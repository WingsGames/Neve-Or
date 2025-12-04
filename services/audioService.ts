

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

export const playSfx = (type: 'click' | 'success' | 'error' | 'pop' | 'hover' | 'victory' | 'transition' | 'unlock' | 'bubble' | 'snap' | 'modal_open') => {
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

      case 'snap':
        // Sharp, short mechanical click
        {
          const osc = createOscillator(ctx, 'square', 800);
          const gain = createGain(ctx, 0.02, 0.001, 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        }
        break;

      case 'hover':
        // Very subtle blip for hovers
        {
          const osc = createOscillator(ctx, 'sine', 400);
          const gain = createGain(ctx, 0.01, 0.001, 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.05);
        }
        break;
      
      case 'bubble':
        // Water drop / bubble pop sound
        {
          const osc = createOscillator(ctx, 'sine', 300);
          const gain = createGain(ctx, 0.1, 0.001, 0.15);
          osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
        }
        break;

      case 'transition':
        // Soft "Woosh" or "Swoosh" using low frequency sine sweep
        {
          const osc = createOscillator(ctx, 'sine', 100);
          const gain = createGain(ctx, 0.05, 0.001, 0.4);
          
          osc.frequency.exponentialRampToValueAtTime(300, t + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(t);
          osc.stop(t + 0.4);
        }
        break;

      case 'unlock':
        // Magical sparkle / Chime (Rapid arpeggio)
        {
           const notes = [880, 1108, 1318, 1760]; // A5, C#6, E6, A6
           notes.forEach((freq, i) => {
             const startTime = t + (i * 0.05);
             const osc = createOscillator(ctx, 'sine', freq);
             const gain = createGain(ctx, 0.05, 0.001, 0.3);
             osc.connect(gain);
             gain.connect(ctx.destination);
             osc.start(startTime);
             osc.stop(startTime + 0.3);
           });
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
        // Bubble pop sound (higher pitch than bubble)
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
      
      case 'modal_open':
        // Quick high pitch slide
        {
           const osc = createOscillator(ctx, 'sine', 400);
           const gain = createGain(ctx, 0.1, 0.001, 0.25);
           osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
           osc.connect(gain);
           gain.connect(ctx.destination);
           osc.start(t);
           osc.stop(t + 0.25);
        }
        break;

      case 'victory':
        // Fanfare Arpeggio: C4, E4, G4, C5 (Upward arpeggio)
        {
          const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; 
          notes.forEach((freq, i) => {
            const startTime = t + (i * 0.12);
            const osc = createOscillator(ctx, 'triangle', freq);
            // Longer decay for celebratory feel
            const gain = createGain(ctx, 0.15, 0.001, 1.0);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 1.0);
          });
          
          // Final chord layer
          setTimeout(() => {
             const chordRoot = createOscillator(ctx, 'sine', 523.25); // C
             const chordThird = createOscillator(ctx, 'sine', 659.25); // E
             const chordFifth = createOscillator(ctx, 'sine', 783.99); // G
             const chordGain = createGain(ctx, 0.2, 0.001, 1.5);
             
             chordRoot.connect(chordGain);
             chordThird.connect(chordGain);
             chordFifth.connect(chordGain);
             chordGain.connect(ctx.destination);
             
             const endT = ctx.currentTime;
             chordRoot.start(endT); chordRoot.stop(endT + 1.5);
             chordThird.start(endT); chordThird.stop(endT + 1.5);
             chordFifth.start(endT); chordFifth.stop(endT + 1.5);
          }, 600);
        }
        break;
    }
  } catch (e) {
    // Audio context might be blocked or not supported, fail silently
  }
};