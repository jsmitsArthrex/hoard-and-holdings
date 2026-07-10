export type SoundName =
  | 'coinPickup'
  | 'coinLoss'
  | 'diceRoll'
  | 'pageFlip'
  | 'koboldCheer'
  | 'dragonRoar'
  | 'alert'
  | 'uiClick'
  | 'uiOpen'
  | 'uiClose';

const MUTE_KEY = 'hoard-holdings-muted';
const VOLUME_KEY = 'hoard-holdings-volume';

let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _muted: boolean = localStorage.getItem(MUTE_KEY) === 'true';
let _volume: number = Math.max(0, Math.min(1, parseFloat(localStorage.getItem(VOLUME_KEY) ?? '0.8')));

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function getMasterGain(): GainNode {
  const ctx = getCtx();
  if (!_masterGain) {
    _masterGain = ctx.createGain();
    _masterGain.gain.value = _muted ? 0 : _volume;
    _masterGain.connect(ctx.destination);
  }
  return _masterGain;
}

function ramp(
  param: AudioParam,
  from: number,
  to: number,
  startTime: number,
  duration: number,
) {
  param.setValueAtTime(from, startTime);
  param.linearRampToValueAtTime(to, startTime + duration);
}

function fade(gain: GainNode, ctx: AudioContext, startTime: number, duration: number) {
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
}

function sweepTone(
  ctx: AudioContext,
  freqFrom: number,
  freqTo: number,
  duration: number,
  waveform: OscillatorType = 'sine',
  volume = 0.25,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveform;
  osc.connect(gain);
  gain.connect(getMasterGain());
  const t = ctx.currentTime;
  ramp(osc.frequency, freqFrom, freqTo, t, duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function noise(ctx: AudioContext, duration: number, volume = 0.12) {
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  src.connect(gain);
  gain.connect(getMasterGain());
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.start(t);
}

const SOUND_MAP: Record<SoundName, () => void> = {
  coinPickup: () => {
    const ctx = getCtx();
    sweepTone(ctx, 440, 880, 0.12, 'sine', 0.2);
    setTimeout(() => sweepTone(ctx, 660, 1320, 0.08, 'sine', 0.15), 80);
  },
  coinLoss: () => {
    const ctx = getCtx();
    sweepTone(ctx, 880, 220, 0.18, 'sine', 0.22);
  },
  diceRoll: () => {
    const ctx = getCtx();
    noise(ctx, 0.15, 0.18);
    sweepTone(ctx, 300, 200, 0.1, 'triangle', 0.08);
  },
  pageFlip: () => {
    const ctx = getCtx();
    noise(ctx, 0.08, 0.1);
    sweepTone(ctx, 800, 400, 0.07, 'triangle', 0.05);
  },
  koboldCheer: () => {
    const ctx = getCtx();
    [0, 60, 120].forEach(delay => {
      setTimeout(() => {
        sweepTone(ctx, 400 + Math.random() * 200, 500 + Math.random() * 300, 0.12, 'square', 0.06);
      }, delay);
    });
    setTimeout(() => noise(ctx, 0.2, 0.07), 30);
  },
  dragonRoar: () => {
    const ctx = getCtx();
    sweepTone(ctx, 80, 40, 0.6, 'sawtooth', 0.35);
    sweepTone(ctx, 120, 60, 0.5, 'square', 0.18);
    noise(ctx, 0.5, 0.12);
  },
  alert: () => {
    const ctx = getCtx();
    sweepTone(ctx, 880, 880, 0.06, 'sine', 0.3);
    setTimeout(() => sweepTone(ctx, 1100, 1100, 0.06, 'sine', 0.25), 120);
  },
  uiClick: () => {
    const ctx = getCtx();
    sweepTone(ctx, 720, 600, 0.04, 'sine', 0.14);
    noise(ctx, 0.025, 0.06);
  },
  uiOpen: () => {
    const ctx = getCtx();
    sweepTone(ctx, 380, 660, 0.16, 'sine', 0.1);
    sweepTone(ctx, 480, 760, 0.12, 'sine', 0.06);
  },
  uiClose: () => {
    const ctx = getCtx();
    sweepTone(ctx, 580, 320, 0.13, 'sine', 0.1);
    noise(ctx, 0.04, 0.04);
  },
};

export function playSound(name: SoundName): void {
  if (_muted) return;
  try {
    SOUND_MAP[name]?.();
  } catch {
    // AudioContext may be blocked before first user interaction; fail silently
  }
}

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(val: boolean): void {
  _muted = val;
  localStorage.setItem(MUTE_KEY, String(val));
  if (_masterGain) _masterGain.gain.value = _muted ? 0 : _volume;
}

export function toggleMute(): boolean {
  _muted = !_muted;
  localStorage.setItem(MUTE_KEY, String(_muted));
  if (_masterGain) _masterGain.gain.value = _muted ? 0 : _volume;
  return _muted;
}

export function getVolume(): number {
  return _volume;
}

export function setVolume(val: number): void {
  _volume = Math.max(0, Math.min(1, val));
  localStorage.setItem(VOLUME_KEY, String(_volume));
  if (_masterGain && !_muted) _masterGain.gain.value = _volume;
}

// ── Procedural Ambient Music Engine ───────────────────────────────────────
// Royalty-free: fully synthesized via Web Audio API.
// Three context-aware tracks: ambient (hub/exploration), combat, npc (dialogue).
export type MusicTrack = 'ambient' | 'combat' | 'npc';

const MUSIC_MUTE_KEY = 'hoard-holdings-music-muted';
const MUSIC_VOLUME_KEY = 'hoard-holdings-music-volume';

let _musicMuted: boolean = localStorage.getItem(MUSIC_MUTE_KEY) === 'true';
let _musicVolume: number = Math.max(0, Math.min(1, parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) ?? '0.5')));
let _musicGain: GainNode | null = null;
let _musicRunning = false;
let _musicSchedulerTimer: ReturnType<typeof setTimeout> | null = null;
let _musicNextBeat = 0;
let _musicNextNoteTime = 0;
let _droneNodes: OscillatorNode[] = [];
let _currentTrack: MusicTrack = 'ambient';

