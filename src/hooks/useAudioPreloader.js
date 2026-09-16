import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 2000;

/**
 * Abort a download only once nothing has arrived for this long. A slow
 * connection is allowed to finish; a dead one is not left hanging, which is how
 * the old metadata preloader could sit at "preparing" forever.
 */
const STALL_TIMEOUT_MS = 15000;

const CACHE_PREFIX = "exam-audio-";

/** Stamped on every stored file so its age can be judged later. */
const CACHED_AT_HEADER = "x-cached-at";

/**
 * How long a stored recording may be reused when the server offers no way to
 * check it. Long enough to cover a sitting and the reloads inside it, short
 * enough that a recording replaced between sittings is never served again.
 */
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const abortError = () => new DOMException("Aborted", "AbortError");

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    let timer = null;

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };

    timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });

/** Wait out a dropped connection rather than burning retries against it. */
const waitForOnline = (signal) => {
  if (navigator.onLine) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("online", onOnline);
      signal.removeEventListener("abort", onAbort);
    };

    const onOnline = () => {
      cleanup();
      resolve();
    };

    const onAbort = () => {
      cleanup();
      reject(abortError());
    };

    window.addEventListener("online", onOnline);
    signal.addEventListener("abort", onAbort, { once: true });
  });
};

/**
 * One exam's audio at a time: another sitting's files are dead weight against
 * the browser's storage quota.
 */
const openAudioCache = async (cacheKey) => {
  if (!cacheKey || typeof caches === "undefined") return null;

  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(
          (name) =>
            name.startsWith(CACHE_PREFIX) && name !== CACHE_PREFIX + cacheKey
        )
        .map((name) => caches.delete(name))
    );

    return await caches.open(CACHE_PREFIX + cacheKey);
  } catch (error) {
    // No Cache Storage in a private window or on an insecure origin. Downloads
    // still work; they just will not survive a reload.
    console.warn("Audio cache unavailable:", error);
    return null;
  }
};

/**
 * Headers that let the server say "still the same file".
 *
 * Cross-origin audio only exposes these when the server sets
 * Access-Control-Expose-Headers; without them there is nothing to revalidate
 * against and the age check below takes over.
 */
export const readValidators = (cached) => {
  const etag = cached.headers.get("ETag");
  if (etag) return { "If-None-Match": etag };

  const lastModified = cached.headers.get("Last-Modified");
  if (lastModified) return { "If-Modified-Since": lastModified };

  return null;
};

export const isRecent = (cached) => {
  const cachedAt = Number(cached.headers.get(CACHED_AT_HEADER)) || 0;
  return cachedAt > 0 && Date.now() - cachedAt < CACHE_MAX_AGE_MS;
};

/** Drop files this exam no longer refers to, so a swapped recording cannot sit
 *  in storage next to the one that replaced it. */
const pruneCache = async (cache, sources) => {
  try {
    const wanted = new Set(
      sources.filter(Boolean).map((src) => new URL(src, window.location.href).href)
    );

    const keys = await cache.keys();
    await Promise.all(
      keys
        .filter((request) => !wanted.has(request.url))
        .map((request) => cache.delete(request))
    );
  } catch (error) {
    console.warn("Audio cache prune failed:", error);
  }
};

/** Fetch one file to a Blob, reporting 0..1 progress as the body arrives. */
const downloadAudio = async (src, { signal, onProgress, validators }) => {
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  signal.addEventListener("abort", onOuterAbort, { once: true });

  let stallTimer = null;
  const keepAlive = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS);
  };

  try {
    keepAlive();

    const response = await fetch(src, {
      signal: controller.signal,
      headers: validators || undefined,
    });

    // The stored copy is still current.
    if (response.status === 304) return { notModified: true };

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("Content-Type") || "audio/mpeg";
    const total = Number(response.headers.get("Content-Length")) || 0;

    const etag = response.headers.get("ETag");
    const lastModified = response.headers.get("Last-Modified");
    const storedHeaders = {
      "Content-Type": contentType,
      [CACHED_AT_HEADER]: String(Date.now()),
      ...(etag ? { ETag: etag } : {}),
      ...(lastModified ? { "Last-Modified": lastModified } : {}),
    };

    // Compressed or chunked responses carry no length; fall back to a single
    // read with no progress rather than reporting a made-up percentage.
    if (!response.body || !total) {
      const blob = await response.blob();
      onProgress(1);
      return { blob, headers: storedHeaders };
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    for (;;) {
      const { done, value } = await reader.read();
      keepAlive();
      if (done) break;

      chunks.push(value);
      received += value.length;
      onProgress(Math.min(1, received / total));
    }

    return { blob: new Blob(chunks, { type: contentType }), headers: storedHeaders };
  } finally {
    clearTimeout(stallTimer);
    signal.removeEventListener("abort", onOuterAbort);
  }
};

/**
 * A stored recording is reused only when it can be shown to still be the right
 * one — the server confirms it with a 304, or, where the server offers no
 * validator, it is recent enough that it cannot plausibly have been replaced.
 *
 * This matters because audio is uploaded against a listening id: if the backend
 * writes the new file to the same URL, a cache keyed on that URL alone would
 * keep playing the old recording to the candidate for as long as it survived.
 */
