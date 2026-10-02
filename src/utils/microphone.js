import { toast } from "react-toastify";

/**
 * Ask for the microphone before a Listening section opens.
 *
 * The exam does not record anything — the permission is what proves the
 * candidate has a working headset before the audio starts, because an audio
 * part is played once and cannot be recovered afterwards.
 *
 * Returns true when the section may open. Every failure is explained to the
 * candidate here, so callers only have to decide whether to navigate.
 */
export const ensureMicrophoneAccess = async () => {
  try {
    // Asked first where the browser supports it: a permission already refused
    // would otherwise re-prompt invisibly and look like nothing happened.
    if (navigator.permissions) {
      const status = await navigator.permissions.query({ name: "microphone" });

      if (status.state === "denied") {
        toast.info(
          "Please enable microphone access in your browser settings and try again."
        );
        return false;
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Released straight away: this was a permission check, not a recording.
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error("Audio permission error: ", error);

    switch (error.name) {
      case "NotAllowedError":
        toast.info(
          "Microphone access denied. Please enable it in browser settings."
        );
        break;

      case "NotFoundError":
        toast.error("No microphone device found.");
        break;

      case "NotReadableError":
        toast.error("Microphone is already in use by another application.");
        break;

      case "SecurityError":
        toast.error("Microphone access requires HTTPS.");
        break;

      default:
        toast.error("An unexpected error occurred. Please try again.");
    }

    return false;
  }
};

export default ensureMicrophoneAccess;
