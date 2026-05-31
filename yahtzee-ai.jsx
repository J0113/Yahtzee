// yahtzee-ai.jsx — CPU opponent strategy, separated from app/UI logic.
//
// Two public functions:
//   cpuHoldStrategy(dice, scores, difficulty, rollsLeft) → dice[] with .held updated
//   cpuPickCategory(dice, scores, difficulty)            → { key, pts }
//
// Difficulty tiers:
//   easy   — heuristic + ~25% blunder rate (random category, sometimes break a hand)
//   normal — Monte-Carlo EV with low sample count + top-K random pick (some variance)
//   hard   — Monte-Carlo EV with high sample count + always-optimal pick.
//            Value model hoards Chance early and is par-aware on the upper
//            section (won't dump two 6's below par while chasing the 63 bonus).
//
// Depends on UPPER_CATS, LOWER_CATS, scoreFor from yahtzee-scorecard.jsx
// (loaded before this file).

// ── Helpers ────────────────────────────────────────────────────────────────

function _counts(dice) {
  const c = {};
  dice.forEach(d => { c[d.value] = (c[d.value] || 0) + 1; });
  return c;
}

function _remaining(scores) {
  return [...UPPER_CATS, ...LOWER_CATS].filter(c => scores[c.key] === undefined);
}

function _holdValues(dice, valuesToHold) {
  const set = new Set(valuesToHold);
  return dice.map(d => set.has(d.value));
}

function _upperProgress(scores) {
  return UPPER_CATS.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0);
}

function _rollDie() { return 1 + Math.floor(Math.random() * 6); }

// ── Value model ────────────────────────────────────────────────────────────
// Estimated "true" value of filling catKey with `pts` given current scorecard.
// Used by both hold EV and category-pick decisions so they agree.

const HARD_BONUS = {
  yahtzee:    35,  // big retention bonus — Yahtzee very hard to refill
  lgStraight: 22,
  smStraight: 12,
  fullHouse:  10,
  fourKind:    6,
  threeKind:   3,
};

// Sacrifice priority (negative — picking a 0 here costs this much vs an alternative).
// Lower (more negative) = worse to zero. Prefer sacrificing high indices first.
const SACRIFICE_VALUE = {
  ones:       -2,
  twos:       -4,
  threes:     -6,
  fours:      -8,
  fives:     -12,
  sixes:     -16,
  threeKind:  -8,
  fourKind:  -12,
  fullHouse: -18,
  smStraight:-22,
  lgStraight:-32,
  yahtzee:   -45,
  chance:    -28,
};

function _categoryValue(catKey, pts, scores) {
  if (pts <= 0) {
    return SACRIFICE_VALUE[catKey] ?? -15;
  }
  let v = pts;

  // Upper section: filling toward the 63-pt bonus is worth extra.
  const upperIdx = UPPER_CATS.findIndex(c => c.key === catKey);
  if (upperIdx >= 0) {
    const upperProg = _upperProgress(scores);
    const upperNeeded = Math.max(0, 63 - upperProg);
    if (upperNeeded > 0) {
      const faceVal = upperIdx + 1;
      const par = faceVal * 3; // par = three of a face = on pace for the bonus
      const surplus = pts - par; // scales with faceVal
      // Par-aware while chasing the bonus: locking a high box BELOW par burns
      // bonus headroom you can't recover, so penalize shortfalls steeply; reward
      // surplus only mildly. The steep below-par slope makes two 6's (surplus -6
      // → -13.2) score worse than two 2's (surplus -2 → -4.4), so the AI dumps
      // the low face and keeps chasing 3+ sixes. 3+ of a face is at/above par.
      v += surplus >= 0 ? surplus * 0.5 : surplus * 2.2;
      // Floor: a positive fill must never look worse than zeroing the same box,
      // or the AI would throw away real points (e.g. a lone 6) for "bonus value".
      const floor = (SACRIFICE_VALUE[catKey] ?? -15) + 1;
      if (v < floor) v = floor;
    }
  }

  // Chance: a flexible safety net. Hoard it early — a mediocre sum should not
  // beat sacrificing a cheap box. Penalty decays as the card fills, so Chance
  // becomes usable late and still beats zeroing a hard category when forced.
  if (catKey === 'chance') {
    const remainingCount = _remaining(scores).length;
    v -= Math.max(0, remainingCount - 1) * 3;
  }

  // Retention bonus — having a positive score in a hard category is much
  // better than zeroing it later.
  v += HARD_BONUS[catKey] || 0;

  return v;
}

function _bestFillValue(dice, remaining, scores) {
  let best = -Infinity;
  for (const c of remaining) {
    const pts = scoreFor(c.key, dice);
    const v = _categoryValue(c.key, pts, scores);
    if (v > best) best = v;
  }
  return best;
}

