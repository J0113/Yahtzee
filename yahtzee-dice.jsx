// Yahtzee dice components — original tactile design
// One pip layout per face (1–6), held state, roll animation.

const DIE_PIP_LAYOUTS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

function DieFace({ value, size = 64, held = false, rolling = false, shaking = false, shakeIndex = 0, accent = '#E26D5C', dark = false }) {
  // Faces always show light surface (ivory) regardless of dark mode — dice are dice.
  const faceBg = held ? '#FAF6EE' : '#F2EBDC';
  const pipColor = held ? accent : '#1C1917';
  const ringColor = held ? accent : 'rgba(28,25,23,0.12)';
  const pipSize = size * 0.14;
  const padding = size * 0.18;
  const cellSize = (size - padding * 2) / 2;
  const layout = DIE_PIP_LAYOUTS[value] || [];

  // Each die shakes with a slightly different rhythm
  const shakeDuration = 220 + (shakeIndex % 5) * 40; // ms
  const shakeDelay = (shakeIndex * 37) % 120; // ms

  let animation = 'none';
  if (rolling) animation = 'dice-tumble 480ms cubic-bezier(.4,.0,.2,1)';
  else if (shaking && !held) animation = `dice-shake ${shakeDuration}ms ease-in-out ${shakeDelay}ms infinite`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        position: 'relative',
        background: faceBg,
        boxShadow: held
          ? `0 0 0 2.5px ${accent}, 0 12px 24px -8px rgba(226,109,92,0.45), inset 0 -3px 0 rgba(0,0,0,0.06)`
          : `0 0 0 1px ${ringColor}, 0 6px 14px -6px rgba(28,25,23,0.35), 0 2px 4px rgba(28,25,23,0.08), inset 0 -3px 0 rgba(0,0,0,0.05), inset 0 2px 0 rgba(255,255,255,0.6)`,
        transition: 'box-shadow 220ms ease, transform 220ms ease, background 220ms ease',
        transform: held ? 'translateY(-4px)' : 'translateY(0)',
        animation,
        flexShrink: 0,
        willChange: shaking || rolling ? 'transform' : 'auto',
      }}
    >
      {/* subtle paper grain */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: size * 0.22, pointerEvents: 'none',
        background: 'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)',
      }} />
      {layout.map(([r, c], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: padding + (r - 1) * (cellSize / 2) - pipSize / 2 + cellSize / 2,
            left: padding + (c - 1) * (cellSize / 2) - pipSize / 2 + cellSize / 2,
            width: pipSize,
            height: pipSize,
            borderRadius: '50%',
            background: pipColor,
            boxShadow: held ? 'none' : 'inset 0 1px 1px rgba(0,0,0,0.2)',
            transition: 'background 200ms ease',
          }}
        />
      ))}
    </div>
  );
}

// The shaking + tossing dice tray
function DiceTray({ dice, onToggleHold, rolling = false, shaking = false, feltColor = '#1F3D38', accent = '#E26D5C', canHold = true }) {
  return (
    <div
      style={{
        background: feltColor,
        borderRadius: 20,
        padding: '22px 14px 18px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.06), 0 2px 0 rgba(0,0,0,0.05)',
      }}
    >
      {/* felt texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        backgroundImage: `radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '4px 4px',
      }} />
      {/* "HELD" hint label */}
      <div style={{
        position: 'absolute', top: 7, left: 14, color: 'rgba(255,255,255,0.32)',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 8.5, letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 600,
      }}>
        Dice · tap to hold
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
        position: 'relative', zIndex: 1, marginTop: 8,
      }}>
        {dice.map((d, i) => (
          <button
            key={i}
            onClick={() => canHold && onToggleHold && onToggleHold(i)}
            disabled={!canHold}
            style={{
              all: 'unset', display: 'flex', justifyContent: 'center', alignItems: 'center',
              cursor: canHold ? 'pointer' : 'default',
              padding: '2px 0',
            }}
            aria-label={`Die ${i + 1}, value ${d.value}${d.held ? ', held' : ''}`}
          >
            <DieFace value={d.value} size={50} held={d.held} rolling={rolling && !d.held} shaking={shaking} shakeIndex={i} accent={accent} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Mini die for inline use (e.g. results lists)
function MiniDie({ value, size = 22, accent = '#E26D5C' }) {
  return <DieFace value={value} size={size} accent={accent} />;
}

Object.assign(window, { DieFace, DiceTray, MiniDie });
