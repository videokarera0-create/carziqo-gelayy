import { useState, useEffect } from 'react';

const ACCENT_COLORS = [
  '#22d3ee', // cyan
  '#34d399', // emerald
  '#fbbf24', // amber
  '#fb7185', // rose
  '#60a5fa', // blue
  '#f472b6', // pink
  '#2dd4bf', // teal
  '#f59e0b', // orange
];

function pickRandomColor(exclude?: string): string {
  const pool = ACCENT_COLORS.filter((c) => c !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useAccentColor(intervalMs = 60000): string {
  const [color, setColor] = useState(() => pickRandomColor());

  useEffect(() => {
    const interval = setInterval(() => {
      setColor((prev) => pickRandomColor(prev));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return color;
}

export { ACCENT_COLORS };
