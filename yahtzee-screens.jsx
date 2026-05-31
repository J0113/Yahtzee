// Yahtzee screens — Home, Setup (mode, difficulty, players), Game, Results.

// ─── Hooks ────────────────────────────────────────────────────────────────────

// Tracks whether the viewport is wide enough for a multi-column game layout.
function useIsWide(breakpoint = 900) {
  const get = () => typeof window !== 'undefined' && window.innerWidth >= breakpoint;
  const [wide, setWide] = React.useState(get);
  React.useEffect(() => {
    const onResize = () => setWide(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return wide;
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function PrimaryButton({ children, onClick, accent = '#E26D5C', disabled, style = {}, onPressStart, onPressEnd }) {
  const handlePointerDown = (e) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(0.98)';
    onPressStart && onPressStart();
  };
  const handlePointerEnd = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    onPressEnd && onPressEnd();
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{
        all: 'unset',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 56, width: '100%',
        background: disabled ? 'rgba(28,25,23,0.15)' : accent,
        color: disabled ? 'rgba(28,25,23,0.4)' : '#FAF6EE',
        borderRadius: 16,
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: 16, fontWeight: 600, letterSpacing: -0.1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : `0 1px 0 rgba(0,0,0,0.05), 0 8px 24px -8px ${accent}90`,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        touchAction: 'manipulation',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 48, padding: '0 18px',
        background: 'transparent',
        color: '#1C1917',
        borderRadius: 14,
        fontFamily: '"Geist", system-ui, sans-serif',
        fontSize: 14, fontWeight: 500,
        cursor: 'pointer',
        border: '1px solid rgba(28,25,23,0.18)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function BackBar({ onBack, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 18px 4px',
      gap: 14,
    }}>
      <button
        onClick={onBack}
        style={{
          all: 'unset', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 99,
          background: 'rgba(28,25,23,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Back"
      >
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2 L3 7 L9 12" stroke="#1C1917" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
          color: 'rgba(28,25,23,0.5)',
        }}>{subtitle}</div>
        <div style={{
          fontFamily: '"Instrument Serif", "DM Serif Display", Georgia, serif',
          fontSize: 26, color: '#1C1917', lineHeight: 1.1, letterSpacing: -0.5,
        }}>{title}</div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function HomeScreen({ onStart, accent, hasSavedGame, onResume }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', padding: '48px 22px 28px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative dice scatter */}
      <div style={{
        position: 'absolute', top: 70, right: -30, opacity: 0.9,
        transform: 'rotate(15deg)',
      }}>
        <DieFace value={5} size={92} accent={accent} />
      </div>
      <div style={{
        position: 'absolute', top: 150, right: 80, opacity: 0.95,
        transform: 'rotate(-12deg)',
      }}>
        <DieFace value={2} size={62} accent={accent} />
      </div>
      <div style={{
        position: 'absolute', top: 210, right: 14, opacity: 0.85,
        transform: 'rotate(22deg)',
      }}>
        <DieFace value={6} size={48} accent={accent} />
      </div>

      <div style={{ flex: 1 }} />

      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
          color: 'rgba(28,25,23,0.5)', marginBottom: 12,
        }}>
          ◆ Pocket Dice Hall · est. 26
        </div>
        <h1 style={{
          fontFamily: '"Instrument Serif", "DM Serif Display", Georgia, serif',
          fontSize: 88, lineHeight: 0.92, margin: 0,
          color: '#1C1917', letterSpacing: -2.5, fontWeight: 400,
        }}>
          Yahtzee.
        </h1>
        <p style={{
          fontFamily: '"Geist", system-ui, sans-serif',
          fontSize: 15, lineHeight: 1.45, color: 'rgba(28,25,23,0.65)',
          marginTop: 18, marginBottom: 0, maxWidth: 280,
        }}>
          Five dice. Thirteen rounds. One scorecard between friends — or a clever computer.
        </p>
      </div>

      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {hasSavedGame && (
          <button
            onClick={onResume}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(28,25,23,0.04)',
              border: '1px solid rgba(28,25,23,0.08)',
              borderRadius: 14,
            }}
          >
            <div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                letterSpacing: 1.4, textTransform: 'uppercase',
                color: 'rgba(28,25,23,0.5)',
              }}>In progress</div>
              <div style={{
                fontFamily: '"Geist", sans-serif', fontSize: 14, fontWeight: 500,
                color: '#1C1917', marginTop: 2,
              }}>Resume · You vs. Cleo, round 7</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 2 L11 7 L5 12" stroke="#1C1917" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <PrimaryButton onClick={onStart} accent={accent}>
          New game →
        </PrimaryButton>
        <button
          style={{
            all: 'unset', cursor: 'pointer',
            textAlign: 'center', padding: '10px',
            fontFamily: '"Geist", sans-serif', fontSize: 13,
            color: 'rgba(28,25,23,0.55)',
          }}
        >
          How to play
        </button>
      </div>
    </div>
  );
}

