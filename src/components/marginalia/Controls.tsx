'use client';

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

const DURATION = 150; // mock length in seconds
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const LINE = 'M2 10 C 40 5, 80 15, 120 9 S 200 13, 240 8 S 330 14, 398 9';

// Volume squiggle: waves grow toward the right, like a volume ramp
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

function Astronaut() {
  return (
    <svg viewBox="0 0 11 12" width="33" height="36" shapeRendering="crispEdges" aria-hidden="true">
      {SPRITE.flatMap((row, y) =>
        [...row].map((c, x) =>
          COLORS[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[c]} /> : null,
        ),
      )}
    </svg>
  );
}

export function Controls() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.28);
  const [hover, setHover] = useState<number | null>(null);
  const [drawKey, setDrawKey] = useState(0);

  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [muteKey, setMuteKey] = useState(0);
  const [full, setFull] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => Math.min(1, p + 0.25 / DURATION)), 250);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (progress >= 1 && playing) setPlaying(false);
  }, [progress, playing]);

  const toggle = () => {
    if (progress >= 1) setProgress(0);
    setPlaying((p) => !p);
    setDrawKey((k) => k + 1);
  };

  const pctFrom = (el: HTMLElement | null, e: PointerEvent) => {
    const r = el!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };

  const onSeekKey = (e: KeyboardEvent) => {
    const step = 5 / DURATION;
    if (e.key === 'ArrowRight') setProgress((p) => Math.min(1, p + step));
    else if (e.key === 'ArrowLeft') setProgress((p) => Math.max(0, p - step));
    else if (e.key === 'Home') setProgress(0);
    else if (e.key === 'End') setProgress(1);
    else return;
    e.preventDefault();
  };

  const onVolKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setVolume((v) => Math.min(1, v + 0.05));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setVolume((v) => Math.max(0, v - 0.05));
    else if (e.key === 'Home') setVolume(0);
    else if (e.key === 'End') setVolume(1);
    else return;
    setMuted(false);
    e.preventDefault();
  };

  const t = progress * DURATION;
  const level = muted ? 0 : volume;

  return (
    <div className="strip">
      {/* Play */}
      <button type="button" className="sticky-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {drawKey > 0 && (
          <svg key={drawKey} className="scribble" viewBox="0 0 80 80" aria-hidden="true">
            <path pathLength="1" d="M40 6 C 62 4, 78 22, 74 44 C 70 66, 48 77, 28 72 C 8 66, 3 40, 12 24 C 20 10, 38 8, 52 12" />
          </svg>
        )}
        <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
          {playing ? (
            <>
              <rect x="2" y="1" width="2" height="7" />
              <rect x="5" y="1" width="2" height="7" />
            </>
          ) : (
            <>
              <rect x="2" y="1" width="1" height="7" />
              <rect x="3" y="2" width="1" height="5" />
              <rect x="4" y="3" width="1" height="3" />
              <rect x="5" y="4" width="1" height="1" />
            </>
          )}
        </svg>
      </button>

      {/* Seek */}
      <div
        className="seek"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={DURATION}
        aria-valuenow={Math.round(t)}
        aria-valuetext={`${fmt(t)} of ${fmt(DURATION)}`}
        onKeyDown={onSeekKey}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setProgress(pctFrom(trackRef.current, e));
        }}
        onPointerMove={(e) => {
          const p = pctFrom(trackRef.current, e);
          setHover(p);
          if (e.buttons === 1) setProgress(p);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg className="pencil" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
          <path d={LINE} vectorEffect="non-scaling-stroke" />
        </svg>
        <svg
          className="ink"
          viewBox="0 0 400 20"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ clipPath: `inset(-10px ${(1 - progress) * 100}% -10px 0)` }}
        >
          <path d={LINE} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="ticks" aria-hidden="true" />
        <span className="rider" data-playing={playing || undefined} style={{ left: `${progress * 100}%` }} aria-hidden="true">
          <Astronaut />
        </span>
        {hover !== null && (
          <span className="tip" style={{ left: `${hover * 100}%` }} aria-hidden="true">
            {fmt(hover * DURATION)}
          </span>
        )}
      </div>

      {/* Margin-note time */}
      <p className="margin-note" aria-hidden="true">
        {fmt(t)} <span>/ {fmt(DURATION)}</span>
      </p>

      {/* Tools: mute, volume squiggle, fullscreen */}
      <div className="tools">
        <button
          type="button"
          className="tab tab-a"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => {
            setMuted((m) => !m);
            setMuteKey((k) => k + 1);
          }}
        >
          <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
            <rect x="0" y="3" width="2" height="3" />
            <rect x="2" y="2" width="1" height="5" />
            <rect x="3" y="1" width="1" height="7" />
            {!muted && (
              <>
                <rect x="5" y="3" width="1" height="3" />
                <rect x="7" y="2" width="1" height="5" />
              </>
            )}
          </svg>
          {muted && (
            <svg key={muteKey} className="scribble scribble-x" viewBox="0 0 80 80" aria-hidden="true">
              <path pathLength="1" d="M14 14 L 68 66 M 68 14 L 14 68" />
            </svg>
          )}
        </button>

        <div
          className="vol"
          ref={volRef}
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
          onKeyDown={onVolKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setVolume(pctFrom(volRef.current, e));
            setMuted(false);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) {
              setVolume(pctFrom(volRef.current, e));
              setMuted(false);
            }
          }}
        >
          <svg className="wave wave-base" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
            <path d={WAVE} vectorEffect="non-scaling-stroke" />
          </svg>
          <svg
            className="wave wave-ink"
            viewBox="0 0 100 48"
            preserveAspectRatio="none"
            aria-hidden="true"
            style={{ clipPath: `inset(-10px ${(1 - level) * 100}% -10px 0)` }}
          >
            <path d={WAVE} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <button type="button" className="tab tab-b" aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFull((f) => !f)}>
          <svg viewBox="0 0 9 9" className="pixel-icon" shapeRendering="crispEdges" aria-hidden="true">
            {full ? (
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
      </div>
    </div>
  );
}