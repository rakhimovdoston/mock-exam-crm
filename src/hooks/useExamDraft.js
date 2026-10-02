import { useCallback, useEffect, useRef, useState } from "react";
import apiClient, { apiUrl } from "../services/api";
import { getRequestLanguage } from "../i18n/lang";

export const DRAFT_SAVE_INTERVAL_MS = 15000;
export const DRAFT_DEBOUNCE_MS = 3000;

const draftPath = (examUniqueId, moduleType) =>
  `api/v1/exam/draft/${examUniqueId}?moduleType=${moduleType}`;

/**
 * Server-side draft of whatever the student has entered so far.
 *
 * The server stores the JSON opaquely, so the shape is each module's own
 * business — reading and listening hand over their answer sheet, writing hands
 * over its two tasks. The draft is deleted server-side on submit, so nothing
 * here has to clean up.
 *
 * `getContent` is read through a ref so a save always sends what is on screen
 * now, not what was on screen when the timer or listener was registered.
 */
const useExamDraft = (examUniqueId, moduleType, { getContent, onRestore }) => {
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(false);

  const getContentRef = useRef(getContent);
  const onRestoreRef = useRef(onRestore);
  getContentRef.current = getContent;
  onRestoreRef.current = onRestore;

  const dirtyRef = useRef(false);
  const debounceRef = useRef(null);
  // What the server already holds, so an unchanged sheet never causes a request.
  const lastSavedRef = useRef(null);

  const saveNow = useCallback(async () => {
    if (!examUniqueId) return null;

    const content = getContentRef.current?.();
    if (content == null) return null;

    setSaving(true);
    try {
      const response = await apiClient.put(
        draftPath(examUniqueId, moduleType),
        content
      );

      if (response?.code !== 200) {
        const error = new Error(response?.message || "draft save failed");
        error.apiPayload = response;
        throw error;
      }

      dirtyRef.current = false;
      lastSavedRef.current = JSON.stringify(content);
      setSavedAt(response?.data?.savedAt || new Date().toISOString());

      return response.data;
    } finally {
      setSaving(false);
    }
  }, [examUniqueId, moduleType]);

  /** Called on every edit; schedules a save once typing stops. */
  const markDirty = useCallback(() => {
    const content = getContentRef.current?.();
    if (content == null) return;

    const serialized = JSON.stringify(content);
    if (serialized === lastSavedRef.current) return;

    dirtyRef.current = true;

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      saveNow().catch((error) => console.error("Draft save failed:", error));
    }, DRAFT_DEBOUNCE_MS);
  }, [saveNow]);

  // Restore whatever was saved before this page load.
  useEffect(() => {
    if (!examUniqueId) return undefined;

    let cancelled = false;

    apiClient
      .get(draftPath(examUniqueId, moduleType))
      .then((response) => {
        if (cancelled || response?.code !== 200) return;

        const content = response?.data?.content;
        if (content == null) return;

        // Seeded so restoring does not immediately look like an edit.
        lastSavedRef.current = JSON.stringify(content);
        setSavedAt(response.data.savedAt || null);

        onRestoreRef.current?.(content);
        setRestored(true);
      })
      .catch((error) => console.error("Could not restore the draft:", error));

    return () => {
      cancelled = true;
    };
  }, [examUniqueId, moduleType]);

  // Periodic save — only when something actually changed.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!dirtyRef.current) return;
      saveNow().catch((error) => console.error("Draft save failed:", error));
    }, DRAFT_SAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [saveNow]);

  // Leaving the page. An axios request is cancelled as the document goes away,
  // so this last one goes out with keepalive instead.
  useEffect(() => {
    if (!examUniqueId) return undefined;

    const flush = () => {
      if (!dirtyRef.current) return;

      const content = getContentRef.current?.();
      if (content == null) return;

      const token = localStorage.getItem("accessToken");

      fetch(`${apiUrl}${draftPath(examUniqueId, moduleType)}`, {
        method: "PUT",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          // Set by hand: this one leaves through fetch, so the axios
          // interceptor that adds it everywhere else never sees it.
          "Accept-Language": getRequestLanguage(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(content),
      }).catch(() => {});

      dirtyRef.current = false;
    };

    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      window.clearTimeout(debounceRef.current);
    };
  }, [examUniqueId, moduleType]);

  return { savedAt, saving, restored, saveNow, markDirty };
};

export default useExamDraft;
