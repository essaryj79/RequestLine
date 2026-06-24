import { useState, useEffect, useRef } from 'react';
import { Song, ThemeColors, RequestItem, AppSettings } from '../types';
import { parseChordPro, transposeChordPro } from '../utils/chordTransposer';
import { X, Play, Pause, ChevronLeft, ChevronRight, Settings2, Sliders, RefreshCw, Radio } from 'lucide-react';

interface ViewerProps {
  song: Song;
  songsList: Song[]; // active setlist songs
  currentIndex: number;
  requests: RequestItem[];
  settings: AppSettings;
  colors: ThemeColors;
  stageSyncEnabled: boolean;
  onToggleStageSync: (enabled: boolean) => void;
  onUpdateSongSettings: (songId: string, fontSz: number, speed: number, delay: number, transpose: number) => void;
  onSongMarkedPlayed: (songId: string) => void;
  onNavigateToSong: (index: number) => void;
  onClose: (markAsPlayed: boolean) => void;
  // Stage Sync State Integration
  syncScrollTop: number;
  onScrollChanged: (scrollTop: number) => void;
  isSyncLeader: boolean;
}

export default function Viewer({
  song,
  songsList,
  currentIndex,
  requests,
  settings,
  colors,
  stageSyncEnabled,
  onToggleStageSync,
  onUpdateSongSettings,
  onSongMarkedPlayed,
  onNavigateToSong,
  onClose,
  syncScrollTop,
  onScrollChanged,
  isSyncLeader
}: ViewerProps) {
  // Overridable settings per song
  const initialFontSize = song.settings?.fontSize ?? settings.defaultFontSize;
  const initialScrollSpeed = song.settings?.scrollSpeed ?? settings.defaultScrollSpeed;
  const initialScrollDelay = song.settings?.scrollDelay ?? settings.defaultScrollDelay;
  const initialTranspose = song.settings?.transpose ?? 0;

  const [fontSize, setFontSize] = useState(initialFontSize);
  const [scrollSpeed, setScrollSpeed] = useState(initialScrollSpeed);
  const [scrollDelay, setScrollDelay] = useState(initialScrollDelay);
  const [transpose, setTranspose] = useState(initialTranspose);

  // Auto-scroll states
  const [isScrolling, setIsScrolling] = useState(false);
  const [countdown, setCountdown] = useState(initialScrollDelay);
  const [showConfig, setShowConfig] = useState(false);

  // Count active requests in queue
  const activeRequestsCount = requests.filter(r => !r.played).length;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const playedTimeoutRef = useRef<any>(null);

  // Sync state variables to prevent loop triggers
  const lastEmittedScrollTop = useRef<number>(0);

  // Track 30-second play marker
  useEffect(() => {
    // Clear any existing played timeout
    if (playedTimeoutRef.current) clearTimeout(playedTimeoutRef.current);

    // After 30 seconds, mark song as played
    playedTimeoutRef.current = setTimeout(() => {
      onSongMarkedPlayed(song.id);
    }, 30000);

    return () => {
      if (playedTimeoutRef.current) clearTimeout(playedTimeoutRef.current);
    };
  }, [song.id]);

  // Restart countdown when song or scrollDelay changes
  useEffect(() => {
    setIsScrolling(false);
    setCountdown(scrollDelay);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (scrollDelay > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setIsScrolling(true); // Auto start scrolling
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsScrolling(true);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [song.id, scrollDelay]);

  // Setup auto-scroll interval
  useEffect(() => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

    if (isScrolling) {
      // 50ms tick interval (20fps)
      scrollIntervalRef.current = setInterval(() => {
        const container = scrollContainerRef.current;
        if (container) {
          // If the viewer is scrolled to bottom, stop scrolling
          const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
          if (isAtBottom) {
            setIsScrolling(false);
            return;
          }

          // speed is px per second. In 50ms (0.05s), scroll amount is speed * 0.05
          const step = scrollSpeed * 0.05;
          const nextScrollTop = container.scrollTop + step;
          container.scrollTop = nextScrollTop;

          // Emit scroll change for stage sync
          if (stageSyncEnabled && isSyncLeader) {
            const relativeScroll = nextScrollTop / (container.scrollHeight - container.clientHeight || 1);
            if (Math.abs(relativeScroll - lastEmittedScrollTop.current) > 0.005) {
              onScrollChanged(relativeScroll);
              lastEmittedScrollTop.current = relativeScroll;
            }
          }
        }
      }, 50);
    }

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isScrolling, scrollSpeed, stageSyncEnabled, isSyncLeader]);

  // Handle Incoming Stage Sync scroll position
  useEffect(() => {
    if (stageSyncEnabled && !isSyncLeader && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetScrollTop = syncScrollTop * (container.scrollHeight - container.clientHeight);
      // Avoid jitter
      if (Math.abs(container.scrollTop - targetScrollTop) > 5) {
        container.scrollTop = targetScrollTop;
      }
    }
  }, [syncScrollTop, stageSyncEnabled, isSyncLeader]);

  // Handle local user scroll on container (for stage sync broadcast)
  const handleScroll = () => {
    if (stageSyncEnabled && isSyncLeader && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const relativeScroll = container.scrollTop / (container.scrollHeight - container.clientHeight || 1);
      
      // Prevent echoing back
      if (Math.abs(relativeScroll - lastEmittedScrollTop.current) > 0.01) {
        onScrollChanged(relativeScroll);
        lastEmittedScrollTop.current = relativeScroll;
      }
    }
  };

  // Exit & Save changed overrides for the song
  const handleExit = (markAsPlayed: boolean) => {
    // Save settings per-song on exit
    onUpdateSongSettings(song.id, fontSize, scrollSpeed, scrollDelay, transpose);
    onClose(markAsPlayed);
  };

  // Parse & Transpose the ChordPro content
  const transposedContent = transposeChordPro(song.content, transpose);
  const parsedLines = parseChordPro(transposedContent);

  // Reset to original settings for the song
  const handleResetSettings = () => {
    setFontSize(settings.defaultFontSize);
    setScrollSpeed(settings.defaultScrollSpeed);
    setScrollDelay(settings.defaultScrollDelay);
    setTranspose(0);
  };

  return (
    <div 
      className="fixed inset-0 theme-backend z-40 flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: settings.fontStyle === 'sans' ? 'Inter, sans-serif' : settings.fontStyle === 'serif' ? 'Georgia, serif' : 'monospace'
      }}
      id="performance-viewer"
    >
      {/* 1. TOP BAR */}
      <div 
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '22' }}
      >
        {/* Top Left: Title & Artist */}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-black truncate">{song.title}</h2>
          <p className="text-xs sm:text-sm opacity-75 truncate">{song.artist}</p>
        </div>

        {/* Top Center: Countdown indicator */}
        <div className="flex-1 flex justify-center">
          {countdown > 0 ? (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Scrolling in {countdown}s...
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Auto-Scroll Active
            </div>
          )}
        </div>

        {/* Top Right: Stage Sync */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStageSync(!stageSyncEnabled)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 cursor-pointer`}
            style={{
              backgroundColor: stageSyncEnabled ? colors.accent + '15' : 'transparent',
              color: stageSyncEnabled ? colors.accent : colors.mutedText,
              borderColor: stageSyncEnabled ? colors.accent : colors.accent + '22'
            }}
            id="viewer-stage-sync-btn"
          >
            <Radio className={`w-4 h-4 ${stageSyncEnabled ? 'animate-pulse' : ''}`} />
            Sync: {stageSyncEnabled ? (isSyncLeader ? 'Leader' : 'Follower') : 'Off'}
          </button>
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS BAR */}
      <div 
        className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b bg-black/10"
        style={{ borderColor: colors.accent + '11' }}
      >
        {/* Left: Queue and Skip */}
        <div className="flex items-center gap-2">
          <span 
            className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border"
            style={{ borderColor: colors.accent + '15', color: colors.accent }}
            title="Active requests in audience queue"
          >
            Queue: {activeRequestsCount} Requests
          </span>

          <button
            onClick={() => handleExit(false)} // Exits without plays++
            className="px-3 py-1 rounded-lg border text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
            style={{ borderColor: colors.accent + '33' }}
            title="Exit song without marking as played"
            id="viewer-exit-no-play"
          >
            Exit (Unplayed)
          </button>
        </div>

        {/* Center: Play controls */}
        <div className="flex items-center gap-3">
          <button
            disabled={currentIndex === 0}
            onClick={() => onNavigateToSong(currentIndex - 1)}
            className="p-2 rounded-lg border disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 transition-all cursor-pointer"
            style={{ borderColor: colors.accent + '33' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className="px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: colors.primary }}
            id="viewer-play-pause-btn"
          >
            {isScrolling ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Scroll
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Scroll
              </>
            )}
          </button>

          <button
            disabled={currentIndex >= songsList.length - 1}
            onClick={() => onNavigateToSong(currentIndex + 1)}
            className="p-2 rounded-lg border disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 transition-all cursor-pointer"
            style={{ borderColor: colors.accent + '33' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Toggle Overrides and Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-lg border transition-all hover:bg-white/5 cursor-pointer`}
            style={{ 
              borderColor: showConfig ? colors.primary : colors.accent + '33',
              color: showConfig ? colors.primary : colors.text
            }}
            title="Sheet Tuning Controls (Font, Speed, Key)"
            id="viewer-config-toggle"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleExit(true)} // Closes and marks as played
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            title="Mark as played and Close"
            id="viewer-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. TUNING CONTROLS OVERLAY (collapsible) */}
      {showConfig && (
        <div 
          className="p-5 border-b grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in relative z-20"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '22' }}
          id="viewer-config-panel"
        >
          {/* Font Size */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase opacity-75">Lyrics Font Size ({fontSize}px)</label>
            <input
              type="range"
              min="12"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-[var(--primary-color)] cursor-pointer"
            />
          </div>

          {/* Scroll Speed */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase opacity-75">Scroll Speed ({scrollSpeed} px/s)</label>
            <input
              type="range"
              min="5"
              max="150"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-full accent-[var(--primary-color)] cursor-pointer"
            />
          </div>

          {/* Scroll Delay */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase opacity-75">Start Delay ({scrollDelay}s)</label>
            <input
              type="range"
              min="0"
              max="30"
              value={scrollDelay}
              onChange={(e) => setScrollDelay(Number(e.target.value))}
              className="w-full accent-[var(--primary-color)] cursor-pointer"
            />
          </div>

          {/* Transpose Key */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase opacity-75">Transpose ({transpose > 0 ? `+${transpose}` : transpose} semitones)</label>
              <button
                onClick={handleResetSettings}
                className="text-[9px] font-bold text-red-400 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setTranspose(prev => Math.max(-11, prev - 1))}
                className="py-1 rounded border border-white/10 hover:bg-white/5 font-bold text-xs cursor-pointer"
              >
                -1
              </button>
              <button
                onClick={() => setTranspose(0)}
                className="py-1 rounded border border-white/10 hover:bg-white/5 font-bold text-xs cursor-pointer"
              >
                Orig
              </button>
              <button
                onClick={() => setTranspose(prev => Math.min(11, prev + 1))}
                className="py-1 rounded border border-white/10 hover:bg-white/5 font-bold text-xs cursor-pointer"
              >
                +1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN SHEET MUSIC CONTENT VIEWPORT */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 select-text scrollbar-thin"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
        id="viewer-sheet-scroll"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {song.format === 'chordpro' ? (
            /* RENDER CHORDPRO FORMAT */
            parsedLines.map((line, idx) => {
              if (line.type === 'directive') {
                if (line.directiveName === 'chorus') {
                  return <div key={idx} className="border-l-4 pl-4 font-bold my-4 opacity-95" style={{ borderColor: colors.primary }} />;
                }
                if (line.directiveName === 'end_of_chorus') {
                  return <div key={idx} className="my-2 border-b border-dashed border-white/10" />;
                }
                return null; // hide other directives inside lyrics view
              }
              
              if (line.type === 'comment') {
                return (
                  <p key={idx} className="text-sm italic font-semibold opacity-60 my-2">
                    {line.originalText}
                  </p>
                );
              }

              return (
                <div key={idx} className="flex flex-wrap items-end my-1.5 leading-none">
                  {line.segments?.map((seg, sIdx) => (
                    <div key={sIdx} className="flex flex-col mr-1 mb-1 mt-3">
                      {seg.chord && (
                        <span 
                          className="text-xs font-bold leading-none mb-1 text-[var(--primary-color)] select-none select-none select-none select-none block"
                          style={{ color: colors.primary, fontSize: `${Math.max(10, fontSize * 0.5)}px` }}
                        >
                          {seg.chord}
                        </span>
                      )}
                      <span className="text-base leading-none select-text block whitespace-pre" style={{ fontSize: `${fontSize}px` }}>
                        {seg.text || '\u00A0'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })
          ) : (
            /* RENDER PLAIN TEXT/CHORDS */
            <pre 
              className="font-mono whitespace-pre-wrap leading-relaxed select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {transposedContent}
            </pre>
          )}

          {/* Safety space at bottom so they can scroll the last line to top */}
          <div className="h-[60vh]" />
        </div>
      </div>
    </div>
  );
}