const M_LOOKAHEAD = 0.2;
const M_INTERVAL = 60;

interface TrackDef {
  bpm: number;
  chords: number[][];
  bass: number[];
  melody: number[];
  scale: number[];
  droneFreqs: number[];
  chordVol: number;
  melodyVol: number;
  bassVol: number;
}

// ambient: Am→F→C→Em, 76 BPM, A minor pentatonic, sawtooth drone
// combat:  Em→Am→Dm→Bm, 112 BPM, E minor pentatonic, extra off-beat bass hits, no drone
// npc:     C→G→Am→F, 58 BPM, C major pentatonic, soft, no drone
const TRACK_DEFS: Record<MusicTrack, TrackDef> = {
  ambient: {
    bpm: 76,
    chords: [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [261.63, 329.63, 392],
      [164.81, 196, 246.94],
    ],
    bass: [110, 87.31, 130.81, 82.41],
    melody: [5, 3, 4, 5, 3, 1, 2, 3, 4, 5, 4, 3, 2, 3, 1, -1],
    scale: [220, 261.63, 293.66, 329.63, 392, 440, 523.25],
    droneFreqs: [82.41, 110],
    chordVol: 0.055,
    melodyVol: 0.22,
    bassVol: 0.18,
  },
  combat: {
    bpm: 112,
    chords: [
      [164.81, 196, 246.94],
      [220, 261.63, 329.63],
      [146.83, 174.61, 220],
      [123.47, 155.56, 185.0],
    ],
    bass: [82.41, 110, 73.42, 61.74],
    melody: [4, -1, 4, 6, 3, -1, 5, 6, 4, 3, 2, -1, 4, 6, 5, -1],
    scale: [164.81, 185.0, 196, 220, 246.94, 293.66, 329.63],
    droneFreqs: [],
    chordVol: 0.07,
    melodyVol: 0.28,
    bassVol: 0.24,
  },
  npc: {
    bpm: 58,
    chords: [
      [261.63, 329.63, 392],
      [196, 246.94, 293.66],
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
    ],
    bass: [130.81, 98.0, 110, 87.31],
    melody: [4, 3, 2, 4, 3, 1, 2, 3, 5, 4, 3, 2, 4, 3, 2, -1],
    scale: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33],
    droneFreqs: [],
    chordVol: 0.04,
    melodyVol: 0.18,
    bassVol: 0.13,
  },
};

function getMusicGain(): GainNode {
  const ctx = getCtx();
  if (!_musicGain) {
    _musicGain = ctx.createGain();
    _musicGain.gain.value = _musicMuted ? 0 : _musicVolume;
    _musicGain.connect(ctx.destination);
  }
  return _musicGain;
}

function schedMelodyNote(freq: number, t: number, dur: number, vol: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(getMusicGain());
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol, t + dur - 0.12);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function schedChord(freqs: number[], t: number, dur: number, vol: number) {
  const ctx = getCtx();
  freqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filt.type = 'lowpass';
    filt.frequency.value = 900;
    filt.Q.value = 0.4;
    osc.connect(filt);
    filt.connect(g);
    g.connect(getMusicGain());
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.6);
    g.gain.setValueAtTime(vol, t + dur - 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  });
}

