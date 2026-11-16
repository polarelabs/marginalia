'use client';

import {
  BufferingIndicator,
  CaptionsButton,
  Container,
  Controls,
  FullscreenButton,
  Gesture,
  Hotkey,
  MuteButton,
  PiPButton,
  PlaybackRateButton,
  PlayButton,
  SeekIndicator,
  selectPlayback,
  selectVolume,
  StatusAnnouncer,
  Time,
  TimeSlider,
  usePlayer,
  VolumeSlider,
} from '@videojs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import './marginalia.css';

const LINE = 'M2 10 C 40 5, 80 15, 120 9 S 200 13, 240 8 S 330 14, 398 9';

const WAVE = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= 100; x += 2) {
    const y = 24 + Math.sin((x / 100) * Math.PI * 6) * (3 + 11 * (x / 100));
    pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const SPRITE = [
  '...BBBBB...',
  '..BWWWWWB..',
  '.BWKKKKKWB.',
  '.BWKKKKKWB.',
  '.BWWWWWWWB.',
  '..BBBBBBB..',
  '.BBRRRRRBB.',
  'BBBRRRRRBBB',
  'B.BRRRRRB.B',
  '..BBBBBBB..',
  '..BB...BB..',
  '..BB...BB..',
];
const COLORS: Record<string, string> = { B: '#1c1a17', W: '#ffffff', K: '#3a6ea5', R: '#ef476f' };

function Astronaut({ size = 3, rows = SPRITE.length }: { size?: number; rows?: number }) {
  return (
    <svg viewBox={`0 0 11 ${rows}`} width={11 * size} height={rows * size} shapeRendering="crispEdges" aria-hidden="true">
      {SPRITE.slice(0, rows).flatMap((row, y) =>
        [...row].map((c, x) =>
          COLORS[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[c]} /> : null,
        ),
      )}
    </svg>
  );
}

function PixelStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="0" width="1" height="7" />
      <rect x="0" y="3" width="7" height="1" />
      <rect x="2" y="2" width="3" height="3" />
    </svg>
  );
}

/* Slides out from between the two prints and holds up a speech bubble */
function Mascot() {
  const playback = usePlayer(selectPlayback);
  const audio = usePlayer(selectVolume);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const prev = useRef<{ paused?: boolean; volume?: number; muted?: boolean }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const paused = playback?.paused;
  const ended = playback?.ended;
  const volume = audio?.volume;
  const muted = audio?.muted;

  useEffect(() => {
    const p = prev.current;
    const first = p.paused === undefined;
    let next: string | null = null;

    if (!first) {
      if (volume !== p.volume && !muted) next = `Volume ${Math.round((volume ?? 0) * 100)}%`;
      else if (muted !== p.muted) next = muted ? 'Shhh… muted' : 'Sound on!';
      else if (paused !== p.paused && !ended) next = paused ? 'Paused. Take a breath!' : 'Rolling!';
    }
    prev.current = { paused, volume, muted };

    if (next) {
      setMsg(next);
      setOpen(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(false), 1800);
    }
  }, [paused, ended, volume, muted]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      <span className="mascot-body" data-open={open || undefined} aria-hidden="true">
        <Astronaut size={6} rows={6} />
      </span>
      <p className="bubble" data-open={open || undefined} aria-hidden="true">{msg}</p>
    </>
  );
}

/* Controls hide 2s after playback starts. Hover the bottom area, press a key
   or touch the player to bring them back. Always visible while paused. */
function AutoHide() {
  const ref = useRef<HTMLSpanElement>(null);
  const playback = usePlayer(selectPlayback);
  const playing = !!playback && !playback.paused && !playback.ended;

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let inZone = false;

    const show = () => {
      el.dataset.ui = 'show';
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!inZone) el.dataset.ui = 'hide';
      }, 2000);
    };

    show();
    if (!playing) return;
    arm();

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (e.clientY >= r.bottom - 190) {
        inZone = true;
        show();
        clearTimeout(timer);
      } else if (inZone) {
        inZone = false;
        arm();
      }
    };
    const onLeave = () => {
      inZone = false;
      arm();
    };
    const onTouch = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        show();
        arm();
      }
    };
    const onKey = () => {
      show();
      arm();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onTouch);
    el.addEventListener('focusin', onKey);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onTouch);
      el.removeEventListener('focusin', onKey);
      document.removeEventListener('keydown', onKey);
    };
  }, [playing]);

  return <span ref={ref} hidden />;
}

