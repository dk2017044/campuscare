import { useState, useEffect } from 'react';
import { playDecryptionBlip } from '../services/sound';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#%&*@!';

export function useScrambleText(targetText: string, delay = 0): string {
  const [displayText, setDisplayText] = useState(targetText);

  useEffect(() => {
    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(() =>
          targetText
            .split('')
            .map((char, index) => {
              if (index < iteration) {
                return targetText[index];
              }
              if (char === ' ') return ' ';
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('')
        );

        if (iteration % 2 === 0) {
          playDecryptionBlip();
        }

        if (iteration >= targetText.length) {
          clearInterval(interval);
        }

        iteration += 1 / 2;
      }, 35);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [targetText, delay]);

  return displayText;
}
