// UI for the play group planner. Loaded as a classic script after solver.js, so it also works from file://.
(() => {
const { bounds, evaluate, solve, solveMinRounds, scoreBound } = globalThis.Solver;

const T = {
  da: {
    title: 'Legegrupper',
    lead: 'Lav en plan for klassens legegrupper, så alle børn kommer i gruppe med alle de andre, og hvert barn er vært på skift.',
    guideTitle: 'Sådan gør du',
    g1t: 'Skriv klassen ind', g1: 'Skriv ét navn per linje, eller prøv med en eksempel-klasse.',
    g2t: 'Vælg gruppestørrelse', g2: 'Hvis antallet ikke går op, får nogle grupper et barn mere.',
    g3t: 'Lav planen', g3: 'Værktøjet finder det mindste antal runder, hvor alle har været i gruppe med alle. En runde kan fx være en måned.',
    g4t: 'Del eller udskriv', g4: 'Adressen i browseren gemmer planen, så du kan sende den som et link.',
    names: 'Klassen',
    namesPlaceholder: 'Ida\nNoah\nFreja\nOscar',
    namesHint: 'Skriv ét navn per linje. Vil du bruge kategorireglen, så skriv kategorien efter et komma, fx "Ida, A".',
    example: 'Prøv med en eksempel-klasse',
    count: n => (n === 1 ? '1 barn' : `${n} børn`),
    k: 'Børn per gruppe',
    kHint: 'Nogle grupper kan få et barn mere.',
    rounds: 'Antal runder',
    auto: 'Automatisk',
    roundsHint: 'Lad feltet stå tomt for at få det mindste antal runder, hvor alle mødes.',
    catTitle: 'Kategorier',
    catRule: 'Ingen er alene om sin kategori i en gruppe',
    catHint: 'Hver gruppe har enten ingen eller mindst to børn fra hver kategori. Børn uden kategori tæller ikke med.',
    seedTitle: 'Avanceret: seed',
    seed: 'Seed',
    seedHint: 'Det samme seed giver den samme plan.',
    make: 'Lav plan',
    another: 'Lav et nyt forslag',
    thorough: 'Søg grundigere',
    share: 'Del planen',
    shareTitle: 'Link til planen',
    shareHint: 'Linket viser kun planen, uden redigering. Navnene står kodet i linket, så de ikke kan læses direkte. Det er ikke kryptering: alle med linket kan se planen.',
    copy: 'Kopiér link',
    copied: 'Linket er kopieret.',
    openShare: 'Åbn delingsvisningen',
    labelPlaceholder: 'Tilføj dato eller måned',
    labelAria: r => `Etiket for runde ${r}`,
    ownPlan: 'Lav din egen plan',
    badLink: 'Linket er ugyldigt eller ufuldstændigt. Bed om et nyt link.',
    mathTitle: 'Hvordan virker matematikken?',
    figTitle: '9 børn i grupper af 3 over 4 runder',
    computingLong: 'Søger grundigt. Det kan tage op til et minut …',
    scoreLabel: 'strafpoint',
    scoreText: b => `Lavere er bedre. Ingen plan med det antal runder kan komme under ${b}.`,
    scoreBest: 'Bedre kan det ikke blive med det antal runder.',
    scoreHow: 'Hvert par, der aldrig mødes, giver 10 point. Et par, der mødes 2 gange, giver 1 point, 3 gange giver 8 point og 4 gange giver 27 point.',
    plan: 'Planen',
    empty: 'Planen kommer til at stå her, når du har skrevet klassen ind.',
    privacy: 'Alt beregnes i din browser: navnene bliver ikke sendt nogen steder.\nAI er ikke involveret i beregningen – kun matematik.',
    computing: 'Laver planen …',
    csv: 'Hent som CSV',
    print: 'Udskriv',
    round: 'Runde',
    host: 'vært',
    followHint: 'Huset markerer værten. Klik på et barn for at se barnets grupper i alle runder.',
    following: (name, hostRounds, met, total) =>
      `${name} ${hostRounds.length ? `er vært i runde ${list(hostRounds, 'og')}` : 'er ikke vært'} og har været i gruppe med ${met === total ? 'alle andre' : `${met} af ${total} andre`}.`,
    hostsTitle: 'Vis hvor mange gange hvert barn er vært',
    hostsCols: ['Barn', 'Vært', 'Runder'],
    matrix: 'Vis hvor mange gange to børn har været i gruppe sammen',
    legend: ['aldrig', '1 gang', '2 gange', '3 eller flere'],
    sizes: (r, g, s) => `${r} runder med ${g} grupper på ${s} børn.`,
    lower: r => `Ingen plan kan nå rundt til alle på færre end ${r} runder.`,
    unmetOk: 'Alle har været i gruppe med alle.',
    unmet: u => `${u} par har aldrig været i gruppe sammen. Prøv med flere runder.`,
    maxMeet: m => (m === 1 ? 'To børn er højst i gruppe sammen én gang.' : `To børn er højst i gruppe sammen ${m} gange.`),
    hosts: (lo, hi) => (lo === hi ? `Hvert barn er vært ${lo === 1 ? 'én gang' : `${lo} gange`}.` : `Hvert barn er vært ${lo} eller ${hi} gange.`),
    hostOnce: r => `Planen skal have ${r} runder, hvis hvert barn skal være vært præcis én gang.`,
    alone: a => `${a} gange er et barn alene om sin kategori i en gruppe.`,
    lonely: c => `Kategorien "${c}" har kun ét barn, så kategorireglen kan ikke overholdes.`,
    tooFew: 'Skriv mindst to navne.',
    dupes: d => `To børn har samme navn: ${d}. Tilføj fx et efternavnsbogstav.`,
    or: 'eller',
    csvHead: ['Runde', 'Gruppe', 'Vært', 'Børn'],
    csvFile: 'legegrupper.csv',
  },
  en: {
    title: 'Play groups',
    lead: 'Make a plan for your class\'s play groups, so every child is in a group with every other child, and the children take turns hosting.',
    guideTitle: 'How it works',
    g1t: 'Enter the class', g1: 'Enter one name per line, or try an example class.',
    g2t: 'Choose a group size', g2: 'If the class doesn\'t divide evenly, some groups get one more child.',
    g3t: 'Make the plan', g3: 'The tool finds the fewest rounds in which everyone has been in a group with everyone. A round can be a month, for example.',
    g4t: 'Share or print', g4: 'The address in your browser stores the plan, so you can send it as a link.',
    names: 'The class',
    namesPlaceholder: 'Ida\nNoah\nFreja\nOscar',
    namesHint: 'Enter one name per line. To use the category rule, add the category after a comma, e.g. "Ida, A".',
    example: 'Try an example class',
    count: n => (n === 1 ? '1 child' : `${n} children`),
    k: 'Children per group',
    kHint: 'Some groups may get one more child.',
    rounds: 'Number of rounds',
    auto: 'Automatic',
    roundsHint: 'Leave empty to get the fewest rounds in which everyone meets.',
    catTitle: 'Categories',
    catRule: 'Nobody is alone with their category in a group',
    catHint: 'Each group has either none or at least two children of each category. Children without a category don\'t count.',
    seedTitle: 'Advanced: seed',
    seed: 'Seed',
    seedHint: 'The same seed gives the same plan.',
    make: 'Make plan',
    another: 'Make another suggestion',
    thorough: 'Search more thoroughly',
    share: 'Share the plan',
    shareTitle: 'Link to the plan',
    shareHint: 'The link shows only the plan, without editing. The names are encoded in the link, so they can\'t be read directly. This is not encryption: anyone with the link can see the plan.',
    copy: 'Copy link',
    copied: 'The link is copied.',
    openShare: 'Open the shared view',
    labelPlaceholder: 'Add a date or month',
    labelAria: r => `Label for round ${r}`,
    ownPlan: 'Make your own plan',
    badLink: 'The link is invalid or incomplete. Ask for a new link.',
    mathTitle: 'How does the mathematics work?',
    figTitle: '9 children in groups of 3 over 4 rounds',
    computingLong: 'Searching thoroughly. This can take up to a minute …',
    scoreLabel: 'penalty points',
    scoreText: b => `Lower is better. No plan with this number of rounds can get below ${b}.`,
    scoreBest: 'No plan with this number of rounds can do better.',
    scoreHow: 'Each pair that never meets gives 10 points. A pair that meets twice gives 1 point, 3 times gives 8 points, and 4 times gives 27 points.',
    plan: 'The plan',
    empty: 'The plan appears here once you have entered the class.',
    privacy: 'Everything is computed in your browser: the names are not sent anywhere.\nNo AI is involved in the computation – only mathematics.',
    computing: 'Making the plan …',
    csv: 'Download as CSV',
    print: 'Print',
    round: 'Round',
    host: 'host',
    followHint: 'The house marks the host. Click a child to see their groups in every round.',
    following: (name, hostRounds, met, total) =>
      `${name} ${hostRounds.length ? `hosts in round${hostRounds.length > 1 ? 's' : ''} ${list(hostRounds, 'and')}` : 'never hosts'} and has been in a group with ${met === total ? 'everyone else' : `${met} of ${total} others`}.`,
    hostsTitle: 'Show how many times each child hosts',
    hostsCols: ['Child', 'Hosts', 'Rounds'],
    matrix: 'Show how many times two children have been in a group together',
    legend: ['never', 'once', 'twice', '3 or more'],
    sizes: (r, g, s) => `${r} rounds with ${g} groups of ${s} children.`,
    lower: r => `No plan can reach everyone in fewer than ${r} rounds.`,
    unmetOk: 'Everyone has been in a group with everyone.',
    unmet: u => `${u} pairs have never been in a group together. Try more rounds.`,
    maxMeet: m => (m === 1 ? 'Two children are in a group together at most once.' : `Two children are in a group together at most ${m} times.`),
    hosts: (lo, hi) => (lo === hi ? `Every child hosts ${lo === 1 ? 'once' : `${lo} times`}.` : `Every child hosts ${lo} or ${hi} times.`),
    hostOnce: r => `For every child to host exactly once, the plan needs ${r} rounds.`,
    alone: a => `${a} times a child is alone with their category in a group.`,
    lonely: c => `The category "${c}" has only one child, so the category rule can't be met.`,
    tooFew: 'Enter at least two names.',
    dupes: d => `Two children have the same name: ${d}. Add an initial, for example.`,
    or: 'or',
    csvHead: ['Round', 'Group', 'Host', 'Children'],
    csvFile: 'play-groups.csv',
  },
};

const EXAMPLE = ['Ida', 'Noah', 'Freja', 'Oscar', 'Alma', 'William', 'Ella', 'Carl', 'Karla', 'Emil', 'Clara', 'Valdemar',
  'Lucas', 'Alfred', 'Aksel', 'Malthe', 'Viggo', 'Arthur', 'Felix', 'Theo', 'Elias', 'Magnus', 'Asta', 'Storm'];
const HOUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 1 7.4V15h5v-4.5h4V15h5V7.4z"/></svg>';

const $ = id => document.getElementById(id);
// Joins [2, 6, 10] as "2, 6 og 10".
const list = (xs, and) => (xs.length < 2 ? String(xs[0]) : `${xs.slice(0, -1).join(', ')} ${and} ${xs.at(-1)}`);
const params = new URLSearchParams(location.hash.slice(1));
let lang = params.get('lang') === 'en' ? 'en' : 'da';
let last = null;
let followed = -1;
let view = false;
let shareOpen = false;

// The URL hash holds the state as deflate-compressed JSON in base64url, so names can't be read directly.
async function pack(obj) {
  const stream = new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function unpack(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}

// A plan travels as rounds of groups, each group a list of child indices with the host first.
const packPlan = plan => plan.map(round => round.map(g => g.members));
function unpackPlan(p, n) {
  const ok = Array.isArray(p) && p.every(round => Array.isArray(round) && round.every(g =>
    Array.isArray(g) && g.length && g.every(i => Number.isInteger(i) && i >= 0 && i < n)));
  return ok ? p.map(round => round.map(m => ({ host: m[0], members: m }))) : null;
}

async function shareUrl() {
  const v = await pack({ n: last.names, p: packPlan(last.plan), l: last.labels.slice(0, last.plan.length) });
  return `${location.href.split('#')[0]}#${new URLSearchParams({ v, lang })}`;
}

// Builds DOM nodes. Names are user input, so text always goes in as text nodes.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...kids.flat());
  return el;
}

function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => (el.textContent = t[el.dataset.t]));
  document.querySelectorAll('[data-tp]').forEach(el => (el.placeholder = t[el.dataset.tp]));
  document.querySelectorAll('[data-lang]').forEach(el => (el.hidden = el.dataset.lang !== lang));
  $('lang').textContent = lang === 'da' ? 'English' : 'Dansk';
  $('lang').lang = lang === 'da' ? 'en' : 'da';
  updateCount();
  if (last) render();
}