// ─── Setup: Mode pick ────────────────────────────────────────────────────────

function ModeCard({ icon, title, sub, onClick, accent, selected }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px 18px',
        background: '#FAF6EE',
        borderRadius: 18,
        border: `1.5px solid ${selected ? accent : 'rgba(28,25,23,0.08)'}`,
        boxShadow: selected ? `0 0 0 4px ${accent}20, 0 4px 14px -6px rgba(28,25,23,0.2)` : '0 1px 0 rgba(28,25,23,0.04)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: selected ? accent : 'rgba(28,25,23,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? '#FAF6EE' : '#1C1917',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 22,
          color: '#1C1917', lineHeight: 1.1, letterSpacing: -0.3,
        }}>{title}</div>
        <div style={{
          fontFamily: '"Geist", sans-serif', fontSize: 13,
          color: 'rgba(28,25,23,0.6)', marginTop: 4, lineHeight: 1.35,
        }}>{sub}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 14 14"><path d="M5 2 L11 7 L5 12" stroke="rgba(28,25,23,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

function SetupModeScreen({ onPick, onBack, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BackBar onBack={onBack} subtitle="Step 1 of 2" title="Pick a mode" />
      <div style={{
        padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <ModeCard
          accent={accent}
          onClick={() => onPick('pass')}
          icon={(
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
              <circle cx="17" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M14.5 18c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          )}
          title="Pass & Play"
          sub="Take turns on this device. 2–6 players."
        />
        <ModeCard
          accent={accent}
          onClick={() => onPick('cpu')}
          icon={(
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/>
              <rect x="9" y="9" width="6" height="6" rx="1.4" fill="currentColor"/>
              <path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
          title="vs Computer"
          sub="Solo round against an AI opponent. Choose difficulty."
        />
      </div>
    </div>
  );
}

// ─── Setup: Difficulty ───────────────────────────────────────────────────────

function DifficultyCard({ label, tag, sub, dots, selected, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        padding: '18px 16px',
        background: selected ? '#1C1917' : '#FAF6EE',
        color: selected ? '#FAF6EE' : '#1C1917',
        borderRadius: 18,
        border: `1.5px solid ${selected ? '#1C1917' : 'rgba(28,25,23,0.08)'}`,
        gap: 12,
        flex: 1,
        transition: 'all 160ms ease',
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: 99,
            background: i <= dots ? (selected ? accent : accent) : (selected ? 'rgba(255,255,255,0.18)' : 'rgba(28,25,23,0.12)'),
          }} />
        ))}
      </div>
      <div>
        {tag && (
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
            opacity: selected ? 0.55 : 0.4, marginBottom: 4,
          }}>{tag}</div>
        )}
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 26,
          lineHeight: 1, letterSpacing: -0.4,
        }}>{label}</div>
        <div style={{
          fontFamily: '"Geist", sans-serif', fontSize: 12,
          marginTop: 6, opacity: selected ? 0.75 : 0.6, lineHeight: 1.4,
        }}>{sub}</div>
      </div>
    </button>
  );
}

