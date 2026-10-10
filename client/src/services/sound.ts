/**
 * Web Audio API Sound Synthesizer
 * Generates tactile micro-haptics, emergency sirens, and ambient UI audio natively.
 */

let activeSirenCtx: AudioContext | null = null;
let activeSirenOsc: OscillatorNode | null = null;
let activeSirenGain: GainNode | null = null;

let soundMuted = localStorage.getItem('campuscare_sound_muted') === 'true';

export function isSoundEnabled(): boolean {
  return !soundMuted;
}

export function setSoundEnabled(enabled: boolean) {
  soundMuted = !enabled;
  localStorage.setItem('campuscare_sound_muted', String(soundMuted));
}

export function toggleSound(): boolean {
  soundMuted = !soundMuted;
  localStorage.setItem('campuscare_sound_muted', String(soundMuted));
  if (!soundMuted) {
    playTapSound();
  }
  return !soundMuted;
}

/**
 * Tactile wooden glass micro-tap (Teenage Engineering style)
 */
export function playTapSound() {
  if (soundMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore autoplay restriction
  }
}

/**
 * Sci-Fi Micro-Decryption blip
 */
export function playDecryptionBlip() {
  if (soundMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Ignore
  }
}

/**
 * Success Crystal Chime (Apple VisionOS / Linear confirmation)
 */
export function playSuccessChime() {
  if (soundMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.45);
    });
  } catch {
    // Ignore
  }
}

export function playEmergencySiren(durationSeconds = 6): { stop: () => void } {
  try {
    stopEmergencySiren();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return { stop: () => {} };

    const ctx = new AudioContextClass();
    activeSirenCtx = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    activeSirenOsc = osc;
    activeSirenGain = gain;

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(650, now);

    const cycle = 0.45;
    const totalCycles = Math.ceil(durationSeconds / cycle);

    for (let i = 0; i < totalCycles; i++) {
      const cycleStart = now + i * cycle;
      osc.frequency.linearRampToValueAtTime(1150, cycleStart + cycle / 2);
      osc.frequency.linearRampToValueAtTime(650, cycleStart + cycle);
    }

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
    gain.gain.setValueAtTime(0.28, now + durationSeconds - 0.3);
    gain.gain.linearRampToValueAtTime(0.001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSeconds);

    const timer = setTimeout(() => {
      stopEmergencySiren();
    }, durationSeconds * 1000);

    return {
      stop: () => {
        clearTimeout(timer);
        stopEmergencySiren();
      }
    };
  } catch (err) {
    console.warn('Audio playback error:', err);
    return { stop: () => {} };
  }
}

export function stopEmergencySiren() {
  try {
    if (activeSirenOsc) {
      activeSirenOsc.stop();
      activeSirenOsc.disconnect();
      activeSirenOsc = null;
    }
    if (activeSirenGain) {
      activeSirenGain.disconnect();
      activeSirenGain = null;
    }
    if (activeSirenCtx) {
      activeSirenCtx.close();
      activeSirenCtx = null;
    }
  } catch {
    // Ignore close errors
  }
}