export function MarginaliaSkin({ children }: { children: ReactNode }) {
  const [help, setHelp] = useState(false);
  const helpBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // "?" toggles the cheat sheet, Escape closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?') setHelp((v) => !v);
      else if (e.key === 'Escape') setHelp(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Move focus into the note when it opens, back to the "?" tab when it closes
  useEffect(() => {
    if (help) closeBtn.current?.focus();
    else if (wasOpen.current) helpBtn.current?.focus();
    wasOpen.current = help;
  }, [help]);

  return (
    <figure className="paper-frame" role="region" aria-label="Video player">
      {/* Scenery on the desk */}
      <span className="coffee" aria-hidden="true" />
      <svg className="clip" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M14 70 V22 a8 8 0 0 1 16 0 V68 a12 12 0 0 1 -24 0 V24" fill="none" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span className="doodle doodle-star-a" aria-hidden="true"><PixelStar /></span>
      <span className="doodle doodle-star-b" aria-hidden="true"><PixelStar /></span>
      <span className="doodle doodle-note" aria-hidden="true">
        watch closely!
        <svg viewBox="0 0 60 40" aria-hidden="true">
          <path d="M4 6 C 20 2, 44 10, 52 32 M44 26 L52 34 L56 22" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="press-me" aria-hidden="true">
        <svg viewBox="0 0 100 50" aria-hidden="true">
          <path d="M6 44 C 30 48, 62 38, 88 8 M78 8 L90 6 L92 18" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        press me!
      </span>

      <Container className="photo">
        <AutoHide />
        <span className="sketch-border" aria-hidden="true" />
        <Mascot />
        <span className="tape tape-l" aria-hidden="true" />
        <span className="tape tape-r" aria-hidden="true" />

        <div className="screen">
          {children}

          {/* Loading: a flipbook astronaut */}
          <BufferingIndicator className="flip">
            <span className="flip-hero"><Astronaut /></span>
            <span className="flip-text">drawing the next frame…</span>
          </BufferingIndicator>

          {/* Double-tap / arrow-key skip doodle */}
          <SeekIndicator.Root className="seek-note">
            <SeekIndicator.Value />
          </SeekIndicator.Root>

          {/* THE END stamp */}
          <div className="end-stamp" aria-hidden="true">THE END</div>
        </div>

        {/* Keyboard cheat sheet */}
        {help && (
          <div className="cheat" role="dialog" aria-label="Keyboard shortcuts">
            <h2>Cheat sheet</h2>
            <ul>
              <li><span><kbd>Space</kbd> <kbd>K</kbd></span> play / pause</li>
              <li><span><kbd>M</kbd></span> mute</li>
              <li><span><kbd>F</kbd></span> fullscreen</li>
              <li><span><kbd>←</kbd> <kbd>→</kbd></span> skip 5s</li>
              <li><span>2× click</span> skip 10s</li>
              <li><span><kbd>?</kbd></span> this note</li>
              <li><span><kbd>Esc</kbd></span> close it</li>
            </ul>
            <button ref={closeBtn} type="button" className="cheat-close" onClick={() => setHelp(false)}>
              got it
            </button>
          </div>
        )}

        <Controls.Root visibility="always">
          <Controls.Content className="strip">
            {/* Extra tools sit on the edge of the video */}
            <div className="extras">
              <PlaybackRateButton
                className="tab tab-sm tab-speed"
                render={(props, state) => (
                  <button {...props}>{Math.round(state.rate * 100) / 100}×</button>
                )}
              />
              <PiPButton
                className="tab tab-sm"
                render={(props) => (
                  <button {...props}>
                    <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
                      <rect x="1" y="1" width="7" height="1" />
                      <rect x="1" y="7" width="7" height="1" />
                      <rect x="1" y="1" width="1" height="7" />
                      <rect x="7" y="1" width="1" height="7" />
                      <rect x="4" y="4" width="3" height="3" />
                    </svg>
                  </button>
                )}
              />
              <CaptionsButton
                className="tab tab-sm tab-cc"
                render={(props, state) => (
                  <button {...props} data-on={state.subtitlesShowing || undefined}>CC</button>
                )}
              />
              <button
                ref={helpBtn}
                type="button"
                className="tab tab-sm tab-cc"
                aria-label="Keyboard shortcuts"
                aria-expanded={help}
                onClick={() => setHelp((v) => !v)}
              >
                ?
              </button>
            </div>

            {/* Play / pause / replay */}
            <PlayButton
              className="sticky-play"
              render={(props, state) => (
                <button {...props}>
                  <svg key={`${state.paused}-${state.ended}`} className="scribble" viewBox="0 0 80 80" aria-hidden="true">
                    <path pathLength="1" d="M40 6 C 62 4, 78 22, 74 44 C 70 66, 48 77, 28 72 C 8 66, 3 40, 12 24 C 20 10, 38 8, 52 12" />
                  </svg>
                  {state.ended ? (
                    <svg viewBox="0 0 24 24" className="replay-icon" aria-hidden="true">
                      <path d="M5 12a7 7 0 1 0 2.2-5.1" fill="none" strokeWidth="3" strokeLinecap="square" />
                      <path d="M3 3v6h6" fill="none" strokeWidth="3" strokeLinecap="square" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
                      {state.paused ? (
                        <>
                          <rect x="2" y="1" width="1" height="7" />
                          <rect x="3" y="2" width="1" height="5" />
                          <rect x="4" y="3" width="1" height="3" />
                          <rect x="5" y="4" width="1" height="1" />
                        </>
                      ) : (
                        <>
                          <rect x="2" y="1" width="2" height="7" />
                          <rect x="5" y="1" width="2" height="7" />
                        </>
                      )}
                    </svg>
                  )}
                </button>
              )}
            />

            {/* Seek: pencil line, inked as you play, astronaut rides it */}
            <TimeSlider.Root className="seek">
              <TimeSlider.Track className="hit" />
              <svg className="pencil" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                <path d={LINE} vectorEffect="non-scaling-stroke" />
              </svg>
              <svg className="ink" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                <path d={LINE} vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="ticks" aria-hidden="true" />
              <TimeSlider.Thumb className="rider">
                <Astronaut />
              </TimeSlider.Thumb>
              <TimeSlider.Preview className="tip">
                <TimeSlider.Value type="pointer" />
              </TimeSlider.Preview>
            </TimeSlider.Root>

            {/* Margin-note time */}
            <p className="margin-note" aria-hidden="true">
              <Time.Value type="current" /> <span>/ <Time.Value type="duration" /></span>
            </p>

            {/* Tools */}
            <div className="tools">
              <MuteButton
                className="tab tab-a"
                render={(props, state) => (
                  <button {...props}>
                    <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
                      <rect x="0" y="3" width="2" height="3" />
                      <rect x="2" y="2" width="1" height="5" />
                      <rect x="3" y="1" width="1" height="7" />
                      {!state.muted && (
                        <>
                          <rect x="5" y="3" width="1" height="3" />
                          <rect x="7" y="2" width="1" height="5" />
                        </>
                      )}
                    </svg>
                    {state.muted && (
                      <svg className="scribble scribble-x" viewBox="0 0 80 80" aria-hidden="true">
                        <path pathLength="1" d="M14 14 L 68 66 M 68 14 L 14 68" />
                      </svg>
                    )}
                  </button>
                )}
              />

              <VolumeSlider.Root className="vol">
                <VolumeSlider.Track className="hit" />
                <svg className="wave wave-base" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
                  <path d={WAVE} vectorEffect="non-scaling-stroke" />
                </svg>
                <svg className="wave wave-ink" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
                  <path d={WAVE} vectorEffect="non-scaling-stroke" />
                </svg>
              </VolumeSlider.Root>

              <FullscreenButton
                className="tab tab-b"
                render={(props, state) => (
                  <button {...props}>
                    <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
                      {state.fullscreen ? (
                        <>
                          <rect x="3" y="1" width="1" height="3" /><rect x="1" y="3" width="3" height="1" />
                          <rect x="5" y="1" width="1" height="3" /><rect x="5" y="3" width="3" height="1" />
                          <rect x="3" y="5" width="1" height="3" /><rect x="1" y="5" width="3" height="1" />
                          <rect x="5" y="5" width="1" height="3" /><rect x="5" y="5" width="3" height="1" />
                        </>
                      ) : (
                        <>
                          <rect x="1" y="1" width="3" height="1" /><rect x="1" y="1" width="1" height="3" />
                          <rect x="5" y="1" width="3" height="1" /><rect x="7" y="1" width="1" height="3" />
                          <rect x="1" y="7" width="3" height="1" /><rect x="1" y="5" width="1" height="3" />
                          <rect x="5" y="7" width="3" height="1" /><rect x="7" y="5" width="1" height="3" />
                        </>
                      )}
                    </svg>
                  </button>
                )}
              />
            </div>
          </Controls.Content>
        </Controls.Root>

        <Hotkey keys="Space" action="togglePaused" />
        <Hotkey keys="k" action="togglePaused" />
        <Hotkey keys="m" action="toggleMuted" />
        <Hotkey keys="f" action="toggleFullscreen" />
        <Hotkey keys="ArrowLeft" action="seekStep" value={-5} />
        <Hotkey keys="ArrowRight" action="seekStep" value={5} />

        <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
        <Gesture type="doubletap" action="seekStep" value={-10} region="left" />
        <Gesture type="doubletap" action="seekStep" value={10} region="right" />

        <StatusAnnouncer className="sr-only-status" />
      </Container>
    </figure>
  );
}