import { useState } from 'react';
import { X, Volume2, VolumeX, ChevronDown, ChevronUp, Music, Music2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import {
  isMuted, setMuted, getVolume, setVolume,
  isMusicMuted, setMusicMuted, getMusicVolume, setMusicVolume,
  playSound,
} from '../../audio/audioEngine';

const INK = '#2C1810';
const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';

interface OptionsModalProps {
  onClose: () => void;
}

function Section({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      marginBottom: last ? 0 : 20,
      paddingBottom: last ? 0 : 20,
      borderBottom: last ? 'none' : `1px solid ${INK}25`,
    }}>
      <div style={{
        fontFamily: '"Cinzel", serif', fontSize: 15, color: '#7A5030',
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function OptionsModal({ onClose }: OptionsModalProps) {
  const { dragon, day, playerPropertyIds, resetGame, goToTitle } = useGameStore();

  const [sfxMuted, setSfxMuted] = useState(isMuted());
  const [sfxVolume, setSfxVolume] = useState(Math.round(getVolume() * 100));
  const [musicMutedState, setMusicMutedState] = useState(isMusicMuted());
  const [musicVolume, setMusicVolumeState] = useState(Math.round(getMusicVolume() * 100));
  const [confirmNew, setConfirmNew] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showSound, setShowSound] = useState(false);

  function handleSfxMuteToggle() {
    const next = !sfxMuted;
    setMuted(next);
    setSfxMuted(next);
  }

  function handleSfxVolumeChange(v: number) {
    setSfxVolume(v);
    setVolume(v / 100);
    if (v > 0 && sfxMuted) { setMuted(false); setSfxMuted(false); }
    else if (v === 0 && !sfxMuted) { setMuted(true); setSfxMuted(true); }
  }

  function handleMusicMuteToggle() {
    const next = !musicMutedState;
    setMusicMuted(next);
    setMusicMutedState(next);
  }

  function handleMusicVolumeChange(v: number) {
    setMusicVolumeState(v);
    setMusicVolume(v / 100);
    if (v > 0 && musicMutedState) { setMusicMuted(false); setMusicMutedState(false); }
    else if (v === 0 && !musicMutedState) { setMusicMuted(true); setMusicMutedState(true); }
  }

  function handleSaveConfirm() {
    playSound('uiClick');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function handleNewGame() {
    playSound('uiClick');
    if (!confirmNew) { setConfirmNew(true); return; }
    resetGame();
    onClose();
  }

  const btnBase: React.CSSProperties = {
    fontFamily: '"Cinzel", serif', fontSize: 17,
    border: 'none', borderRadius: 4,
    padding: '7px 16px', cursor: 'pointer',
  };

  const subLabel: React.CSSProperties = {
    fontFamily: '"Cinzel", serif', fontSize: 13,
    color: '#7A5030', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8,
  };

  const volumeRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(10,4,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="parchment-grain"
        style={{
          background: `linear-gradient(150deg, #D9A85C 0%, #B07830 100%)`,
          border: `3px solid ${INK}`,
          borderRadius: 8,
          padding: '24px 28px',
          minWidth: 340,
          maxWidth: 420,
          width: '90vw',
          fontFamily: '"Crimson Text", Georgia, serif',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: INK, fontSize: 19, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Options
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: `1px solid ${INK}50`, borderRadius: 4, padding: '3px 6px', cursor: 'pointer', color: INK, display: 'flex', alignItems: 'center' }}
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── 1. Save ── */}
        <Section title="📜 Save">
          <div style={{ color: '#5A3A1A', fontSize: 18, lineHeight: 1.5, marginBottom: 10 }}>
            Progress saves automatically with every action.
          </div>
          {dragon && (
            <div style={{
              background: `${INK}12`, borderRadius: 5,
              padding: '7px 12px', marginBottom: 12,
              fontSize: 18, color: INK, lineHeight: 1.6,
            }}>
              <strong style={{ fontFamily: '"Cinzel", serif', fontSize: 17 }}>{dragon.name}</strong>
              <span style={{ color: '#7A5030' }}> · Day {day} · {playerPropertyIds.length} propert{playerPropertyIds.length === 1 ? 'y' : 'ies'}</span>
            </div>
          )}
          <button
            onClick={handleSaveConfirm}
            style={{
              ...btnBase,
              background: savedFlash ? '#2A6A2A' : GOLD,
              color: savedFlash ? '#CCFFCC' : INK,
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            {savedFlash ? '✓ Game Saved!' : 'Confirm Save'}
          </button>
        </Section>

        {/* ── 2. New Game ── */}
        <Section title="🏳️ New Game">
          <div style={{ color: '#5A3A1A', fontSize: 18, lineHeight: 1.5, marginBottom: 12 }}>
            Abandon your current run and begin a new legend from scratch.
          </div>
          {confirmNew ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                background: `${DANGER}18`, border: `1px solid ${DANGER}60`,
                borderRadius: 5, padding: '8px 12px',
                fontSize: 18, color: DANGER, lineHeight: 1.5,
              }}>
                ⚠️ This cannot be undone. Your dragon's legend will be erased.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleNewGame} style={{ ...btnBase, background: DANGER, color: '#FFCCCC' }}>
                  Yes, Start Over
                </button>
                <button onClick={() => setConfirmNew(false)} style={{ ...btnBase, background: `${INK}15`, color: INK, border: `1px solid ${INK}40` }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleNewGame} style={{ ...btnBase, background: `${DANGER}CC`, color: '#FFCCCC' }}>
              Start New Game
            </button>
          )}
        </Section>

        {/* ── 3. Back to Title ── */}
        <Section title="🏠 Back to Title">
          <div style={{ color: '#5A3A1A', fontSize: 18, lineHeight: 1.5, marginBottom: 12 }}>
            Return to the title screen. Your progress is saved and can be loaded from there.
          </div>
          <button
            onClick={() => { playSound('uiClose'); goToTitle(); onClose(); }}
            style={{ ...btnBase, background: `${INK}18`, color: INK, border: `1px solid ${INK}50` }}
          >
            Back to Title Screen
          </button>
        </Section>

        {/* ── 4. Sound (collapsible) ── */}
        <Section title="🔊 Sound" last>
          <button
            onClick={() => { playSound('uiClick'); setShowSound(s => !s); }}
            style={{
              ...btnBase,
              background: `${INK}12`,
              color: INK,
              border: `1px solid ${INK}40`,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 16, padding: '6px 12px',
              marginBottom: showSound ? 14 : 0,
            }}
          >
            {showSound ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            {showSound ? 'Hide Sound Settings' : 'Show Sound Settings'}
          </button>

          {showSound && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* SFX sub-section */}
              <div style={{ background: `${INK}08`, borderRadius: 5, padding: '10px 12px' }}>
                <div style={subLabel}>SFX</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={handleSfxMuteToggle}
                    style={{
                      ...btnBase,
                      background: sfxMuted ? DANGER : `${INK}18`,
                      color: sfxMuted ? '#FFCCCC' : INK,
                      border: `1px solid ${INK}40`,
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', fontSize: 16,
                    }}
                  >
                    {sfxMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    {sfxMuted ? 'Muted' : 'On'}
                  </button>
                </div>
                <div style={volumeRow}>
                  <VolumeX size={16} color="#7A5030" />
                  <input
                    type="range" min={0} max={100} value={sfxVolume}
                    onChange={e => handleSfxVolumeChange(Number(e.target.value))}
                    style={{ flex: 1, accentColor: GOLD, cursor: 'pointer' }}
                  />
                  <Volume2 size={16} color="#7A5030" />
                  <span style={{ fontSize: 16, color: INK, minWidth: 36, fontFamily: '"Cinzel", serif', textAlign: 'right' }}>
                    {sfxVolume}%
                  </span>
                </div>
              </div>

              {/* Music sub-section */}
              <div style={{ background: `${INK}08`, borderRadius: 5, padding: '10px 12px' }}>
                <div style={subLabel}>Music</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={handleMusicMuteToggle}
                    style={{
                      ...btnBase,
                      background: musicMutedState ? DANGER : `${INK}18`,
                      color: musicMutedState ? '#FFCCCC' : INK,
                      border: `1px solid ${INK}40`,
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', fontSize: 16,
                    }}
                  >
                    {musicMutedState ? <Music2 size={17} /> : <Music size={17} />}
                    {musicMutedState ? 'Muted' : 'On'}
                  </button>
                </div>
                <div style={volumeRow}>
                  <VolumeX size={16} color="#7A5030" />
                  <input
                    type="range" min={0} max={100} value={musicVolume}
                    onChange={e => handleMusicVolumeChange(Number(e.target.value))}
                    style={{ flex: 1, accentColor: GOLD, cursor: 'pointer' }}
                  />
                  <Volume2 size={16} color="#7A5030" />
                  <span style={{ fontSize: 16, color: INK, minWidth: 36, fontFamily: '"Cinzel", serif', textAlign: 'right' }}>
                    {musicVolume}%
                  </span>
                </div>
              </div>

            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
