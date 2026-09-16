import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { createEditor, Editor, Node, Range, Transforms } from "slate";
import { withHistory } from "slate-history";
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import TableRowElement from "./elements/TableRowElement";
import TableCellElement from "./elements/TableCellElement";
import ImageElement from "./elements/ImageElement";
import InputElement from "./elements/InputElement";
import OrderedListElement from "./elements/OrderedListElement";
import UnorderedListElement from "./elements/UnorderedListElement";
import SpanElement from "./elements/SpanElement";
import ParagraphElement from "./elements/ParagraprhElement";
import ReadOnlyMultipleChoiceElement from "./elements/ReadOnlyMultipleChoiceElement";
import Leaf from "./elements/Leaf";
import DefaultElement from "./elements/DefaultElement";
import MultipleChoiceMultipleAnswerElement from "./elements/MultipleChoiceMultipleAnswerElement";
import TableElementViewer from "./elements/TableElementViewer";
import ListItemViewElement from "./elements/view/ListItemViewElement";
import {
  canDragAndDrop,
  clearFormat,
  getMarkRangeByValue,
  toggleFormat,
} from "./editorUtils";
import {
  ANNOTATION_STORAGE_PREFIX,
  getStartByQuestionType,
} from "../../utils";
import { notifyNotesChanged, registerNoteOwner } from "../../utils/examNotes";
import { DragProvider } from "./contexts/DragContext";
import { updateAnswer } from "../../store/answerReducer";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { updateForUserAnswers } from "../../store/examReducer";
import { Tooltip } from "antd";
import {
  ClearOutlined,
  DeleteOutlined,
  FormOutlined,
} from "@ant-design/icons";
import MultipleChoiceOptionElement from "./elements/view/MultipleChoiceOptionElement";
import CheckboxViewElement from "./elements/view/CheckboxViewElement";
import "../../styles/exam.css";

const HIGHLIGHT_COLORS = ["#FFE58F", "#B7EB8F", "#BAE0FF"];

// Used to keep the floating surfaces inside the viewport. Kept in sync with
// their own padding/button sizes below.
const MENU_WIDTH = 190;
const MENU_HEIGHT = 40;
const MENU_MARGIN = 8;
const NOTE_WIDTH = 300;
const NOTE_HEIGHT = 210;

/** Longest quote shown as the note's header before it is cut short. */
const NOTE_QUOTE_LIMIT = 90;

