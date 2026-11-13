/* OUTWARD: SoulCause back office. COR: Compliance, Operations and Reporting.
   Sign-in and data through Supabase (publishable key is public by design; the database
   rules decide what each role may see). OWL answers through /api/owl. */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { createAccounting } from './accounting.js';

const SUPABASE_URL = 'https://orhmsmxnfokupmtctueu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eI838082EIyT7JVnvKIllQ_v3cRZQZL';
const sb = (window.__OUTWARD_TEST_CLIENT__ || createClient)(SUPABASE_URL, SUPABASE_KEY);

const VALUES = ['Obedience', 'Unity', 'Truth', 'Wisdom', 'Abiding', 'Readiness', 'Discernment'];
const FUNCS = ['Operations', 'Updates', 'Tasks', 'Workforce', 'Accountability', 'Reporting', 'Direction'];
const DONE = ['done', 'cancelled', 'paid', 'received', 'closed', 'terminated', 'accepted', 'expired'];

const ONBOARD = ['Offer or service agreement signed', 'Background check (required for work with minors or vulnerable adults)', 'Tax forms: I-9 and W-4 (employee) or W-9 (contractor)', 'Statement of faith and code of conduct signed', 'Child and vulnerable-adult safety policy acknowledged', 'Email, FIELD and system accounts set up', 'Payroll or stipend set up', 'Orientation complete', '30-day check-in'];
const OFFBOARD = ['Final conversation held and documented', 'Final pay processed on time for your state', 'Email, FIELD and system access removed', 'Equipment, keys and files returned', 'Benefits and COBRA notice sent (if applicable)', 'Exit interview', 'Personnel file closed and retained'];

const M = {
  task: { label: 'Tasks', group: 'Operations', color: '#1F4FD8', statuses: ['open', 'in progress', 'blocked', 'done'], noun: 'task',
    fields: [['title', 'Task', 'text'], ['status', 'Status', 'status'], ['owner_email', 'Owner', 'staff'], ['due_date', 'Due', 'date'], ['d.priority', 'Priority', ['normal', 'high', 'low']], ['d.notes', 'Notes', 'area']] },
  event: { label: 'Schedule', group: 'Operations', color: '#F5C518', statuses: ['scheduled', 'done', 'cancelled'], noun: 'event',
    fields: [['title', 'Event', 'text'], ['due_date', 'Date', 'date'], ['d.time', 'Time', 'time'], ['d.location', 'Where', 'text'], ['owner_email', 'Lead', 'staff'], ['status', 'Status', 'status'], ['d.notes', 'Notes', 'area']] },
  person: { label: 'People', group: 'Compliance', color: '#F2711C', statuses: ['candidate', 'onboarding', 'active', 'offboarding', 'terminated'], noun: 'person', sensitive: true,
    fields: [['title', 'Full name', 'text'], ['d.position', 'Role or position', 'text'], ['d.type', 'Type', ['employee', 'contractor', 'volunteer']], ['status', 'Stage', 'status'], ['d.email', 'Email', 'email'], ['d.phone', 'Phone', 'tel'], ['d.start', 'Start date', 'date'], ['due_date', 'Next review or last day', 'date'], ['owner_email', 'Manager', 'staff'], ['d.checklist', 'Checklist', 'checklist'], ['d.notes', 'Notes', 'area']] },
  finance: { label: 'Finance', group: 'Reporting', color: '#1E9E5A', statuses: ['planned', 'pending', 'paid', 'received'], noun: 'finance item', sensitive: true,
    fields: [['title', 'Description', 'text'], ['d.kind', 'Kind', ['expense', 'income', 'donation', 'budget']], ['amount', 'Amount ($)', 'money'], ['due_date', 'Date', 'date'], ['d.category', 'Category', 'text'], ['status', 'Status', 'status'], ['d.notes', 'Notes', 'area']] },
  legal: { label: 'Legal', group: 'Compliance', color: '#B9A6F0', statuses: ['draft', 'active', 'renewal due', 'expired', 'closed'], noun: 'legal item', sensitive: true,
    fields: [['title', 'Name', 'text'], ['d.kind', 'Kind', ['contract', 'policy', 'filing', 'insurance', 'license']], ['d.party', 'Other party', 'text'], ['status', 'Status', 'status'], ['due_date', 'Renewal or deadline', 'date'], ['owner_email', 'Owner', 'staff'], ['d.notes', 'Notes', 'area']] },
  marketing: { label: 'Marketing', group: 'Reporting', color: '#FF9E6B', statuses: ['idea', 'planned', 'live', 'done'], noun: 'campaign',
    fields: [['title', 'Campaign', 'text'], ['d.channel', 'Channel', ['email', 'social', 'events', 'print', 'web', 'partners']], ['status', 'Status', 'status'], ['d.start', 'Start', 'date'], ['due_date', 'End', 'date'], ['amount', 'Budget ($)', 'money'], ['owner_email', 'Owner', 'staff'], ['d.goal', 'Goal', 'text'], ['d.notes', 'Notes', 'area']] },
  risk: { label: 'Risk (ERM)', group: 'Compliance', color: '#0B0B0C', statuses: ['open', 'mitigating', 'accepted', 'closed'], noun: 'risk',
    fields: [['title', 'Risk', 'text'], ['d.category', 'Category', ['safety', 'financial', 'legal', 'people', 'reputation', 'technology', 'operations']], ['d.likelihood', 'Likelihood (1-5)', [1, 2, 3, 4, 5]], ['d.impact', 'Impact (1-5)', [1, 2, 3, 4, 5]], ['status', 'Status', 'status'], ['owner_email', 'Owner', 'staff'], ['due_date', 'Next review', 'date'], ['d.mitigation', 'Mitigation plan', 'area']] }
};