function SetupDifficultyScreen({ onPick, onBack, accent }) {
  const [selected, setSelected] = React.useState('normal');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BackBar onBack={onBack} subtitle="Step 2 of 2" title="Set the bar" />
      <div style={{ padding: '20px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        }}>
          <DifficultyCard
            label="Mouse"
            tag="Easy"
            sub="Holds the obvious. Misses the clever."
            dots={1}
            selected={selected === 'easy'}
            onClick={() => setSelected('easy')}
            accent={accent}
          />
          <DifficultyCard
            label="Queenie"
            tag="Medium"
            sub="Plays a clean game with the odd risk."
            dots={2}
            selected={selected === 'normal'}
            onClick={() => setSelected('normal')}
            accent={accent}
          />
          <DifficultyCard
            label="Cleo"
            tag="Hard"
            sub="Counts probabilities. Punishes mistakes."
            dots={3}
            selected={selected === 'hard'}
            onClick={() => setSelected('hard')}
            accent={accent}
          />
        </div>

        <div style={{
          marginTop: 22, padding: '16px 16px',
          borderRadius: 16,
          background: 'rgba(28,25,23,0.04)',
          fontFamily: '"Geist", sans-serif', fontSize: 13,
          color: 'rgba(28,25,23,0.7)', lineHeight: 1.5,
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(28,25,23,0.45)', marginBottom: 6,
          }}>How {selected === 'easy' ? 'Mouse' : selected === 'normal' ? 'Queenie' : 'Cleo'} plays</div>
          {selected === 'easy' && "Mouse will go for upper-section sums and accept what the dice give. Forget the straights."}
          {selected === 'normal' && "Queenie balances the upper bonus against big plays. Will chase a Yahtzee if it's free."}
          {selected === 'hard' && "Cleo evaluates expected value at every roll. Hoards Chance for the endgame and chases the 63-point upper bonus hard. Watch out."}
        </div>

        <div style={{ flex: 1 }} />

        <PrimaryButton onClick={() => onPick(selected)} accent={accent} style={{ marginTop: 20 }}>
          Continue →
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Setup: Players ──────────────────────────────────────────────────────────

const PLAYER_COLORS = ['#E26D5C', '#2D8A6E', '#C49A35', '#7D5BA6', '#3F6C9E', '#D45D8C'];
const SUGGESTED_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley', 'Quinn', 'Morgan'];

function PlayerRow({ player, idx, onName, onRemove, canRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: '#FAF6EE',
      borderRadius: 14,
      border: '1px solid rgba(28,25,23,0.06)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 99,
        background: player.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FAF6EE',
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 20, fontWeight: 500,
        flexShrink: 0,
      }}>
        {(player.name?.[0] || `P${idx + 1}`[0]).toUpperCase()}
      </div>
      <input
        value={player.name}
        onChange={(e) => onName(idx, e.target.value)}
        placeholder={SUGGESTED_NAMES[idx]}
        maxLength={14}
        style={{
          all: 'unset', flex: 1,
          fontFamily: '"Geist", sans-serif', fontSize: 15, fontWeight: 500,
          color: '#1C1917',
        }}
      />
      {canRemove && (
        <button
          onClick={() => onRemove(idx)}
          style={{
            all: 'unset', cursor: 'pointer',
            width: 30, height: 30, borderRadius: 99,
            background: 'rgba(28,25,23,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(28,25,23,0.5)',
            fontSize: 14,
          }}
          aria-label="Remove player"
        >✕</button>
      )}
    </div>
  );
}

function SetupPlayersScreen({ mode, difficulty, onStart, onBack, accent }) {
  const cpuName = { easy: 'Mouse', normal: 'Queenie', hard: 'Cleo' }[difficulty] ?? 'Cleo';
  const initial = mode === 'cpu'
    ? [
        { name: 'You', color: PLAYER_COLORS[0], isCpu: false },
        { name: cpuName, color: PLAYER_COLORS[1], isCpu: true },
      ]
    : [
        { name: '', color: PLAYER_COLORS[0], isCpu: false },
        { name: '', color: PLAYER_COLORS[1], isCpu: false },
      ];
  const [players, setPlayers] = React.useState(initial);

  const setName = (i, name) => setPlayers(ps => ps.map((p, idx) => idx === i ? { ...p, name } : p));
  const addPlayer = () => {
    if (players.length >= 6) return;
    setPlayers(ps => [...ps, { name: '', color: PLAYER_COLORS[ps.length % PLAYER_COLORS.length], isCpu: false }]);
  };
  const removePlayer = (i) => setPlayers(ps => ps.filter((_, idx) => idx !== i));

  const canStart = players.every(p => p.name.trim().length > 0) && players.length >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BackBar
        onBack={onBack}
        subtitle="Step 2 of 2"
        title={mode === 'cpu' ? `You and ${cpuName}` : 'Who\u2019s playing?'}
      />
      <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mode === 'cpu' && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 12,
            background: `${accent}15`, marginBottom: 4,
          }}>
            <div style={{
              fontFamily: '"Geist", sans-serif', fontSize: 13, color: '#1C1917',
            }}>
              <span style={{ opacity: 0.55 }}>Difficulty · </span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{difficulty}</span>
            </div>
            <button
              onClick={onBack}
              style={{
                all: 'unset', cursor: 'pointer',
                fontFamily: '"Geist", sans-serif', fontSize: 12,
                color: accent, fontWeight: 600,
              }}
            >Change</button>
          </div>
        )}
        {players.map((p, idx) => (
          <PlayerRow
            key={idx}
            idx={idx}
            player={p}
            onName={setName}
            onRemove={removePlayer}
            canRemove={players.length > 2 && !p.isCpu}
          />
        ))}
        {mode === 'pass' && players.length < 6 && (
          <button
            onClick={addPlayer}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              border: '1.5px dashed rgba(28,25,23,0.18)',
              borderRadius: 14,
              color: 'rgba(28,25,23,0.65)',
              fontFamily: '"Geist", sans-serif', fontSize: 14, fontWeight: 500,
            }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 99,
              background: 'rgba(28,25,23,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>+</span>
            Add player
          </button>
        )}

        <div style={{ flex: 1 }} />

        <PrimaryButton onClick={() => onStart(players)} accent={accent} disabled={!canStart}>
          Start game
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Game screen ─────────────────────────────────────────────────────────────

