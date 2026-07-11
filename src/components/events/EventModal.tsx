import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { playSound } from '../../audio/audioEngine';
import { PLAYER_COUNCIL_MOTIONS } from '../../engine/councilMotions';

const PARCHMENT = '#C4934A';
const GOLD = '#C9A227';
const DANGER = '#8B1A1A';
const GREEN = '#4a7c3f';

export default function EventModal() {
  const {
    pendingEvents,
    dismissPendingEvent,
    resolveEventChoice,
    councilVoteResult,
    resolveCouncilVote,
    clearCouncilVoteResult,
    proposeCouncilMotion,
    councilSessionsAttended,
  } = useGameStore();

  const [showProposalPanel, setShowProposalPanel] = useState(false);

  const ev = pendingEvents[0];

  useEffect(() => {
    setShowProposalPanel(false);
  }, [ev?.defId]);

  useEffect(() => {
    if (!ev) return;
    if (ev.defId.startsWith('title_')) {
      playSound('dragonRoar');
    } else {
      playSound('alert');
    }
  }, [ev?.defId]);

  useEffect(() => {
    if (!councilVoteResult) return;
    if (councilVoteResult.playerFavored) {
      playSound('dragonRoar');
    }
  }, [councilVoteResult]);

  if (!ev) return null;

  const isCouncilVote = Boolean(ev.councilMotionId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,3,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        fontFamily: '"Crimson Text", Georgia, serif',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #1a0a00, #2C1810)',
          border: `3px solid ${isCouncilVote ? GOLD : PARCHMENT}`,
          borderRadius: 12,
          maxWidth: 540,
          width: '90%',
          boxShadow: `0 0 60px ${isCouncilVote ? GOLD : PARCHMENT}30, 0 16px 48px rgba(0,0,0,0.8)`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${isCouncilVote ? GOLD : PARCHMENT}22, ${isCouncilVote ? GOLD : PARCHMENT}08)`,
            borderBottom: `2px solid ${isCouncilVote ? GOLD : PARCHMENT}40`,
            padding: '20px 24px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 8, lineHeight: 1 }}>{ev.icon}</div>
          <div
            style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              color: isCouncilVote ? GOLD : PARCHMENT,
              fontSize: 22,
              lineHeight: 1.2,
            }}
          >
            {ev.title}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* ── Council Vote Result Phase ── */}
          {councilVoteResult && isCouncilVote ? (
            <>
              {/* Pass / Fail banner */}
              <div
                style={{
                  background: councilVoteResult.passed ? `${GREEN}33` : `${DANGER}33`,
                  border: `2px solid ${councilVoteResult.passed ? GREEN : DANGER}88`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 900,
                    fontSize: 24,
                    color: councilVoteResult.passed ? '#6dbf67' : '#d9534f',
                    letterSpacing: 2,
                  }}
                >
                  {councilVoteResult.passed ? '✔ MOTION PASSED' : '✘ MOTION FAILED'}
                </div>
                <div
                  style={{
                    fontFamily: '"Crimson Text", serif',
                    fontSize: 18,
                    color: PARCHMENT,
                    marginTop: 4,
                  }}
                >
                  Final tally — Aye: {councilVoteResult.tallyAye} &nbsp;|&nbsp; Nay: {councilVoteResult.tallyNay}
                </div>
              </div>

              {/* Vote breakdown */}
              <div
                style={{
                  background: `${PARCHMENT}0a`,
                  border: `1px solid ${PARCHMENT}25`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Cinzel", serif',
                    fontSize: 13,
                    color: `${PARCHMENT}80`,
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  VOTE RECORD
                </div>
                {/* Player vote */}
                {!councilVoteResult.isPlayerProposal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: GOLD, fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700 }}>You</span>
                    <span style={{
                      color: councilVoteResult.playerVoteAye ? '#6dbf67' : '#d9534f',
                      fontFamily: '"Cinzel", serif',
                      fontSize: 14,
                      fontWeight: 700,
                    }}>
                      {councilVoteResult.playerVoteAye ? '✔ Aye' : '✘ Nay'}
                    </span>
                  </div>
                )}
                {councilVoteResult.isPlayerProposal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: GOLD, fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700 }}>You</span>
                    <span style={{ color: `${PARCHMENT}80`, fontFamily: '"Cinzel", serif', fontSize: 14, fontStyle: 'italic' }}>
                      — Abstained
                    </span>
                  </div>
                )}
                {/* Rival votes */}
                {councilVoteResult.rivalVotes.map((rv) =>
                  councilVoteResult.isPlayerProposal ? (
                    <div key={rv.name} style={{ marginBottom: 6 }}>
                      <span
                        style={{
                          color: rv.votedAye ? '#6dbf67' : '#d9534f',
                          fontFamily: '"Crimson Text", serif',
                          fontSize: 16,
                          fontStyle: 'italic',
                        }}
                      >
                        {rv.flavour ?? `${rv.name} votes ${rv.votedAye ? 'Aye' : 'Nay'}.`}
                      </span>
                    </div>
                  ) : (
                    <div key={rv.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: PARCHMENT, fontSize: 15 }}>{rv.name}</span>
                      <span style={{
                        color: rv.votedAye ? '#6dbf67' : '#d9534f',
                        fontFamily: '"Cinzel", serif',
                        fontSize: 14,
                        fontWeight: 700,
                      }}>
                        {rv.votedAye ? '✔ Aye' : '✘ Nay'}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Effect applied */}
              {councilVoteResult.passed && (
                <div
                  style={{
                    background: `${GOLD}12`,
                    border: `1px solid ${GOLD}40`,
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontSize: 17,
                    color: GOLD,
                    fontFamily: '"Cinzel", serif',
                    marginBottom: 16,
                  }}
                >
                  ⚡ {councilVoteResult.isPlayerProposal
                    ? councilVoteResult.proposedEffectSummary
                    : ev.effectSummary}
                </div>
              )}

              {/* Fail flavour for player proposals */}
              {!councilVoteResult.passed && councilVoteResult.isPlayerProposal && councilVoteResult.failFlavourText && (
                <div
                  style={{
                    background: `${DANGER}0d`,
                    border: `1px solid ${DANGER}30`,
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontSize: 16,
                    color: `${PARCHMENT}90`,
                    fontFamily: '"Crimson Text", serif',
                    fontStyle: 'italic',
                    marginBottom: 16,
                  }}
                >
                  {councilVoteResult.failFlavourText}
                </div>
              )}

              <button
                onClick={() => { playSound('uiClick'); clearCouncilVoteResult(); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: `${GOLD}20`,
                  border: `2px solid ${GOLD}50`,
                  borderRadius: 6,
                  color: GOLD,
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: 19,
                  cursor: 'pointer',
                }}
              >
                So Be It
              </button>
            </>
          ) : isCouncilVote ? (
            /* ── Council Vote Phase ── */
            <>
              <p
                style={{
                  fontSize: 19,
                  color: '#C4934ACC',
                  lineHeight: 1.65,
                  margin: '0 0 16px',
                  fontStyle: 'italic',
                }}
              >
                {ev.description}
              </p>
              <div
                style={{
                  background: `${GOLD}12`,
                  border: `1px solid ${GOLD}30`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 17,
                  color: GOLD,
                  fontFamily: '"Cinzel", serif',
                  marginBottom: 18,
                }}
              >
                ⚡ {ev.effectSummary}
              </div>
              {showProposalPanel ? (
                /* ── Proposal Selection Panel ── */
                <div>
                  <div
                    style={{
                      fontFamily: '"Cinzel", serif',
                      fontSize: 13,
                      color: `${GOLD}90`,
                      letterSpacing: 1,
                      marginBottom: 10,
                    }}
                  >
                    SELECT YOUR MOTION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PLAYER_COUNCIL_MOTIONS.map((pm) => (
                      <div
                        key={pm.id}
                        style={{
                          background: `${GOLD}0d`,
                          border: `1px solid ${GOLD}35`,
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>{pm.icon}</span>
                          <span
                            style={{
                              fontFamily: '"Cinzel", serif',
                              fontWeight: 700,
                              fontSize: 14,
                              color: GOLD,
                            }}
                          >
                            {pm.name}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            color: `${PARCHMENT}99`,
                            fontStyle: 'italic',
                            margin: '0 0 8px',
                            lineHeight: 1.5,
                          }}
                        >
                          {pm.description}
                        </p>
                        <div
                          style={{
                            fontSize: 13,
                            color: GOLD,
                            fontFamily: '"Cinzel", serif',
                            marginBottom: 8,
                          }}
                        >
                          ⚡ {pm.effectSummary}
                        </div>
                        <button
                          onClick={() => {
                            playSound('pageFlip');
                            proposeCouncilMotion(pm.id);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            background: `${GOLD}25`,
                            border: `2px solid ${GOLD}60`,
                            borderRadius: 6,
                            color: GOLD,
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            letterSpacing: 0.5,
                          }}
                        >
                          Propose This Motion
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowProposalPanel(false)}
                    style={{
                      width: '100%',
                      marginTop: 10,
                      padding: '9px',
                      background: 'transparent',
                      border: `1px solid ${PARCHMENT}30`,
                      borderRadius: 6,
                      color: `${PARCHMENT}70`,
                      fontFamily: '"Cinzel", serif',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Vote
                  </button>
                </div>
              ) : (
                /* ── Aye / Nay (+ optional Abstain & Propose) ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => {
                        playSound('pageFlip');
                        resolveCouncilVote(ev.councilMotionId!, true);
                      }}
                      style={{
                        flex: 1,
                        padding: '14px 10px',
                        background: `${GREEN}33`,
                        border: `2px solid ${GREEN}88`,
                        borderRadius: 6,
                        color: '#6dbf67',
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 900,
                        fontSize: 20,
                        cursor: 'pointer',
                        letterSpacing: 1,
                      }}
                    >
                      ✔ Aye
                    </button>
                    <button
                      onClick={() => {
                        playSound('pageFlip');
                        resolveCouncilVote(ev.councilMotionId!, false);
                      }}
                      style={{
                        flex: 1,
                        padding: '14px 10px',
                        background: `${DANGER}33`,
                        border: `2px solid ${DANGER}88`,
                        borderRadius: 6,
                        color: '#d9534f',
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 900,
                        fontSize: 20,
                        cursor: 'pointer',
                        letterSpacing: 1,
                      }}
                    >
                      ✘ Nay
                    </button>
                  </div>
                  {(councilSessionsAttended ?? 0) >= 3 && (
                    <button
                      onClick={() => {
                        playSound('uiClick');
                        setShowProposalPanel(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '11px 10px',
                        background: `${PARCHMENT}10`,
                        border: `2px dashed ${GOLD}50`,
                        borderRadius: 6,
                        color: GOLD,
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        letterSpacing: 0.5,
                      }}
                    >
                      ↗ Abstain &amp; Propose Your Own Motion
                    </button>
                  )}
                </div>
              )}
            </>
          ) : ev.defId === 'koboldLetter' ? (
            /* ── Kobold Letter ── */
            <>
              <div
                style={{
                  background: 'linear-gradient(160deg, #f5f0e8, #ede5d0)',
                  border: '1px solid #b8a878',
                  borderRadius: 4,
                  padding: '20px 24px',
                  marginBottom: 18,
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.12)',
                  fontFamily: '"Crimson Text", Georgia, serif',
                  color: '#2a1f0e',
                }}
              >
                <p
                  style={{
                    fontSize: 17,
                    fontStyle: 'italic',
                    marginBottom: 16,
                    color: '#3a2e1a',
                    lineHeight: 1.5,
                  }}
                >
                  {ev.letterSalutation}
                </p>
                <p
                  style={{
                    fontSize: 18,
                    lineHeight: 1.75,
                    margin: '0 0 18px 12px',
                    color: '#2a1f0e',
                  }}
                >
                  {ev.description}
                </p>
                <p
                  style={{
                    fontSize: 17,
                    fontStyle: 'italic',
                    textAlign: 'right',
                    margin: 0,
                    color: '#3a2e1a',
                    lineHeight: 1.5,
                  }}
                >
                  {ev.letterClosing}
                </p>
              </div>
              <button
                onClick={() => { playSound('uiClick'); dismissPendingEvent(); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: `${PARCHMENT}18`,
                  border: `2px solid ${PARCHMENT}40`,
                  borderRadius: 6,
                  color: PARCHMENT,
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >
                File Under: Ignored
              </button>
            </>
          ) : (
            /* ── Normal event rendering ── */
            <>
              <p
                style={{
                  fontSize: 20,
                  color: '#C4934ACC',
                  lineHeight: 1.65,
                  margin: '0 0 16px',
                  fontStyle: 'italic',
                }}
              >
                {ev.description}
              </p>

              {ev.effectSummary && (
                <div
                  style={{
                    background: `${PARCHMENT}12`,
                    border: `1px solid ${PARCHMENT}30`,
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontSize: 18,
                    color: GOLD,
                    fontFamily: '"Cinzel", serif',
                    marginBottom: 16,
                  }}
                >
                  ⚡ {ev.effectSummary}
                </div>
              )}

              {ev.isPassive ? (
                <button
                  onClick={() => { playSound('uiClick'); dismissPendingEvent(); }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: `${PARCHMENT}20`,
                    border: `2px solid ${PARCHMENT}50`,
                    borderRadius: 6,
                    color: PARCHMENT,
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 700,
                    fontSize: 19,
                    cursor: 'pointer',
                  }}
                >
                  Acknowledge
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ev.choices?.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => { playSound('pageFlip'); resolveEventChoice(i); }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: i === 0 ? `${GOLD}22` : `${PARCHMENT}10`,
                        border: `2px solid ${i === 0 ? GOLD : PARCHMENT}50`,
                        borderRadius: 6,
                        color: i === 0 ? GOLD : PARCHMENT,
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        fontSize: 18,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <span>{choice.label}</span>
                      <span
                        style={{
                          fontFamily: '"Crimson Text", serif',
                          fontWeight: 400,
                          fontSize: 17,
                          color: `${i === 0 ? GOLD : PARCHMENT}80`,
                        }}
                      >
                        {choice.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
