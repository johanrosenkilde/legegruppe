// Play group planner: R rounds, each a partition of n children into groups of about k.
// Groups are found by simulated annealing over swaps within a round; hosts are assigned afterwards.
// Classic script, so the page also works from file://. Exposes globalThis.Solver.
(() => {
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function groupSizes(n, k) {
  const g = Math.max(1, Math.floor(n / k));
  const base = Math.floor(n / g), extra = n % g;
  return Array.from({ length: g }, (_, i) => base + (i < extra ? 1 : 0));
}

// coverRounds: fewest rounds in which every pair can meet. hostRounds: rounds needed for n hosts.
// With categories, a category of m children meets the other n - m children at most `cross` times per round.
function bounds(n, k, cat = null) {
  const sizes = groupSizes(n, k);
  let coverRounds = sizes[0] > 1 ? Math.ceil((n - 1) / (sizes[0] - 1)) : Infinity;
  const lonely = [];
  const counts = {};
  for (const c of cat || []) if (c >= 0) counts[c] = (counts[c] || 0) + 1;
  for (const [c, m] of Object.entries(counts)) {
    if (m < 2) { lonely.push(+c); continue; }
    // ponytail: spreads m evenly over the largest groups; a lower bound, not always tight.
    const parts = Math.min(Math.floor(m / 2), sizes.length);
    let cross = 0;
    for (let g = 0; g < parts; g++) {
      const t = Math.floor(m / parts) + (g < m % parts ? 1 : 0);
      cross += t * Math.max(0, sizes[g] - t);
    }
    coverRounds = Math.max(coverRounds, cross ? Math.ceil((m * (n - m)) / cross) : Infinity);
  }
  return { sizes, coverRounds, hostRounds: n / sizes.length, lonely };
}

// Smallest number of rounds, from the lower bound up, for which the solver covers every pair.
function solveMinRounds(opts, maxExtra = 5) {
  const b = bounds(opts.n, opts.k, opts.cat);
  const first = Math.max(b.coverRounds, Math.ceil(b.hostRounds));
  let plan;
  for (let R = first; R <= first + maxExtra; R++) {
    plan = solve({ ...opts, rounds: R });
    if (evaluate(plan, opts.n, opts.cat).unmet === 0) break;
  }
  return plan;
}

const W_UNMET = 10;
const W_ALONE = 1000;
const W_HOST = 10;
const P_TARGET = 0.5;
const T0 = 7, T1 = 0.5;
// A pair that never meets costs W_UNMET; a pair meeting c >= 1 times costs (c-1)³, so repeats spread out.
const pairCost = c => (c === 0 ? W_UNMET : (c - 1) ** 3);
const alone = c => (c === 1 ? 1 : 0);

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pick a child c in group g1 and a child u = round[g2][j] that c has not met. Returns [g1, c, g2, j] or null.
function unmetMove(round, cnt, n, rand) {
  const g1 = Math.floor(rand() * round.length);
  const A = round[g1];
  const c = A[Math.floor(rand() * A.length)];
  const options = [];
  round.forEach((B, g2) => {
    if (g2 !== g1) B.forEach((u, j) => { if (cnt[c * n + u] === 0) options.push([g2, j]); });
  });
  if (!options.length || A.length < 2) return null;
  const [g2, j] = options[Math.floor(rand() * options.length)];
  return [g1, c, g2, j];
}

// cat[i] is a category id >= 0, or -1 for none. With cat set, no child is the only one of its category in a group.
function solveGroups(n, sizes, R, cat, rand, iters) {
  const G = sizes.length;
  const nc = cat ? Math.max(-1, ...cat) + 1 : 0;
  const cnt = new Int32Array(n * n);
  const cc = new Int32Array(R * G * Math.max(nc, 1));
  const ci = (r, g, c) => (r * G + g) * nc + c;

  const members = [];
  for (let r = 0; r < R; r++) {
    const perm = shuffle([...Array(n).keys()], rand);
    let o = 0;
    members.push(sizes.map(s => perm.slice(o, (o += s))));
  }
  members.forEach((round, r) => round.forEach((grp, g) => {
    for (const a of grp) {
      for (const b of grp) if (a !== b) cnt[a * n + b]++;
      if (nc && cat[a] >= 0) cc[ci(r, g, cat[a])]++;
    }
  }));

  let cost = 0;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) cost += pairCost(cnt[a * n + b]);
  for (const c of cc) if (nc) cost += W_ALONE * alone(c);

  let best = members.map(round => round.map(grp => [...grp]));
  let bestCost = cost;
  if (G < 2) return { best, cost };

  const delta = (r, g1, i, g2, j) => {
    const A = members[r][g1], B = members[r][g2];
    const a = A[i], b = B[j];
    // Moving a to B and b to A changes only pairs (a|b, x) for x in A ∪ B.
    let d = 0;
    for (const x of A) if (x !== a) {
      d += pairCost(cnt[b * n + x] + 1) - pairCost(cnt[b * n + x]);
      d += pairCost(cnt[a * n + x] - 1) - pairCost(cnt[a * n + x]);
    }
    for (const y of B) if (y !== b) {
      d += pairCost(cnt[a * n + y] + 1) - pairCost(cnt[a * n + y]);
      d += pairCost(cnt[b * n + y] - 1) - pairCost(cnt[b * n + y]);
    }
    if (nc && cat[a] !== cat[b]) {
      for (const [g, out, inn] of [[g1, cat[a], cat[b]], [g2, cat[b], cat[a]]]) {
        if (out >= 0) { const c = cc[ci(r, g, out)]; d += W_ALONE * (alone(c - 1) - alone(c)); }
        if (inn >= 0) { const c = cc[ci(r, g, inn)]; d += W_ALONE * (alone(c + 1) - alone(c)); }
      }
    }
    return d;
  };

  const apply = (r, g1, i, g2, j) => {
    const A = members[r][g1], B = members[r][g2];
    const a = A[i], b = B[j];
    for (const x of A) if (x !== a) {
      cnt[b * n + x]++; cnt[x * n + b]++; cnt[a * n + x]--; cnt[x * n + a]--;
    }
    for (const y of B) if (y !== b) {
      cnt[a * n + y]++; cnt[y * n + a]++; cnt[b * n + y]--; cnt[y * n + b]--;
    }
    if (nc && cat[a] !== cat[b]) {
      if (cat[a] >= 0) { cc[ci(r, g1, cat[a])]--; cc[ci(r, g2, cat[a])]++; }
      if (cat[b] >= 0) { cc[ci(r, g2, cat[b])]--; cc[ci(r, g1, cat[b])]++; }
    }
    A[i] = b; B[j] = a;
  };

  for (let it = 0; it < iters; it++) {
    const T = T0 * (T1 / T0) ** (it / iters);
    const r = Math.floor(rand() * R);
    let move = rand() < P_TARGET ? unmetMove(members[r], cnt, n, rand) : null, d;
    if (move) {
      // Of c's group mates, send away the one whose swap costs least.
      const [g1, c, g2, j] = move;
      d = Infinity;
      members[r][g1].forEach((x, i) => {
        if (x === c) return;
        const di = delta(r, g1, i, g2, j);
        if (di < d) { d = di; move = [r, g1, i, g2, j]; }
      });
    } else {
      const g1 = Math.floor(rand() * G);
      let g2 = Math.floor(rand() * (G - 1));
      if (g2 >= g1) g2++;
      move = [r, g1, Math.floor(rand() * members[r][g1].length), g2, Math.floor(rand() * members[r][g2].length)];
      d = delta(...move);
    }
    if (d > 0 && rand() >= Math.exp(-d / T)) continue;
    apply(...move);
    cost += d;
    if (cost < bestCost) {
      bestCost = cost;
      best = members.map(round => round.map(grp => [...grp]));
    }
  }

  return { best, cost: bestCost };
}

// Balance host counts first, then spread each child's host rounds apart in time.
function hostCost(rounds) {
  let c = W_HOST * rounds.length * rounds.length;
  for (let i = 0; i < rounds.length; i++)
    for (let j = i + 1; j < rounds.length; j++) c += 1 / Math.abs(rounds[i] - rounds[j]);
  return c;
}

function assignHosts(members, n, rand, iters) {
  const slots = [];
  members.forEach((round, r) => round.forEach(grp => slots.push({ r, grp })));
  const host = slots.map(s => s.grp[Math.floor(rand() * s.grp.length)]);
  const hosted = Array.from({ length: n }, () => []);
  host.forEach((h, s) => hosted[h].push(slots[s].r));

  let best = [...host];
  let cost = hosted.reduce((sum, rs) => sum + hostCost(rs), 0);
  let bestCost = cost;
  const T0 = 2, T1 = 0.01;
  for (let it = 0; it < iters; it++) {
    const T = T0 * (T1 / T0) ** (it / iters);
    const s = Math.floor(rand() * slots.length);
    const { r, grp } = slots[s];
    const a = host[s], b = grp[Math.floor(rand() * grp.length)];
    if (a === b) continue;
    const ra = hosted[a].filter((x, i) => i !== hosted[a].indexOf(r));
    const rb = [...hosted[b], r];
    const d = hostCost(ra) + hostCost(rb) - hostCost(hosted[a]) - hostCost(hosted[b]);
    if (d > 0 && rand() >= Math.exp(-d / T)) continue;
    hosted[a] = ra; hosted[b] = rb; host[s] = b;
    cost += d;
    if (cost < bestCost) { bestCost = cost; best = [...host]; }
  }
  return slots.map((s, i) => ({ r: s.r, grp: s.grp, host: best[i] }));
}

// Returns rounds[r] = [{ host, members }], with the host first in members.
function solve({ n, k, rounds: R, cat = null, seed = 1, iterations = 500000, restarts = 3 }) {
  const rand = mulberry32(seed);
  const sizes = groupSizes(n, k);
  let members, bestCost = Infinity;
  for (let i = 0; i < restarts; i++) {
    const { best, cost } = solveGroups(n, sizes, R, cat, rand, iterations);
    if (cost < bestCost) { bestCost = cost; members = best; }
  }
  const plan = Array.from({ length: R }, () => []);
  for (const { r, grp, host } of assignHosts(members, n, rand, Math.max(20000, R * n * 200))) {
    plan[r].push({ host, members: [host, ...grp.filter(x => x !== host).sort((x, y) => x - y)] });
  }
  return plan;
}

function evaluate(plan, n, cat = null) {
  const meet = Array.from({ length: n }, () => new Array(n).fill(0));
  const hosts = new Array(n).fill(0);
  let alone = 0;
  for (const round of plan) for (const { host, members } of round) {
    hosts[host]++;
    for (const a of members) for (const b of members) if (a !== b) meet[a][b]++;
    if (cat) {
      const per = {};
      for (const a of members) if (cat[a] >= 0) per[cat[a]] = (per[cat[a]] || 0) + 1;
      alone += Object.values(per).filter(c => c === 1).length;
    }
  }
  let unmet = 0, maxMeet = 0, score = 0;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    if (meet[a][b] === 0) unmet++;
    maxMeet = Math.max(maxMeet, meet[a][b]);
    score += pairCost(meet[a][b]);
  }
  return { meet, hosts, unmet, maxMeet, alone, score };
}

