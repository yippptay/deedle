'use client';

import { useEffect, useId, useRef } from 'react';

// "Boiling line" wobble, per:
// https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters
//
// feTurbulence generates a noise field; feDisplacementMap uses it to nudge
// the image's pixels around. We then re-roll the turbulence's baseFrequency
// (and seed, so the noise pattern itself changes) on an interval, which
// reads as a subtle hand-drawn jitter rather than a static distortion.

const BASE_FREQUENCY = 0.08;
const OFFSETS = [-0.02, 0.01, -0.01, 0.02];
const DISPLACEMENT_SCALE = 2.5;
const INTERVAL_MS = 100;

interface CrownIconProps {
  /** Path to your crown image, e.g. "/crown.png" (relative to /public). */
  src: string;
  size?: number;
  className?: string;
}

export function CrownIcon({ src, size = 22, className = '' }: CrownIconProps) {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const filterId = `crown-boil-${useId()}`;

  useEffect(() => {
    const node = turbulenceRef.current;
    if (!node) return;

    // Respect the user's motion preference — just show a static crown.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let tick = 0;
    const interval = setInterval(() => {
      const offset = OFFSETS[tick % OFFSETS.length];
      node.setAttribute('baseFrequency', String(BASE_FREQUENCY + offset));
      node.setAttribute('seed', String(tick));
      tick++;
    }, INTERVAL_MS);

    return () => clearInterval(interval);
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
          <feTurbulence
            ref={turbulenceRef}
            type="turbulence"
            baseFrequency={BASE_FREQUENCY}
            numOctaves={2}
            seed={1}
            result="noise"
          />
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