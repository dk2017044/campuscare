/**
 * Web Audio API Sound Synthesizer
 * Generates emergency sirens and notifications natively without external audio files.
 */

let activeSirenCtx: AudioContext | null = null;
let activeSirenOsc: OscillatorNode | null = null;
let activeSirenGain: GainNode | null = null;

export function playEmergencySiren(durationSeconds = 6): { stop: () => void } {
  try {
    // Stop any existing siren first
    stopEmergencySiren();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return { stop: () => {} };
    }

    const ctx = new AudioContextClass();
    activeSirenCtx = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    activeSirenOsc = osc;
    activeSirenGain = gain;

    osc.type = 'sawtooth';

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(650, now);

    // Undulating dual-frequency sweep (650Hz to 1150Hz) simulating a police / campus emergency siren
    const cycle = 0.45; // seconds per pitch sweep
    const totalCycles = Math.ceil(durationSeconds / cycle);

    for (let i = 0; i < totalCycles; i++) {
      const cycleStart = now + i * cycle;
      osc.frequency.linearRampToValueAtTime(1150, cycleStart + cycle / 2);
      osc.frequency.linearRampToValueAtTime(650, cycleStart + cycle);
    }

    // Smooth volume fade-in and sustained emergency alert volume
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
    console.warn('Audio playback error (user interaction might be needed):', err);
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

export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Ignore
  }
}