function parseNames() {
  return $('names').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(',');
    return i < 0 ? { name: l, cat: '' } : { name: l.slice(0, i).trim(), cat: l.slice(i + 1).trim() };
  });
}

function updateCount() {
  const n = parseNames().length;
  $('count').textContent = n ? T[lang].count(n) : '';
}

function readInput() {
  const people = parseNames();
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

async function saveHash() {
  let key = 'e', state;
  if (view) {
    key = 'v';
    state = { n: last.names, p: packPlan(last.plan), l: last.labels };
  } else {
    state = { t: $('names').value, k: $('k').value, r: $('rounds').value, c: $('cat').checked ? 1 : 0, s: $('seed').value };
    if (last) Object.assign(state, { p: packPlan(last.plan), l: last.labels.slice(0, last.plan.length) });
  }
  history.replaceState(null, '', '#' + new URLSearchParams({ [key]: await pack(state), lang }));
  if (shareOpen && $('share-url')) $('share-url').value = await shareUrl();
}

// Runs the solver in a worker. Browsers refuse workers on file://, so then it runs on the page.
function compute(msg, done) {
  const local = () => setTimeout(() => done(msg.rounds ? solve(msg) : solveMinRounds(msg)), 30);
  let worker;
  try { worker = new Worker('worker.js'); } catch { return local(); }
  worker.onmessage = ({ data }) => { worker.terminate(); done(data); };
  worker.onerror = e => { e.preventDefault(); worker.terminate(); local(); };
  worker.postMessage(msg);
}

// Thorough search runs eight times as many annealing steps.
function run(thorough = false) {
  const t = T[lang];
  const input = readInput();
  const dupes = [...new Set(input.names.filter((x, i) => input.names.indexOf(x) !== i))];
  if (input.names.length < 2 || dupes.length) {
    $('out').replaceChildren(h('p', { class: 'empty error' }, input.names.length < 2 ? t.tooFew : t.dupes(dupes.join(', '))));
    return;
  }
  const btns = document.querySelectorAll('.actions button');
  btns.forEach(b => (b.disabled = true));
  $('out').replaceChildren(h('p', { class: 'empty' }, thorough ? t.computingLong : t.computing));
  const msg = { n: input.names.length, k: input.k, rounds: input.rounds, cat: input.cat, seed: input.seed };
  if (thorough) Object.assign(msg, { iterations: 4000000, restarts: 2 });
  compute(msg, plan => {
    btns.forEach(b => (b.disabled = false));
    last = { ...input, plan, labels: last?.labels || [] };
    followed = -1;
    render();
    saveHash();
    $('results-title').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}

const dotColor = i => `hsl(${(i * 137.508) % 360} 62% 52%)`;

function render() {
  const { names, catNames, cat, k, plan, labels } = last;
  const t = T[lang], n = names.length;
  const s = evaluate(plan, n, cat);
  const b = view ? null : bounds(n, k, cat);
  const lo = Math.min(...s.hosts), hi = Math.max(...s.hosts);
  const sizes = view ? '' : [...new Set(b.sizes)].sort((x, y) => x - y).join(` ${t.or} `);
  const facts = view ? [] : [
    [t.sizes(plan.length, b.sizes.length, sizes), 'info'],
    s.unmet ? [t.unmet(s.unmet), 'warn'] : [t.unmetOk, 'ok'],
    [t.maxMeet(s.maxMeet), 'ok'],
    [t.hosts(lo, hi), lo === 0 ? 'warn' : 'ok'],
    s.alone ? [t.alone(s.alone), 'warn'] : null,
    ...b.lonely.map(c => [t.lonely(catNames[c]), 'warn']),
    [t.lower(b.coverRounds), 'info'],
    Number.isInteger(b.hostRounds) && b.hostRounds !== plan.length ? [t.hostOnce(b.hostRounds), 'info'] : null,
  ].filter(Boolean);

  const chip = (i, isHost) => {
    const el = h('button', { type: 'button', class: 'chip' + (isHost ? ' host' : '') + (i === followed ? ' hl' : ''), 'aria-pressed': String(i === followed), onclick: () => follow(i) });
    if (isHost) el.insertAdjacentHTML('beforeend', HOUSE);
    else el.append(h('span', { class: 'dot', style: `background:${dotColor(i)}` }));
    el.append(names[i]);
    if (cat && cat[i] >= 0) el.append(h('span', { class: 'cat' }, catNames[cat[i]]));
    if (isHost) el.append(h('span', { class: 'sr-only' }, `(${t.host})`));
    return el;
  };

  const roundTitle = r => {
    if (!view) {
      return [h('h3', {}, `${t.round} ${r + 1}`),
        h('input', { type: 'text', class: 'round-label', value: labels[r] || '', placeholder: t.labelPlaceholder, 'aria-label': t.labelAria(r + 1), maxlength: '60',
          oninput: e => { labels[r] = e.target.value; saveHash(); } })];
    }
    return labels[r]
      ? [h('p', { class: 'round-no' }, `${t.round} ${r + 1}`), h('h3', {}, labels[r])]
      : [h('h3', {}, `${t.round} ${r + 1}`)];
  };
  const rounds = plan.map((round, r) => h('section', { class: 'round', 'aria-label': labels[r] ? `${t.round} ${r + 1}: ${labels[r]}` : `${t.round} ${r + 1}` },
    roundTitle(r),
    round.map(g => h('div', { class: 'group' + (g.members.includes(followed) ? ' has-hl' : '') },
      h('div', { class: 'chips' }, g.members.map((i, j) => chip(i, j === 0)))))));

  const hostRounds = names.map((_, i) => plan.flatMap((round, r) => (round.some(g => g.host === i) ? [r + 1] : [])));
  let followText = t.followHint;
  if (followed >= 0) {
    const met = s.meet[followed].filter((c, j) => j !== followed && c > 0).length;
    followText = t.following(names[followed], hostRounds[followed], met, n - 1);
  }

  const matrix = h('table', {},
    h('tr', {}, h('th', {}), names.map((_, j) => h('th', { scope: 'col', title: names[j] }, String(j + 1)))),
    names.map((name, i) => h('tr', i === followed ? { class: 'hl' } : {},
      h('th', { scope: 'row' }, `${i + 1}. ${name}`),
      names.map((_, j) => (i === j ? h('td', {}) : h('td', { class: 'c' + Math.min(3, s.meet[i][j]), title: `${names[i]} – ${names[j]}` }, String(s.meet[i][j])))))));
  const hostTable = h('table', {},
    h('tr', {}, t.hostsCols.map(c => h('th', { scope: 'col' }, c))),
    names.map((name, i) => h('tr', i === followed ? { class: 'hl' } : {},
      h('th', { scope: 'row' }, h('button', { type: 'button', class: 'link', 'aria-pressed': String(i === followed), onclick: () => follow(i) }, name)),
      h('td', {}, String(hostRounds[i].length)),
      h('td', {}, hostRounds[i].join(', ')))));

  // Panels keep their open state when the plan re-renders.
  const open = new Set([...document.querySelectorAll('#out details[open]')].map(d => d.dataset.key));
  const panel = (key, title, ...body) => h('details', { class: `panel ${key}`, 'data-key': key, ...(open.has(key) ? { open: '' } : {}) }, h('summary', {}, title), ...body);

  const quality = () => {
    const bound = scoreBound(n, k, plan.length);
    return [
      h('div', { class: 'score' },
        h('p', { class: 'score-num' }, String(s.score), h('span', {}, t.scoreLabel)),
        h('div', {},
          h('p', { class: 'score-text' }, s.score <= bound ? t.scoreBest : t.scoreText(bound)),
          h('p', { class: 'hint' }, t.scoreHow))),
      h('ul', { class: 'facts' }, facts.map(([text, cls]) => h('li', { class: cls }, text)))];
  };
  const shareBox = () => h('div', { class: 'share' },
    h('label', { for: 'share-url' }, t.shareTitle),
    h('div', { class: 'share-row' },
      h('input', { id: 'share-url', type: 'text', readonly: '', onfocus: e => e.target.select() }),
      h('button', { type: 'button', class: 'btn primary', onclick: copyShare }, t.copy)),
    h('p', { class: 'hint', id: 'share-status', 'aria-live': 'polite' }, t.shareHint),
    h('a', { id: 'share-open', target: '_blank', rel: 'noopener' }, t.openShare));

  $('out').replaceChildren(
    ...(view ? [] : quality()),
    h('div', { class: 'toolbar' },
      h('p', { class: 'follow', id: 'follow' }, followText),
      h('div', { class: 'buttons' },
        view ? '' : h('button', { type: 'button', class: 'btn primary', 'aria-expanded': String(shareOpen), onclick: toggleShare }, t.share),
        h('button', { type: 'button', class: 'btn', onclick: () => downloadCsv() }, t.csv),
        h('button', { type: 'button', class: 'btn', onclick: () => print() }, t.print))),
    shareOpen && !view ? shareBox() : '',
    h('div', { class: 'rounds' + (followed >= 0 ? ' following' : '') }, rounds),
    panel('hosts', t.hostsTitle, h('div', { class: 'table-wrap' }, hostTable)),
    view ? '' : panel('matrix', t.matrix,
      h('div', { class: 'table-wrap' }, matrix),
      h('div', { class: 'legend' }, t.legend.map((l, i) => h('span', { class: 'l' + i }, l)))),
    view ? h('p', { class: 'own-plan' }, h('a', { href: location.href.split('#')[0] }, t.ownPlan)) : '');
  if (shareOpen && !view) fillShare();
}

async function fillShare() {
  const url = await shareUrl();
  $('share-url').value = url;
  $('share-open').href = url;
}

function toggleShare() {
  shareOpen = !shareOpen;
  render();
}

async function copyShare() {
  try {
    await navigator.clipboard.writeText($('share-url').value);
    $('share-status').textContent = T[lang].copied;
  } catch {
    $('share-url').focus();
  }
}

function follow(i) {
  followed = followed === i ? -1 : i;
  const y = scrollY;
  render();
  scrollTo(0, y);
}

function downloadCsv() {
  const { names, plan } = last;
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [T[lang].csvHead];
  plan.forEach((round, r) => round.forEach((g, i) =>
    rows.push([last.labels[r] ? `${r + 1} – ${last.labels[r]}` : r + 1, i + 1, names[g.host], g.members.map(m => names[m]).join('; ')])));
  const blob = new Blob(['﻿' + rows.map(row => row.map(q).join(',')).join('\r\n')], { type: 'text/csv' });
  const a = h('a', { href: URL.createObjectURL(blob), download: T[lang].csvFile });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$('form').onsubmit = e => { e.preventDefault(); run(); };
$('reseed').onclick = () => { $('seed').value = Math.floor(Math.random() * 1e6) + 1; run(); };
$('thorough').onclick = () => run(true);
$('lang').onclick = () => { lang = lang === 'da' ? 'en' : 'da'; applyLang(); saveHash(); };
$('names').oninput = updateCount;
// Pointing at a round in the figure legend shows that round alone; a click keeps it shown.
let pinned = '';
const showRound = r => {
  if (r) $('design').dataset.show = r;
  else delete $('design').dataset.show;
};
document.querySelectorAll('.fig-legend button').forEach(btn => {
  const r = btn.dataset.r;
  btn.onmouseenter = btn.onfocus = () => showRound(r);
  btn.onmouseleave = btn.onblur = () => showRound(pinned);
  btn.onclick = () => {
    pinned = pinned === r ? '' : r;
    document.querySelectorAll('.fig-legend button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.r === pinned)));
    showRound(pinned || r);
  };
});
$('example').onclick = () => { $('names').value = EXAMPLE.join('\n'); updateCount(); run(); };

async function load() {
  applyLang();
  try {
    if (params.has('v')) {
      const d = await unpack(params.get('v'));
      const plan = Array.isArray(d.n) && d.n.every(x => typeof x === 'string') && unpackPlan(d.p, d.n.length);
      if (!plan) throw new Error('bad plan');
      view = true;
      document.body.classList.add('view');
      last = { names: d.n, catNames: [], cat: null, k: 0, plan, labels: Array.isArray(d.l) ? d.l.map(String) : [] };
      render();
    } else if (params.has('e')) {
      const d = await unpack(params.get('e'));
      $('names').value = String(d.t ?? '');
      $('k').value = d.k ?? 4;
      $('rounds').value = d.r ?? '';
      $('seed').value = d.s ?? 1;
      $('cat').checked = d.c === 1;
      updateCount();
      const input = readInput();
      const plan = d.p && unpackPlan(d.p, input.names.length);
      if (plan) {
        last = { ...input, plan, labels: Array.isArray(d.l) ? d.l.map(String) : [] };
        render();
      } else if (input.names.length) {
        run();
      }
    }
  } catch {
    $('out').replaceChildren(h('p', { class: 'empty error' }, T[lang].badLink));
  }
}
load();
})();
