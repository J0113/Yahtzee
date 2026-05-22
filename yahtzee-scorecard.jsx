// Yahtzee scorecard — categories, scoring helpers, and the Sheet UI.

const UPPER_CATS = [
  { key: 'ones',   label: 'Ones',   hint: 'Sum of 1s' },
  { key: 'twos',   label: 'Twos',   hint: 'Sum of 2s' },
  { key: 'threes', label: 'Threes', hint: 'Sum of 3s' },
  { key: 'fours',  label: 'Fours',  hint: 'Sum of 4s' },
  { key: 'fives',  label: 'Fives',  hint: 'Sum of 5s' },
  { key: 'sixes',  label: 'Sixes',  hint: 'Sum of 6s' },
];

const LOWER_CATS = [
  { key: 'threeKind', label: 'Three of a kind', hint: 'Sum of all dice' },
  { key: 'fourKind',  label: 'Four of a kind',  hint: 'Sum of all dice' },
  { key: 'fullHouse', label: 'Full house',      hint: '25' },
  { key: 'smStraight', label: 'Small straight', hint: '30' },
  { key: 'lgStraight', label: 'Large straight', hint: '40' },
  { key: 'yahtzee',   label: 'Yahtzee',         hint: '50' },
  { key: 'chance',    label: 'Chance',          hint: 'Sum of all dice' },
];

// Score a given category for a roll. Returns the points that category would award.
function scoreFor(cat, dice) {
  const vals = dice.map(d => d.value).sort((a, b) => a - b);
  const counts = {};
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const countsArr = Object.values(counts).sort((a, b) => b - a);
  const sumAll = vals.reduce((a, b) => a + b, 0);
  const sumOf = (n) => vals.filter(v => v === n).reduce((a, b) => a + b, 0);

  switch (cat) {
    case 'ones': return sumOf(1);
    case 'twos': return sumOf(2);
    case 'threes': return sumOf(3);
    case 'fours': return sumOf(4);
    case 'fives': return sumOf(5);
    case 'sixes': return sumOf(6);
    case 'threeKind': return countsArr[0] >= 3 ? sumAll : 0;
    case 'fourKind': return countsArr[0] >= 4 ? sumAll : 0;
    case 'fullHouse': return (countsArr[0] === 3 && countsArr[1] === 2) ? 25 : 0;
    case 'smStraight': {
      const u = [...new Set(vals)].join('');
      return /1234|2345|3456/.test(u) ? 30 : 0;
    }
    case 'lgStraight': {
      const u = [...new Set(vals)].join('');
      return /12345|23456/.test(u) ? 40 : 0;
    }
    case 'yahtzee': return countsArr[0] === 5 ? 50 : 0;
    case 'chance': return sumAll;
    default: return 0;
  }
}

function upperTotal(scores) {
  return UPPER_CATS.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
}
function upperBonus(scores) {
  return upperTotal(scores) >= 63 ? 35 : 0;
}
function lowerTotal(scores) {
  return LOWER_CATS.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
}
function grandTotal(scores) {
  return upperTotal(scores) + upperBonus(scores) + lowerTotal(scores);
}

// ── UI ──────────────────────────────────────────────────────────────────────

function ScoreRow({ cat, scored, suggested, isActive, locked, accent, onPick }) {
  const filled = scored !== undefined && scored !== null;
  const showSuggest = !filled && isActive && suggested !== null && suggested !== undefined;

  return (
    <button
      onClick={() => !filled && isActive && onPick && onPick(cat.key, suggested ?? 0)}
      disabled={filled || !isActive || locked}
      style={{
        all: 'unset',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        width: '100%', boxSizing: 'border-box',
        background: filled ? 'rgba(28,25,23,0.04)' : (showSuggest ? `${accent}10` : 'transparent'),
        borderBottom: '1px solid rgba(28,25,23,0.06)',
        cursor: (filled || !isActive) ? 'default' : 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
          fontSize: 14, fontWeight: 500, color: '#1C1917',
          opacity: filled ? 0.55 : 1,
        }}>
          {cat.label}
        </span>
        <span style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, color: 'rgba(28,25,23,0.45)', letterSpacing: 0.2,
        }}>
          {cat.hint}
        </span>
      </div>
      <div style={{
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 16, fontWeight: 600,
        color: filled ? '#1C1917' : (showSuggest ? accent : 'rgba(28,25,23,0.25)'),
        minWidth: 38, textAlign: 'right',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
      }}>
        {filled ? scored : (showSuggest ? `+${suggested}` : '—')}
        {showSuggest && (
          <span style={{
            width: 6, height: 6, borderRadius: 99, background: accent,
            boxShadow: `0 0 0 4px ${accent}25`,
          }} />
        )}
      </div>
    </button>
  );
}

