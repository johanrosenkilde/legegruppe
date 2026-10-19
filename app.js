import { bounds, evaluate } from './solver.js';

const T = {
  da: {
    title: 'Legegrupper',
    lead: 'Fordel en klasse i legegrupper over flere runder, så alle har været i gruppe med alle, og hvert barn er vært lige mange gange. Alt beregnes i din browser.',
    names: 'Børn',
    namesHint: 'Ét navn per linje. Tilføj evt. en kategori efter et komma, fx "Ida, A".',
    k: 'Børn per gruppe (ca.)',
    rounds: 'Antal runder',
    roundsHint: 'Tomt: det mindste antal, hvor alle mødes.',
    catRule: 'Ingen er alene om sin kategori i en gruppe',
    catHint: 'Hver gruppe har enten ingen eller mindst to børn fra hver kategori. Børn uden kategori tæller ikke med.',
    seed: 'Seed',
    make: 'Lav plan',
    another: 'Nyt forslag',
    computing: 'Beregner…',
    csv: 'Hent CSV',
    print: 'Udskriv',
    round: 'Runde',
    host: 'vært',
    summary: 'Overblik',
    plan: 'Plan',
    matrix: 'Hvor mange gange har to børn været i gruppe sammen?',
    sizes: (g, s) => `${g} grupper per runde med ${s} børn.`,
    lower: r => `Mindst ${r} runder, før alle kan have mødt alle.`,
    unmetOk: 'Alle har været i gruppe med alle.',
    unmet: u => `${u} par har aldrig været i gruppe sammen. Prøv flere runder.`,
    maxMeet: m => `To børn er højst i gruppe sammen ${m} gang${m === 1 ? '' : 'e'}.`,
    hosts: (lo, hi) => (lo === hi ? `Hvert barn er vært ${lo} gang${lo === 1 ? '' : 'e'}.` : `Hvert barn er vært ${lo} eller ${hi} gange.`),
    hostOnce: r => `Planen skal have ${r} runder, hvis hvert barn skal være vært præcis én gang.`,
    alone: a => `${a} gange er et barn alene om sin kategori i en gruppe.`,
    lonely: c => `Kategorien "${c}" har kun ét barn, så reglen kan ikke overholdes.`,
    tooFew: 'Skriv mindst to navne.',
    dupes: d => `Navnene skal være forskellige: ${d}.`,
    csvHead: ['Runde', 'Gruppe', 'Vært', 'Børn'],
  },
  en: {
    title: 'Play groups',
    lead: 'Split a class into play groups over several rounds, so that everyone has been in a group with everyone, and every child hosts equally often. Everything runs in your browser.',
    names: 'Children',
    namesHint: 'One name per line. Optionally add a category after a comma, e.g. "Ida, A".',
    k: 'Children per group (approx.)',
    rounds: 'Number of rounds',
    roundsHint: 'Empty: the fewest rounds in which everyone meets.',
    catRule: 'Nobody is alone with their category in a group',
    catHint: 'Each group has either none or at least two children of each category. Children without a category don\'t count.',
    seed: 'Seed',
    make: 'Make plan',
    another: 'Another suggestion',
    computing: 'Computing…',
    csv: 'Download CSV',
    print: 'Print',
    round: 'Round',
    host: 'host',
    summary: 'Overview',
    plan: 'Plan',
    matrix: 'How many times have two children been in a group together?',
    sizes: (g, s) => `${g} groups per round of ${s} children.`,
    lower: r => `At least ${r} rounds before everyone can have met everyone.`,
    unmetOk: 'Everyone has been in a group with everyone.',
    unmet: u => `${u} pairs have never been in a group together. Try more rounds.`,
    maxMeet: m => (m === 1 ? 'Two children are in a group together at most once.' : `Two children are in a group together at most ${m} times.`),
    hosts: (lo, hi) => (lo === hi ? `Every child hosts ${lo} time${lo === 1 ? '' : 's'}.` : `Every child hosts ${lo} or ${hi} times.`),
    hostOnce: r => `For every child to host exactly once, the plan needs ${r} rounds.`,
    alone: a => `${a} times a child is alone with their category in a group.`,
    lonely: c => `The category "${c}" has only one child, so the rule can't be met.`,
    tooFew: 'Enter at least two names.',
    dupes: d => `Names must be unique: ${d}.`,
    csvHead: ['Round', 'Group', 'Host', 'Children'],
  },
};

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.hash.slice(1));
let lang = params.get('lang') || (navigator.language.startsWith('da') ? 'da' : 'en');
let last = null;

// Builds DOM nodes; names are user input, so text always goes in as text nodes.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids.flat());
  return el;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => (el.textContent = T[lang][el.dataset.t]));
  $('lang').textContent = lang === 'da' ? 'English' : 'Dansk';
  if (last) render(last);
}

function readInput() {
  const people = $('names').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(',');
    return i < 0 ? { name: l, cat: '' } : { name: l.slice(0, i).trim(), cat: l.slice(i + 1).trim() };
  });
  // Categories match case-insensitively and display as first written.
  const cats = [...new Set(people.map(p => p.cat.toLowerCase()).filter(Boolean))];
  return {
    names: people.map(p => p.name),
    catNames: cats.map(c => people.find(p => p.cat.toLowerCase() === c).cat),
    cat: $('cat').checked && cats.length ? people.map(p => cats.indexOf(p.cat.toLowerCase())) : null,
    k: Math.max(2, +$('k').value || 4),
    rounds: +$('rounds').value || 0,
    seed: Math.max(1, +$('seed').value || 1),
  };
}

