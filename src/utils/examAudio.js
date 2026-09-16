const POSITION_PREFIX = "exam_audio_pos_";

const positionKey = (examId) => `${POSITION_PREFIX}${examId}`;

/**
 * Where the recording had got to, so a reload resumes instead of replaying.
 *
 * The extra-time flow reloads the page on purpose, and the usual reason for
 * granting Listening time is that the audio failed — so restarting every
 * student at Part 1 is exactly the wrong default.
 */
export const readAudioPosition = (examId) => {
  try {
    const raw = sessionStorage.getItem(positionKey(examId));
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (!Number.isInteger(saved?.index) || saved.index < 0) return null;

    return { index: saved.index, time: Number(saved.time) || 0 };
  } catch (error) {
    console.warn("Could not read the audio position:", error);
    return null;
  }
};

export const writeAudioPosition = (examId, index, time) => {
  try {
    sessionStorage.setItem(
      positionKey(examId),
      JSON.stringify({ index, time })
    );
  } catch {
    // Storage full or blocked. Resuming is a convenience, never a requirement,
    // so this stays silent — it is written several times a minute.
  }
};

/** Dropped on submit, so a reset-and-retry starts from the beginning. */
export const clearAudioPosition = (examId) => {
  try {
    sessionStorage.removeItem(positionKey(examId));
  } catch (error) {
    console.warn("Could not clear the audio position:", error);
  }
};