const S = { me: null, staff: [], records: [], visitors: [], activity: [], view: 'command', q: '', filter: '', owl: [] };
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date(new Date().toDateString());
const dt = (s) => (s ? new Date(s + 'T00:00:00') : null);
const days = (s) => (s ? Math.round((dt(s) - today()) / 864e5) : null);
const fmtDate = (s) => (s ? dt(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const money = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));
const isAdmin = () => S.me && (S.me.role === 'owner' || S.me.role === 'admin');
const canSee = (mod) => !M[mod].sensitive || isAdmin();
const staffName = (e) => { const s = S.staff.find((x) => x.email === e); return s ? (s.name || s.email) : (e || ''); };
const recs = (mod) => S.records.filter((r) => r.module === mod);
const open = (r) => !DONE.includes(r.status);
const riskScore = (r) => (Number(r.details?.likelihood) || 0) * (Number(r.details?.impact) || 0);
const ACCT = createAccounting({ sb, esc, money, rerender: () => render(), token: async () => (await sb.auth.getSession()).data?.session?.access_token || '' });
const isAcct = (v) => Object.prototype.hasOwnProperty.call(ACCT.VIEWS, v);

/* ---------- mirrored mark ---------- */
function paintAcro() {
  const v = $('.acro-pair .values'), l = $('.acro-pair .letters'), f = $('.acro-pair .functions');
  if (!v) return;
  v.innerHTML = VALUES.map((w) => `<li>${w}</li>`).join('');
  l.innerHTML = 'OUTWARD'.split('').map((c) => `<li>${c}</li>`).join('');
  f.innerHTML = FUNCS.map((w) => `<li>${w}</li>`).join('');
}

/* ---------- auth ---------- */
async function boot() {
  paintAcro();
  const { data } = await sb.auth.getSession();
  if (data?.session) await enter(); else showSignIn();
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') showSignIn(); });
}
function showSignIn(msg) {
  $('#app').hidden = true; $('#signin').hidden = false;
  const e = $('#signin .err'); e.hidden = !msg; e.textContent = msg || '';
}
$('#signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, err = $('.err', f);
  err.hidden = true;
  const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
  if (error) { err.textContent = 'That email and password don’t match. Try again, or reset your password.'; err.hidden = false; return; }
  await enter();
});
$('#reset-link').addEventListener('click', async () => {
  const email = $('#signin-form').email.value.trim(), err = $('#signin .err');
  if (!email) { err.textContent = 'Type your email first, then tap Forgot password.'; err.hidden = false; return; }
  await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/outward/' });
  err.textContent = 'If that email belongs to SoulCause staff, a reset link is on its way.'; err.hidden = false;
});
$('#request-link').addEventListener('click', () => { $('#request-form').hidden = false; $('#request-form').elements.name.focus(); });
$('#request-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, msg = $('.err', f), email = f.elements.email.value.trim().toLowerCase(), name = f.elements.name.value.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter your name and a valid email.'; msg.hidden = false; return; }
  await sb.from('outward_staff').insert({ email, name: name.slice(0, 120), role: 'staff', active: false });
  msg.textContent = 'Request sent. The owner will review it and let you know.'; msg.hidden = false; f.reset();
});
$('#signout').addEventListener('click', async () => { await sb.auth.signOut(); showSignIn(); });

async function enter() {
  const { data: u } = await sb.auth.getUser();
  const email = (u?.user?.email || '').toLowerCase();
  const { data: staff } = await sb.from('outward_staff').select('email,name,role,active').order('name');
  S.staff = staff || [];
  S.me = S.staff.find((s) => s.email === email && s.active);
  if (!S.me) { await sb.auth.signOut(); return showSignIn('This account isn’t approved yet. Use Request access below, or ask the owner to approve you.'); }
  $('#signin').hidden = true; $('#app').hidden = false;
  $('#who').textContent = `${S.me.name || S.me.email} · ${S.me.role}`;
  await load();
  go(location.hash.slice(1) || 'command');
}
async function load() {
  const [r, a] = await Promise.all([
    sb.from('outward_records').select('*').order('due_date', { ascending: true, nullsFirst: false }),
    sb.from('outward_activity').select('*').order('at', { ascending: false }).limit(15)
  ]);
  S.records = r.data || []; S.activity = a.data || [];
  if (isAdmin()) await ACCT.load();
  if (isAdmin()) { const v = await sb.from('visitors').select('*').order('created_at', { ascending: false }).limit(200); S.visitors = v.data || []; }
}