// ── Monte-Carlo hold EV ────────────────────────────────────────────────────
// For each of the 32 possible hold subsets, simulate `samples` final dice
// outcomes (factoring in `rollsLeft` rerolls) and pick the subset with
// highest expected `_bestFillValue` over remaining categories.
//
// Approximation for 2-reroll case: after the first simulated reroll, re-hold
// any die matching the modal value (greedy continuation). Good enough — the
// outer subset choice dominates results.

function _evForSubset(dice, hold, scores, remaining, rollsLeft, samples) {
  let sum = 0;
  for (let s = 0; s < samples; s++) {
    const rolled = dice.map((d, i) => hold[i] ? d : { value: _rollDie() });

    let finalDice = rolled;
    if (rollsLeft >= 2) {
      // Greedy second reroll: keep originally-held + dice matching modal value.
      const counts = _counts(rolled);
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const modalVal = Number(sortedCounts[0][0]);
      finalDice = rolled.map((d, i) =>
        (hold[i] || d.value === modalVal) ? d : { value: _rollDie() }
      );
    }
    sum += _bestFillValue(finalDice, remaining, scores);
  }
  return sum / samples;
}

function _evAllSubsets(dice, scores, rollsLeft, samples) {
  const remaining = _remaining(scores);
  const results = [];
  for (let mask = 0; mask < 32; mask++) {
    const hold = [
      !!(mask & 1), !!(mask & 2), !!(mask & 4), !!(mask & 8), !!(mask & 16),
    ];
    const ev = _evForSubset(dice, hold, scores, remaining, rollsLeft, samples);
    results.push({ hold, ev });
  }
  results.sort((a, b) => b.ev - a.ev);
  return results;
}

// ── Easy: heuristic + blunder ──────────────────────────────────────────────

function _holdEasy(dice) {
  // 20% chance to hold a random subset (blunder)
  if (Math.random() < 0.20) {
    return dice.map(() => Math.random() < 0.5);
  }
  const counts = _counts(dice);
  const mostCommonVal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return _holdValues(dice, [Number(mostCommonVal)]);
}

function _pickEasy(dice, remaining) {
  // 25% blunder: pick a random remaining category, ignoring score
  if (Math.random() < 0.25) {
    return remaining[Math.floor(Math.random() * remaining.length)];
  }
  const positive = remaining.filter(c => scoreFor(c.key, dice) > 0);
  if (positive.length > 0) return positive[0];
  return remaining[Math.floor(Math.random() * remaining.length)] ?? remaining[0];
}

// ── Normal: lighter MC + variance ──────────────────────────────────────────

function _holdNormal(dice, scores, rollsLeft) {
  const results = _evAllSubsets(dice, scores, rollsLeft, 40);
  // Random pick among top 3 to add variance / risk-taking
  const topK = Math.min(3, results.length);
  const idx = Math.floor(Math.random() * topK);
  return results[idx].hold;
}

function _pickNormal(dice, remaining, scores) {
  const scored = remaining.map(c => {
    const pts = scoreFor(c.key, dice);
    return { c, pts, v: _categoryValue(c.key, pts, scores) };
  });
  scored.sort((a, b) => b.v - a.v);
  // 15% chance: take 2nd-best pick instead (mild risk)
  if (scored.length >= 2 && Math.random() < 0.15) {
    return scored[1].c;
  }
  return scored[0].c;
}

// ── Hard: full MC + optimal pick ───────────────────────────────────────────

function _holdHard(dice, scores, rollsLeft) {
  const results = _evAllSubsets(dice, scores, rollsLeft, 140);
  return results[0].hold;
}

function _pickHard(dice, remaining, scores) {
  let best = remaining[0];
  let bestVal = -Infinity;
  for (const c of remaining) {
    const pts = scoreFor(c.key, dice);
    const v = _categoryValue(c.key, pts, scores);
    if (v > bestVal) { bestVal = v; best = c; }
  }
  return best;
}

// ── Public API ─────────────────────────────────────────────────────────────

function cpuHoldStrategy(dice, scores, difficulty, rollsLeft = 1) {
  let mask;
  if (difficulty === 'easy') {
    mask = _holdEasy(dice);
  } else if (difficulty === 'normal') {
    mask = _holdNormal(dice, scores, rollsLeft);
  } else {
    mask = _holdHard(dice, scores, rollsLeft);
  }
  return dice.map((d, i) => ({ ...d, held: mask[i] }));
}

function cpuPickCategory(dice, scores, difficulty) {
  const remaining = _remaining(scores);
  if (remaining.length === 0) return null;

  let cat;
  if (difficulty === 'easy') {
    cat = _pickEasy(dice, remaining);
  } else if (difficulty === 'normal') {
    cat = _pickNormal(dice, remaining, scores);
  } else {
    cat = _pickHard(dice, remaining, scores);
  }

  return { key: cat.key, pts: scoreFor(cat.key, dice) };
}

Object.assign(window, { cpuHoldStrategy, cpuPickCategory });