export const loadAudio = async (src, cache, { signal, onProgress }) => {
  let cached = null;

  if (cache) {
    try {
      cached = (await cache.match(src)) ?? null;
    } catch (error) {
      console.warn("Audio cache read failed:", error);
    }
  }

  const validators = cached ? readValidators(cached) : null;

  if (cached && !validators && isRecent(cached)) {
    onProgress(1);
    return cached.blob();
  }

  let result;
  try {
    result = await downloadAudio(src, { signal, onProgress, validators });
  } catch (error) {
    if (signal.aborted || !validators) throw error;

    // If-None-Match is not CORS-safelisted, so on a cross-origin server that
    // does not answer the preflight the conditional request fails outright.
    // Falling back keeps a misconfigured server from blocking the exam.
    console.warn("Conditional audio request failed, refetching in full:", error);
    result = await downloadAudio(src, { signal, onProgress });
  }

  if (result.notModified) {
    onProgress(1);
    return cached.blob();
  }

  if (cache) {
    try {
      await cache.put(src, new Response(result.blob, { headers: result.headers }));
    } catch (error) {
      // Over quota, or the response cannot be stored. The download itself
      // succeeded, so the exam carries on without a cached copy.
      console.warn("Audio cache write failed:", error);
    }
  }

  return result.blob;
};

/**
 * Download the recordings ahead of playback, in order and one at a time.
 *
 * Strictly sequential on purpose. The candidate is only waiting for the first
 * recording, so it gets the whole connection to itself; the rest arrive during
 * the eight-odd minutes that first part is playing. Downloading in parallel
 * would make the one file anybody is actually waiting for arrive *later*, and
 * in a hall where twenty machines start together it would only add congestion.
 *
 * Results are published per file — `urls[i]` appears as soon as file `i` lands
 * — so the caller can begin as soon as it has what it needs. Files are also
 * kept in Cache Storage, so the reload the extra-time notice performs does not
 * mean downloading tens of megabytes again.
 */
const useAudioPreloader = (sources, cacheKey) => {
  const [urls, setUrls] = useState([]);
  const [progress, setProgress] = useState([]);
  const [failedIndexes, setFailedIndexes] = useState([]);
  const [complete, setComplete] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // src -> object URL, so a retry never re-downloads what already arrived.
  const objectUrlsRef = useRef(new Map());
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  // Identity-independent: the array is rebuilt on every render upstream.
  const sourcesKey = JSON.stringify(sources ?? null);

  useEffect(() => {
    const list = sourcesRef.current;
    if (!list || list.length === 0) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    setComplete(false);
    setFailedIndexes([]);
    setUrls((previous) =>
      list.map((src, i) => previous[i] ?? objectUrlsRef.current.get(src) ?? null)
    );
    setProgress((previous) => list.map((_, i) => previous[i] ?? 0));

    const publish = (index, url) =>
      setUrls((previous) => {
        const next = [...previous];
        next[index] = url;
        return next;
      });

    const report = (index, fraction) =>
      setProgress((previous) => {
        // Chunks arrive far more often than a progress bar can show; skipping
        // equal percentages keeps this from re-rendering on every read.
        if (Math.round((previous[index] ?? 0) * 100) === Math.round(fraction * 100)) {
          return previous;
        }

        const next = [...previous];
        next[index] = fraction;
        return next;
      });

    const run = async () => {
      const cache = await openAudioCache(cacheKey);
      if (signal.aborted) return;

      // Recordings this exam no longer points at are dropped before anything
      // is fetched, so a replaced file cannot linger beside its replacement.
      if (cache) await pruneCache(cache, list);
      if (signal.aborted) return;

      for (let i = 0; i < list.length; i += 1) {
        const src = list[i];

        // Nothing attached to this part, or it arrived on an earlier attempt.
        if (!src) {
          report(i, 1);
          continue;
        }

        if (objectUrlsRef.current.has(src)) {
          report(i, 1);
          publish(i, objectUrlsRef.current.get(src));
          continue;
        }

        let lastError = null;

        for (let tries = 1; tries <= MAX_ATTEMPTS; tries += 1) {
          try {
            await waitForOnline(signal);

            const blob = await loadAudio(src, cache, {
              signal,
              onProgress: (fraction) => report(i, fraction),
            });

            if (signal.aborted) return;

            const objectUrl = URL.createObjectURL(blob);
            objectUrlsRef.current.set(src, objectUrl);

            report(i, 1);
            publish(i, objectUrl);

            lastError = null;
            break;
          } catch (error) {
            if (signal.aborted) return;

            lastError = error;
            console.warn(
              `Audio download failed (attempt ${tries}/${MAX_ATTEMPTS}):`,
              src,
              error
            );

            if (tries < MAX_ATTEMPTS) {
              try {
                await sleep(tries * RETRY_BASE_MS, signal);
              } catch {
                return; // aborted while backing off
              }
            }
          }
        }

        if (lastError) {
          // Recorded rather than thrown: a later part giving up must not stop
          // the candidate from sitting the parts that did arrive.
          setFailedIndexes((previous) =>
            previous.includes(i) ? previous : [...previous, i]
          );
        }
      }

      if (!signal.aborted) setComplete(true);
    };

    run();

    return () => controller.abort();
  }, [sourcesKey, cacheKey, attempt]);

  // Object URLs pin their blobs in memory until they are revoked.
  useEffect(() => {
    const created = objectUrlsRef.current;

    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
      created.clear();
    };
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { urls, progress, failedIndexes, complete, retry };
};

export default useAudioPreloader;
