/* OUTWARD Accounting: chart of accounts, bank and card accounts, transactions,
   statement import (CSV or PDF), reports and exports. Owner and admin only.
   Amounts: money in is positive, money out is negative. */
export function createAccounting({ sb, esc, money, rerender, token }) {
  const A = { accounts: [], sources: [], tx: [], docs: [], period: 'ytd', f: { source: '', account: '', status: '', q: '' }, loaded: false };
  const TYPES = [['income', 'Income'], ['expense', 'Expenses'], ['asset', 'Assets'], ['liability', 'Liabilities'], ['equity', 'Net assets']];
  const VIEWS = { acct: 'Accounting overview', 'acct-coa': 'Chart of accounts', 'acct-tx': 'Transactions', 'acct-sources': 'Bank & cards', 'acct-docs': 'Statements', 'acct-reports': 'Reports' };
  const $ = (s, r = document) => r.querySelector(s);
  const iso = (d) => d.toISOString().slice(0, 10);
  const acc = (id) => A.accounts.find((a) => a.id === id);
  const src = (id) => A.sources.find((s) => s.id === id);
  const label = (a) => (a ? `${a.code} · ${a.name}` : 'Uncategorized');
  const m2 = (n) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  /* ---------- data ---------- */
  async function load() {
    const [a, s, t, d] = await Promise.all([
      sb.from('acct_accounts').select('*').order('code'),
      sb.from('acct_sources').select('*').order('name'),
      sb.from('acct_transactions').select('*').order('date', { ascending: false }).limit(5000),
      sb.from('acct_documents').select('*').order('created_at', { ascending: false })
    ]);
    A.accounts = a.data || []; A.sources = s.data || []; A.tx = t.data || []; A.docs = d.data || []; A.loaded = true;
  }

  /* ---------- periods ---------- */
  const PERIODS = [['month', 'This month'], ['last', 'Last month'], ['quarter', 'This quarter'], ['ytd', 'Year to date'], ['12m', 'Last 12 months'], ['all', 'All time']];
  function range(p = A.period) {
    const n = new Date(), y = n.getFullYear(), mo = n.getMonth();
    if (p === 'month') return [iso(new Date(y, mo, 1)), iso(n)];
    if (p === 'last') return [iso(new Date(y, mo - 1, 1)), iso(new Date(y, mo, 0))];
    if (p === 'quarter') return [iso(new Date(y, Math.floor(mo / 3) * 3, 1)), iso(n)];
    if (p === 'ytd') return [`${y}-01-01`, iso(n)];
    if (p === '12m') return [iso(new Date(y, mo - 11, 1)), iso(n)];
    return ['0000-01-01', '9999-12-31'];
  }
  const inRange = (t, r = range()) => t.date >= r[0] && t.date <= r[1];
  const periodSel = () => `<select data-acct-period aria-label="Period">${PERIODS.map(([k, l]) => `<option value="${k}" ${A.period === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;

  /* ---------- math ---------- */
  function pnl(r = range()) {
    const rows = {}; let income = 0, expense = 0, uncat = 0;
    A.tx.filter((t) => inRange(t, r)).forEach((t) => {
      const a = acc(t.account_id);
      if (!a) { uncat += Number(t.amount); return; }
      if (a.type === 'income') { income += Number(t.amount); rows[a.id] = (rows[a.id] || 0) + Number(t.amount); }
      if (a.type === 'expense') { expense += -Number(t.amount); rows[a.id] = (rows[a.id] || 0) - Number(t.amount); }
    });
    return { rows, income, expense, net: income - expense, uncat };
  }
  const balance = (s) => Number(s.opening_balance || 0) + A.tx.filter((t) => t.source_id === s.id && (!s.opening_date || t.date >= s.opening_date)).reduce((x, t) => x + Number(t.amount), 0);

  /* ---------- views ---------- */
  function render(view, el) {
    if (!A.loaded) { el.innerHTML = '<p class="empty">Loading accounting…</p>'; load().then(() => render(view, el)); return; }
    el.innerHTML = { acct: overview, 'acct-coa': coa, 'acct-tx': transactions, 'acct-sources': sources, 'acct-docs': documents, 'acct-reports': reports }[view]();
  }
  function overview() {
    const p = pnl(), unrev = A.tx.filter((t) => t.status === 'unreviewed').length;
    const cash = A.sources.filter((s) => s.kind === 'bank' && s.active).reduce((x, s) => x + balance(s), 0);
    const cards = A.sources.filter((s) => s.kind === 'credit_card' && s.active).reduce((x, s) => x + balance(s), 0);
    const top = Object.entries(p.rows).map(([id, v]) => [acc(id), v]).filter(([a]) => a?.type === 'expense').sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = Math.max(1, ...top.map(([, v]) => v));
    return `<div class="toolbar">${periodSel()}<span class="fine">${esc(range()[0] === '0000-01-01' ? 'All time' : `${range()[0]} to ${range()[1]}`)}</span></div>
    <div class="summary"><div class="chip"><b>${money(p.income)}</b><span>revenue</span></div><div class="chip"><b>${money(p.expense)}</b><span>expenses</span></div><div class="chip"><b style="color:${p.net < 0 ? '#B3261E' : 'inherit'}">${money(p.net)}</b><span>net</span></div><div class="chip"><b>${money(cash)}</b><span>cash in banks</span></div><div class="chip"><b>${money(-cards)}</b><span>owed on cards</span></div><div class="chip"><b>${unrev}</b><span>to review</span></div></div>
    <section class="sec"><h3>Where the money went</h3>${top.length ? `<div class="bars">${top.map(([a, v]) => `<div class="barrow"><span>${esc(a.name)}</span><div class="track"><div style="width:${(v / max * 100).toFixed(1)}%"></div></div><b>${money(v)}</b></div>`).join('')}</div>` : '<p class="empty">No categorized expenses in this period yet.</p>'}</section>
    <section class="sec"><h3>Ready for review</h3>${unrev ? txTable(A.tx.filter((t) => t.status === 'unreviewed').slice(0, 8)) + '<button class="link" data-view-go="acct-tx">Review all transactions</button>' : '<p class="empty">Everything is reviewed. Import a statement or CSV to add more.</p>'}</section>
    <section class="sec"><h3>Get started</h3><div class="toolbar"><button class="btn ghost" data-acct="add-source">+ Bank or card account</button><button class="btn ghost" data-acct="upload">Upload statement (PDF)</button><button class="btn ghost" data-acct="import-csv">Import CSV</button><button class="btn ghost" data-acct="add-tx">+ Transaction</button></div></section>`;
  }
  function coa() {
    const p = pnl();
    return `<div class="toolbar">${periodSel()}<button class="btn ghost" data-acct="add-account">+ Account</button><button class="btn ghost" data-acct="export-coa">Export CSV</button></div>` +
      TYPES.map(([t, l]) => {
        const list = A.accounts.filter((a) => a.type === t);
        if (!list.length) return '';
        return `<section class="sec"><h3>${l}</h3><div class="table-wrap"><table><tr><th>CODE</th><th>ACCOUNT</th><th>ACTIVITY (PERIOD)</th><th></th></tr>${list.map((a) => {
          const act = A.tx.filter((x) => x.account_id === a.id && inRange(x)).reduce((s, x) => s + Number(x.amount), 0);
          return `<tr${a.active ? '' : ' style="opacity:.5"'}><td>${esc(a.code)}</td><td><b>${esc(a.name)}</b>${a.description ? `<br><span class="fine">${esc(a.description)}</span>` : ''}</td><td>${act ? money(t === 'expense' ? -act : act) : '—'}</td><td><button class="link" data-acct="edit-account" data-id="${a.id}">Edit</button></td></tr>`;
        }).join('')}</table></div></section>`;
      }).join('') + `<p class="fine">Net this period: ${money(p.net)}.</p>`;
  }
  function filtered() {
    const r = range(), f = A.f, q = f.q.toLowerCase();
    return A.tx.filter((t) => inRange(t, r) && (!f.source || t.source_id === f.source) && (!f.status || t.status === f.status) &&
      (!f.account || (f.account === 'none' ? !t.account_id : t.account_id === f.account)) && (!q || (t.description + ' ' + (t.memo || '')).toLowerCase().includes(q)));
  }
  function accountOptions(sel, blank = 'Uncategorized') {
    return `<option value="">${blank}</option>` + TYPES.map(([t, l]) => `<optgroup label="${l}">${A.accounts.filter((a) => a.type === t && a.active).map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(label(a))}</option>`).join('')}</optgroup>`).join('');
  }
  function txTable(list) {
    return `<div class="table-wrap"><table class="tx"><tr><th>DATE</th><th>DESCRIPTION</th><th>ACCOUNT</th><th>CATEGORY</th><th style="text-align:right">AMOUNT</th><th></th></tr>${list.map((t) => `<tr>
      <td>${esc(t.date)}</td><td><b>${esc(t.description)}</b>${t.memo ? `<br><span class="fine">${esc(t.memo)}</span>` : ''}</td><td>${esc(src(t.source_id)?.name || '—')}</td>
      <td><select data-cat="${t.id}" aria-label="Category">${accountOptions(t.account_id)}</select></td>
      <td style="text-align:right;font-weight:700;color:${t.amount < 0 ? '#0B0B0C' : '#137A43'}">${m2(t.amount)}</td>
      <td>${t.status === 'approved' ? '<span class="status good">approved</span>' : `<button class="btn ghost sm" data-approve="${t.id}" ${t.account_id ? '' : 'disabled title="Choose a category first"'}>Approve</button>`} <button class="link" data-acct="edit-tx" data-id="${t.id}">Edit</button></td></tr>`).join('')}</table></div>`;
  }
  function transactions() {
    const list = filtered(), f = A.f;
    const ready = list.filter((t) => t.status === 'unreviewed' && t.account_id).length;
    return `<div class="toolbar">${periodSel()}<select data-f="source" aria-label="Bank or card"><option value="">All accounts</option>${A.sources.map((s) => `<option value="${s.id}" ${f.source === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
      <select data-f="account" aria-label="Category"><option value="">All categories</option><option value="none" ${f.account === 'none' ? 'selected' : ''}>Uncategorized</option>${A.accounts.map((a) => `<option value="${a.id}" ${f.account === a.id ? 'selected' : ''}>${esc(label(a))}</option>`).join('')}</select>
      <select data-f="status" aria-label="Status"><option value="">Any status</option><option ${f.status === 'unreviewed' ? 'selected' : ''}>unreviewed</option><option ${f.status === 'approved' ? 'selected' : ''}>approved</option></select>
      <input type="search" data-f="q" placeholder="Search" value="${esc(f.q)}" aria-label="Search transactions"></div>
      <div class="toolbar"><button class="btn dark" data-acct="approve-ready" ${ready ? '' : 'disabled'}>Approve ${ready} categorized</button><button class="btn ghost" data-acct="add-tx">+ Transaction</button><button class="btn ghost" data-acct="import-csv">Import CSV</button><button class="btn ghost" data-acct="upload">Upload PDF statement</button><button class="btn ghost" data-acct="export-tx">Export CSV</button></div>
      <p class="fine">${list.length} transactions · in ${money(list.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0))} · out ${money(-list.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0))}</p>
      ${list.length ? txTable(list.slice(0, 500)) : '<p class="empty">No transactions match. Import a statement or CSV, or add one by hand.</p>'}`;
  }
  function sources() {
    return `<div class="toolbar"><button class="btn dark" data-acct="add-source">+ Bank or card account</button></div>
      ${A.sources.length ? `<div class="rows">${A.sources.map((s) => {
        const b = balance(s), n = A.tx.filter((t) => t.source_id === s.id).length, last = A.tx.filter((t) => t.source_id === s.id).map((t) => t.date).sort().pop();
        return `<div class="row" style="cursor:default"><span class="bar" style="background:${s.kind === 'bank' ? '#1E9E5A' : '#F2711C'}"></span><span><span class="t">${esc(s.name)}</span><span class="m"><span>${s.kind === 'bank' ? 'Bank account' : 'Credit card'}</span>${s.institution ? `<span>${esc(s.institution)}</span>` : ''}${s.last4 ? `<span>•••• ${esc(s.last4)}</span>` : ''}<span>${n} transactions</span>${last ? `<span>latest ${esc(last)}</span>` : ''}<span>linked to ${esc(label(acc(s.gl_account_id)))}</span></span></span>
        <span class="r"><span class="amt">${s.kind === 'credit_card' ? money(-b) + ' owed' : money(b)}</span><span><button class="link" data-acct="edit-source" data-id="${s.id}">Edit</button> · <button class="link" data-acct="import-csv" data-src="${s.id}">CSV</button> · <button class="link" data-acct="upload" data-src="${s.id}">PDF</button></span></span></div>`;
      }).join('')}</div>` : '<p class="empty">Add your checking, savings and credit cards. Then import statements to bring in transactions.</p>'}
      <div class="tile-note"><b>Live bank feeds</b><p>Automatic daily sync with your bank and card companies needs a bank-data provider such as Plaid. It isn’t connected yet. Until then, upload PDF statements or CSV downloads from your bank here. Both land in Transactions for review.</p></div>`;
  }
  function documents() {
    return `<div class="toolbar"><button class="btn dark" data-acct="upload">Upload statement (PDF)</button><button class="btn ghost" data-acct="import-csv">Import CSV</button></div>
      ${A.docs.length ? `<div class="table-wrap"><table><tr><th>UPLOADED</th><th>DOCUMENT</th><th>ACCOUNT</th><th>PERIOD</th><th>TRANSACTIONS</th><th></th></tr>${A.docs.map((d) => `<tr><td>${esc(new Date(d.created_at).toLocaleDateString())}</td><td><b>${esc(d.name)}</b></td><td>${esc(src(d.source_id)?.name || '—')}</td><td>${esc([d.period_start, d.period_end].filter(Boolean).join(' to ') || '—')}</td><td>${A.tx.filter((t) => t.document_id === d.id).length}</td><td><button class="link" data-acct="open-doc" data-id="${d.id}">Open</button></td></tr>`).join('')}</table></div>` : '<p class="empty">No statements yet. Upload a PDF bank or credit card statement and OUTWARD will read the transactions for you to review.</p>'}
      <p class="fine">Statements are stored privately and only owners and admins can open them. Scanned (photo) PDFs can’t be read automatically; use your bank’s CSV download instead.</p>`;
  }
  function reports() {
    const r = range(), p = pnl(r);
    const line = (a, v) => `<tr><td>${esc(a.code)}</td><td>${esc(a.name)}</td><td style="text-align:right">${m2(v)}</td></tr>`;
    const inc = A.accounts.filter((a) => a.type === 'income' && p.rows[a.id]), exp = A.accounts.filter((a) => a.type === 'expense' && p.rows[a.id]);
    return `<div class="toolbar no-print">${periodSel()}<button class="btn ghost" data-acct="export-pnl">Export P&L (CSV)</button><button class="btn ghost" data-acct="export-tx">Export transactions (CSV)</button><button class="btn ghost" data-acct="print">Print or save as PDF</button></div>
      <section class="sec report"><h3>Profit and loss</h3><p class="fine">SoulCause · ${esc(r[0] === '0000-01-01' ? 'All time' : `${r[0]} to ${r[1]}`)} · cash basis</p>
      <div class="table-wrap"><table><tr><th>CODE</th><th>INCOME</th><th style="text-align:right">AMOUNT</th></tr>${inc.map((a) => line(a, p.rows[a.id])).join('') || '<tr><td colspan="3">No income recorded.</td></tr>'}<tr><td></td><td><b>Total income</b></td><td style="text-align:right"><b>${m2(p.income)}</b></td></tr>
      <tr><th>CODE</th><th>EXPENSES</th><th></th></tr>${exp.map((a) => line(a, p.rows[a.id])).join('') || '<tr><td colspan="3">No expenses recorded.</td></tr>'}<tr><td></td><td><b>Total expenses</b></td><td style="text-align:right"><b>${m2(p.expense)}</b></td></tr>
      <tr><td></td><td><b>Net ${p.net < 0 ? 'loss' : 'income'}</b></td><td style="text-align:right"><b>${m2(p.net)}</b></td></tr></table></div>
      ${p.uncat ? `<p class="fine">${m2(p.uncat)} in uncategorized transactions is not included. <button class="link" data-acct="show-uncat">Categorize them</button></p>` : ''}</section>
      <section class="sec report"><h3>Cash and cards</h3><div class="table-wrap"><table><tr><th>ACCOUNT</th><th>TYPE</th><th style="text-align:right">BALANCE</th></tr>${A.sources.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.kind === 'bank' ? 'Bank' : 'Credit card'}</td><td style="text-align:right">${m2(balance(s))}</td></tr>`).join('') || '<tr><td colspan="3">No accounts yet.</td></tr>'}</table></div>
      <p class="fine">Balances are opening balance plus imported transactions. Reconcile against your statements. These reports help you keep track; have a CPA review them for tax filings.</p></section>`;
  }

  /* ---------- dialogs ---------- */
  function dialog(title, body, onSave, saveLabel = 'Save') {
    let d = $('#acct-dialog');
    if (!d) { d = document.createElement('dialog'); d.id = 'acct-dialog'; d.className = 'editor'; document.body.appendChild(d); }
    d.innerHTML = `<form method="dialog" novalidate><div class="ed-head"><h3>${esc(title)}</h3><button class="x" value="cancel" formnovalidate aria-label="Close">×</button></div><div class="ed-body">${body}</div><p class="err" role="alert" hidden></p><div class="ed-foot"><span></span><button class="btn ghost" value="cancel" formnovalidate>Cancel</button>${onSave ? `<button class="btn dark" value="save">${esc(saveLabel)}</button>` : ''}</div></form>`;
    const f = $('form', d);
    f.addEventListener('submit', async (e) => {
      if (e.submitter?.value !== 'save') return;
      e.preventDefault();
      const err = $('.err', d); err.hidden = true;
      try { const msg = await onSave(f, d); if (msg) { err.textContent = msg; err.hidden = false; return; } d.close(); await load(); rerender(); }
      catch (x) { err.textContent = 'Something went wrong. ' + (x.message || ''); err.hidden = false; }
    });
    d.showModal();
    return d;
  }
  const srcOptions = (sel) => `<option value="">Choose…</option>` + A.sources.map((s) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  function editAccount(a) {
    dialog(a ? 'Edit account' : 'New account', `<div class="two"><label>Code<input name="code" value="${esc(a?.code || '')}" maxlength="12" required></label><label>Type<select name="type">${TYPES.map(([t, l]) => `<option value="${t}" ${a?.type === t ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label>Name<input name="name" value="${esc(a?.name || '')}" maxlength="120" required></label><label>Description<input name="description" value="${esc(a?.description || '')}" maxlength="300"></label>
      <label class="check-list" style="flex-direction:row;align-items:center"><input type="checkbox" name="active" ${a?.active === false ? '' : 'checked'} style="width:20px;height:20px;min-height:0">Active</label>`, async (f) => {
      const row = { code: f.code.value.trim(), name: f.name.value.trim(), type: f.type.value, description: f.description.value.trim() || null, active: f.active.checked };
      if (!row.code || !row.name) return 'Code and name are required.';
      const { error } = a ? await sb.from('acct_accounts').update(row).eq('id', a.id) : await sb.from('acct_accounts').insert(row);
      return error ? (error.message.includes('duplicate') ? 'That code is already used.' : error.message) : null;
    });
  }
  function editSource(s) {
    dialog(s ? 'Edit bank or card account' : 'New bank or card account', `<label>Name<input name="name" value="${esc(s?.name || '')}" placeholder="Operating checking" required></label>
      <div class="two"><label>Type<select name="kind"><option value="bank" ${s?.kind === 'bank' ? 'selected' : ''}>Bank account</option><option value="credit_card" ${s?.kind === 'credit_card' ? 'selected' : ''}>Credit card</option></select></label><label>Last 4 digits<input name="last4" value="${esc(s?.last4 || '')}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}"></label></div>
      <label>Bank or card company<input name="institution" value="${esc(s?.institution || '')}"></label>
      <label>Linked chart-of-accounts account<select name="gl">${A.accounts.filter((a) => ['asset', 'liability'].includes(a.type)).map((a) => `<option value="${a.id}" ${a.id === s?.gl_account_id ? 'selected' : ''}>${esc(label(a))}</option>`).join('')}</select></label>
      <div class="two"><label>Opening balance ($)<input name="ob" type="number" step="0.01" value="${esc(s?.opening_balance ?? 0)}"></label><label>As of<input name="od" type="date" value="${esc(s?.opening_date || '')}"></label></div>
      <p class="fine">For credit cards, enter the amount owed as a negative number (for example, -1250.00). Never enter full account or card numbers.</p>`, async (f) => {
      const row = { name: f.name.value.trim(), kind: f.kind.value, institution: f.institution.value.trim() || null, last4: f.last4.value.trim() || null, gl_account_id: f.gl.value || null, opening_balance: Number(f.ob.value || 0), opening_date: f.od.value || null };
      if (!row.name) return 'Please name the account.';
      if (row.last4 && !/^\d{4}$/.test(row.last4)) return 'Last 4 must be four digits.';
      const { error } = s ? await sb.from('acct_sources').update(row).eq('id', s.id) : await sb.from('acct_sources').insert(row);
      return error?.message || null;
    });
  }
  function editTx(t) {
    const d = dialog(t ? 'Edit transaction' : 'New transaction', `<div class="two"><label>Date<input name="date" type="date" value="${esc(t?.date || new Date().toISOString().slice(0, 10))}" required></label><label>Bank or card<select name="src">${srcOptions(t?.source_id)}</select></label></div>
      <label>Description<input name="description" value="${esc(t?.description || '')}" maxlength="300" required></label>
      <div class="two"><label>Money in or out<select name="dir"><option value="out" ${t && t.amount > 0 ? '' : 'selected'}>Money out (expense, payment)</option><option value="in" ${t && t.amount > 0 ? 'selected' : ''}>Money in (revenue, deposit)</option></select></label><label>Amount ($)<input name="amt" type="number" step="0.01" min="0" value="${esc(t ? Math.abs(t.amount) : '')}" required></label></div>
      <label>Category<select name="acct">${accountOptions(t?.account_id)}</select></label><label>Memo<input name="memo" value="${esc(t?.memo || '')}" maxlength="500"></label>
      ${t ? '<button type="button" class="link danger" data-del>Delete transaction</button>' : ''}`, async (f) => {
      const amt = Math.abs(Number(f.amt.value));
      if (!f.description.value.trim() || !amt || !f.date.value) return 'Date, description and amount are required.';
      const row = { date: f.date.value, description: f.description.value.trim(), amount: f.dir.value === 'in' ? amt : -amt, source_id: f.src.value || null, account_id: f.acct.value || null, memo: f.memo.value.trim() || null };
      const { error } = t ? await sb.from('acct_transactions').update(row).eq('id', t.id) : await sb.from('acct_transactions').insert(row);
      return error?.message || null;
    });
    const del = $('[data-del]', d);
    if (del) del.addEventListener('click', async () => { if (!confirm('Delete this transaction?')) return; await sb.from('acct_transactions').delete().eq('id', t.id); d.close(); await load(); rerender(); });
  }

  /* ---------- import: CSV ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some((x) => x.trim())) rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
    return rows;
  }
  function normDate(s) {
    s = String(s || '').trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/.exec(s); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; }
    return null;
  }
  const num = (s) => { s = String(s || '').replace(/[$,\s]/g, ''); if (/^\(.*\)$/.test(s)) s = '-' + s.slice(1, -1); const n = Number(s); return Number.isFinite(n) ? n : null; };
  function fromCSV(text, kind) {
    const rows = parseCSV(text); if (rows.length < 2) return [];
    const h = rows[0].map((x) => x.toLowerCase().trim());
    const find = (...k) => h.findIndex((x) => k.some((y) => x.includes(y)));
    const di = find('date'), de = find('description', 'payee', 'merchant', 'name', 'memo', 'details'), am = find('amount'), dr = find('debit', 'withdrawal'), cr = find('credit', 'deposit');
    if (di < 0 || de < 0 || (am < 0 && dr < 0 && cr < 0)) return null;
    // Many card exports show purchases as positive numbers; flip so money out is negative.
    const flip = kind === 'credit_card' && am >= 0 && rows.slice(1).filter((x) => (num(x[am]) || 0) > 0).length > (rows.length - 1) / 2;
    return rows.slice(1).map((r) => {
      let amount = am >= 0 ? num(r[am]) : ((num(r[cr]) || 0) - Math.abs(num(r[dr]) || 0));
      if (flip && amount !== null) amount = -amount;
      return { date: normDate(r[di]), description: String(r[de] || '').trim().slice(0, 300), amount };
    }).filter((t) => t.date && t.description && t.amount !== null && t.amount !== 0);
  }
  function suggest(desc) {
    const w = desc.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((x) => x.length > 2).slice(0, 2).join(' ');
    if (!w) return null;
    const hit = A.tx.find((t) => t.account_id && t.description.toLowerCase().replace(/[^a-z ]/g, ' ').includes(w));
    return hit ? hit.account_id : null;
  }
  function preview(list, sourceId, extra = {}) {
    const keys = new Set(A.tx.map((t) => `${t.source_id}|${t.date}|${Number(t.amount).toFixed(2)}|${t.description.toLowerCase()}`));
    const items = list.map((t) => ({ ...t, dup: keys.has(`${sourceId}|${t.date}|${Number(t.amount).toFixed(2)}|${t.description.toLowerCase()}`), account_id: suggest(t.description) }));
    const fresh = items.filter((t) => !t.dup);
    return { items, fresh, html: `<p class="fine">${items.length} found · ${fresh.length} new · ${items.length - fresh.length} already imported (skipped). In ${money(fresh.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0))} · out ${money(-fresh.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0))}</p>
      <div class="table-wrap" style="max-height:300px;overflow:auto"><table><tr><th>DATE</th><th>DESCRIPTION</th><th style="text-align:right">AMOUNT</th></tr>${items.slice(0, 400).map((t) => `<tr style="${t.dup ? 'opacity:.4;text-decoration:line-through' : ''}"><td>${esc(t.date)}</td><td>${esc(t.description)}</td><td style="text-align:right">${m2(t.amount)}</td></tr>`).join('')}</table></div>`, extra };
  }
  async function insertBatch(fresh, sourceId, documentId) {
    const batch = 'b' + Date.now();
    for (let i = 0; i < fresh.length; i += 200) {
      const { error } = await sb.from('acct_transactions').insert(fresh.slice(i, i + 200).map((t) => ({ date: t.date, description: t.description, amount: t.amount, source_id: sourceId, account_id: t.account_id || null, document_id: documentId || null, import_batch: batch })));
      if (error) return error.message;
    }
    return null;
  }
  function importCSV(sourceId) {
    let parsed = null;
    const d = dialog('Import CSV', `<label>Bank or card<select name="src" required>${srcOptions(sourceId)}</select></label><label>CSV file from your bank<input name="file" type="file" accept=".csv,text/csv"></label><div data-prev></div>
      <p class="fine">Download "Transactions" as CSV from your bank or card website. OUTWARD finds the date, description and amount columns, skips anything already imported and suggests categories from your past choices.</p>`, async (f) => {
      if (!f.src.value) return 'Choose the bank or card these transactions belong to.';
      if (!parsed || !parsed.fresh.length) return 'Choose a CSV file with new transactions first.';
      return insertBatch(parsed.fresh, f.src.value, null);
    }, 'Import');
    const f = $('form', d);
    const run = async () => {
      const file = f.file.files[0]; if (!file) return;
      const kind = src(f.src.value)?.kind;
      const list = fromCSV(await file.text(), kind);
      if (list === null) { $('[data-prev]', d).innerHTML = '<p class="err">Couldn’t find date, description and amount columns in that file.</p>'; parsed = null; return; }
      parsed = preview(list, f.src.value || null); $('[data-prev]', d).innerHTML = parsed.html;
    };
    f.file.addEventListener('change', run); f.src.addEventListener('change', run);
  }

  /* ---------- import: PDF statement ---------- */
  let pdfjs = null;
  async function pdfText(file) {
    if (!pdfjs) {
      pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    }
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let p = 1; p <= Math.min(doc.numPages, 40); p++) {
      const c = await (await doc.getPage(p)).getTextContent();
      let lastY = null;
      c.items.forEach((it) => { const y = Math.round(it.transform[5]); out += (lastY !== null && Math.abs(y - lastY) > 2 ? '\n' : ' ') + it.str; lastY = y; });
      out += '\n\n';
    }
    return out;
  }
  function uploadPDF(sourceId) {
    let parsed = null, file = null, stmt = {};
    const d = dialog('Upload statement', `<label>Bank or card<select name="src">${srcOptions(sourceId)}</select></label><label>PDF statement<input name="file" type="file" accept="application/pdf,.pdf"></label><div data-prev></div>
      <p class="fine">OUTWARD reads the statement with OWL (AI), shows you every transaction, and imports only after you approve. The PDF is stored privately. Always compare totals with your statement.</p>`, async (f) => {
      if (!f.src.value) return 'Choose the bank or card this statement belongs to.';
      if (!file) return 'Choose a PDF statement first.';
      if (!parsed) return 'Wait for the statement to finish reading.';
      const path = `statements/${f.src.value}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
      const up = await sb.storage.from('outward-docs').upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (up.error) return 'Upload failed. ' + up.error.message;
      const { data: doc, error } = await sb.from('acct_documents').insert({ name: file.name, storage_path: path, kind: 'statement', source_id: f.src.value, period_start: stmt.period_start || null, period_end: stmt.period_end || null }).select().single();
      if (error) return error.message;
      return parsed.fresh.length ? insertBatch(parsed.fresh, f.src.value, doc.id) : null;
    }, 'Save and import');
    const f = $('form', d), box = $('[data-prev]', d);
    f.file.addEventListener('change', async () => {
      file = f.file.files[0]; parsed = null; if (!file) return;
      box.innerHTML = '<p class="fine">Reading the statement… this can take up to a minute.</p>';
      try {
        const text = await pdfText(file);
        const r = await fetch('/api/statement-extract', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ text }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { box.innerHTML = `<p class="err">${esc(j.error || 'Could not read that statement.')}</p>`; return; }
        stmt = j.statement || {};
        if (!f.src.value && stmt.last4) { const m = A.sources.find((s) => s.last4 === stmt.last4); if (m) f.src.value = m.id; }
        parsed = preview(j.transactions || [], f.src.value || null);
        box.innerHTML = `${stmt.institution || stmt.period_end ? `<p class="fine"><b>${esc(stmt.institution || 'Statement')}</b>${stmt.last4 ? ` •••• ${esc(stmt.last4)}` : ''}${stmt.period_start ? ` · ${esc(stmt.period_start)} to ${esc(stmt.period_end || '')}` : ''}${stmt.closing_balance != null ? ` · closing ${m2(stmt.closing_balance)}` : ''}</p>` : ''}${parsed.html}`;
      } catch (e) { box.innerHTML = `<p class="err">Couldn’t read that PDF. ${esc(e.message || '')}</p>`; }
    });
  }

  /* ---------- export ---------- */
  function download(name, rows) {
    const csv = rows.map((r) => r.map((c) => { const s = String(c ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  /* ---------- events ---------- */
  async function onClick(e) {
    const b = e.target.closest('[data-acct],[data-approve]'); if (!b) return false;
    if (b.dataset.approve) { await sb.from('acct_transactions').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', b.dataset.approve); await load(); rerender(); return true; }
    const a = b.dataset.acct, id = b.dataset.id;
    if (a === 'add-account') editAccount(null);
    if (a === 'edit-account') editAccount(acc(id));
    if (a === 'add-source') editSource(null);
    if (a === 'edit-source') editSource(src(id));
    if (a === 'add-tx') editTx(null);
    if (a === 'edit-tx') editTx(A.tx.find((t) => t.id === id));
    if (a === 'import-csv') importCSV(b.dataset.src || A.f.source || '');
    if (a === 'upload') uploadPDF(b.dataset.src || A.f.source || '');
    if (a === 'approve-ready') {
      const ids = filtered().filter((t) => t.status === 'unreviewed' && t.account_id).map((t) => t.id);
      for (let i = 0; i < ids.length; i += 100) await sb.from('acct_transactions').update({ status: 'approved', approved_at: new Date().toISOString() }).in('id', ids.slice(i, i + 100));
      await load(); rerender();
    }
    if (a === 'show-uncat') { A.f = { source: '', account: 'none', status: '', q: '' }; return 'acct-tx'; }
    if (a === 'open-doc') { const d = A.docs.find((x) => x.id === id); const { data } = await sb.storage.from('outward-docs').createSignedUrl(d.storage_path, 300); if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener'); }
    if (a === 'export-coa') download(`soulcause-chart-of-accounts-${stamp()}.csv`, [['Code', 'Name', 'Type', 'Description', 'Active'], ...A.accounts.map((x) => [x.code, x.name, x.type, x.description || '', x.active ? 'yes' : 'no'])]);
    if (a === 'export-tx') download(`soulcause-transactions-${stamp()}.csv`, [['Date', 'Description', 'Amount', 'Bank or card', 'Account code', 'Account', 'Status', 'Memo'], ...filtered().map((t) => [t.date, t.description, Number(t.amount).toFixed(2), src(t.source_id)?.name || '', acc(t.account_id)?.code || '', acc(t.account_id)?.name || 'Uncategorized', t.status, t.memo || ''])]);
    if (a === 'export-pnl') { const p = pnl(), r = range(); download(`soulcause-profit-and-loss-${stamp()}.csv`, [['SoulCause profit and loss', r[0] === '0000-01-01' ? 'All time' : `${r[0]} to ${r[1]}`], [], ['Code', 'Account', 'Type', 'Amount'], ...A.accounts.filter((x) => p.rows[x.id]).map((x) => [x.code, x.name, x.type, p.rows[x.id].toFixed(2)]), [], ['', 'Total income', '', p.income.toFixed(2)], ['', 'Total expenses', '', p.expense.toFixed(2)], ['', 'Net', '', p.net.toFixed(2)]]); }
    if (a === 'print') window.print();
    return true;
  }
  async function onChange(e) {
    const t = e.target;
    if (t.matches('[data-acct-period]')) { A.period = t.value; rerender(); return true; }
    if (t.dataset.f && t.tagName === 'SELECT') { A.f[t.dataset.f] = t.value; rerender(); return true; }
    if (t.dataset.cat) { await sb.from('acct_transactions').update({ account_id: t.value || null }).eq('id', t.dataset.cat); const x = A.tx.find((y) => y.id === t.dataset.cat); if (x) x.account_id = t.value || null; rerender(); return true; }
    return false;
  }
  function onInput(e) { if (e.target.dataset.f === 'q') { A.f.q = e.target.value; return true; } return false; }
  const month = () => pnl(range('month'));
  const reviewCount = () => A.tx.filter((t) => t.status === 'unreviewed').length;
  const context = () => { const p = pnl(); return A.loaded ? `## Accounting (${A.period})\n- Revenue ${money(p.income)}, expenses ${money(p.expense)}, net ${money(p.net)}, uncategorized ${money(p.uncat)}\n- ${reviewCount()} transactions waiting for review\n` + Object.entries(p.rows).map(([id, v]) => `- ${label(acc(id))}: ${money(v)}`).join('\n') : ''; };
  return { VIEWS, month, render, load, onClick, onChange, onInput, reviewCount, context, isLoaded: () => A.loaded };
}