function PlayerChip({ player, isActive, score, accent, compact }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '6px 10px',
      borderRadius: 12,
      background: isActive ? '#1C1917' : 'transparent',
      color: isActive ? '#FAF6EE' : '#1C1917',
      minWidth: 56,
      transition: 'background 200ms ease',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 99,
        background: player.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FAF6EE',
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 14, fontWeight: 500,
        boxShadow: isActive ? `0 0 0 2.5px ${accent}` : 'none',
      }}>
        {player.name[0]?.toUpperCase()}
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12, fontWeight: 600,
      }}>
        {score}
      </div>
      <div style={{
        fontFamily: '"Geist", sans-serif',
        fontSize: 9, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5,
        maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {player.isCpu ? 'CPU' : player.name}
      </div>
    </div>
  );
}

function RollsIndicator({ used, total = 3, accent }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: 99,
          background: i < used ? 'rgba(255,255,255,0.18)' : accent,
          boxShadow: i < used ? 'none' : `0 0 0 1px rgba(255,255,255,0.1)`,
          transition: 'background 200ms ease',
        }} />
      ))}
    </div>
  );
}

function GameScreen({
  players, currentPlayerIdx, round, dice, rollsUsed, rolling,
  onRoll, onOpenScore, onToggleHold, onPickCategory, accent, feltColor, onExit,
  recap, onContinue,
}) {
  const current = players[currentPlayerIdx];
  const canRoll = rollsUsed < 3 && !rolling && !recap;
  const canScore = rollsUsed > 0 && !rolling && !current.isCpu && !recap;
  const inRecap = !!recap;
  const recapCatLabel = inRecap
    ? [...UPPER_CATS, ...LOWER_CATS].find(c => c.key === recap.catKey)?.label
    : null;
  // Press-and-hold on Roll button → shake the dice for good-luck flavour.
  const [shaking, setShaking] = React.useState(false);
  React.useEffect(() => { if (rolling || inRecap) setShaking(false); }, [rolling, inRecap]);

  const isWide = useIsWide(900);
  const flashCatKey = inRecap ? recap.catKey : null;

  // ── Shared subcomponents (inline) ──────────────────────────────────────────
  const topBar = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px 8px', gap: 10,
      maxWidth: 1400, margin: '0 auto', width: '100%',
    }}>
      <button
        onClick={onExit}
        style={{
          all: 'unset', cursor: 'pointer',
          width: 32, height: 32, borderRadius: 99,
          background: 'rgba(28,25,23,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Exit"
      >
        <svg width="12" height="12" viewBox="0 0 14 14"><path d="M3 3 L11 11 M3 11 L11 3" stroke="#1C1917" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          letterSpacing: 1.4, textTransform: 'uppercase',
          color: 'rgba(28,25,23,0.5)',
        }}>Round</span>
        <span style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 18, color: '#1C1917',
        }}>{round}<span style={{ opacity: 0.4 }}>/13</span></span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => onOpenScore('open')}
        style={{
          all: 'unset', cursor: 'pointer',
          height: 32, padding: '0 12px', borderRadius: 99,
          background: '#1C1917', color: '#FAF6EE',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: '"Geist", sans-serif', fontSize: 12, fontWeight: 500,
          flexShrink: 0,
        }}
        aria-label="View all players"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="9" r="3" stroke="#FAF6EE" strokeWidth="1.8"/>
          <circle cx="16" cy="10" r="2.2" stroke="#FAF6EE" strokeWidth="1.6"/>
          <path d="M3 18c0-2.4 2.4-4.3 5.4-4.3s5.4 1.9 5.4 4.3" stroke="#FAF6EE" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        All players
      </button>
    </div>
  );

  // Bottom action area — dice tray + rolls + roll button. Same in both layouts,
  // but constrained to a sensible width on wide screens.
  const actionArea = (
    <div style={{
      maxWidth: isWide ? 640 : '100%',
      margin: '0 auto', width: '100%',
      padding: isWide ? '8px 24px 24px' : '0',
    }}>
      <div style={{ padding: isWide ? 0 : '4px 16px 0' }}>
        <DiceTray
          dice={dice}
          onToggleHold={onToggleHold}
          rolling={rolling}
          shaking={shaking}
          feltColor={feltColor}
          accent={accent}
          canHold={rollsUsed > 0 && rollsUsed < 3 && !rolling && !inRecap && !current.isCpu}
        />
      </div>
      <div style={{
        padding: isWide ? '10px 0 0' : '6px 16px 12px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        {inRecap ? (
          <PrimaryButton onClick={onContinue} accent={accent}>
            Continue →
          </PrimaryButton>
        ) : (
          <>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 12px',
              background: feltColor,
              borderRadius: 14,
              flexShrink: 0, height: 56, justifyContent: 'center',
            }}>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}>Rolls</div>
              <RollsIndicator used={rollsUsed} accent={accent} />
            </div>
            <PrimaryButton
              onClick={onRoll}
              accent={accent}
              disabled={!canRoll || current.isCpu}
              onPressStart={() => { if (canRoll && !current.isCpu) setShaking(true); }}
              onPressEnd={() => setShaking(false)}
            >
              {shaking ? 'Toss it!' :
               rollsUsed === 0 ? 'Hold to shake · tap to roll' :
               rollsUsed >= 3 ? 'No rolls left' :
               `Roll again · ${3 - rollsUsed} left`}
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );

  // The single-player banner used in narrow layout.
  const narrowBanner = (
    <div style={{
      padding: '4px 18px 8px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 99, background: current.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FAF6EE', fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 18, flexShrink: 0,
        boxShadow: `0 0 0 2.5px ${accent}, 0 0 0 3.5px ${accent}30`,
      }}>
        {current.name[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase',
          color: 'rgba(28,25,23,0.5)',
        }}>
          {inRecap ? `${current.name} just scored` :
           current.isCpu ? `${current.name} is thinking…` :
           `${current.name}'s turn`}
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 20, color: '#1C1917', lineHeight: 1.1, letterSpacing: -0.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {inRecap ? (
            <span>
              {recap.points > 0 ? (
                <><span style={{ color: accent, fontWeight: 500 }}>+{recap.points}</span> on {recapCatLabel}</>
              ) : (
                <>Sacrificed <em style={{ fontStyle: 'italic' }}>{recapCatLabel}</em></>
              )}
            </span>
          ) : (
            rollsUsed === 0 ? 'Tap roll to begin' :
            rollsUsed >= 3 ? 'Last roll — choose a row' :
            `Roll ${rollsUsed} · hold what works`
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
          color: 'rgba(28,25,23,0.5)',
        }}>Total</div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 18, fontWeight: 600, color: '#1C1917', lineHeight: 1,
        }}>{grandTotal(current.scores)}</div>
      </div>
    </div>
  );

  // The compact turn message used in wide layout (centered above the dice).
  const wideTurnMessage = (
    <div style={{
      textAlign: 'center', padding: '10px 18px 4px',
      maxWidth: 640, margin: '0 auto', width: '100%',
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
        color: 'rgba(28,25,23,0.5)',
      }}>
        {inRecap ? `${current.name} just scored` :
         current.isCpu ? `${current.name} is thinking…` :
         `${current.name}'s turn`}
      </div>
      <div style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 26, color: '#1C1917', lineHeight: 1.1, letterSpacing: -0.4,
        marginTop: 2,
      }}>
        {inRecap ? (
          <span>
            {recap.points > 0 ? (
              <><span style={{ color: accent }}>+{recap.points}</span> on {recapCatLabel}</>
            ) : (
              <>Sacrificed <em style={{ fontStyle: 'italic' }}>{recapCatLabel}</em></>
            )}
          </span>
        ) : (
          rollsUsed === 0 ? 'Tap roll to begin' :
          rollsUsed >= 3 ? 'Last roll — choose a row' :
          `Roll ${rollsUsed} · hold what works`
        )}
      </div>
    </div>
  );

  // ── Wide layout ────────────────────────────────────────────────────────────
  if (isWide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {topBar}
        <div style={{
          flex: 1, display: 'grid', gap: 16,
          gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
          padding: '8px 24px 4px',
          maxWidth: 1400, margin: '0 auto', width: '100%',
          minHeight: 0,
        }}>
          {players.map((p, i) => (
            <PlayerColumn
              key={i}
              player={p}
              isActive={i === currentPlayerIdx}
              dice={dice}
              accent={accent}
              canScore={canScore && i === currentPlayerIdx}
              rolling={rolling}
              rollsUsed={rollsUsed}
              onPick={onPickCategory}
              flashCatKey={i === currentPlayerIdx ? flashCatKey : null}
              inRecap={inRecap}
            />
          ))}
        </div>
        {wideTurnMessage}
        {actionArea}
      </div>
    );
  }

  // ── Narrow layout (mobile) ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {topBar}
      {narrowBanner}
      <InlineScorecard
        dice={dice}
        scores={current.scores}
        accent={accent}
        canScore={canScore}
        rolling={rolling}
        rollsUsed={rollsUsed}
        onPick={onPickCategory}
        flashCatKey={flashCatKey}
      />
      {actionArea}
    </div>
  );
}

