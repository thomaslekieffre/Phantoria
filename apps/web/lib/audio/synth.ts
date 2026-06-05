import type { SoundId } from "./types";

/** Sons procéduraux — remplacés automatiquement si un fichier existe dans /assets/audio/. */

type ToneStep = {
  freq: number;
  type?: OscillatorType;
  duration: number;
  gain: number;
  delay?: number;
  slideTo?: number;
};

function playSteps(ctx: AudioContext, steps: ToneStep[], master = 1) {
  const t0 = ctx.currentTime;
  for (const step of steps) {
    const start = t0 + (step.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step.type ?? "sine";
    osc.frequency.setValueAtTime(step.freq, start);
    if (step.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(step.slideTo, 1), start + step.duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(step.gain * master, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + step.duration + 0.02);
  }
}

function playNoise(ctx: AudioContext, duration: number, gain: number, delay = 0) {
  const sampleRate = ctx.sampleRate;
  const len = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, len, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.02);
}

export function playSynth(ctx: AudioContext, id: SoundId, master: number) {
  switch (id) {
    case "ui_click":
      playSteps(ctx, [{ freq: 880, type: "triangle", duration: 0.05, gain: 0.12 }], master);
      break;
    case "ui_confirm":
      playSteps(
        ctx,
        [
          { freq: 523, duration: 0.07, gain: 0.14 },
          { freq: 784, duration: 0.1, gain: 0.16, delay: 0.06 },
        ],
        master,
      );
      break;
    case "ui_error":
      playSteps(
        ctx,
        [
          { freq: 220, type: "sawtooth", duration: 0.12, gain: 0.1 },
          { freq: 165, type: "sawtooth", duration: 0.14, gain: 0.08, delay: 0.1 },
        ],
        master,
      );
      break;
    case "gacha_tick":
      playSteps(ctx, [{ freq: 440 + Math.random() * 80, type: "square", duration: 0.04, gain: 0.08 }], master);
      break;
    case "gacha_reveal_common":
      playSteps(ctx, [{ freq: 392, duration: 0.15, gain: 0.18, slideTo: 520 }], master);
      break;
    case "gacha_reveal_rare":
      playSteps(
        ctx,
        [
          { freq: 440, duration: 0.1, gain: 0.2 },
          { freq: 660, duration: 0.18, gain: 0.22, delay: 0.08, slideTo: 880 },
        ],
        master,
      );
      break;
    case "gacha_reveal_s":
      playSteps(
        ctx,
        [
          { freq: 523, duration: 0.12, gain: 0.22 },
          { freq: 784, duration: 0.15, gain: 0.25, delay: 0.1 },
          { freq: 1047, duration: 0.25, gain: 0.28, delay: 0.22, slideTo: 1319 },
        ],
        master,
      );
      playNoise(ctx, 0.08, 0.06 * master, 0.15);
      break;
    case "battle_hit":
      playNoise(ctx, 0.06, 0.12 * master);
      playSteps(ctx, [{ freq: 120, type: "square", duration: 0.05, gain: 0.1 }], master);
      break;
    case "capture_throw":
      playSteps(ctx, [{ freq: 600, duration: 0.08, gain: 0.15, slideTo: 200 }], master);
      break;
    case "capture_shake":
      playSteps(
        ctx,
        [
          { freq: 180, type: "square", duration: 0.06, gain: 0.1, delay: 0 },
          { freq: 200, type: "square", duration: 0.06, gain: 0.1, delay: 0.12 },
          { freq: 170, type: "square", duration: 0.06, gain: 0.1, delay: 0.24 },
        ],
        master,
      );
      break;
    case "capture_success":
      playSteps(
        ctx,
        [
          { freq: 523, duration: 0.1, gain: 0.2 },
          { freq: 659, duration: 0.12, gain: 0.22, delay: 0.08 },
          { freq: 784, duration: 0.2, gain: 0.24, delay: 0.18 },
        ],
        master,
      );
      break;
    case "capture_fail":
      playSteps(ctx, [{ freq: 330, duration: 0.2, gain: 0.15, slideTo: 110 }], master);
      break;
    case "quest_claim":
      playSteps(
        ctx,
        [
          { freq: 440, duration: 0.08, gain: 0.18 },
          { freq: 554, duration: 0.1, gain: 0.2, delay: 0.07 },
          { freq: 659, duration: 0.14, gain: 0.22, delay: 0.15 },
        ],
        master,
      );
      break;
    case "gold_gain":
      playSteps(
        ctx,
        [
          { freq: 988, type: "triangle", duration: 0.06, gain: 0.14 },
          { freq: 1319, type: "triangle", duration: 0.1, gain: 0.16, delay: 0.05 },
        ],
        master,
      );
      break;
  }
}
