// Leonida Trophy Guide — tracker for the 55 official GTA VI trophies.
// Data lives in data/trophies.json (official names, descriptions, grades,
// plus guides in our own words with sources). Progress is saved in
// localStorage and can be exported to a file and imported back. Everything
// runs offline: the app fetches only its own data file and reaches for no
// network at all.
const KEY = 'leonida-trophy-guide-v1';
const listEl = document.getElementById('list');
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

// ---- state ---------------------------------------------------------------
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { saved = {}; }
const earned = new Set(Array.isArray(saved.earned) ? saved.earned : []);
let spoilerOn = saved.spoilers !== false;
if (params.get('spoiler') === 'on') spoilerOn = true;
if (params.get('spoiler') === 'off') spoilerOn = false;
if (params.get('demo') === '1') {
  // Demo ticks for screenshots only: shown, never persisted.
  [2, 3, 4, 8, 16, 21, 28].forEach((id) => earned.add(id));
}
const openId = Number(params.get('open') || 0);
const gradeRank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], spoilers: spoilerOn }));
}

// ---- helpers ---------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const gradeLabel = (g) => g[0].toUpperCase() + g.slice(1);
const isStory = (t) => t.kind === 'story';
const isHiddenStory = (t) => isStory(t) && t.hidden && spoilerOn && !earned.has(t.id);

function fmtCount(t) {
  if (t.count == null) return null;
  if (t.name === 'Dime on the Dollar') return 'Target: $250,000';
  if (t.name === 'Treat Yo Self') return 'Target: $100,000';
  return `Target: ${t.count}`;
}

function tag(text, cls) {
  const s = document.createElement('span');
  s.className = 'tag' + (cls ? ' ' + cls : '');
  s.textContent = text;
  return s;
}