function ScorecardSheet({
  open, onClose, players, currentPlayerIdx, dice, rollsUsed, accent = '#E26D5C',
  onPickCategory,
}) {
  const player = players[currentPlayerIdx];
  const canScore = rollsUsed > 0;

  // Tab state for viewing different player cards.
  const [viewIdx, setViewIdx] = React.useState(currentPlayerIdx);
  React.useEffect(() => { if (open) setViewIdx(currentPlayerIdx); }, [open, currentPlayerIdx]);

  const viewing = players[viewIdx];
  const isCurrentView = viewIdx === currentPlayerIdx;

  // Compute suggested scores for current player when rolling
  const suggestions = React.useMemo(() => {
    const s = {};
    [...UPPER_CATS, ...LOWER_CATS].forEach(c => { s[c.key] = scoreFor(c.key, dice); });
    return s;
  }, [dice]);

  if (!open) return null;

  const ut = upperTotal(viewing.scores);
  const ub = upperBonus(viewing.scores);

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(28,25,23,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'sheet-fade 220ms ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '88%',
          background: '#F7F1E3',
          borderRadius: '28px 28px 0 0',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 28,
          animation: 'sheet-slide 280ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 5, borderRadius: 99, background: 'rgba(28,25,23,0.18)' }} />
        </div>

        {/* header */}
        <div style={{
          padding: '8px 18px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: '"Instrument Serif", "DM Serif Display", Georgia, serif',
              fontSize: 28, lineHeight: 1, color: '#1C1917', letterSpacing: -0.5,
            }}>
              Scorecard
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
              color: 'rgba(28,25,23,0.5)', marginTop: 4,
            }}>
              {isCurrentView
                ? (canScore ? `Choose a category · ${player.name}'s turn` : 'Roll first, then score')
                : `Viewing · ${viewing.name}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              all: 'unset', cursor: 'pointer',
              width: 36, height: 36, borderRadius: 99,
              background: 'rgba(28,25,23,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#1C1917',
            }}
            aria-label="Close scorecard"
          >
            ✕
          </button>
        </div>

        {/* player tabs */}
        <div style={{
          display: 'flex', gap: 6, padding: '0 18px 14px', overflowX: 'auto',
        }}>
          {players.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setViewIdx(idx)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '8px 12px', borderRadius: 99,
                background: idx === viewIdx ? '#1C1917' : 'transparent',
                color: idx === viewIdx ? '#F7F1E3' : '#1C1917',
                border: idx === viewIdx ? 'none' : '1px solid rgba(28,25,23,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: '"Geist", system-ui, sans-serif',
                fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 99,
                background: p.color,
              }} />
              {p.name}
              {idx === currentPlayerIdx && (
                <span style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase',
                  opacity: 0.7,
                }}>· turn</span>
              )}
            </button>
          ))}
        </div>

        {/* scrolling categories */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#FAF6EE' }}>
          {/* Upper */}
          <SectionLabel label="Upper section" right={`${ut}/63`} />
          {UPPER_CATS.map(cat => (
            <ScoreRow
              key={cat.key}
              cat={cat}
              scored={viewing.scores[cat.key]}
              suggested={isCurrentView && canScore ? suggestions[cat.key] : null}
              isActive={isCurrentView && canScore}
              accent={accent}
              onPick={onPickCategory}
            />
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 16px',
            background: ub > 0 ? `${accent}15` : 'rgba(28,25,23,0.03)',
            borderBottom: '1px solid rgba(28,25,23,0.06)',
            fontFamily: '"Geist", system-ui, sans-serif',
            fontSize: 13, color: '#1C1917',
          }}>
            <span>Bonus {ub > 0 ? '✓' : `(${Math.max(0, 63 - ut)} more for +35)`}</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>+{ub}</span>
          </div>

          {/* Lower */}
          <SectionLabel label="Lower section" right={`${lowerTotal(viewing.scores)}`} />
          {LOWER_CATS.map(cat => (
            <ScoreRow
              key={cat.key}
              cat={cat}
              scored={viewing.scores[cat.key]}
              suggested={isCurrentView && canScore ? suggestions[cat.key] : null}
              isActive={isCurrentView && canScore}
              accent={accent}
              onPick={onPickCategory}
            />
          ))}

          {/* Grand total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 16px 22px',
            background: '#1C1917',
            color: '#F7F1E3',
            marginTop: 4,
          }}>
            <div style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 22,
            }}>Total</div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 28, fontWeight: 600,
              color: accent,
            }}>{grandTotal(viewing.scores)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 16px 6px',
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
      color: 'rgba(28,25,23,0.5)',
    }}>
      <span>{label}</span>
      <span>{right}</span>
    </div>
  );
}

Object.assign(window, {
  UPPER_CATS, LOWER_CATS, scoreFor, upperTotal, upperBonus, lowerTotal, grandTotal,
  ScorecardSheet,
});