/** Ties the leaves of one note together, and names it for the notes panel. */
const createNoteId = () =>
  `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * Clamp a floating surface of the given size next to `rect`, in viewport
 * coordinates — it is rendered position:fixed, so page scroll does not come
 * into it, and the passage scrolls in its own container anyway, which document
 * coordinates could not follow.
 */
const placeNear = (rect, width, height) => {
  const fitsAbove = rect.top > height + MENU_MARGIN * 2;
  const rawTop = fitsAbove
    ? rect.top - height - MENU_MARGIN
    : rect.bottom + MENU_MARGIN;

  return {
    top: Math.min(
      Math.max(MENU_MARGIN, rawTop),
      window.innerHeight - height - MENU_MARGIN
    ),
    left: Math.min(
      Math.max(MENU_MARGIN, rect.left),
      window.innerWidth - width - MENU_MARGIN
    ),
  };
};

/**
 * Highlights and notes are both marks on the Slate document, so the document is
 * what gets persisted — one sessionStorage entry per viewer covers both. Only
 * viewers that are given a storageKey take part; the admin editors pass none
 * and behave exactly as before.
 */
const loadAnnotatedContent = (storageKey, fresh) => {
  if (!storageKey) return null;

  try {
    const raw = sessionStorage.getItem(ANNOTATION_STORAGE_PREFIX + storageKey);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    // Shape guard: if the question changed server-side, fall back to the fresh
    // copy rather than rendering a stale document.
    if (!Array.isArray(saved) || saved.length !== fresh.length) return null;

    return saved;
  } catch (error) {
    console.error("Could not restore annotations:", error);
    return null;
  }
};

const saveAnnotatedContent = (storageKey, value) => {
  if (!storageKey) return;

  try {
    sessionStorage.setItem(
      ANNOTATION_STORAGE_PREFIX + storageKey,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error("Could not save annotations:", error);
  }
};

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "Something went wrong, please report it to the reviewer." },
    ],
  },
];

const convertMultipleChoiceToSlateFriendly = (content) => {
  return content.map((node) => {
    if (
      (node.type === "multiple-choice" ||
        node.type === "multiple-choice-multiple-answer") &&
      node.question &&
      node.options
    ) {
      const id = node.id;
      const questionParagraph = {
        type: "span",
        id: id,
        questionNumber: node.questionNumber,
        startInputId: node.startInputId,
        children: [{ text: node.question }],
      };

      const optionNodes = node.options.map((opt) => ({
        type:
          node.type === "multiple-choice-multiple-answer"
            ? "checkbox"
            : "option",
        id: id,
        questionNumber: node.questionNumber,
        startInputId: node.startInputId,
        optionValue: opt,
        children: [{ text: opt }],
      }));

      return {
        ...node,
        question: undefined,
        options: undefined,
        children: [questionParagraph, ...optionNodes],
      };
    }

    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: convertMultipleChoiceToSlateFriendly(node.children),
      };
    }

    return node;
  });
};

function injectSelectoptions(nodes) {
  const extractOptionsFromList = (node) => {
    if (
      node.type === "ordered-list" &&
      node.listStyleType === "upper-alpha" &&
      Array.isArray(node.children)
    ) {
      return node.children
        .filter((child) => child.type === "list-item")
        .map((child, index) => ({
          key: Node.string(child),
          value: String.fromCharCode(65 + index),
        }));
    }
    return null;
  };

  let headingOptions = [];

  const findHeadingList = (nodes) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;

      const options = extractOptionsFromList(node);

      if (options) {
        headingOptions = options;
        break;
      }

      if (node.children) {
        findHeadingList(node.children);
      }
    }
  };

  findHeadingList(nodes);
  return headingOptions;
}

function injectHeadingOptions(content, headings, type) {
  const headOptions = [];
  if (
    (headings && type === "Matching Headings") ||
    type === "Matching Information"
  ) {
    for (let i = 0; i < headings; i++) {
      headOptions.push({
        key: String.fromCharCode(65 + i),
        value: String.fromCharCode(65 + i),
      });
    }
  } else if (type === "True/False/Not Given" || type === "Yes/No/Not Given") {
    if (type === "Yes/No/Not Given") {
      headOptions.push(
        { key: "Yes", value: "Yes" },
        { key: "No", value: "No" },
        { key: "Not Given", value: "Not Given" }
      );
    } else
      headOptions.push(
        { key: "True", value: "True" },
        { key: "False", value: "False" },
        { key: "Not Given", value: "Not Given" }
      );
  }

  const headingOptions =
    headOptions.length > 0
      ? headOptions
      : injectSelectoptions(content || initialValue);

  const inject = (nodes) => {
    return nodes.map((node) => {
      if (node.type === "list-item") {
        return {
          ...node,
          headingOptions: headingOptions,
          questionsType: type,
        };
      }

      if (node.children) {
        return {
          ...node,
          children: inject(node.children),
        };
      }

      return node;
    });
  };

  return inject(content);
}

const RichTextViewer = ({
  content,
  headings,
  type,
  is_passage = false,
  difficultType = "default",
  storageKey,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { size } = useSelector((state) => state.app);
  const adminAnswers = useSelector((state) => state.answer.answers);
  const examAnswers = useSelector((state) => state.exam.answers);

  const editor = useMemo(() => {
    const baseEditor = withHistory(withReact(createEditor()));
    const originalIsInline = baseEditor.isInline;

    baseEditor.isInline = (element) => {
      return (
        element.type === "input" ||
        (originalIsInline ? originalIsInline(element) : false)
      );
    };

    return baseEditor;
  }, []);

  const [menuPosition, setMenuPosition] = useState(null);
  // { top, left, quote, range, existing } while a note is being written.
  const [notePopup, setNotePopup] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const noteRef = useRef(null);
  // The note editor's dismissal listeners are bound once per note, so they
  // reach the current draft through this ref instead of a stale closure.
  const saveNoteRef = useRef(null);
  // The Slate range the menu will act on, captured while the DOM selection is
  // still alive. Buttons preventDefault on mousedown so it survives the click.
  const savedRangeRef = useRef(null);

  // Notes are only offered where they can be kept — the admin editors pass no
  // storageKey, and a note that vanished on navigation would be worse than none.
  const canAnnotate = Boolean(storageKey);

  const closeMenu = () => {
    savedRangeRef.current = null;
    setMenuPosition(null);
  };

  const closeNote = () => {
    setNotePopup(null);
    setNoteDraft("");
  };

  const handleMouseUp = (event) => {
    // Portals keep their React parent, so a click inside the menu or the note
    // editor still reaches this handler — it must not be read as a selection.
    if (
      menuRef.current?.contains(event?.target) ||
      noteRef.current?.contains(event?.target)
    ) {
      return;
    }

    const domSelection = window.getSelection();

    if (!domSelection || !domSelection.rangeCount) {
      closeMenu();
      return;
    }

    if (!domSelection.toString().trim()) {
      closeMenu();
      return;
    }

    // The page holds several viewers side by side (passage + each question) and
    // each one owns its own editor. Only act on a selection that lies entirely
    // inside this one, or a colour click would be applied to the wrong editor.
    const container = containerRef.current;
    if (
      !container ||
      !container.contains(domSelection.anchorNode) ||
      !container.contains(domSelection.focusNode)
    ) {
      closeMenu();
      return;
    }

    // Resolving the DOM selection here — rather than relying on editor.selection
    // — also covers selections that start next to a contentEditable=false island
    // (a gap-fill input, a drop zone), which Slate deselects in read-only mode.
    let slateRange = null;
    try {
      slateRange = ReactEditor.toSlateRange(editor, domSelection, {
        exactMatch: false,
        suppressThrow: true,
      });
    } catch (error) {
      console.error("Could not resolve the selection:", error);
    }

    if (!slateRange || Range.isCollapsed(slateRange)) {
      closeMenu();
      return;
    }

    const rect = domSelection.getRangeAt(0).getBoundingClientRect();

    // Agar rect noto‘g‘ri bo‘lsa (0,0 yoki -1), menyuni ko‘rsatmaymiz
    if (rect.width === 0 && rect.height === 0) {
      closeMenu();
      return;
    }

    savedRangeRef.current = slateRange;

    setMenuPosition(placeNear(rect, MENU_WIDTH, MENU_HEIGHT));
  };

  // Touch devices finish a selection with touchend, not mouseup. The timeout
  // lets the browser settle the selection handles first.
  const handleTouchEnd = (event) => {
    const target = event?.target;
    window.setTimeout(() => handleMouseUp({ target }), 0);
  };

  // A floating menu anchored to a selection goes stale the moment anything
  // moves, so it is dismissed rather than left drifting. Capture phase catches
  // scrolling inside the passage panel too, not just the window.
  useEffect(() => {
    if (!menuPosition) return undefined;

    const dismiss = () => closeMenu();
    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      closeMenu();
    };

    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    document.addEventListener("mousedown", onPointerDown, true);

    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      document.removeEventListener("mousedown", onPointerDown, true);
    };
  }, [menuPosition]);

  // The note editor is anchored the same way, so it is dismissed by the same
  // events — but dismissing keeps what was typed, because losing a note to a
  // stray click mid-exam is far worse than an extra one. Escape discards.
  useEffect(() => {
    if (!notePopup) return undefined;

    // Scrolling the textarea itself is caught by the capture listener too, and
    // must not count as moving away from the note.
    const isInside = (target) => noteRef.current?.contains(target);

    const dismiss = (event) => {
      if (isInside(event.target)) return;
      saveNoteRef.current?.();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeNote();
    };

    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    document.addEventListener("mousedown", dismiss, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      document.removeEventListener("mousedown", dismiss, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notePopup]);

  // Re-select the captured range before marking, so the mark always lands on
  // the text the candidate actually highlighted.
  const applyHighlight = (color) => {
    const range = savedRangeRef.current;
    if (!range) {
      closeMenu();
      return;
    }

    Transforms.select(editor, range);

    if (color) {
      toggleFormat(editor, "highlight", color);
    } else {
      clearFormat(editor, "highlight");
    }

    closeMenu();
  };

  const openNoteEditor = ({ range, noteId, rect, text }) => {
    setNoteDraft(text);

    const quote = Editor.string(editor, range);
    setNotePopup({
      ...placeNear(rect, NOTE_WIDTH, NOTE_HEIGHT),
      quote:
        quote.length > NOTE_QUOTE_LIMIT
          ? `${quote.slice(0, NOTE_QUOTE_LIMIT).trimEnd()}…`
          : quote,
      range,
      noteId,
      existing: Boolean(text),
    });
  };

  // Reopen the note with the given id over the words it was written on, rather
  // than over whatever happens to be selected.
  const openExistingNote = (noteId, rect) => {
    const range = getMarkRangeByValue(editor, "noteId", noteId);
    if (!range) return false;

    const [leaf] = Editor.node(editor, range.anchor.path);
    openNoteEditor({
      range,
      noteId,
      rect,
      text: typeof leaf.note === "string" ? leaf.note : "",
    });

    return true;
  };

  // "Note" in the selection menu: write a note against the selected words.
  const startNote = () => {
    const range = savedRangeRef.current;
    const domSelection = window.getSelection();

    if (!range || !domSelection?.rangeCount) {
      closeMenu();
      return;
    }

    const rect = domSelection.getRangeAt(0).getBoundingClientRect();

    Transforms.select(editor, range);
    const marks = Editor.marks(editor) || {};
    const existingId = typeof marks.noteId === "string" ? marks.noteId : null;

    closeMenu();

    // Selecting over text that already carries a note edits that note, keeping
    // its id — otherwise the same words would end up with two of them.
    if (existingId && openExistingNote(existingId, rect)) return;

    openNoteEditor({ range, noteId: createNoteId(), rect, text: "" });
  };

  // Clicking noted text reopens its note. The click lands on one leaf, but the
  // id it carries names the whole run.
  const handleClick = (event) => {
    if (!canAnnotate) return;

    const noted = event.target?.closest?.("[data-note-id]");
    if (!noted) return;

    closeMenu();
    openExistingNote(noted.dataset.noteId, noted.getBoundingClientRect());
  };

  const saveNote = () => {
    if (!notePopup) return;

    const text = noteDraft.trim();
    Transforms.select(editor, notePopup.range);

    // An emptied note is a deleted note, which is also what makes Save the safe
    // action for a dismissal.
    if (text) {
      Editor.addMark(editor, "note", text);
      Editor.addMark(editor, "noteId", notePopup.noteId);
    } else {
      Editor.removeMark(editor, "note");
      Editor.removeMark(editor, "noteId");
    }

    closeNote();
  };

  const deleteNote = () => {
    if (!notePopup) return;

    Transforms.select(editor, notePopup.range);
    Editor.removeMark(editor, "note");
    Editor.removeMark(editor, "noteId");
    closeNote();
  };

  saveNoteRef.current = saveNote;

  // The notes panel lists notes read back from storage, so it can only ask for
  // one by id — this editor is the only thing that can find it again.
  useEffect(() => {
    if (!storageKey) return undefined;

    return registerNoteOwner(storageKey, {
      reveal: (noteId) => {
        const element = containerRef.current?.querySelector(
          `[data-note-id="${CSS.escape(noteId)}"]`
        );
        if (!element) return;

        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Animated rather than class-toggled: the element belongs to Slate, and
        // a re-render would drop a class halfway through the flash.
        const wash = getComputedStyle(document.documentElement)
          .getPropertyValue("--exam-accent-wash")
          .trim();

        element.animate?.(
          [{ backgroundColor: wash }, { backgroundColor: "transparent" }],
          { duration: 1400, easing: "ease-out" }
        );
      },
      remove: (noteId) => {
        const range = getMarkRangeByValue(editor, "noteId", noteId);
        if (!range) return;

        Transforms.select(editor, range);
        Editor.removeMark(editor, "note");
        Editor.removeMark(editor, "noteId");
      },
    });
  }, [storageKey, editor]);

  const renderElement = useCallback((props) => {
    const checkDragAndDrop = canDragAndDrop(content, type);
    const path = ReactEditor.findPath(editor, props.element);
    const index = path[path.length - 1];
    switch (props.element.type) {
      case "table":
        return <TableElementViewer {...props} />;
      case "table-row":
        return <TableRowElement {...props} />;
      case "table-cell":
        return <TableCellElement {...props} />;
      case "image":
        return <ImageElement {...props} />;
      case "input":
        return <InputElement {...props} dragAndDrop={checkDragAndDrop} />;
      case "ordered-list":
        return <OrderedListElement {...props} is_passage={is_passage} />;
      case "unordered-list":
        return (
          <UnorderedListElement
            {...props}
            is_passage={is_passage}
            type={type}
            dragAndDrop={checkDragAndDrop}
          />
        );
      case "list-item":
        return (
          <ListItemViewElement
            {...props}
            is_passage={is_passage}
            index={index}
            startQuestionNumber={getStartByQuestionType(difficultType) + 1}
            dragAndDrop={checkDragAndDrop}
            type={type}
          />
        );
      case "span":
        return <SpanElement {...props} />;
      case "paragraph":
        return <ParagraphElement {...props} />;
      case "multiple-choice-multiple-answer":
        return <MultipleChoiceMultipleAnswerElement {...props} />;
      case "multiple-choice":
        return <ReadOnlyMultipleChoiceElement {...props} />;
      case "option":
        return <MultipleChoiceOptionElement {...props} />;
      case "checkbox":
        return <CheckboxViewElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, [content, type, is_passage, difficultType, editor]);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  const preparedContent = useMemo(() => {
    const converted = convertMultipleChoiceToSlateFriendly(
      content || initialValue
    );
    const fresh = injectHeadingOptions(converted, headings, type);

    // A restored document already went through the conversion above, but the
    // heading options are re-injected in case the question type changed.
    const saved = loadAnnotatedContent(storageKey, fresh);
    return saved ? injectHeadingOptions(saved, headings, type) : fresh;
  }, [content, headings, type, storageKey]);

  // Persist after anything that is not a pure selection move — i.e. after a
  // highlight or a note is added, edited or removed.
  const handleEditorChange = (value) => {
    if (!storageKey) return;

    const changedContent = editor.operations.some(
      (operation) => operation.type !== "set_selection"
    );
    if (!changedContent) return;

    saveAnnotatedContent(storageKey, value);
    // sessionStorage is silent in the tab that wrote it, so the notes panel is
    // told directly.
    notifyNotesChanged();
  };

  const isAnswerKeyMode = location.pathname.includes("/dashboard/ielts");

  const setAnswerValue = useCallback(
    (key, value) => {
      if (isAnswerKeyMode) {
        dispatch(updateAnswer({ key, value }));
      } else {
        dispatch(updateForUserAnswers({ key, value }));
      }
    },
    [dispatch, isAnswerKeyMode]
  );

  // A word bank belongs to one part, so a moved answer is only cleared from
  // slots inside that same part — never from a typed answer elsewhere.
  const getScopeFor = useCallback(
    (key) => {
      if (isAnswerKeyMode) return adminAnswers;
      const part = examAnswers.find((item) =>
        (item.answers || []).some((answer) => answer.key === key)
      );
      return part ? part.answers : [];
    },
    [isAnswerKeyMode, adminAnswers, examAnswers]
  );

  const onDropAnswer = useCallback(
    (key, value, fromKey = null) => {
      if (fromKey != null && fromKey === key) return;

      // One bank item can only sit in one slot: free the slot that holds it.
      const previous = getScopeFor(key).find(
        (answer) =>
          answer.key !== undefined && answer.key !== key && answer.value === value
      );
      if (previous) setAnswerValue(previous.key, "");

      setAnswerValue(key, value);
    },
    [getScopeFor, setAnswerValue]
  );

  const onClearAnswer = useCallback(
    (key) => setAnswerValue(key, ""),
    [setAnswerValue]
  );

  return (
    <div
      style={{
        minHeight: "100px",
        maxHeight: is_passage ? "calc(100vh - 250px)" : "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <DragProvider onDropAnswer={onDropAnswer} onClearAnswer={onClearAnswer}>
        <Slate
          key={JSON.stringify(content)}
          editor={editor}
          initialValue={preparedContent}
          onChange={handleEditorChange}
        >
          {menuPosition &&
            ReactDOM.createPortal(
              <div
                ref={menuRef}
                className="exam-hl-menu"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="exam-hl-swatch"
                    aria-label={`Highlight (${color})`}
                    style={{ background: color }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyHighlight(color);
                    }}
                  />
                ))}

                <span className="exam-hl-divider" />

                {canAnnotate && (
                  <Tooltip title="Add a note">
                    <button
                      type="button"
                      className="exam-hl-action"
                      aria-label="Add a note"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        startNote();
                      }}
                    >
                      <FormOutlined />
                    </button>
                  </Tooltip>
                )}

                <Tooltip title="Remove highlight">
                  <button
                    type="button"
                    className="exam-hl-action"
                    aria-label="Remove highlight"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyHighlight(null);
                    }}
                  >
                    <ClearOutlined />
                  </button>
                </Tooltip>
              </div>,
              document.body
            )}

          {notePopup &&
            ReactDOM.createPortal(
              <div
                ref={noteRef}
                className="exam-note-pop"
                style={{ top: notePopup.top, left: notePopup.left }}
              >
                <p className="exam-note-pop__quote">“{notePopup.quote}”</p>

                <textarea
                  autoFocus
                  className="exam-note-pop__input"
                  value={noteDraft}
                  placeholder="Write your note…"
                  onChange={(event) => setNoteDraft(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter breaks the line; the shortcut saves, like a dialog.
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      saveNote();
                    }
                  }}
                />

                <div className="exam-note-pop__actions">
                  {notePopup.existing && (
                    <button
                      type="button"
                      className="exam-note-pop__btn exam-note-pop__btn--danger"
                      onClick={deleteNote}
                    >
                      <DeleteOutlined /> Delete
                    </button>
                  )}

                  <span style={{ flex: 1 }} />

                  <button
                    type="button"
                    className="exam-note-pop__btn"
                    onClick={closeNote}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="exam-note-pop__btn exam-note-pop__btn--primary"
                    onClick={saveNote}
                  >
                    Save
                  </button>
                </div>
              </div>,
              document.body
            )}

          <Editable
            style={{
              padding: "0 10px",
              fontSize: `${size}px`,
              border: "none",
              overflowY: "auto",
              borderRadius: "4px",
              minHeight: "50px",
              maxHeight: "100%",
            }}
            readOnly={true}
            placeholder="Type something..."
            renderElement={renderElement}
            renderLeaf={renderLeaf}
          />
        </Slate>
      </DragProvider>
    </div>
  );
};
export default RichTextViewer;
