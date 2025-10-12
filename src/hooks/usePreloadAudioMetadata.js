// // hooks/usePreloadAudioMetadata.js
// import { useEffect, useState, useRef, useCallback } from 'react';

// const AUDIO_CONFIG = {
//   METADATA_TIMEOUT: 8000,
//   MAX_METADATA_ATTEMPTS: 3,
//   METADATA_RETRY_DELAY: 300,
// };

// const usePreloadAudioMetadata = (audioUrls) => {
//   const [audioDurations, setAudioDurations] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isReady, setIsReady] = useState(false);
//   const metadataErrorCache = useRef(new Set());
//   const metadataAttemptRef = useRef(0);
//   const isCancelledRef = useRef(false);

//   const loadMetadataOnce = useCallback((src, attempt) => {
//     return new Promise((resolve) => {
//       const audio = new Audio();
//       audio.preload = "metadata"; // ✅ Only load metadata, not full audio
//       audio.crossOrigin = "anonymous";
      
//       const cacheBustingSrc = attempt > 1
//         ? `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`
//         : src;
      
//       audio.src = cacheBustingSrc;

//       const finalize = (payload) => {
//         audio.src = "";
//         audio.remove();
//         resolve(payload);
//       };

//       const timeoutId = setTimeout(
//         () => finalize({ success: false }),
//         AUDIO_CONFIG.METADATA_TIMEOUT
//       );

//       audio.onloadedmetadata = () => {
//         clearTimeout(timeoutId);
//         finalize({ 
//           success: true, 
//           duration: audio.duration || 0 
//         });
//       };

//       audio.onerror = () => {
//         clearTimeout(timeoutId);
//         finalize({ success: false });
//       };

//       audio.load();
//     });
//   }, []);

//   const loadAllDurations = useCallback(async () => {
//     if (!audioUrls || audioUrls.length === 0) {
//       setAudioDurations([]);
//       setIsLoading(false);
//       setIsReady(true);
//       return;
//     }

//     if (isCancelledRef.current) return;

//     setIsLoading(true);
//     setIsReady(false);
//     metadataAttemptRef.current += 1;
    
//     const durations = new Array(audioUrls.length).fill(0);

//     // ✅ Load all metadata in parallel for faster loading
//     const promises = audioUrls.map(async (src, index) => {
//       if (!src || isCancelledRef.current) {
//         return { index, duration: 0 };
//       }

//       let attempt = 1;
//       let success = false;

//       while (
//         !success && 
//         attempt <= AUDIO_CONFIG.MAX_METADATA_ATTEMPTS && 
//         !isCancelledRef.current
//       ) {
//         const result = await loadMetadataOnce(src, attempt);

//         if (result.success && Number.isFinite(result.duration)) {
//           success = true;
//           return { index, duration: result.duration };
//         }

//         attempt += 1;

//         if (attempt <= AUDIO_CONFIG.MAX_METADATA_ATTEMPTS && !isCancelledRef.current) {
//           await new Promise(resolve => 
//             setTimeout(resolve, attempt * AUDIO_CONFIG.METADATA_RETRY_DELAY)
//           );
//         }
//       }

//       if (!success && !metadataErrorCache.current.has(src)) {
//         metadataErrorCache.current.add(src);
//         console.warn("Failed to load audio metadata:", src);
//       }

//       return { index, duration: 0 };
//     });

//     const results = await Promise.all(promises);

//     if (!isCancelledRef.current) {
//       results.forEach(({ index, duration }) => {
//         durations[index] = duration;
//       });

//       setAudioDurations(durations);
      
//       const hasFullDurations = durations.every(duration => duration > 0);
//       setIsReady(hasFullDurations);
//       setIsLoading(false);
//     }
//   }, [audioUrls, loadMetadataOnce]);

//   useEffect(() => {
//     isCancelledRef.current = false;
//     loadAllDurations();

//     return () => {
//       isCancelledRef.current = true;
//     };
//   }, [loadAllDurations]);

//   const totalDuration = audioDurations.length
//     ? Math.ceil(audioDurations.reduce((sum, dur) => sum + dur, 0))
//     : 0;

//   return {
//     audioDurations,
//     totalDuration,
//     isLoading,
//     isReady,
//   };
// };

// export default usePreloadAudioMetadata;