// One-column player tile for the wide layout. Shows player header (avatar,
// name, total) and their scorecard. Inactive players are dimmed and read-only.
function PlayerColumn({ player, isActive, dice, accent, canScore, rolling, rollsUsed, onPick, flashCatKey, inRecap }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: 14,
      borderRadius: 18,
      background: isActive ? 'rgba(255,255,255,0.55)' : 'rgba(28,25,23,0.025)',
      border: isActive
        ? `1.5px solid ${accent}55`
        : '1px solid rgba(28,25,23,0.08)',
      boxShadow: isActive
        ? `0 8px 28px -10px ${accent}55, 0 0 0 4px ${accent}10`
        : 'none',
      minHeight: 0, overflow: 'hidden',
      opacity: isActive ? 1 : 0.86,
      transition: 'all 240ms ease',
    }}>
      {/* Player header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 99, background: player.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FAF6EE', fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 20, flexShrink: 0,
          boxShadow: isActive ? `0 0 0 2.5px ${accent}` : 'none',
        }}>
          {player.name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase',
            color: isActive ? accent : 'rgba(28,25,23,0.45)',
            fontWeight: 600,
          }}>
            {isActive ? (inRecap ? 'Just scored' : 'Now rolling') : 'Waiting'}
          </div>
          <div style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 22, color: '#1C1917', lineHeight: 1.1, letterSpacing: -0.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.name}{player.isCpu ? ' · CPU' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(28,25,23,0.5)',
          }}>Total</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 22, fontWeight: 600, color: '#1C1917', lineHeight: 1,
          }}>{grandTotal(player.scores)}</div>
        </div>
      </div>

      <InlineScorecard
        hideHeader
        compact
        dice={dice}
        scores={player.scores}
        accent={accent}
        canScore={canScore}
        rolling={rolling}
        rollsUsed={rollsUsed}
        onPick={onPick}
        flashCatKey={flashCatKey}
      />
    </div>
  );
}

// Inline two-column scorecard for the current player. Available rows are
// highlighted with the accent; rows that would score zero stay tappable
// but muted (you can always sacrifice a row).
function InlineScorecard({ dice, scores, accent, canScore, rolling, rollsUsed, onPick, flashCatKey, hideHeader = false, compact = false }) {
  const suggestions = React.useMemo(() => {
    const s = {};
    [...UPPER_CATS, ...LOWER_CATS].forEach(c => { s[c.key] = scoreFor(c.key, dice); });
    return s;
  }, [dice]);

  const upper = UPPER_CATS;
  const lower = LOWER_CATS;
  const ut = upperTotal(scores);
  const ub = upperBonus(scores);

  return (
    <div style={{
      flex: 1,
      padding: compact ? 0 : '10px 16px 4px',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      overflow: 'hidden',
    }}>
      {!hideHeader && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '0 2px 6px',
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: 1.4, textTransform: 'uppercase',
            color: 'rgba(28,25,23,0.5)',
          }}>Your scorecard</span>
          {canScore && (
            <span style={{
              fontFamily: '"Geist", sans-serif', fontSize: 11, color: accent, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 99, background: accent,
                boxShadow: `0 0 0 3px ${accent}25`,
              }} />
              tap a row to score
            </span>
          )}
        </div>
      )}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 8, minHeight: 0, overflow: 'hidden',
      }}>
        <ScorecardColumn
          title="Upper"
          cats={upper}
          scores={scores}
          suggestions={suggestions}
          canScore={canScore}
          accent={accent}
          onPick={onPick}
          rolling={rolling}
          flashCatKey={flashCatKey}
          footer={(
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 8px',
              borderTop: '1px dashed rgba(28,25,23,0.12)',
              fontFamily: '"Geist", sans-serif', fontSize: 10, fontWeight: 500,
              color: ub > 0 ? accent : 'rgba(28,25,23,0.55)',
            }}>
              <span>Bonus {ub > 0 ? '✓' : `≥63`}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {ut}<span style={{ opacity: 0.4 }}>/63</span>
                {' '}<span style={{ marginLeft: 4, fontWeight: 700 }}>+{ub}</span>
              </span>
            </div>
          )}
        />
        <ScorecardColumn
          title="Lower"
          cats={lower}
          scores={scores}
          suggestions={suggestions}
          canScore={canScore}
          accent={accent}
          onPick={onPick}
          rolling={rolling}
          flashCatKey={flashCatKey}
        />
      </div>
    </div>
  );
}

function ScorecardColumn({ title, cats, scores, suggestions, canScore, accent, onPick, rolling, footer, flashCatKey }) {
  return (
    <div style={{
      background: '#FAF6EE',
      borderRadius: 14,
      border: '1px solid rgba(28,25,23,0.06)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '6px 10px 4px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase',
        color: 'rgba(28,25,23,0.4)',
        background: 'rgba(28,25,23,0.025)',
        borderBottom: '1px solid rgba(28,25,23,0.05)',
      }}>{title}</div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {cats.map(cat => {
          const filled = scores[cat.key] !== undefined;
          const pts = suggestions[cat.key];
          const isPositive = pts > 0;
          const isHighlighted = !filled && canScore && isPositive;
          const isTappable = !filled && canScore;
          const isFlashed = flashCatKey === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => isTappable && onPick(cat.key, pts)}
              disabled={!isTappable}
              style={{
                all: 'unset',
                width: '100%', boxSizing: 'border-box',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px',
                background: isFlashed ? `${accent}30`
                  : filled ? 'transparent'
                  : (isHighlighted ? `${accent}18` : 'transparent'),
                borderBottom: '1px solid rgba(28,25,23,0.04)',
                cursor: isTappable ? 'pointer' : 'default',
                position: 'relative',
                transition: 'background 160ms ease',
                animation: isFlashed ? 'recap-flash 1200ms ease-out' : 'none',
              }}
            >
              {(isHighlighted || isFlashed) && (
                <span style={{
                  position: 'absolute', left: 0, top: 4, bottom: 4, width: 2.5,
                  background: accent, borderRadius: '0 2px 2px 0',
                }} />
              )}
              <span style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: 11.5, fontWeight: 500,
                color: filled
                  ? (isFlashed ? '#1C1917' : 'rgba(28,25,23,0.45)')
                  : (isHighlighted ? '#1C1917' : 'rgba(28,25,23,0.85)'),
                lineHeight: 1.15,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                paddingRight: 4,
              }}>
                {cat.label}
              </span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                fontWeight: (filled || isFlashed) ? 700 : (isHighlighted ? 700 : 500),
                color: isFlashed ? accent
                  : filled ? '#1C1917'
                  : (isHighlighted ? accent
                  : (isTappable ? 'rgba(28,25,23,0.3)' : 'rgba(28,25,23,0.18)')),
                flexShrink: 0,
                opacity: rolling && !filled ? 0.4 : 1,
                transition: 'opacity 160ms ease',
              }}>
                {filled ? scores[cat.key] : (isTappable ? (isPositive ? `+${pts}` : '0') : '—')}
              </span>
            </button>
          );
        })}
      </div>
      {footer}
    </div>
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

function ResultsScreen({ players, accent, onPlayAgain, onHome }) {
  const ranked = [...players]
    .map((p, i) => ({ ...p, total: grandTotal(p.scores), origIdx: i }))
    .sort((a, b) => b.total - a.total);
  const winner = ranked[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 22px 24px' }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
        color: 'rgba(28,25,23,0.5)',
      }}>◆ Final tally</div>
      <div style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 56, color: '#1C1917', lineHeight: 0.95, letterSpacing: -1.5,
        marginTop: 6,
      }}>
        {winner.name}<br />
        <span style={{ color: accent }}>wins.</span>
      </div>
      <div style={{
        fontFamily: '"Geist", sans-serif', fontSize: 15,
        color: 'rgba(28,25,23,0.6)', marginTop: 14,
      }}>
        {winner.total} points across thirteen rounds. {ranked[1] ? `That's ${winner.total - ranked[1].total} ahead of ${ranked[1].name}.` : ''}
      </div>

      <div style={{
        marginTop: 26, background: '#FAF6EE',
        borderRadius: 18, padding: '6px 0',
        border: '1px solid rgba(28,25,23,0.06)',
      }}>
        {ranked.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < ranked.length - 1 ? '1px solid rgba(28,25,23,0.05)' : 'none',
          }}>
            <div style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 24, color: i === 0 ? accent : 'rgba(28,25,23,0.4)',
              width: 22, textAlign: 'center',
            }}>{i + 1}</div>
            <div style={{
              width: 32, height: 32, borderRadius: 99, background: p.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FAF6EE', fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 16,
            }}>{p.name[0]?.toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: '"Geist", sans-serif', fontSize: 15, fontWeight: 500,
                color: '#1C1917',
              }}>{p.name}{p.isCpu ? ' · CPU' : ''}</div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                color: 'rgba(28,25,23,0.5)', marginTop: 1, letterSpacing: 0.4,
              }}>
                Upper {upperTotal(p.scores)} · Lower {lowerTotal(p.scores)} · Bonus {upperBonus(p.scores)}
              </div>
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 600,
              color: i === 0 ? accent : '#1C1917',
            }}>{p.total}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        <PrimaryButton onClick={onPlayAgain} accent={accent}>Play again</PrimaryButton>
        <button
          onClick={onHome}
          style={{
            all: 'unset', cursor: 'pointer',
            textAlign: 'center', padding: '10px',
            fontFamily: '"Geist", sans-serif', fontSize: 13,
            color: 'rgba(28,25,23,0.55)',
          }}
        >Back to home</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, SetupModeScreen, SetupDifficultyScreen, SetupPlayersScreen,
  GameScreen, ResultsScreen, PrimaryButton, GhostButton,
});
