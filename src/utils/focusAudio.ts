// Shared singleton Web Audio API engine for completion chimes and offline focus soundscapes.
// Reuses one AudioContext and resumes synchronously on user clicks to satisfy browser/Electron autoplay rules.

export type AmbientSoundMode = 'off' | 'rain' | 'brown' | 'pink' | 'gamma40' | 'alpha10';

interface AmbientNodes {
  stop: () => void;
  gainNode: GainNode;
}

let sharedCtx: AudioContext | null = null;
let activeAmbient: AmbientNodes | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctx || null;
}

export function getSharedAudioContext(): AudioContext | null {
  const AudioCtx = getAudioContextClass();
  if (!AudioCtx) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function playGentleChime(variant: 'complete' | 'tick' | 'break' = 'complete'): boolean {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const notes =
      variant === 'tick'
        ? [587.33]
        : variant === 'break'
        ? [659.25, 523.25]
        : [523.25, 659.25, 783.99, 1046.5];

    const stepSec = variant === 'tick' ? 0.08 : 0.13;
    const peakGain = variant === 'tick' ? 0.045 : 0.09;
    const decaySec = variant === 'tick' ? 0.18 : 0.58;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * stepSec;
      gain.gain.setValueAtTime(0.0008, start);
      gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + decaySec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + decaySec + 0.05);
    });
    return true;
  } catch {
    return false;
  }
}

export function stopAmbientSoundscape(): void {
  if (activeAmbient) {
    try {
      activeAmbient.stop();
    } catch {
      // ignore disconnect errors
    }
    activeAmbient = null;
  }
}

export function setAmbientSoundscapeVolume(volume: number): void {
  const safe = Math.max(0.02, Math.min(1, volume));
  if (activeAmbient && sharedCtx) {
    try {
      activeAmbient.gainNode.gain.setTargetAtTime(safe, sharedCtx.currentTime, 0.04);
    } catch {
      activeAmbient.gainNode.gain.value = safe;
    }
  }
}

function createCrossfadedNoiseBuffer(
  ctx: AudioContext,
  mode: 'rain' | 'brown' | 'pink'
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const seconds = 4;
  const length = sampleRate * seconds;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    let lastBrown = 0;
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        lastBrown = (lastBrown + 0.025 * white) / 1.025;
        data[i] = Math.max(-0.95, Math.min(0.95, lastBrown * 3.4));
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
        b6 = white * 0.115926;
        data[i] = Math.max(-0.95, Math.min(0.95, mode === 'rain' ? pink * 1.15 : pink));
      }
    }

    // Crossfade first/last 200ms so looping never clicks
    const fadeSamples = Math.min(Math.floor(sampleRate * 0.2), Math.floor(length / 8));
    for (let i = 0; i < fadeSamples; i += 1) {
      const t = i / fadeSamples;
      const tailIdx = length - fadeSamples + i;
      const blended = data[i] * t + data[tailIdx] * (1 - t);
      data[i] = blended;
      data[tailIdx] = blended;
    }
  }

  return buffer;
}

export async function startAmbientSoundscape(
  mode: AmbientSoundMode,
  volume: number
): Promise<'playing' | 'suspended' | 'off' | 'unsupported'> {
  stopAmbientSoundscape();
  if (mode === 'off') return 'off';

  const ctx = getSharedAudioContext();
  if (!ctx) return 'unsupported';

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {
    // will still inspect ctx.state below
  }

  const masterGain = ctx.createGain();
  const safeVol = Math.max(0.02, Math.min(1, volume));
  masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  masterGain.gain.setTargetAtTime(safeVol, ctx.currentTime, 0.08);
  masterGain.connect(ctx.destination);

  if (mode === 'gamma40' || mode === 'alpha10') {
    const carrier = mode === 'gamma40' ? 190 : 160;
    const beatHz = mode === 'gamma40' ? 40 : 10;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const toneGainL = ctx.createGain();
    const toneGainR = ctx.createGain();
    const merger = ctx.createChannelMerger(2);

    oscL.type = 'sine';
    oscR.type = 'sine';
    oscL.frequency.value = carrier;
    oscR.frequency.value = carrier + beatHz;
    toneGainL.gain.value = 0.24;
    toneGainR.gain.value = 0.24;

    oscL.connect(toneGainL);
    oscR.connect(toneGainR);
    toneGainL.connect(merger, 0, 0);
    toneGainR.connect(merger, 0, 1);
    merger.connect(masterGain);

    oscL.start();
    oscR.start();

    activeAmbient = {
      gainNode: masterGain,
      stop: () => {
        oscL.stop();
        oscR.stop();
        oscL.disconnect();
        oscR.disconnect();
        merger.disconnect();
        masterGain.disconnect();
      },
    };
  } else {
    const buffer = createCrossfadedNoiseBuffer(ctx, mode);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    const nodeGain = ctx.createGain();

    if (mode === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 1050;
      filter.Q.value = 0.45;
      nodeGain.gain.value = 1.1;
    } else if (mode === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.65;
      nodeGain.gain.value = 1.25;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.5;
      nodeGain.gain.value = 0.95;
    }

    src.connect(filter);
    filter.connect(nodeGain);
    nodeGain.connect(masterGain);
    src.start();

    activeAmbient = {
      gainNode: masterGain,
      stop: () => {
        src.stop();
        src.disconnect();
        filter.disconnect();
        nodeGain.disconnect();
        masterGain.disconnect();
      },
    };
  }

  return ctx.state === 'running' ? 'playing' : 'suspended';
}
