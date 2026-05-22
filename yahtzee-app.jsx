// Yahtzee — main app shell. Routes between screens, owns game state.
// AI logic is in yahtzee-ai.jsx (cpuHoldStrategy, cpuPickCategory).

function makeEmptyScores() { return {}; }

function rollOne() { return 1 + Math.floor(Math.random() * 6); }
function makeFreshDice() {
  return Array.from({ length: 5 }, () => ({ value: 1, held: false }));
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Resolve theme tokens from tweaks
  const accent = t.accent;
  const feltColor = t.feltColor;
  const bg = t.bg;

  // Route + setup state
  const [route, setRoute] = React.useState('home'); // home|mode|difficulty|players|game|results
  const [mode, setMode] = React.useState(null);
  const [difficulty, setDifficulty] = React.useState('normal');

  // Game state
  const [players, setPlayers] = React.useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = React.useState(0);
  const [round, setRound] = React.useState(1);
  const [dice, setDice] = React.useState(makeFreshDice());
  const [rollsUsed, setRollsUsed] = React.useState(0);
  const [rolling, setRolling] = React.useState(false);
  const [scoreSheetOpen, setScoreSheetOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  // When a CPU finishes a turn we pause on a recap state until the human taps Continue.
  // { playerIdx, catKey, points } | null
  const [recap, setRecap] = React.useState(null);

  // Refs that stay in sync with state — used by async CPU logic to avoid
  // reading stale closure values.
  const diceRef = React.useRef(dice);
  const playersRef = React.useRef(players);
  const currentPlayerIdxRef = React.useRef(currentPlayerIdx);
  React.useEffect(() => { diceRef.current = dice; }, [dice]);
  React.useEffect(() => { playersRef.current = players; }, [players]);
  React.useEffect(() => { currentPlayerIdxRef.current = currentPlayerIdx; }, [currentPlayerIdx]);

  // CPU auto-play: when current player is CPU, simulate a full turn.
  React.useEffect(() => {
    if (route !== 'game') return;
    const current = players[currentPlayerIdx];
    if (!current?.isCpu) return;

    const playTurn = async () => {
      await new Promise(r => setTimeout(r, 800));

      // Roll 1
      doRoll();
      await new Promise(r => setTimeout(r, 900));

      // Hold after Roll 1, with 2 rerolls still available
      setDice(prev => cpuHoldStrategy(prev, playersRef.current[currentPlayerIdxRef.current].scores, difficulty, 2));
      await new Promise(r => setTimeout(r, 500));

      // Roll 2
      doRoll();
      await new Promise(r => setTimeout(r, 900));

      // Hold after Roll 2, with 1 reroll left
      setDice(prev => cpuHoldStrategy(prev, playersRef.current[currentPlayerIdxRef.current].scores, difficulty, 1));
      await new Promise(r => setTimeout(r, 400));

      // Roll 3 (final). Held dice stay; rest reroll.
      doRoll();
      await new Promise(r => setTimeout(r, 900));

      // Pick best category
      const liveDice = diceRef.current;
      const me = playersRef.current[currentPlayerIdxRef.current];
      if (!me) return;
      const result = cpuPickCategory(liveDice, me.scores, difficulty);
      if (result) pickCategory(result.key, result.pts);
    };

    playTurn();
    // eslint-disable-next-line
  }, [route, currentPlayerIdx]);

  function startGame(playerList) {
    setPlayers(playerList.map(p => ({ ...p, scores: makeEmptyScores() })));
    setCurrentPlayerIdx(0);
    setRound(1);
    setDice(makeFreshDice());
    setRollsUsed(0);
    setScoreSheetOpen(false);
    setRoute('game');
  }

  function doRoll() {
    if (rollsUsed >= 3 || rolling) return;
    setRolling(true);
    // Tumble animation: rapidly randomize values, then settle.
    let ticks = 0;
    const maxTicks = 5;
    const iv = setInterval(() => {
      setDice(prev => prev.map(d => d.held ? d : { ...d, value: rollOne() }));
      ticks += 1;
      if (ticks >= maxTicks) {
        clearInterval(iv);
        setDice(prev => prev.map(d => d.held ? d : { ...d, value: rollOne() }));
        setRollsUsed(u => u + 1);
        setRolling(false);
      }
    }, 80);
  }

  function toggleHold(i) {
    if (rolling) return;
    if (rollsUsed === 0 || rollsUsed >= 3) return;
    setDice(prev => prev.map((d, idx) => idx === i ? { ...d, held: !d.held } : d));
  }

  function pickCategory(catKey, pts) {
    const wasCpu = players[currentPlayerIdx]?.isCpu;
    setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? {
      ...p,
      scores: { ...p.scores, [catKey]: pts },
    } : p));
    // Toast
    const catLabel = [...UPPER_CATS, ...LOWER_CATS].find(c => c.key === catKey)?.label;
    setToast({
      name: players[currentPlayerIdx].name,
      color: players[currentPlayerIdx].color,
      category: catLabel, points: pts,
    });
    setTimeout(() => setToast(null), 2200);
    setScoreSheetOpen(false);

    if (wasCpu) {
      setRecap({ playerIdx: currentPlayerIdx, catKey, points: pts });
    } else {
      advanceTurn();
    }
  }

  function acknowledgeRecap() {
    setRecap(null);
    advanceTurn();
  }

  function advanceTurn() {
    const nextIdx = (currentPlayerIdx + 1) % players.length;
    const nextRound = nextIdx === 0 ? round + 1 : round;
    setCurrentPlayerIdx(nextIdx);
    setRound(nextRound);
    setDice(makeFreshDice());
    setRollsUsed(0);
    if (nextRound > 13) {
      setRoute('results');
    }
  }

  function exitToHome() {
    setRoute('home');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const screenContent = (
    <div style={{
      width: '100%', height: '100%',
      background: bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      paddingTop: 'max(14px, env(safe-area-inset-top))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        width: '100%',
        maxWidth: route === 'game' ? '100%' : 540,
        margin: route === 'game' ? '0' : '0 auto',
      }}>
        {route === 'home' && (
          <HomeScreen
            accent={accent}
            onStart={() => setRoute('mode')}
            hasSavedGame={false}
          />
        )}
        {route === 'mode' && (
          <SetupModeScreen
            accent={accent}
            onBack={() => setRoute('home')}
            onPick={(m) => {
              setMode(m);
              if (m === 'cpu') setRoute('difficulty');
              else setRoute('players');
            }}
          />
        )}
        {route === 'difficulty' && (
          <SetupDifficultyScreen
            accent={accent}
            onBack={() => setRoute('mode')}
            onPick={(d) => {
              setDifficulty(d);
              startGame([
                { name: 'You', color: PLAYER_COLORS[0], isCpu: false },
                { name: 'Cleo', color: PLAYER_COLORS[1], isCpu: true },
              ]);
            }}
          />
        )}
        {route === 'players' && (
          <SetupPlayersScreen
            mode={mode}
            difficulty={difficulty}
            accent={accent}
            onBack={() => setRoute(mode === 'cpu' ? 'difficulty' : 'mode')}
            onStart={startGame}
          />
        )}
        {route === 'game' && players.length > 0 && (
          <GameScreen
            players={players}
            currentPlayerIdx={currentPlayerIdx}
            round={round}
            dice={dice}
            rollsUsed={rollsUsed}
            rolling={rolling}
            accent={accent}
            feltColor={feltColor}
            onRoll={doRoll}
            onToggleHold={toggleHold}
            onOpenScore={(action, cat, pts) => {
              if (action === 'pick') pickCategory(cat, pts);
              else setScoreSheetOpen(true);
            }}
            onPickCategory={pickCategory}
            onExit={exitToHome}
            recap={recap}
            onContinue={acknowledgeRecap}
          />
        )}
        {route === 'results' && (
          <ResultsScreen
            players={players}
            accent={accent}
            onPlayAgain={() => startGame(players.map(p => ({ ...p, scores: {} })))}
            onHome={exitToHome}
          />
        )}

        {/* Score sheet overlay */}
        {route === 'game' && (
          <ScorecardSheet
            open={scoreSheetOpen}
            onClose={() => setScoreSheetOpen(false)}
            players={players}
            currentPlayerIdx={currentPlayerIdx}
            dice={dice}
            rollsUsed={rollsUsed}
            accent={accent}
            onPickCategory={pickCategory}
          />
        )}

        {/* Score toast */}
        {toast && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#1C1917', color: '#FAF6EE',
            padding: '10px 16px', borderRadius: 99,
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: '"Geist", sans-serif', fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 200,
            animation: 'toast-in 320ms cubic-bezier(.2,.8,.2,1)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 99, background: toast.color,
            }} />
            <span><strong style={{ fontWeight: 600 }}>{toast.name}</strong> scored <strong style={{ color: accent }}>+{toast.points}</strong> on {toast.category}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-page">
      <div className="app-shell" style={{ background: bg }}>
        {screenContent}
      </div>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={['#E26D5C', '#C2410C', '#2D8A6E', '#7D5BA6', '#3F6C9E']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakColor
          label="Felt color"
          value={t.feltColor}
          options={['#1F3D38', '#2A2F4E', '#3A2F2C', '#1A2E1A', '#1C1917']}
          onChange={(v) => setTweak('feltColor', v)}
        />
        <TweakColor
          label="Background"
          value={t.bg}
          options={['#F2EBDC', '#F7F4ED', '#EFE4D2', '#FAF6EE', '#EAE3D0']}
          onChange={(v) => setTweak('bg', v)}
        />
        <TweakSection label="Jump to screen" />
        <TweakSelect
          label="Screen"
          value={route}
          options={['home', 'mode', 'difficulty', 'players', 'game', 'results']}
          onChange={(v) => {
            if (v === 'game' && players.length === 0) {
              const demo = [
                { name: 'You', color: PLAYER_COLORS[0], isCpu: false, scores: { ones: 4, twos: 6, threes: 9, fours: 8, threeKind: 18, fullHouse: 25 } },
                { name: 'Cleo', color: PLAYER_COLORS[1], isCpu: true, scores: { ones: 3, twos: 4, fives: 15, smStraight: 30, chance: 22 } },
              ];
              setPlayers(demo);
              setCurrentPlayerIdx(0);
              setRound(7);
              setDice([{ value: 5, held: true }, { value: 5, held: true }, { value: 3, held: false }, { value: 2, held: false }, { value: 6, held: false }]);
              setRollsUsed(1);
            }
            if (v === 'results' && players.length === 0) {
              const demo = [
                { name: 'You', color: PLAYER_COLORS[0], isCpu: false, scores: { ones: 4, twos: 6, threes: 9, fours: 8, fives: 15, sixes: 18, threeKind: 18, fourKind: 24, fullHouse: 25, smStraight: 30, lgStraight: 40, yahtzee: 50, chance: 22 } },
                { name: 'Cleo', color: PLAYER_COLORS[1], isCpu: true, scores: { ones: 3, twos: 4, threes: 6, fours: 12, fives: 15, sixes: 18, threeKind: 22, fourKind: 0, fullHouse: 25, smStraight: 30, lgStraight: 0, yahtzee: 0, chance: 26 } },
              ];
              setPlayers(demo);
            }
            setRoute(v);
          }}
        />
        <TweakSection label="In-game" />
        <TweakButton
          label="Open scorecard"
          onClick={() => { if (route === 'game') setScoreSheetOpen(true); }}
        />
        <TweakButton
          label="Reset to home"
          onClick={() => { setRoute('home'); setPlayers([]); }}
          secondary
        />
      </TweaksPanel>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E26D5C",
  "feltColor": "#1F3D38",
  "bg": "#F2EBDC"
}/*EDITMODE-END*/;

Object.assign(window, { App, TWEAK_DEFAULTS, makeFreshDice });

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