function saveHash() {
  const p = new URLSearchParams({ names: $('names').value, k: $('k').value, r: $('rounds').value, c: $('cat').checked ? 1 : 0, seed: $('seed').value, lang });
  history.replaceState(null, '', '#' + p);
}

function run() {
  const input = readInput();
  saveHash();
  const dupes = input.names.filter((x, i) => input.names.indexOf(x) !== i);
  if (input.names.length < 2 || dupes.length) {
    $('out').replaceChildren(h('p', { class: 'warn' }, input.names.length < 2 ? T[lang].tooFew : T[lang].dupes([...new Set(dupes)].join(', '))));
    return;
  }
  const btns = document.querySelectorAll('button');
  btns.forEach(b => (b.disabled = true));
  $('out').replaceChildren(h('p', {}, T[lang].computing));
  const worker = new Worker('worker.js', { type: 'module' });
  worker.onmessage = ({ data: plan }) => {
    worker.terminate();
    btns.forEach(b => (b.disabled = false));
    last = { ...input, plan };
    render(last);
  };
  worker.postMessage({ n: input.names.length, k: input.k, rounds: input.rounds, cat: input.cat, seed: input.seed });
}

function render({ names, catNames, cat, k, plan }) {
  const t = T[lang], n = names.length;
  const s = evaluate(plan, n, cat);
  const b = bounds(n, k, cat);
  const lo = Math.min(...s.hosts), hi = Math.max(...s.hosts);
  const sizes = [...new Set(b.sizes)].sort((x, y) => x - y).join(lang === 'da' ? ' eller ' : ' or ');
  const facts = [
    [t.sizes(b.sizes.length, sizes)],
    [t.lower(b.coverRounds)],
    s.unmet ? [t.unmet(s.unmet), 'warn'] : [t.unmetOk],
    [t.maxMeet(s.maxMeet)],
    [t.hosts(lo, hi), lo === 0 ? 'warn' : ''],
    Number.isInteger(b.hostRounds) && b.hostRounds !== plan.length ? [t.hostOnce(b.hostRounds)] : null,
    s.alone ? [t.alone(s.alone), 'warn'] : null,
    ...b.lonely.map(c => [t.lonely(catNames[c]), 'warn']),
  ].filter(Boolean);

  const label = i => (cat && cat[i] >= 0 ? `${names[i]} (${catNames[cat[i]]})` : names[i]);
  const rounds = plan.map((round, r) => h('section', { class: 'round' },
    h('h3', {}, `${t.round} ${r + 1}`),
    h('ol', {}, round.map(g => h('li', {},
      h('span', { class: 'host' }, `${label(g.host)} (${t.host})`),
      g.members.slice(1).map(i => ', ' + label(i)))))));

  const matrix = h('table', {},
    h('tr', {}, h('th', {}), names.map((_, j) => h('th', { scope: 'col', title: names[j] }, String(j + 1)))),
    names.map((name, i) => h('tr', {},
      h('th', { scope: 'row' }, `${i + 1}. ${name}`),
      names.map((_, j) => i === j ? h('td', {}) : h('td', { class: 'c' + Math.min(3, s.meet[i][j]), title: `${names[i]} – ${names[j]}` }, String(s.meet[i][j]))))));

  $('out').replaceChildren(
    h('h2', {}, t.summary),
    h('div', { class: 'summary' }, h('ul', {}, facts.map(([text, cls]) => h('li', cls ? { class: cls } : {}, text)))),
    h('div', { class: 'buttons no-print', style: 'margin-top:1rem' },
      Object.assign(h('button', { type: 'button' }, t.csv), { onclick: () => downloadCsv(names, plan) }),
      Object.assign(h('button', { type: 'button' }, t.print), { onclick: () => print() })),
    h('h2', {}, t.plan),
    h('div', { class: 'rounds' }, rounds),
    h('h2', {}, t.matrix),
    h('div', { class: 'matrix' }, matrix));
}

function downloadCsv(names, plan) {
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [T[lang].csvHead];
  plan.forEach((round, r) => round.forEach((g, i) =>
    rows.push([r + 1, i + 1, names[g.host], g.members.map(m => names[m]).join('; ')])));
  const blob = new Blob([rows.map(row => row.map(q).join(',')).join('\n')], { type: 'text/csv' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'legegrupper.csv' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('form').onsubmit = e => { e.preventDefault(); run(); };
$('reseed').onclick = () => { $('seed').value = Math.floor(Math.random() * 1e6) + 1; run(); };
$('lang').onclick = () => { lang = lang === 'da' ? 'en' : 'da'; applyLang(); saveHash(); };

$('names').value = params.get('names') || '';
if (params.has('k')) $('k').value = params.get('k');
if (params.has('r')) $('rounds').value = params.get('r');
if (params.has('seed')) $('seed').value = params.get('seed');
$('cat').checked = params.get('c') === '1';
applyLang();
if ($('names').value.trim()) run();