/* ---------- alerts ---------- */
function alerts() {
  const out = [];
  S.records.forEach((r) => {
    if (!open(r)) return;
    const d = days(r.due_date), mod = M[r.module];
    const horizon = r.module === 'legal' ? 30 : 14;
    if (d != null && d < 0) out.push({ r, cls: 'overdue', t: r.title, s: `${mod.label} · overdue`, when: `${-d}d late` });
    else if (d != null && d <= horizon) out.push({ r, cls: 'soon', t: r.title, s: `${mod.label} · ${r.module === 'legal' ? 'renewal or deadline' : 'due soon'}`, when: d === 0 ? 'today' : `in ${d}d` });
    if (r.module === 'risk' && riskScore(r) >= 15) out.push({ r, cls: 'overdue', t: r.title, s: `High risk · score ${riskScore(r)} of 25`, when: 'review' });
    if (r.module === 'person' && ['onboarding', 'offboarding'].includes(r.status)) {
      const c = r.details?.checklist || [], left = c.filter((x) => !x.done).length;
      if (left) out.push({ r, cls: 'info', t: r.title, s: `${r.status === 'onboarding' ? 'Onboarding' : 'Termination'} checklist`, when: `${left} left` });
    }
  });
  const waiting = S.visitors.filter((v) => !v.followed_up_at && (v.prayer_request || v.email)).length;
  if (waiting) out.push({ visitors: true, cls: 'info', t: `${waiting} visitor${waiting > 1 ? 's' : ''} waiting for follow-up`, s: 'Prayer requests and new contacts from soulcause.com', when: 'follow up' });
  const order = { overdue: 0, soon: 1, info: 2 };
  return out.sort((a, b) => order[a.cls] - order[b.cls]);
}

/* ---------- navigation ---------- */
const NAV = [['Command', [['command', 'Command center', '#0B0B0C'], ['alerts', 'Alerts', '#F2711C']]],
  ['Operations', [['task', 'Tasks', M.task.color], ['event', 'Schedule', M.event.color]]],
  ['Compliance', [['person', 'People', M.person.color], ['legal', 'Legal', M.legal.color], ['risk', 'Risk (ERM)', '#555']]],
  ['Accounting', [['acct', 'Overview', '#1E9E5A'], ['acct-coa', 'Chart of accounts', '#1E9E5A'], ['acct-tx', 'Transactions', '#1E9E5A'], ['acct-sources', 'Bank & cards', '#1E9E5A'], ['acct-docs', 'Statements', '#1E9E5A'], ['acct-reports', 'Reports', '#1E9E5A']]],
  ['Reporting', [['marketing', 'Marketing', M.marketing.color], ['visitors', 'Visitors & prayer', '#B9A6F0'], ['finance', 'Budget items', M.finance.color]]],
  ['Admin', [['team', 'Team', '#fff']]]];
