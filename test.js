// Run with: node test.js
import assert from 'node:assert/strict';
import './solver.js';

const { solve, solveMinRounds, evaluate, bounds, groupSizes, scoreBound } = globalThis.Solver;

function check(name, plan, n, k, cat, maxMeet) {
  const s = evaluate(plan, n, cat);
  for (const round of plan) {
    assert.deepEqual(round.flatMap(g => g.members).sort((a, b) => a - b), [...Array(n).keys()], `${name}: partition`);
    assert.deepEqual(round.map(g => g.members.length).sort(), groupSizes(n, k).sort(), `${name}: group sizes`);
  }
  const lo = Math.floor((plan.length * groupSizes(n, k).length) / n);
  assert.ok(s.hosts.every(h => h === lo || h === lo + 1), `${name}: balanced hosts ${s.hosts}`);
  assert.equal(s.unmet, 0, `${name}: every pair meets`);
  assert.equal(s.alone, 0, `${name}: nobody alone in their category`);
  assert.ok(s.maxMeet <= maxMeet, `${name}: maxMeet ${s.maxMeet}`);
  console.log(`ok ${name}: ${plan.length} rounds, max ${s.maxMeet} meetings per pair`);
}

assert.deepEqual(groupSizes(25, 4), [5, 4, 4, 4, 4, 4]);
assert.equal(bounds(24, 6).coverRounds, 5);
assert.equal(bounds(24, 6).hostRounds, 6);
assert.equal(bounds(24, 4, Array.from({ length: 24 }, (_, i) => (i < 5 ? 0 : -1))).coverRounds, 14);

// 24/6/6 has 120 pairs repeated across round pairs; the best spread is 12 pairs twice and 36 three times.
assert.equal(scoreBound(24, 6, 6), 300);
assert.equal(scoreBound(15, 3, 7), 0);
const s24 = evaluate(solve({ n: 24, k: 4, rounds: 10 }), 24);
assert.ok(s24.score >= scoreBound(24, 4, 10), 'score respects its bound');

// Kirkman's schoolgirl problem: every pair meets exactly once.
check('kirkman 15/3', solve({ n: 15, k: 3, rounds: 7 }), 15, 3, null, 1);
// Affine plane AG(2,5).
check('affine 25/5', solve({ n: 25, k: 5, rounds: 6 }), 25, 5, null, 1);
check('24/4', solveMinRounds({ n: 24, k: 4 }), 24, 4, null, 2);
// 6 children share a category, so each group has 0 or at least 2 of them.
const cat = Array.from({ length: 24 }, (_, i) => (i < 6 ? 0 : -1));
check('24/4 with category', solveMinRounds({ n: 24, k: 4, cat }), 24, 4, cat, 3);
