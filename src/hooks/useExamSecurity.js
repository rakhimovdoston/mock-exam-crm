import { useEffect } from "react";
import { toast } from "react-toastify";

const BLOCKED_COMBO_KEYS = ["s", "p", "r", "t"];
const BLOCKED_TOAST_ID = "exam-shortcut-blocked";

const isEditableElement = (element) => {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();
  if (tagName === "input" || tagName === "textarea") {
    return !element.readOnly && !element.disabled;
  }

  return element.isContentEditable;
};

const useExamSecurity = ({ allowTypingShortcuts = false } = {}) => {
  useEffect(() => {
    // const handleKeyDown = (event) => {
    //   const target = event.target;
    //   const isTypingContext = isEditableElement(target);
    //   const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
    //   const shouldBlockCombo =
    //     event.ctrlKey &&
    //     BLOCKED_COMBO_KEYS.includes(key) &&
    //     (!allowTypingShortcuts || !isTypingContext);

    //   if (shouldBlockCombo) {
    //     const previouslyFocused = document.activeElement;
    //     const canRestoreSelection =
    //       previouslyFocused &&
    //       typeof previouslyFocused.selectionStart === "number" &&
    //       typeof previouslyFocused.selectionEnd === "number" &&
    //       typeof previouslyFocused.setSelectionRange === "function";
    //     const selection = canRestoreSelection
    //       ? [previouslyFocused.selectionStart, previouslyFocused.selectionEnd]
    //       : null;

    //     event.preventDefault();

    //     toast.dismiss(BLOCKED_TOAST_ID);
    //     toast.info("Keyboard shortcut disabled:", {
    //       toastId: BLOCKED_TOAST_ID,
    //       autoClose: 2000,
    //     });

    //     if (
    //       previouslyFocused &&
    //       typeof previouslyFocused.focus === "function"
    //     ) {
    //       requestAnimationFrame(() => {
    //         previouslyFocused.focus();
    //         if (selection) {
    //           previouslyFocused.setSelectionRange(selection[0], selection[1]);
    //         }
    //       });
    //     }
    //   }
    // };

    const handleContextMenu = (event) => {
      event.preventDefault();
      toast.dismiss("context-blocked");
      toast.info("Context menu blocked", {
        toastId: "context-blocked",
        autoClose: 2000,
      });
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    // window.addEventListener("keydown", handleKeyDown, true);
    // document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // window.removeEventListener("keydown", handleKeyDown, true);
      // document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [allowTypingShortcuts]);
};

export default useExamSecurity;