function paintNav() {
  const a = alerts();
  $('#nav').innerHTML = NAV.map(([g, items]) => {
    const vis = items.filter(([k]) => (M[k] ? canSee(k) : k === 'team' ? S.me.role === 'owner' : (k === 'visitors' || isAcct(k)) ? isAdmin() : true));
    if (!vis.length) return '';
    return `<p class="grp">${g.toUpperCase()}</p>` + vis.map(([k, label, c]) => {
      const n = k === 'alerts' ? a.length : k === 'acct-tx' ? ACCT.reviewCount() : k === 'team' ? S.staff.filter((x) => !x.active).length : M[k] ? a.filter((x) => x.r && x.r.module === k).length : 0;
      return `<button data-view="${k}" ${S.view === k ? 'aria-current="page"' : ''}><i style="background:${c}"></i>${label}${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }).join('');
  }).join('');
  const bc = $('#bell-count'); bc.hidden = !a.length; bc.textContent = a.length;
}
$('#nav').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) go(b.dataset.view); });
$('#bell').addEventListener('click', () => go('alerts'));
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== S.view && S.me) go(v); });

function go(view) {
  if (M[view] && !canSee(view)) view = 'command';
  if (view === 'team' && S.me.role !== 'owner') view = 'command';
  if ((view === 'visitors' || isAcct(view)) && !isAdmin()) view = 'command';
  if (!M[view] && !isAcct(view) && !['command', 'alerts', 'team', 'visitors'].includes(view)) view = 'command';
  S.view = view; S.q = ''; S.filter = '';
  if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view);
  render();
}
function render() {
  paintNav();
  const v = S.view, mod = M[v];
  if (isAcct(v)) {
    $('#view-kicker').textContent = 'COR \u00b7 Reporting \u00b7 Accounting';
    $('#view-title').textContent = ACCT.VIEWS[v];
    $('#add-btn').hidden = true;
    ACCT.render(v, $('#view'));
    return;
  }
  $('#view-kicker').textContent = mod ? `COR · ${mod.group}` : v === 'command' ? 'COR · Compliance · Operations · Reporting' : v === 'team' ? 'Admin' : v === 'visitors' ? 'Reporting' : 'Notifications';
  $('#view-title').textContent = mod ? mod.label : { command: 'Command center', alerts: 'Alerts', team: 'Team', visitors: 'Visitors & prayer' }[v];
  const add = $('#add-btn'); add.hidden = !(mod || v === 'team'); add.textContent = v === 'team' ? '+ Add person to team' : `+ Add ${mod ? mod.noun : ''}`;
  const el = $('#view');
  if (v === 'command') el.innerHTML = viewCommand();
  else if (v === 'alerts') el.innerHTML = viewAlerts(alerts());
  else if (v === 'team') el.innerHTML = viewTeam();
  else if (v === 'visitors') el.innerHTML = viewVisitors();
  else el.innerHTML = viewModule(v);
  window.scrollTo(0, 0);
}

/* ---------- views ---------- */
function corTile(name, mods, extra) {
  const a = alerts().filter((x) => x.r && mods.includes(x.r.module));
  const over = a.filter((x) => x.cls === 'overdue').length, soon = a.filter((x) => x.cls === 'soon').length;
  const st = over ? ['act', 'Act now'] : soon ? ['watch', 'Watch'] : ['good', 'On track'];
  const openCount = S.records.filter((r) => mods.includes(r.module) && open(r)).length;
  return `<div class="tile"><span class="mono">${name.toUpperCase()}</span><h3>${name}</h3><span class="status ${st[0]}">${st[1]}</span>
    <p class="big">${openCount}</p><p class="fine">open items · ${over} overdue · ${soon} due soon</p>${extra || ''}</div>`;
}
function viewCommand() {
  const vis = (m) => m.filter(canSee);
  const fin = recs('finance');
  const ym = new Date().toISOString().slice(0, 7);
  const inMonth = fin.filter((r) => (r.due_date || '').startsWith(ym));
  const income = inMonth.filter((r) => ['income', 'donation'].includes(r.details?.kind)).reduce((s, r) => s + Number(r.amount || 0), 0);
  const spent = inMonth.filter((r) => r.details?.kind === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
  const mo = isAdmin() && ACCT.isLoaded() ? ACCT.month() : { income, expense: spent };
  const repExtra = isAdmin() ? `<ul><li>This month in: <b>${money(mo.income)}</b></li><li>This month out: <b>${money(mo.expense)}</b></li><li>To review: <b>${ACCT.reviewCount()}</b></li><li>Live campaigns: <b>${recs('marketing').filter((r) => r.status === 'live').length}</b></li></ul>` : `<ul><li>Live campaigns: <b>${recs('marketing').filter((r) => r.status === 'live').length}</b></li></ul>`;
  const week = recs('event').filter((r) => { const d = days(r.due_date); return d != null && d >= 0 && d <= 7 && open(r); });
  const opsExtra = `<ul><li>Events this week: <b>${week.length}</b></li><li>Blocked tasks: <b>${recs('task').filter((r) => r.status === 'blocked').length}</b></li></ul>`;
  const a = alerts().slice(0, 8);
  return `<div class="cor">${corTile('Compliance', vis(['person', 'legal', 'risk']), `<ul><li>Open risks: <b>${recs('risk').filter(open).length}</b></li>${isAdmin() ? `<li>Active contracts and policies: <b>${recs('legal').filter((r) => r.status === 'active').length}</b></li>` : ''}</ul>`)}
    ${corTile('Operations', ['task', 'event'], opsExtra)}${corTile('Reporting', vis(['finance', 'marketing']), repExtra)}</div>
    <section class="sec"><h3>Needs attention</h3>${viewAlerts(a, true)}</section>
    <section class="sec"><h3>Recent activity</h3>${S.activity.length ? `<div class="table-wrap"><table><tr><th>WHEN</th><th>WHO</th><th>WHAT</th></tr>${S.activity.map((x) => `<tr><td>${esc(new Date(x.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</td><td>${esc(staffName(x.actor))}</td><td>${esc(x.action)} ${esc(M[x.module]?.noun || '')}: ${esc(x.title)}</td></tr>`).join('')}</table></div>` : '<p class="empty">Nothing yet. Add your first task, event or person to get started.</p>'}</section>`;
}
function viewAlerts(list, compact) {
  if (!list.length) return `<p class="empty">All clear. Nothing overdue or due soon.</p>`;
  return `<div class="alerts">${list.map((x) => `<button class="alert ${x.cls}" ${x.r ? `data-open="${x.r.id}"` : 'data-view-go="visitors"'}><span class="dot"></span><span><span class="t">${esc(x.t)}</span><br><span class="s">${esc(x.s)}</span></span><span class="when">${esc(x.when)}</span></button>`).join('')}</div>${compact && alerts().length > list.length ? '<button class="link" data-view-go="alerts">See all alerts</button>' : ''}`;
}
function viewModule(mod) {
  const m = M[mod];
  let list = recs(mod);
  if (S.filter) list = list.filter((r) => r.status === S.filter);
  if (S.q) { const q = S.q.toLowerCase(); list = list.filter((r) => (r.title + ' ' + JSON.stringify(r.details || {}) + ' ' + (r.owner_email || '')).toLowerCase().includes(q)); }
  const counts = m.statuses.map((s) => [s, recs(mod).filter((r) => r.status === s).length]);
  let summary = counts.map(([s, n]) => `<div class="chip"><b>${n}</b><span>${esc(s)}</span></div>`).join('');
  if (mod === 'finance') {
    const sum = (k) => recs('finance').filter((r) => r.details?.kind === k).reduce((s, r) => s + Number(r.amount || 0), 0);
    summary = `<div class="chip"><b>${money(sum('income') + sum('donation'))}</b><span>income and donations</span></div><div class="chip"><b>${money(sum('expense'))}</b><span>expenses</span></div><div class="chip"><b>${money(sum('budget'))}</b><span>budgeted</span></div><div class="chip"><b>${money(sum('income') + sum('donation') - sum('expense'))}</b><span>net</span></div>`;
  }
  let extra = '';
  if (mod === 'risk') extra = heatmap();
  const tools = `<div class="toolbar"><input type="search" placeholder="Search ${esc(m.label.toLowerCase())}" value="${esc(S.q)}" data-q aria-label="Search"><select data-filter aria-label="Filter by status"><option value="">All statuses</option>${m.statuses.map((s) => `<option ${S.filter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>`;
  let body;
  if (!list.length) body = `<p class="empty">No ${esc(m.label.toLowerCase())} yet. Tap <b>+ Add ${esc(m.noun)}</b> to create the first one.</p>`;
  else if (mod === 'event') {
    const by = {}; list.forEach((r) => { (by[r.due_date || 'No date'] = by[r.due_date || 'No date'] || []).push(r); });
    body = Object.keys(by).sort().map((d) => `<div class="day"><h4>${d === 'No date' ? 'NO DATE' : esc(dt(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })).toUpperCase()}</h4><div class="rows">${by[d].map(row).join('')}</div></div>`).join('');
  } else body = `<div class="rows">${list.map(row).join('')}</div>`;
  return `<div class="summary">${summary}</div>${extra}${tools}${body}${mod === 'person' || mod === 'legal' || mod === 'finance' ? '<p class="fine">Owner and admin only. OUTWARD helps you keep track; it isn’t legal, tax or HR advice. Confirm requirements with a qualified professional. <a href="/legal#disclosures" target="_blank" rel="noopener">Disclosures</a></p>' : ''}`;
}
function row(r) {
  const m = M[r.module], d = days(r.due_date), dd = r.details || {};
  const meta = [];
  if (r.module === 'person') { if (dd.position) meta.push(esc(dd.position)); if (dd.type) meta.push(esc(dd.type)); }
  if (r.module === 'legal') { if (dd.kind) meta.push(esc(dd.kind)); if (dd.party) meta.push(esc(dd.party)); }
  if (r.module === 'finance') { if (dd.kind) meta.push(esc(dd.kind)); if (dd.category) meta.push(esc(dd.category)); }
  if (r.module === 'marketing' && dd.channel) meta.push(esc(dd.channel));
  if (r.module === 'event') { if (dd.time) meta.push(esc(dd.time)); if (dd.location) meta.push(esc(dd.location)); }
  if (r.module === 'risk') meta.push(`score ${riskScore(r)} of 25`, esc(dd.category || ''));
  if (r.module === 'task' && dd.priority === 'high') meta.push('high priority');
  if (r.owner_email) meta.push(esc(staffName(r.owner_email)));
  if (r.due_date) meta.push((d < 0 && open(r) ? '<b style="color:#B3261E">' : '<span>') + esc(fmtDate(r.due_date)) + (d < 0 && open(r) ? ` (${-d}d late)</b>` : '</span>'));
  let right = `<span class="status ${open(r) ? (d != null && d < 0 ? 'act' : 'watch') : 'good'}">${esc(r.status)}</span>`;
  if (r.amount != null) right = `<span class="amt">${money(r.amount)}</span>` + right;
  if (r.module === 'person' && (dd.checklist || []).length) {
    const c = dd.checklist, pct = Math.round(c.filter((x) => x.done).length / c.length * 100);
    right += `<span class="prog" title="${pct}% of checklist done"><div style="width:${pct}%"></div></span>`;
  }
  return `<button class="row" data-open="${r.id}"><span class="bar" style="background:${m.color}"></span><span><span class="t">${esc(r.title)}</span><span class="m">${meta.filter(Boolean).map((x) => `<span>${x}</span>`).join('')}</span></span><span class="r">${right}</span></button>`;
}
function heatmap() {
  const cell = (l, i) => { const n = recs('risk').filter((r) => open(r) && Number(r.details?.likelihood) === l && Number(r.details?.impact) === i).length; const s = l * i; const bg = s >= 15 ? '#F2711C' : s >= 8 ? '#F5C518' : '#D9F2E4'; return `<div style="background:${bg}">${n || ''}</div>`; };
  let h = '<div class="heat" aria-label="Risk heat map: likelihood down, impact across"><div class="lab"></div>' + [1, 2, 3, 4, 5].map((i) => `<div class="lab">impact ${i}</div>`).join('');
  for (let l = 5; l >= 1; l--) h += `<div class="lab">likely ${l}</div>` + [1, 2, 3, 4, 5].map((i) => cell(l, i)).join('');
  return h + '</div>';
}
function viewTeam() {
  const pend = S.staff.filter((s) => !s.active);
  return `${pend.length ? `<section class="sec"><h3>Waiting for approval</h3><div class="rows">${pend.map((s) => `<div class="row" style="cursor:default"><span class="bar" style="background:#F2711C"></span><span><span class="t">${esc(s.name || s.email)}</span><span class="m"><span>${esc(s.email)}</span><span>asked for ${esc(s.role)} access</span></span></span><span class="r"><button class="btn dark" data-approve-staff="${esc(s.email)}">Approve</button><button class="link" data-staff="${esc(s.email)}">Edit role</button></span></div>`).join('')}</div><p class="fine">Approving gives the role shown. They also need a sign-in: Supabase \u2192 Authentication \u2192 Users \u2192 Add user with the same email.</p></section>` : ''}<div class="table-wrap"><table><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th></th></tr>${S.staff.map((s) => `<tr><td>${esc(s.name || '')}</td><td>${esc(s.email)}</td><td>${esc(s.role)}</td><td>${s.active ? 'active' : 'removed'}</td><td>${s.email === S.me.email ? '' : `<button class="link" data-staff="${esc(s.email)}">Edit</button>`}</td></tr>`).join('')}</table></div>
  <p class="fine">Adding someone here gives them a role. They also need a sign-in: in Supabase, open Authentication → Users → Add user with the same email. Owners see everything; admins see everything except this Team page; staff see Tasks, Schedule, Risk and Marketing only.</p>`;
}
function viewVisitors() {
  if (!S.visitors.length) return '<p class="empty">No visitors have shared anything yet. Prayer requests from soulcause.com will appear here.</p>';
  return `<div class="rows">${S.visitors.map((v) => `<div class="row" style="cursor:default"><span class="bar" style="background:#B9A6F0"></span><span><span class="t">${esc(v.first_name || 'Anonymous visitor')}</span><span class="m"><span>${esc(new Date(v.created_at).toLocaleDateString())}</span>${v.role ? `<span>${esc(v.role)}</span>` : ''}${v.church ? `<span>${esc(v.church)}</span>` : ''}${v.email ? `<span>${esc(v.email)}</span>` : ''}${v.country ? `<span>${esc(v.country)}</span>` : ''}</span>${v.prayer_request ? `<p style="margin-top:8px;line-height:1.5">${esc(v.prayer_request)}</p>` : ''}</span><span class="r">${v.followed_up_at ? '<span class="status good">followed up</span>' : `<button class="btn ghost" data-follow="${v.id}">Mark followed up</button>`}</span></div>`).join('')}</div>`;
}

/* ---------- view events ---------- */
$('#view').addEventListener('click', async (e) => {
  if (isAcct(S.view)) { const r = await ACCT.onClick(e); if (typeof r === 'string') return go(r); if (r) return; }
  const ap = e.target.closest('[data-approve-staff]');
  if (ap) { await sb.from('outward_staff').update({ active: true }).eq('email', ap.dataset.approveStaff); const { data } = await sb.from('outward_staff').select('email,name,role,active').order('name'); S.staff = data || []; return render(); }
  const o = e.target.closest('[data-open]'); if (o) return edit(S.records.find((r) => r.id === o.dataset.open));
  const g = e.target.closest('[data-view-go]'); if (g) return go(g.dataset.viewGo);
  const st = e.target.closest('[data-staff]'); if (st) return editStaff(S.staff.find((s) => s.email === st.dataset.staff));
  const f = e.target.closest('[data-follow]');
  if (f) { await sb.from('visitors').update({ followed_up_at: new Date().toISOString() }).eq('id', f.dataset.follow); await load(); render(); }
});
$('#view').addEventListener('input', (e) => {
  if (isAcct(S.view) && ACCT.onInput(e)) { clearTimeout(window.__acctQ); window.__acctQ = setTimeout(() => { const pos = e.target.selectionStart; render(); const i = $('[data-f="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 250); return; }
  if (e.target.matches('[data-q]')) { S.q = e.target.value; const pos = e.target.selectionStart; render(); const i = $('[data-q]'); i.focus(); i.setSelectionRange(pos, pos); }
});
$('#view').addEventListener('change', async (e) => { if (isAcct(S.view) && await ACCT.onChange(e)) return; if (e.target.matches('[data-filter]')) { S.filter = e.target.value; render(); } });
$('#add-btn').addEventListener('click', () => (S.view === 'team' ? editStaff(null) : edit(null)));

/* ---------- editor ---------- */
const dlg = $('#editor');
let editing = null;
function get(r, key) { return key.startsWith('d.') ? (r.details || {})[key.slice(2)] : r[key]; }
function field([key, label, type], r, mod) {
  const v = get(r, key) ?? '', name = `name="${key}"`;
  if (type === 'checklist') {
    const c = v || [];
    return `<div><p style="font-weight:600;font-size:14px;margin-bottom:6px">${label}</p><div class="tpl"><button type="button" class="btn ghost" data-tpl="on">Start onboarding</button><button type="button" class="btn ghost" data-tpl="off">Start termination</button></div>
      <div class="check-list" data-checklist>${c.length ? c.map((x, i) => `<label><input type="checkbox" data-ci="${i}" ${x.done ? 'checked' : ''}>${esc(x.t)}</label>`).join('') : '<p class="fine">No checklist yet. Choose onboarding or termination above.</p>'}</div>
      <p class="fine">Starter checklist. Confirm requirements for your state with an HR or legal professional.</p></div>`;
  }
  if (type === 'area') return `<label>${label}<textarea ${name} rows="3">${esc(v)}</textarea></label>`;
  if (type === 'status') return `<label>${label}<select ${name}>${M[mod].statuses.map((s) => `<option ${s === (v || M[mod].statuses[0]) ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>`;
  if (type === 'staff') return `<label>${label}<select ${name}><option value="">Unassigned</option>${S.staff.filter((s) => s.active).map((s) => `<option value="${esc(s.email)}" ${s.email === v ? 'selected' : ''}>${esc(s.name || s.email)}</option>`).join('')}</select></label>`;
  if (Array.isArray(type)) return `<label>${label}<select ${name}>${type.map((o) => `<option ${String(o) === String(v) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  const t = { money: 'number" step="0.01" min="0', text: 'text', date: 'date', time: 'time', email: 'email', tel: 'tel' }[type] || 'text';
  return `<label>${label}<input type="${t}" ${name} value="${esc(v)}" ${key === 'title' ? 'required maxlength="200"' : ''}></label>`;
}
function edit(r) {
  const mod = r ? r.module : S.view;
  if (!M[mod]) return;
  editing = r ? JSON.parse(JSON.stringify(r)) : { module: mod, details: {}, status: M[mod].statuses[0] };
  $('#ed-title').textContent = r ? `Edit ${M[mod].noun}` : `New ${M[mod].noun}`;
  $('#ed-body').innerHTML = M[mod].fields.map((f) => field(f, editing, mod)).join('');
  $('#ed-delete').hidden = !(r && isAdmin());
  $('.err', dlg).hidden = true;
  dlg.showModal();
}
$('#ed-body').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tpl]'); if (!t) return;
  const on = t.dataset.tpl === 'on';
  editing.details.checklist = (on ? ONBOARD : OFFBOARD).map((x) => ({ t: x, done: false }));
  const sel = $('#ed-body select[name="status"]'); if (sel) sel.value = on ? 'onboarding' : 'offboarding';
  $('[data-checklist]').innerHTML = editing.details.checklist.map((x, i) => `<label><input type="checkbox" data-ci="${i}">${esc(x.t)}</label>`).join('');
});
$('#ed-body').addEventListener('change', (e) => { if (e.target.dataset.ci != null) editing.details.checklist[+e.target.dataset.ci].done = e.target.checked; });
$('#ed-form').addEventListener('submit', async (e) => {
  if (e.submitter && e.submitter.value === 'cancel') return;
  e.preventDefault();
  if (editing.staffEdit) return saveStaff();
  const f = e.target, err = $('.err', dlg);
  const rec = { module: editing.module, details: { ...(editing.details || {}) } };
  M[editing.module].fields.forEach(([key, , type]) => {
    if (type === 'checklist') return;
    const el = f.elements[key]; if (!el) return;
    let v = el.value.trim();
    if (type === 'money') v = v === '' ? null : Number(v);
    else if (type === 'date' && !key.startsWith('d.')) v = v || null;
    if (key.startsWith('d.')) rec.details[key.slice(2)] = v; else rec[key] = v === '' ? null : v;
  });
  if (!rec.title) { err.textContent = 'Please add a name or title.'; err.hidden = false; return; }
  const q = editing.id ? sb.from('outward_records').update(rec).eq('id', editing.id) : sb.from('outward_records').insert(rec);
  const { error } = await q;
  if (error) { err.textContent = 'Couldn’t save. ' + (error.message || ''); err.hidden = false; return; }
  dlg.close(); await load(); render();
});
$('#ed-delete').addEventListener('click', async () => {
  if (!editing?.id || !confirm('Delete this item for everyone? This can’t be undone.')) return;
  await sb.from('outward_records').delete().eq('id', editing.id);
  dlg.close(); await load(); render();
});
function editStaff(s) {
  editing = { staffEdit: true, email: s?.email };
  $('#ed-title').textContent = s ? 'Edit team member' : 'Add to team';
  $('#ed-body').innerHTML = `<label>Name<input name="name" value="${esc(s?.name || '')}"></label><label>Email<input name="email" type="email" value="${esc(s?.email || '')}" ${s ? 'readonly' : 'required'}></label>
    <label>Role<select name="role">${['staff', 'admin', 'owner'].map((x) => `<option ${x === (s?.role || 'staff') ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="check-list" style="flex-direction:row;align-items:center"><input type="checkbox" name="active" ${s?.active === false ? '' : 'checked'} style="width:20px;height:20px;min-height:0">Active</label>`;
  $('#ed-delete').hidden = true; $('.err', dlg).hidden = true; dlg.showModal();
}
async function saveStaff() {
  const f = $('#ed-form'), err = $('.err', dlg);
  const row = { email: f.elements.email.value.trim().toLowerCase(), name: f.elements.name.value.trim() || null, role: f.elements.role.value, active: f.elements.active.checked };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) { err.textContent = 'Please enter a valid email.'; err.hidden = false; return; }
  const { error } = await sb.from('outward_staff').upsert(row);
  if (error) { err.textContent = 'Couldn’t save. ' + error.message; err.hidden = false; return; }
  dlg.close(); const { data } = await sb.from('outward_staff').select('email,name,role,active').order('name'); S.staff = data || []; render();
}

/* ---------- OWL ---------- */
const CHIPS = ['What needs my attention this week?', 'Summarize where we stand on COR', 'Draft an onboarding welcome email', 'Which risks should we review first?'];
function owlContext() {
  const lines = [];
  Object.keys(M).filter(canSee).forEach((k) => {
    const rs = recs(k); if (!rs.length) return;
    lines.push(`## ${M[k].label}`);
    rs.slice(0, 80).forEach((r) => {
      const d = r.details || {};
      const bits = [r.title, r.status, r.due_date && `due ${r.due_date}`, r.amount != null && money(r.amount), r.owner_email && `owner ${staffName(r.owner_email)}`,
        k === 'risk' && `score ${riskScore(r)}`, k === 'person' && d.position, k === 'person' && (d.checklist || []).length && `checklist ${d.checklist.filter((x) => x.done).length}/${d.checklist.length}`,
        (k === 'legal' || k === 'finance' || k === 'marketing') && d.kind, d.channel].filter(Boolean);
      lines.push('- ' + bits.join(' | '));
    });
  });
  const a = alerts(); if (a.length) { lines.push('## Alerts'); a.forEach((x) => lines.push(`- ${x.t} (${x.s}, ${x.when})`)); }
  if (isAdmin()) lines.push(ACCT.context());
  return lines.join('\n') || 'No records yet.';
}
function paintOwl() {
  const log = $('#owl-log');
  log.innerHTML = (S.owl.length ? S.owl : [{ role: 'assistant', content: `Hello${S.me?.name ? ', ' + S.me.name.split(' ')[0] : ''}. I’m OWL. Ask me what needs attention, or for a summary, checklist or draft. I\u2019m an AI guide, not a lawyer, accountant or HR professional, so check important answers with one.` }])
    .map((m) => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('');
  log.scrollTop = log.scrollHeight;
  $('#owl-chips').innerHTML = S.owl.length ? '' : CHIPS.map((c) => `<button type="button">${esc(c)}</button>`).join('');
}
async function ask(q) {
  q = q.trim(); if (!q) return;
  S.owl.push({ role: 'user', content: q }); paintOwl();
  const pending = document.createElement('div'); pending.className = 'msg a'; pending.textContent = 'Thinking…'; $('#owl-log').appendChild(pending);
  try {
    const { data } = await sb.auth.getSession();
    const r = await fetch('/api/owl', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data?.session?.access_token || '') }, body: JSON.stringify({ messages: S.owl, context: owlContext(), view: S.view }) });
    const j = await r.json().catch(() => ({}));
    S.owl.push({ role: 'assistant', content: j.reply || j.error || 'OWL could not answer just now.' });
  } catch { S.owl.push({ role: 'assistant', content: 'OWL could not answer just now. Please try again.' }); }
  paintOwl();
}
$('#owl-open').addEventListener('click', () => { $('#owl').hidden = false; paintOwl(); $('#owl-form textarea').focus(); });
$('#owl-close').addEventListener('click', () => { $('#owl').hidden = true; });
$('#owl-chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
$('#owl-form').addEventListener('submit', (e) => { e.preventDefault(); const t = e.target.q; ask(t.value); t.value = ''; });
$('#owl-form textarea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#owl-form').requestSubmit(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#owl').hidden) $('#owl').hidden = true; });

boot();
