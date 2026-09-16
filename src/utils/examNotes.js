import { useCallback, useEffect, useState } from "react";
import { ANNOTATION_STORAGE_PREFIX } from "./index";

/**
 * Storage key for one annotatable viewer: the exam, the module, the part and
 * the slot inside that part.
 *
 * Built in one place because two callers have to agree on it — the exam page
 * renders the viewers with it, and the notes panel reads them back by it. The
 * part is identified by its *type* (easy/medium/hard, part_1…part_4), which is
 * also what the footer switches on, so a note can be navigated back to.
 */
export const annotationKey = (examId, module, partType, slot) =>
  `${examId}-${module}-${partType}-${slot}`;

/**
 * Every note in one saved document, in reading order.
 *
 * A note is a mark, so a phrase spanning several leaves is several text nodes
 * carrying the same noteId. They are stitched back together here, because what
 * the candidate wrote over is one quote, not five fragments.
 */
const collectNotes = (nodes, found = new Map()) => {
  for (const node of nodes || []) {
    if (typeof node.text === "string") {
      if (node.noteId && node.note) {
        const entry = found.get(node.noteId);
        if (entry) {
          entry.quote += node.text;
        } else {
          found.set(node.noteId, {
            id: node.noteId,
            note: node.note,
            quote: node.text,
          });
        }
      }
      continue;
    }

    collectNotes(node.children, found);
  }

  return found;
};

const readDocument = (storageKey) => {
  try {
    const raw = sessionStorage.getItem(ANNOTATION_STORAGE_PREFIX + storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Could not read notes:", error);
    return null;
  }
};

/** Notes across every viewer in `sources`, flattened for the notes panel. */
export const readNotes = (sources) =>
  (sources || []).flatMap((source) => {
    const document = readDocument(source.storageKey);
    if (!Array.isArray(document)) return [];

    return Array.from(collectNotes(document).values()).map((note) => ({
      ...note,
      storageKey: source.storageKey,
      partType: source.partType,
      partLabel: source.partLabel,
      sectionLabel: source.sectionLabel,
    }));
  });

// sessionStorage fires no event in the tab that wrote it, so the viewers
// announce their own writes and the panel re-reads.
const listeners = new Set();

export const subscribeToNotes = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyNotesChanged = () => {
  listeners.forEach((listener) => listener());
};

const signature = (notes) =>
  notes.map((note) => `${note.storageKey}|${note.id}|${note.note}`).join("\n");

/** Live list of notes for `sources`, kept in step with the viewers. */
export const useExamNotes = (sources) => {
  const [notes, setNotes] = useState(() => readNotes(sources));

  const refresh = useCallback(() => {
    const next = readNotes(sources);

    // A re-read that found nothing new must not become a re-render: the effect
    // below re-runs whenever `sources` changes identity, and a caller that
    // rebuilds that array every render would otherwise loop.
    setNotes((current) =>
      signature(current) === signature(next) ? current : next
    );
  }, [sources]);

  useEffect(() => {
    refresh();
    return subscribeToNotes(refresh);
  }, [refresh]);

  return notes;
};

// Revealing or deleting a note has to happen inside the viewer that owns it —
// only that editor can resolve a noteId back to a position in its document.
const owners = new Map();

export const registerNoteOwner = (storageKey, handlers) => {
  owners.set(storageKey, handlers);

  return () => {
    if (owners.get(storageKey) === handlers) owners.delete(storageKey);
  };
};

/** Scroll the note into view and flash it. No-op if its part is not mounted. */
export const revealNote = (storageKey, noteId) =>
  owners.get(storageKey)?.reveal(noteId);

export const removeNote = (storageKey, noteId) =>
  owners.get(storageKey)?.remove(noteId);
