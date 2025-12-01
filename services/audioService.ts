
// A lightweight Audio Service using Web Audio API
// This avoids loading external MP3s and allows for "gentle" synthesized sounds

let audioContext: AudioContext | null = null;

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const createOscillator = (ctx: AudioContext, type: OscillatorType, freq: number) => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  return osc;
};

const createGain = (ctx: AudioContext, startVol: number, endVol: number, duration: number) => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(startVol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(endVol, ctx.currentTime + duration);
  return gain;
};

export const playSfx = (type: 'click' | 'success' | 'error' | 'pop' | 'hover') => {
  try {
    const ctx = initAudio();
    const t = ctx.currentTime;

    switch (type) {
      case 'click':
        // Gentle high-pitch tap
        {
          const osc = createOscillator(ctx, 'sine', 600);
          const gain = createGain(ctx, 0.05, 0.001, 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        }
        break;

      case 'hover':
        // Very subtle blip for hovers
        {
          const osc = createOscillator(ctx, 'sine', 400);
          const gain = createGain(ctx, 0.02, 0.001, 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        }
        break;

      case 'success':
        // Gentle Major Chord (C - E)
        {
          const root = 523.25; // C5
          const third = 659.25; // E5
          
          const osc1 = createOscillator(ctx, 'sine', root);
          const osc2 = createOscillator(ctx, 'triangle', third);
          
          const gain1 = createGain(ctx, 0.1, 0.001, 0.6);
          const gain2 = createGain(ctx, 0.05, 0.001, 0.6);

          osc1.connect(gain1);
          osc2.connect(gain2);
          
          gain1.connect(ctx.destination);
          gain2.connect(ctx.destination);
          
          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + 0.6);
          osc2.stop(t + 0.6);
        }
        break;

      case 'error':
        // Soft, low dull thud (Wooden sound)
        {
          const osc = createOscillator(ctx, 'triangle', 150);
          const gain = createGain(ctx, 0.15, 0.001, 0.3);
          
          // Add a lowpass filter to make it duller
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(200, t);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.2); // Pitch drop
          osc.stop(t + 0.3);
        }
        break;

      case 'pop':
        // Bubble pop sound
        {
          const osc = createOscillator(ctx, 'sine', 400);
          const gain = createGain(ctx, 0.1, 0.001, 0.15);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); // Pitch slide up
          osc.stop(t + 0.15);
        }
        break;
    }
  } catch (e) {
    // Audio context might be blocked or not supported, fail silently
  }
};
