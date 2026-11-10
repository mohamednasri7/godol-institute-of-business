import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, CheckCircle, ArrowRight, X } from 'lucide-react';

const DEFAULT_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID || '342890';

/**
 * BunnyVideoPlayer - High-performance Bunny Stream Video Player
 * Supports Player.js postMessage API, 90% completion trigger, auto-play next lesson countdown,
 * and graceful fallback playback.
 */
const BunnyVideoPlayer = forwardRef(function BunnyVideoPlayer(
  {
    videoId,
    libraryId = DEFAULT_LIBRARY_ID,
    title = 'Course Video',
    autoPlay = false,
    onProgressUpdate,
    onLessonComplete,
    hasNextLesson = false,
    onPlayNextLesson,
    initialWatchedSeconds = 0,
    className = ''
  },
  ref
) {
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(initialWatchedSeconds || 0);
  const [duration, setDuration] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const countdownTimerRef = useRef(null);
  const isMockVideo = !videoId || videoId.startsWith('bunny_vid_') || videoId.startsWith('mock_');

  // Imperative handle for parent to seek, play, pause
  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ method: 'setCurrentTime', value: seconds }),
          '*'
        );
      }
      setCurrentTime(seconds);
    },
    play() {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ method: 'play' }),
          '*'
        );
      }
      setIsPlaying(true);
    },
    pause() {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ method: 'pause' }),
          '*'
        );
      }
      setIsPlaying(false);
    },
    getCurrentTime() {
      return currentTime;
    }
  }));

  // Handle postMessage events from Bunny Stream Player.js
  useEffect(() => {
    const handleMessage = (event) => {
      // Validate origin if desired, or parse Player.js payload
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || !data.event) return;

        switch (data.event) {
          case 'timeupdate': {
            const time = Math.floor(data.value?.currentTime || 0);
            const total = Math.floor(data.value?.duration || 0);
            setCurrentTime(time);
            if (total > 0 && total !== duration) setDuration(total);

            if (onProgressUpdate) {
              onProgressUpdate({
                watchedSeconds: time,
                durationSeconds: total,
                percent: total > 0 ? Math.round((time / total) * 100) : 0
              });
            }

            // Trigger auto-complete when reaching 90% of duration
            if (total > 0 && time / total >= 0.90 && !hasCompleted) {
              setHasCompleted(true);
              if (onLessonComplete) onLessonComplete();
            }
            break;
          }
          case 'play':
            setIsPlaying(true);
            break;
          case 'pause':
            setIsPlaying(false);
            break;
          case 'ended':
            setIsPlaying(false);
            if (!hasCompleted) {
              setHasCompleted(true);
              if (onLessonComplete) onLessonComplete();
            }
            if (hasNextLesson && onPlayNextLesson) {
              startNextLessonCountdown();
            }
            break;
          default:
            break;
        }
      } catch {
        // Not a JSON message from Player.js
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [duration, hasCompleted, hasNextLesson, onLessonComplete, onPlayNextLesson, onProgressUpdate]);

  // Countdown for Auto-Play Next Lesson
  const startNextLessonCountdown = () => {
    setCountdown(5);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          if (onPlayNextLesson) onPlayNextLesson();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(null);
  };

  // Build Bunny Stream Embed URL
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId || DEFAULT_LIBRARY_ID}/${videoId || 'default'}?autoplay=${autoPlay ? 'true' : 'false'}&loop=false&muted=false&preload=true&responsive=true`;

  return (
    <div className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 ${className}`}>
      {!isMockVideo ? (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          loading="lazy"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
      ) : (
        // High-fidelity fallback simulated player for local/mock video IDs
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />

          {/* Video Title Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-accent border border-accent/20">
                Bunny Stream 4K
              </span>
              <span className="text-xs font-semibold text-white/80 truncate max-w-sm">
                {title}
              </span>
            </div>
            <div className="text-[11px] text-white/50 font-mono">
              ID: {videoId || 'Sample'}
            </div>
          </div>

          {/* Central Play/Pause Action */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                const nextPlaying = !isPlaying;
                setIsPlaying(nextPlaying);
                if (nextPlaying && !hasCompleted) {
                  // Simulate progress in mock mode
                  setTimeout(() => {
                    setHasCompleted(true);
                    if (onLessonComplete) onLessonComplete();
                  }, 4000);
                }
              }}
              className="w-20 h-20 rounded-full liquid-glass flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-xl group border border-white/20"
              style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%)' }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current text-accent" />
              ) : (
                <Play className="w-8 h-8 fill-current text-accent ml-1" />
              )}
            </button>
            <p className="text-xs text-white/60 font-medium">
              {isPlaying ? 'Streaming live from Bunny.net CDN...' : 'Click to start playback'}
            </p>
          </div>

          {/* Bottom Mock Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2 z-10">
            {/* Progress bar */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${hasCompleted ? 100 : (isPlaying ? 65 : 20)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{hasCompleted ? '15:00 / 15:00' : (isPlaying ? '09:45 / 15:00' : '00:00 / 15:00')}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setHasCompleted(true);
                    if (onLessonComplete) onLessonComplete();
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {hasCompleted ? 'Completed ✓' : 'Mark Watched'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Play Next Lesson Countdown Modal */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mb-4 text-accent">
            <span className="text-2xl font-black">{countdown}</span>
          </div>
          <h3 className="font-serif text-xl font-bold mb-2">Lesson Finished!</h3>
          <p className="text-xs text-white/70 mb-6 max-w-xs">
            Playing next lesson automatically in {countdown} seconds...
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={cancelCountdown}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={() => {
                cancelCountdown();
                if (onPlayNextLesson) onPlayNextLesson();
              }}
              className="px-6 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105 flex items-center gap-2"
              style={{ background: 'hsl(42 92% 52%)', color: 'hsl(215 50% 12%)' }}
            >
              <span>Play Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default BunnyVideoPlayer;

