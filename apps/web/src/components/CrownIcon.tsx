'use client';

import { useEffect, useId, useState } from 'react';

// "Boiling line" wobble, per:
// https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters
//
// feTurbulence generates a noise field; feDisplacementMap uses it to nudge
// the image's pixels around. We animate baseFrequency/seed with native SVG
// <animate> (SMIL) rather than JS setInterval + setAttribute — browsers are
// unreliable about repainting SVG filters when attributes are changed
// imperatively from JS (long-standing Chrome/WebKit bugs), which is what
// caused the "speeds up while the mouse moves, stalls when it stops" glitch:
// updates were happening on schedule, but only got rendered whenever mouse
// movement forced an unrelated repaint anyway. Native SMIL runs on the
// browser's own animation clock and doesn't have this problem.

const BASE_FREQUENCY = 0.06;
const OFFSETS = [-0.02, 0.01, -0.01, 0.02];
const DISPLACEMENT_SCALE = 2.5;
const STEP_MS = 100;

const FREQUENCY_VALUES = [...OFFSETS, OFFSETS[0]]
  .map(o => (BASE_FREQUENCY + o).toFixed(3))
  .join(';');
const SEED_VALUES = '1;2;3;4;1';
const KEY_TIMES = '0;0.25;0.5;0.75;1';
const DUR = `${(OFFSETS.length * STEP_MS) / 1000}s`;

interface CrownIconProps {
  /** Path to your crown image, e.g. "/crown.png" (relative to /public). */
  src: string;
  size?: number;
  className?: string;
}

export function CrownIcon({ src, size = 22, className = '' }: CrownIconProps) {
  const filterId = `crown-boil-${useId()}`;
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Respect the user's motion preference — just show a static crown.
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`overflow-visible flex-shrink-0 pointer-events-none ${className}`}
      style={{ isolation: 'isolate', contain: 'paint' }}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="turbulence" numOctaves={2} result="noise">
            {animate && (
              <>
                <animate
                  attributeName="baseFrequency"
                  values={FREQUENCY_VALUES}
                  keyTimes={KEY_TIMES}
                  dur={DUR}
                  calcMode="discrete"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="seed"
                  values={SEED_VALUES}
                  keyTimes={KEY_TIMES}
                  dur={DUR}
                  calcMode="discrete"
                  repeatCount="indefinite"
                />
              </>
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={DISPLACEMENT_SCALE}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <image
        href={src}
        x="0"
        y="0"
        width="24"
        height="24"
        filter={`url(#${filterId})`}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}