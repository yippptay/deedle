import { useState, useEffect, useRef } from 'react';

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(n => String(n).padStart(2, '0')).join(':');
}

// Counts down to the next UTC midnight — matches when get_or_set_daily_quote()
// rolls over to a new quote server-side. Calls onReset once, the moment it hits zero.
export function useCountdownToReset(onReset?: () => void): string {
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const firedRef = useRef(false);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const nextResetUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      );
      const diff = nextResetUTC - now.getTime();
      setTimeLeft(formatTimeLeft(diff));

      if (diff <= 0 && !firedRef.current) {
        firedRef.current = true;
        onReset?.();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);

    // Background tabs get their timers throttled or fully suspended by the
    // browser, so the interval above may not fire exactly at midnight if the
    // tab isn't active. Re-check immediately whenever it regains focus.
    function handleVisibility() {
      if (document.visibilityState === 'visible') tick();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [onReset]);

  return timeLeft;
}