// ---- card ------------------------------------------------------------------
function card(t) {
  const el = document.createElement('article');
  el.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  el.dataset.id = String(t.id);
  const top = document.createElement('div');
  top.className = 'card-top';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    persist();
    render();
  });
  top.append(box);
  const body = document.createElement('div');
  body.className = 'card-body';
  const name = document.createElement('h3');
  name.className = 'card-name';
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${t.grade}`;
  badge.textContent = gradeLabel(t.grade);
  if (isHiddenStory(t)) {
    name.textContent = 'Hidden story trophy';
    name.append(badge);
    const tags = document.createElement('div');
    tags.append(tag('Story', 'story'), tag('Hidden', 'hidden-t'));
    body.append(name, tags);
    const cover = document.createElement('p');
    cover.className = 'spoiler-cover';
    cover.textContent = 'Spoilers hidden — earn this trophy (or switch the spoiler setting off) to reveal its name, description and guide.';
    body.append(cover);
  } else {
    name.textContent = t.name;
    name.append(badge);
    body.append(name);
    const tags = document.createElement('div');
    tags.append(tag(t.kind === 'story' ? 'Story' : t.kind === 'collectible' ? 'Collectible' : 'Activity', t.kind === 'story' ? 'story' : ''));
    if (t.hidden) tags.append(tag('Hidden', 'hidden-t'));
    if (t.missable) tags.append(tag('Missable', 'missable'));
    const c = fmtCount(t);
    if (c) tags.append(tag(c, 'count'));
    body.append(tags);
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = t.description;
    body.append(desc);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-toggle';
    const guide = document.createElement('div');
    guide.className = 'guide';
    guide.hidden = t.id !== openId;
    btn.textContent = guide.hidden ? 'Read the guide' : 'Hide the guide';
    btn.addEventListener('click', () => {
      guide.hidden = !guide.hidden;
      btn.textContent = guide.hidden ? 'Read the guide' : 'Hide the guide';
    });
    const gp = document.createElement('p');
    gp.textContent = t.guide;
    guide.append(gp);
    if (t.steps?.length) {
      const ol = document.createElement('ol');
      for (const s of t.steps) {
        const li = document.createElement('li');
        li.textContent = s;
        ol.append(li);
      }
      guide.append(ol);
    }
    if (t.missable_note) {
      const mn = document.createElement('p');
      mn.className = 'missable-note';
      mn.textContent = 'Missable: ' + t.missable_note;
      guide.append(mn);
    }
    const src = document.createElement('p');
    src.className = 'guide-sources';
    src.textContent = 'Sources: ';
    const fullSources = doc.sources ?? [];
    t.sources.forEach((s, i) => {
      if (i) src.append(document.createTextNode(' · '));
      const site = String(s).split(' — ')[0];
      const hit = fullSources.find((x) => x.name.startsWith(site));
      const a = document.createElement('a');
      a.href = hit ? hit.url : '#';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = String(s);
      src.append(a);
    });
    guide.append(src);
    body.append(btn, guide);
  }
  top.append(body);
  el.append(top);
  return el;
}

// ---- filtering ---------------------------------------------------------------
function visible(t) {
  const q = $('search').value.trim().toLowerCase();
  if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
  const kind = $('kind').value;
  if (kind === 'missable' && !t.missable) return false;
  if (kind === 'online') return false; // the game lists no online trophies
  if (kind !== 'all' && kind !== 'missable' && kind !== 'online' && t.kind !== kind) return false;
  const grade = $('grade').value;
  if (grade !== 'all' && t.grade !== grade) return false;
  const status = $('status').value;
  if (status === 'earned' && !earned.has(t.id)) return false;
  if (status === 'todo' && earned.has(t.id)) return false;
  return true;
}

function render() {
  const shown = trophies.filter(visible);
  const sort = $('sort').value;
  if (sort === 'grade') shown.sort((a, b) => gradeRank[a.grade] - gradeRank[b.grade] || a.id - b.id);
  if (sort === 'name') shown.sort((a, b) => a.name.localeCompare(b.name));
  listEl.replaceChildren();
  if ($('kind').value === 'online') {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<strong>No online trophies.</strong><br>All 55 trophies unlock offline in single-player — there is nothing to do online for this Platinum.';
    listEl.append(empty);
  } else if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<strong>Nothing matches those filters.</strong><br>Try clearing the search or choosing another kind or grade.';
    listEl.append(empty);
  } else {
    for (const t of shown) listEl.append(card(t));
  }
  $('progress-text').textContent = `${earned.size} of ${trophies.length} earned`;
  $('progress-pct').textContent = `${Math.round((earned.size / trophies.length) * 100)}%`;
  $('progress-fill').style.width = `${(earned.size / trophies.length) * 100}%`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${gradeLabel(g)} ${trophies.filter((t) => t.grade === g && earned.has(t.id)).length}/${trophies.filter((t) => t.grade === g).length}`)
    .join(' · ');
  $('progress-by-grade').textContent = byGrade;
  $('filter-note').textContent = shown.length === trophies.length
    ? 'Showing all 55 trophies.'
    : `Showing ${shown.length} of ${trophies.length} trophies.`;
}

// ---- controls --------------------------------------------------------------
for (const id of ['search', 'kind', 'grade', 'status', 'sort']) {
  $(id).addEventListener('input', render);
}
$('spoilers').checked = spoilerOn;
$('spoilers').addEventListener('change', (e) => {
  spoilerOn = e.target.checked;
  persist();
  render();
});
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: doc.game, earned: [...earned], spoilers: spoilerOn }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = new Set(trophies.map((t) => t.id));
    const next = new Set((Array.isArray(data) ? data : data.earned).filter((id) => ids.has(Number(id))).map(Number));
    earned.clear();
    for (const id of next) earned.add(id);
    if (typeof data.spoilers === 'boolean') {
      spoilerOn = data.spoilers;
      $('spoilers').checked = spoilerOn;
    }
    persist();
    render();
  } catch {
    alert('That file is not a valid progress export.');
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (!earned.size) return;
  if (confirm('Clear all earned trophies?')) {
    earned.clear();
    persist();
    render();
  }
});

// ---- sources footer ----------------------------------------------------------
const srcList = $('source-list');
for (const s of doc.sources ?? []) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = s.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = s.name;
  li.append(a);
  srcList.append(li);
}

render();
if (params.get('view') === 'roadmap' || location.hash === '#roadmap') {
  document.getElementById('roadmap').scrollIntoView();
}
if (openId) {
  const el = listEl.querySelector(`[data-id="${openId}"]`);
  el?.scrollIntoView({ block: 'start' });
}