function schedBass(freq: number, t: number, vol: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(getMusicGain());
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.55);
}

function musicScheduler() {
  if (!_musicRunning) return;
  const ctx = getCtx();
  const def = TRACK_DEFS[_currentTrack];
  const beat = 60 / def.bpm;
  while (_musicNextNoteTime < ctx.currentTime + M_LOOKAHEAD) {
    const b = _musicNextBeat;
    const t = _musicNextNoteTime;
    const chordIdx = Math.floor(b / 4) % 4;
    if (b % 4 === 0) {
      schedChord(def.chords[chordIdx], t, beat * 4 + 0.2, def.chordVol);
      schedBass(def.bass[chordIdx], t, def.bassVol);
    }
    if (_currentTrack === 'combat' && b % 4 === 2) {
      schedBass(def.bass[chordIdx] * 1.5, t, def.bassVol * 0.6);
    }
    const melIdx = def.melody[b];
    if (melIdx >= 0) schedMelodyNote(def.scale[melIdx], t, beat * 0.82, def.melodyVol);
    _musicNextBeat = (b + 1) % 16;
    _musicNextNoteTime += beat;
  }
  _musicSchedulerTimer = setTimeout(musicScheduler, M_INTERVAL);
}

function startDrones(def: TrackDef): void {
  const ctx = getCtx();
  def.droneFreqs.forEach(freq => {
    const osc = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    filt.type = 'lowpass';
    filt.frequency.value = 130;
    filt.Q.value = 0.6;
    osc.connect(filt);
    filt.connect(g);
    g.connect(getMusicGain());
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 3.0);
    osc.start(ctx.currentTime);
    _droneNodes.push(osc);
  });
}

export function startMusic(): void {
  if (_musicRunning) return;
  _musicRunning = true;
  const ctx = getCtx();
  startDrones(TRACK_DEFS[_currentTrack]);
  _musicNextBeat = 0;
  _musicNextNoteTime = ctx.currentTime + 0.1;
  musicScheduler();
}

export function stopMusic(): void {
  _musicRunning = false;
  if (_musicSchedulerTimer) {
    clearTimeout(_musicSchedulerTimer);
    _musicSchedulerTimer = null;
  }
  if (_ctx && _musicGain) {
    _musicGain.gain.setValueAtTime(_musicGain.gain.value, _ctx.currentTime);
    _musicGain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 1.5);
  }
  const toStop = [..._droneNodes];
  _droneNodes = [];
  setTimeout(() => {
    toStop.forEach(osc => { try { osc.stop(); } catch { /* already stopped */ } });
    if (_musicGain) _musicGain.gain.value = _musicMuted ? 0 : _musicVolume;
  }, 1800);
}

export function setMusicTrack(track: MusicTrack): void {
  if (track === _currentTrack && _musicRunning) return;
  _currentTrack = track;
  if (!_musicRunning) return;
  const ctx = getCtx();
  const mg = getMusicGain();
  if (_musicSchedulerTimer) {
    clearTimeout(_musicSchedulerTimer);
    _musicSchedulerTimer = null;
  }
  mg.gain.setValueAtTime(mg.gain.value, ctx.currentTime);
  mg.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  const toStop = [..._droneNodes];
  _droneNodes = [];
  setTimeout(() => {
    toStop.forEach(osc => { try { osc.stop(); } catch { /* already stopped */ } });
    if (!_musicRunning) return;
    const ctx2 = getCtx();
    const mg2 = getMusicGain();
    mg2.gain.setValueAtTime(0, ctx2.currentTime);
    mg2.gain.linearRampToValueAtTime(_musicMuted ? 0 : _musicVolume, ctx2.currentTime + 1.0);
    startDrones(TRACK_DEFS[_currentTrack]);
    _musicNextBeat = 0;
    _musicNextNoteTime = ctx2.currentTime + 0.1;
    musicScheduler();
  }, 900);
}

export function getMusicTrack(): MusicTrack {
  return _currentTrack;
}

export function isMusicMuted(): boolean {
  return _musicMuted;
}

export function setMusicMuted(val: boolean): void {
  _musicMuted = val;
  localStorage.setItem(MUSIC_MUTE_KEY, String(val));
  if (_musicGain) _musicGain.gain.value = _musicMuted ? 0 : _musicVolume;
}

export function getMusicVolume(): number {
  return _musicVolume;
}

export function setMusicVolume(val: number): void {
  _musicVolume = Math.max(0, Math.min(1, val));
  localStorage.setItem(MUSIC_VOLUME_KEY, String(_musicVolume));
  if (_musicGain && !_musicMuted) _musicGain.gain.value = _musicVolume;
}