// Lower bound on the score of any plan with R rounds. Let x_c be the number of pairs meeting c times.
// Every plan satisfies Σx_c = C(n,2) and Σ c·x_c = R·Σ C(s,2). Two rounds share at least `shared` pairs,
// since their G² group intersections sum to n, so Σ C(c,2)·x_c ≥ C(R,2)·shared.
// The bound is the optimum of this linear program, found by trying every basis of two or three columns.
function scoreBound(n, k, R) {
  const sizes = groupSizes(n, k), G = sizes.length;
  const C2 = x => (x * (x - 1)) / 2;
  const P = C2(n), M = R * sizes.reduce((sum, x) => sum + C2(x), 0);
  const q = Math.floor(n / (G * G)), rem = n % (G * G);
  const B = C2(R) * (rem * C2(q + 1) + (G * G - rem) * C2(q));
  const eps = 1e-9;
  let best = Infinity;
  const tryBasis = (cs, xs) => {
    if (xs.some(x => x < -eps)) return;
    if (cs.reduce((sum, c, i) => sum + C2(c) * xs[i], 0) < B - eps) return;
    best = Math.min(best, cs.reduce((sum, c, i) => sum + pairCost(c) * xs[i], 0));
  };
  for (let a = 0; a <= R; a++) for (let b = a + 1; b <= R; b++) {
    const xb = (M - a * P) / (b - a);
    tryBasis([a, b], [P - xb, xb]);
    for (let c = b + 1; c <= R; c++) {
      // Solve [1 1 1; a b c; C2(a) C2(b) C2(c)] x = [P; M; B] by Cramer's rule.
      const m = [[1, 1, 1], [a, b, c], [C2(a), C2(b), C2(c)]], rhs = [P, M, B];
      const det = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
      const D = det(m);
      if (Math.abs(D) < eps) continue;
      tryBasis([a, b, c], [0, 1, 2].map(j => det(m.map((row, i) => row.map((v, jj) => (jj === j ? rhs[i] : v)))) / D));
    }
  }
  return Math.max(0, Math.ceil(best - eps));
}

globalThis.Solver = { mulberry32, groupSizes, bounds, solve, solveMinRounds, evaluate, scoreBound };
})();
