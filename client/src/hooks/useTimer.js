import { useState, useRef, useCallback } from 'react';

const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [running]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    return seconds; // return elapsed for saving
  }, [seconds]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(0);
  }, []);

  const format = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  return { seconds, running, start, stop, reset, formatted: format(seconds) };
};

export default useTimer;