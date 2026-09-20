/* Jejat admin dashboard — plain fetch against Supabase auth + RPC */
(() => {
  'use strict';
  const URL_ = 'https://mbzzbfvletthtvixdxxm.supabase.co';
  const KEY = 'sb_publishable_1KLmNT9BdmikAfZM5YG2GA_4Gmqy2fD';
  const SITE_ROOT = location.origin + location.pathname.replace(/admin\/?.*$/, '');
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const RES = { aleppo: 'Aleppo', damascus: 'Damascus', syria_other: 'Elsewhere in Syria', abroad: 'Abroad', unknown: 'Unknown' };
  const AGE = { '18_24': '18–24', '25_34': '25–34', '35_44': '35–44', '45_plus': '45+', unknown: 'Unknown' };
  const EV = { pass: ['👋', 'passed on'], optout: ['🙅‍♀️', 'said not for me:'], optin: ['↩️', 'brought back'], suggestion: ['💭', 'suggested'], mode: ['⚡', 'switched mode'], subcategory: ['🏷️', 'filtered'], landing: ['🚪', 'landed'], register: ['📝', 'registered'], click: ['👀', 'opened'], favorite_add: ['❤️', 'favorited'], favorite_remove: ['💔', 'unfavorited'], category: ['🏷️', 'browsed'], top_picks: ['🏆', 'saved top 25'], share: ['📣', 'shared'], lang: ['🌐', 'switched language'], tab: ['↔️', 'switched tab'] };
  const flag = (cc) => cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🌍';
  const img = (u) => u ? (/^https?:/.test(u) ? u : SITE_ROOT + u) : '';
  const S = { session: null, page: 'overview', excl: true, products: [], visitors: [], cats: [], sort: { products: ['score', 1], visitors: ['last_seen_at', 1] }, timer: null };

  // ---------- auth ----------
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  async function authFetch(path, body) {
    const r = await fetch(`${URL_}/auth/v1/${path}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error_description || d.msg || d.message || 'Auth failed');
    return d;
  }
  async function login(email, password) { S.session = await authFetch('token?grant_type=password', { email, password }); S.session.at = Date.now(); store.set('jejat_admin', S.session); }
  async function refresh() { S.session = await authFetch('token?grant_type=refresh_token', { refresh_token: S.session.refresh_token }); S.session.at = Date.now(); store.set('jejat_admin', S.session); }
  function logout() { S.session = null; store.set('jejat_admin', null); clearInterval(S.timer); $('app').hidden = true; $('login').hidden = false; }
  async function rpc(fn, params, retry = true) {
    if (S.session && Date.now() - S.session.at > (S.session.expires_in - 60) * 1000) await refresh().catch(() => {});
    const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + S.session.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) });
    if (r.status === 401 && retry) { await refresh(); return rpc(fn, params, false); }
    if (!r.ok) throw new Error(`${fn}: ${r.status} ${await r.text()}`);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
  async function rest(path, opts = {}) {
    const r = await fetch(`${URL_}/rest/v1/${path}`, { ...opts, headers: { apikey: KEY, Authorization: 'Bearer ' + S.session.access_token, 'Content-Type': 'application/json', Prefer: 'return=minimal', ...(opts.headers || {}) } });
    if (!r.ok) throw new Error(path + ' ' + r.status);
    return r.status === 204 ? null : r.json();
  }

  // ---------- helpers ----------
  const fmt = (n, d = 0) => n == null ? '–' : Number(n).toLocaleString('en', { maximumFractionDigits: d });
  const dt = (s) => s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–';
  const ago = (s) => { if (!s) return '–'; const m = (Date.now() - new Date(s)) / 60000; if (m < 1) return 'just now'; if (m < 60) return `${Math.round(m)} min ago`; if (m < 1440) return `${Math.round(m / 60)} h ago`; return `${Math.round(m / 1440)} d ago`; };
  const name = (v) => [v.first_name, v.last_name].filter(Boolean).join(' ') || '(not registered)';
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }
  function csv(rows, cols, filename) {
    const q = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const out = [cols.map(c => q(c[0])).join(',')].concat(rows.map(r => cols.map(c => q(typeof c[1] === 'function' ? c[1](r) : r[c[1]])).join(','))).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(out); a.download = filename; a.click();
  }
  function hbars(el, items, { max, suffix = '', label = (k) => k } = {}) {
    if (!items.length) { el.innerHTML = '<div class="empty">No data yet</div>'; return; }
    const m = max ?? Math.max(...items.map(i => +i.n), 1);
    el.innerHTML = items.map(i => `<div class="hbar" title="${esc(label(i.key))}: ${fmt(i.n, 1)}${suffix}"><span class="lab">${esc(label(i.key))}</span><span class="trk"><span class="fil" style="width:${Math.max(1.5, 100 * i.n / m)}%"></span></span><span class="val">${fmt(i.n, 1)}${suffix}</span></div>`).join('');
  }
  function columns(el, days) {
    // grouped columns, 2 series, one y axis, hover tooltip
    const W = 560, H = 220, padL = 34, padB = 26, padT = 10, n = days.length;
    const max = Math.max(1, ...days.flatMap(d => [d.visitors, d.favorites]));
    const step = max <= 5 ? 1 : max <= 20 ? 5 : max <= 50 ? 10 : max <= 200 ? 50 : 100;
    const top = Math.ceil(max / step) * step;
    const y = (v) => padT + (H - padT - padB) * (1 - v / top);
    const slot = (W - padL) / n, bw = Math.min(14, (slot - 8) / 2);
    let g = '<g class="grid">';
    for (let v = 0; v <= top; v += step) g += `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    g += '</g>';
    let bars = '';
    days.forEach((d, i) => {
      const x0 = padL + i * slot + slot / 2;
      const lab = new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const r = (x, v, c) => { const h = Math.max(0, y(0) - y(v)); return v > 0 ? `<rect class="bar" x="${x}" y="${y(v)}" width="${bw}" height="${h}" fill="${c}" rx="${Math.min(4, h)}" ry="${Math.min(4, h)}"/><rect x="${x}" y="${y(0) - Math.min(4, h)}" width="${bw}" height="${Math.min(4, h)}" fill="${c}"/>` : ''; };
      bars += `<g data-i="${i}" data-tip="${esc(lab)}: ${d.visitors} visitors · ${d.favorites} favorites"><rect class="hit" x="${padL + i * slot}" y="${padT}" width="${slot}" height="${H - padT - padB}"/>${r(x0 - bw - 1, d.visitors, '#E07C0A')}${r(x0 + 1, d.favorites, '#2A9D8F')}${(i % 2 === n % 2 || n <= 8) ? `<text x="${x0}" y="${H - 8}" text-anchor="middle">${lab}</text>` : ''}</g>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}">${g}<g class="axis"><line x1="${padL}" x2="${W}" y1="${y(0)}" y2="${y(0)}"/></g>${bars}</svg><div class="tip"></div>`;
    const tip = el.querySelector('.tip');
    el.querySelectorAll('g[data-tip]').forEach(gr => {
      gr.addEventListener('mousemove', (e) => { const b = el.getBoundingClientRect(); tip.textContent = gr.dataset.tip; tip.style.left = (e.clientX - b.left) + 'px'; tip.style.top = (e.clientY - b.top) + 'px'; tip.classList.add('on'); });
      gr.addEventListener('mouseleave', () => tip.classList.remove('on'));
    });
  }
  function table(el, cols, rows, sortKey, onRow) {
    const [sk, dir] = sortKey;
    const th = cols.map(c => `<th class="${c.r ? 'r' : ''} ${c.key === sk ? 'on' + (dir < 0 ? ' asc' : '') : ''}" data-k="${c.key}">${c.label}</th>`).join('');
    const tr = rows.map((r, i) => `<tr class="row" data-i="${i}">${cols.map(c => `<td class="${c.r ? 'r' : ''}">${c.cell(r, i)}</td>`).join('')}</tr>`).join('');
    el.innerHTML = `<thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${cols.length}"><div class="empty">Nothing here yet</div></td></tr>`}</tbody>`;
    el.querySelectorAll('th').forEach(h => h.onclick = () => { const k = h.dataset.k; const cur = sortKey; sortKey[1] = cur[0] === k ? -cur[1] : 1; sortKey[0] = k; el.dispatchEvent(new CustomEvent('resort')); });
    if (onRow) el.querySelectorAll('tr.row').forEach(r => r.onclick = () => onRow(rows[+r.dataset.i]));
  }
  const sortRows = (rows, [k, d]) => rows.slice().sort((a, b) => { const x = a[k], y = b[k]; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'number' && typeof y === 'number' ? y - x : String(y).localeCompare(String(x))) * d; });

  // ---------- overview ----------
  async function loadOverview() {
    const [ov, feed, top] = await Promise.all([rpc('admin_overview', { p_exclude_test: S.excl }), rpc('admin_live_feed', { p_limit: 60, p_exclude_test: S.excl }), rpc('admin_product_stats', { p_exclude_test: S.excl })]);
    $('ovMeta').textContent = 'Updated ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const k = (l, v, s, cls = '') => `<div class="kpi ${cls}"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
    $('kpis').innerHTML =
      k('Active now', fmt(ov.active_now), 'seen in the last 3 min', 'live') +
      k('Registered', fmt(ov.visitors_registered), `${fmt(ov.visitors_total)} landed · ${fmt(ov.visitors_today)} today`) +
      k('Favorites', fmt(ov.favorites_total), `${fmt(ov.avg_favorites, 1)} per visitor`) +
      k('Products seen', fmt(ov.avg_seen), `avg of ${fmt(ov.products_active)} per visitor`) +
      k('Time on site', fmt(ov.avg_minutes, 1) + ' min', `avg per session · ${fmt(ov.sessions_total)} sessions`) +
      k('Top 25 saved', fmt(ov.top_picks_visitors), 'visitors who ranked');
    columns($('chDaily'), ov.daily || []);
    hbars($('chCountries'), (ov.countries || []).slice(0, 8).map(c => ({ key: c.country, n: c.n })), { label: (c) => flag(c) + ' ' + c });
    hbars($('chRes'), (ov.residence || []).map(c => ({ key: c.key, n: c.n })), { label: (k) => RES[k] || k });
    hbars($('chAge'), (ov.age || []).sort((a, b) => Object.keys(AGE).indexOf(a.key) - Object.keys(AGE).indexOf(b.key)).map(c => ({ key: c.key, n: c.n })), { label: (k) => AGE[k] || k });
    $('feed').innerHTML = feed.length ? feed.map(e => { const [ic, verb] = EV[e.type] || ['•', e.type]; const what = e.product_name ? `<b>${esc(e.product_name)}</b>` : e.category ? `<b>${esc(e.category)}</b>` : e.meta?.tab ? `<b>${esc(e.meta.tab)}</b>` : e.meta?.count != null ? `<b>${e.meta.count} picks</b>` : e.meta?.text ? `<b>${esc(e.meta.text)}</b>` : e.meta?.mode ? `<b>${esc(e.meta.mode)}</b>` : ''; return `<div class="ev"><span class="ic">${ic}</span><span><span class="who">${flag(e.country)} ${esc(e.visitor_name)}</span> ${verb} ${what}</span><span class="t" title="${dt(e.at)}">${ago(e.at)}</span></div>`; }).join('') : '<div class="empty">No activity yet. Share the link!</div>';
    const rows = top.slice(0, 10);
    table($('topTable'), [
      { key: 'rank', label: '#', cell: (r, i) => `<span class="rank ${i < 3 ? 'top' : ''}">${i + 1}</span>` },
      { key: 'name_en', label: 'Product', cell: r => `<div style="display:flex;gap:10px;align-items:center"><img class="thumb" src="${img(r.image_url)}" alt=""><div><div class="name">${esc(r.name_en)}</div><div class="sub">${esc(r.name_ar)}</div></div></div>` },
      { key: 'category', label: 'Category', cell: r => `<span class="tag">${esc(catName(r.category))}</span>` },
      { key: 'favorites', label: 'Favorites', r: true, cell: r => fmt(r.favorites) },
      { key: 'reach', label: 'Seen by', r: true, cell: r => fmt(r.reach) },
      { key: 'fav_rate', label: 'Fav rate', cell: r => `<div class="bar-cell"><span class="trk"><span class="fil heart" style="width:${Math.min(100, r.fav_rate)}%"></span></span><span class="num">${fmt(r.fav_rate, 1)}%</span></div>` },
      { key: 'top_picks', label: 'Top 25', r: true, cell: r => fmt(r.top_picks) },
      { key: 'score', label: 'Score', r: true, cell: r => `<b>${fmt(r.score, 1)}</b>` },
    ], rows, ['score', 1]);
  }

  // ---------- products ----------
  const catName = (k) => (S.cats.find(c => c.key === k) || {}).name_en || k;
  async function loadProducts() {
    const rows = await rpc('admin_product_stats', { p_exclude_test: S.excl, p_residence: $('fRes').value || null, p_age_band: $('fAge').value || null });
    S.products = rows; renderProducts();
  }
  function renderProducts() {
    const q = $('fSearch').value.trim().toLowerCase(), cat = $('fCat').value;
    const brand = $('fBrand').value;
    let rows = S.products.filter(p => (!cat || p.category === cat) && (!brand || p.brand === brand) && (!q || (p.name_en + ' ' + p.name_ar + ' ' + p.sku + ' ' + (p.brand || '')).toLowerCase().includes(q)));
    const brands = [...new Set(S.products.map(p => p.brand).filter(Boolean))].sort();
    if ($('fBrand').options.length !== brands.length + 1) $('fBrand').innerHTML = '<option value="">All brands</option>' + brands.map(b => `<option value="${esc(b)}" ${b === brand ? 'selected' : ''}>${esc(b)}</option>`).join('');
    rows = sortRows(rows, S.sort.products);
    $('prCount').textContent = `${rows.length} products`;
    $('prMeta').textContent = S.excl ? 'test visitors hidden' : 'including test visitors';
    const maxReach = Math.max(1, ...rows.map(r => r.reach));
    table($('prTable'), [
      { key: '_rank', label: '#', cell: (r, i) => `<span class="rank ${i < 3 && S.sort.products[0] === 'score' ? 'top' : ''}">${i + 1}</span>` },
      { key: 'name_en', label: 'Product', cell: r => `<div style="display:flex;gap:10px;align-items:center"><img class="thumb" src="${img(r.image_url)}" alt="" loading="lazy"><div><div class="name">${esc(r.name_en)}</div><div class="sub">${esc(r.name_ar)}</div></div></div>` },
      { key: 'brand', label: 'Brand', cell: r => r.brand ? `<b style="font-size:.78rem">${esc(r.brand)}</b>` : '<span class="muted">–</span>' },
      { key: 'category', label: 'Category', cell: r => `<span class="tag">${esc(catName(r.category))}</span>${r.sub_en ? ` <span class="muted" style="font-size:.74rem">${esc(r.sub_en)}</span>` : ''}` },
      { key: 'active', label: 'Live', cell: r => `<button class="btn sm ${r.active ? 'ghost' : ''}" data-toggle="${r.id}" title="${r.active ? 'Hide from visitors' : 'Show to visitors'}">${r.active ? 'On' : 'Off'}</button>` },
      { key: 'reach', label: 'Seen by', cell: r => `<div class="bar-cell"><span class="trk"><span class="fil" style="width:${100 * r.reach / maxReach}%"></span></span><span class="num">${fmt(r.reach)}</span></div>` },
      { key: 'favorites', label: 'Favorites', r: true, cell: r => `<b>${fmt(r.favorites)}</b>` },
      { key: 'fav_rate', label: 'Fav rate', cell: r => `<div class="bar-cell"><span class="trk"><span class="fil heart" style="width:${Math.min(100, r.fav_rate)}%"></span></span><span class="num">${fmt(r.fav_rate, 1)}%</span></div>` },
      { key: 'clicks', label: 'Opened', r: true, cell: r => fmt(r.clicks) },
      { key: 'passes', label: 'Passed', r: true, cell: r => r.passes ? `<span class="muted">${fmt(r.passes)}</span>` : '<span class="muted">–</span>' },
      { key: 'top_picks', label: 'Top 25', r: true, cell: r => fmt(r.top_picks) },
      { key: 'score', label: 'Score', r: true, cell: r => `<b>${fmt(r.score, 1)}</b>` },
    ], rows, S.sort.products);
    $('prTable').addEventListener('resort', renderProducts, { once: true });
    $('prTable').querySelectorAll('[data-toggle]').forEach(b => b.onclick = async (e) => { e.stopPropagation(); const id = +b.dataset.toggle; const p = S.products.find(x => x.id === id); await rest(`products?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) }); p.active = !p.active; toast(p.active ? 'Product is live' : 'Product hidden from visitors'); renderProducts(); });
  }

  // ---------- visitors ----------
  async function loadVisitors() { S.visitors = await rpc('admin_visitors', { p_exclude_test: S.excl }); renderVisitors(); }
  function renderVisitors() {
    const q = $('vSearch').value.trim().toLowerCase(), f = $('vFilter').value;
    let rows = S.visitors.filter(v => {
      if (f === 'registered' && !v.registered_at) return false;
      if (f === 'unregistered' && v.registered_at) return false;
      if (f === 'top' && !v.top_picks) return false;
      return !q || [v.first_name, v.last_name, v.email, v.phone, v.referral_code, v.country].join(' ').toLowerCase().includes(q);
    });
    rows = sortRows(rows, S.sort.visitors);
    $('viCount').textContent = `${rows.length} visitors`;
    $('viMeta').textContent = `${S.visitors.filter(v => v.registered_at).length} registered of ${S.visitors.length}`;
    table($('viTable'), [
      { key: 'last_name', label: 'Visitor', cell: v => `<div class="name">${v.last_seen_at && Date.now() - new Date(v.last_seen_at) < 180000 ? '<span class="dot"></span>' : ''}${esc(name(v))}${v.is_test ? ' <span class="tag test">test</span>' : ''}</div><div class="muted" style="font-size:.76rem">${esc([v.email, v.phone].filter(Boolean).join(' · ') || '')}</div>` },
      { key: 'country', label: 'Country', cell: v => `${flag(v.country)} ${esc(v.country || '?')}` },
      { key: 'residence', label: 'Lives in', cell: v => v.residence ? `<span class="tag">${RES[v.residence] || v.residence}</span>` : '<span class="muted">–</span>' },
      { key: 'age_band', label: 'Age', cell: v => AGE[v.age_band] || '<span class="muted">–</span>' },
      { key: 'created_at', label: 'First seen', cell: v => dt(v.created_at) },
      { key: 'last_seen_at', label: 'Last seen', cell: v => `<span title="${dt(v.last_seen_at)}">${ago(v.last_seen_at)}</span>` },
      { key: 'sessions', label: 'Visits', r: true, cell: v => fmt(v.sessions) },
      { key: 'minutes', label: 'Minutes', r: true, cell: v => fmt(v.minutes, 1) },
      { key: 'seen', label: 'Seen', r: true, cell: v => fmt(v.seen) },
      { key: 'clicks', label: 'Opened', r: true, cell: v => fmt(v.clicks) },
      { key: 'favorites', label: '❤', r: true, cell: v => `<b>${fmt(v.favorites)}</b>` },
      { key: 'top_picks', label: 'Top 25', r: true, cell: v => v.top_picks ? `<span class="tag ok">${v.top_picks}</span>` : '<span class="muted">–</span>' },
      { key: 'referred_by_name', label: 'Invited by', cell: v => esc(v.referred_by_name || (v.referred_by ? v.referred_by : '')) || '<span class="muted">–</span>' },
      { key: 'invited', label: 'Invited', r: true, cell: v => fmt(v.invited) },
    ], rows, S.sort.visitors, openVisitor);
    $('viTable').addEventListener('resort', renderVisitors, { once: true });
  }
  async function openVisitor(v) {
    const d = $('drawer'); d.innerHTML = '<div class="empty">Loading…</div>'; $('drawerBg').classList.add('on'); d.classList.add('on');
    let x; try { x = await rpc('admin_visitor_detail', { p_visitor: v.id }); } catch (e) { d.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    const vv = x.visitor;
    const mini = (list, ranked) => list.length ? `<div class="mini">${list.map((p, i) => `<div class="p"><img src="${img(p.image_url)}" alt="" loading="lazy">${ranked ? `<span class="rk">${p.rank}</span>` : ''}<div class="n">${esc(p.name_en)}${p.n ? ` <span class="muted">×${p.n}</span>` : ''}</div></div>`).join('')}</div>` : '<div class="empty">None yet</div>';
    d.innerHTML = `
      <button class="x" id="drawerX">✕</button>
      <h2>${esc(name(vv))} ${vv.is_test ? '<span class="tag test">test</span>' : ''}</h2>
      <div class="sub">${flag(vv.country)} ${esc(vv.country || '?')} · ${RES[vv.residence] || '–'} · ${AGE[vv.age_band] || '–'} · ${vv.lang === 'ar' ? 'Arabic' : 'English'} UI</div>
      <div class="card"><div class="kv">
        <b>Email</b><span>${esc(vv.email || '–')}</span><b>Phone</b><span>${esc(vv.phone || '–')}</span>
        <b>First seen</b><span>${dt(vv.created_at)}</span><b>Registered</b><span>${dt(vv.registered_at)}</span><b>Last seen</b><span>${dt(vv.last_seen_at)} (${ago(vv.last_seen_at)})</span>
        <b>Invite code</b><span>${esc(vv.referral_code)} · share link <code>jejat.com/beta/?r=${esc(vv.referral_code)}</code></span><b>Invited by</b><span>${esc(v.referred_by_name || vv.referred_by || '–')}</span>
        <b>Products seen</b><span>${fmt(x.seen_count)}</span>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px"><button class="btn ghost sm" id="drawerTest">${vv.is_test ? 'Unmark test visitor' : 'Mark as test visitor'}</button></div></div>
      <div class="card"><h3>Top 25 <small>${x.top_picks.length} ranked</small></h3>${mini(x.top_picks, true)}</div>
      <div class="card"><h3>Favorites <small>${x.favorites.length}</small></h3>${mini(x.favorites)}</div>
      <div class="card"><h3>Opened <small>${x.clicked.length} products</small></h3>${mini(x.clicked)}</div>
      <div class="card"><h3>Sessions <small>${x.sessions.length}</small></h3><div class="timeline">${x.sessions.map(s => `<div><span class="t">${dt(s.started_at)}</span><span>${Math.max(1, Math.round((new Date(s.last_seen_at) - new Date(s.started_at)) / 60000))} min · ${esc(s.device || '?')} · ${flag(s.country)} · ${esc(s.screen || '')} ${s.referrer ? '· from ' + esc(s.referrer) : ''}</span></div>`).join('') || '<div class="empty">–</div>'}</div></div>
      <div class="card"><h3>Timeline <small>latest ${x.events.length} events</small></h3><div class="timeline">${x.events.map(e => { const [ic, verb] = EV[e.type] || ['•', e.type]; const p = e.product_id ? (S.products.find(q => q.id === e.product_id) || {}).name_en || ('#' + e.product_id) : ''; return `<div><span class="t">${new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span><span>${ic} ${verb} ${esc(p || e.category || (e.meta?.tab || '') || (e.meta?.lang || '') || (e.meta?.count != null ? e.meta.count + ' picks' : ''))}</span></div>`; }).join('')}</div></div>`;
    $('drawerX').onclick = closeDrawer;
    $('drawerTest').onclick = async () => { await rest(`visitors?id=eq.${vv.id}`, { method: 'PATCH', body: JSON.stringify({ is_test: !vv.is_test }) }); toast(vv.is_test ? 'Unmarked' : 'Marked as test'); closeDrawer(); loadVisitors(); };
  }
  function closeDrawer() { $('drawerBg').classList.remove('on'); $('drawer').classList.remove('on'); }

  // ---------- categories ----------
  async function loadCategories() {
    const [rows, sugg] = await Promise.all([rpc('admin_category_stats', { p_exclude_test: S.excl }), rpc('admin_suggestions', { p_exclude_test: S.excl })]);
    hbars($('chCatRate'), rows.map(r => ({ key: r.key, n: +r.fav_rate })), { suffix: '%', label: catName });
    hbars($('chCatTop'), rows.map(r => ({ key: r.key, n: +r.top_picks })), { label: catName });
    $('caMeta').textContent = `${sugg.length} suggestions`;
    $('suggList').innerHTML = sugg.length ? sugg.map(x => `<div class="ev"><span class="ic">💭</span><span><b>${esc(x.text)}</b> <span class="muted">· ${esc(catName(x.category))} · ${esc(x.visitor_name)}${x.residence ? ' · ' + (RES[x.residence] || x.residence) : ''}</span></span><span class="t" title="${dt(x.at)}">${ago(x.at)}</span></div>`).join('') : '<div class="empty">No suggestions yet</div>';
    table($('caTable'), [
      { key: 'name_en', label: 'Category', cell: r => `${r.emoji || ''} <b>${esc(r.name_en)}</b> <span class="sub" style="display:inline">${esc(r.name_ar)}</span>` },
      { key: 'products', label: 'Products', r: true, cell: r => fmt(r.products) },
      { key: 'reach', label: 'Views', r: true, cell: r => fmt(r.reach) },
      { key: 'favorites', label: 'Favorites', r: true, cell: r => `<b>${fmt(r.favorites)}</b>` },
      { key: 'fav_rate', label: 'Fav rate', r: true, cell: r => fmt(r.fav_rate, 1) + '%' },
      { key: 'clicks', label: 'Opened', r: true, cell: r => fmt(r.clicks) },
      { key: 'top_picks', label: 'Top 25 picks', r: true, cell: r => fmt(r.top_picks) },
      { key: 'completed', label: 'Finished it', r: true, cell: r => fmt(r.completed) },
      { key: 'optouts', label: 'Not for me', r: true, cell: r => r.optouts ? `<span class="tag test">${fmt(r.optouts)}</span>` : '<span class="muted">–</span>' },
      { key: 'suggestions', label: 'Suggestions', r: true, cell: r => fmt(r.suggestions) },
    ], rows, ['fav_rate', 1]);
  }

  // ---------- routing ----------
  const loaders = { overview: loadOverview, products: loadProducts, visitors: loadVisitors, categories: loadCategories };
  async function show(page) {
    S.page = page; location.hash = page;
    document.querySelectorAll('.nav[data-page]').forEach(b => b.classList.toggle('on', b.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'page-' + page));
    try { await loaders[page](); } catch (e) { console.error(e); toast(e.message.includes('401') || e.message.includes('JWT') ? 'Session expired, sign in again' : 'Could not load: ' + e.message); if (/401|JWT/.test(e.message)) logout(); }
  }
  async function start() {
    $('login').hidden = true; $('app').hidden = false;
    $('who').textContent = S.session.user?.email || '';
    S.cats = await rest('categories?select=key,name_en,name_ar,emoji&order=sort', { headers: { Prefer: '' } });
    $('fCat').innerHTML = '<option value="">All categories</option>' + S.cats.map(c => `<option value="${c.key}">${c.emoji || ''} ${esc(c.name_en)}</option>`).join('');
    if (!S.products.length) rpc('admin_product_stats', { p_exclude_test: false }).then(r => S.products = r).catch(() => {});
    show(location.hash.replace('#', '') in loaders ? location.hash.replace('#', '') : 'overview');
    clearInterval(S.timer); S.timer = setInterval(() => { if (S.page === 'overview' && document.visibilityState === 'visible') loadOverview().catch(() => {}); }, 60000);
  }

  // ---------- wire ----------
  $('loginForm').onsubmit = async (e) => {
    e.preventDefault(); $('lErr').textContent = ''; $('lBtn').disabled = true;
    try { await login($('lEmail').value.trim(), $('lPass').value); await start(); } catch (ex) { $('lErr').textContent = ex.message; }
    $('lBtn').disabled = false;
  };
  $('logout').onclick = logout;
  document.querySelectorAll('.nav[data-page]').forEach(b => b.onclick = () => show(b.dataset.page));
  $('exclTest').onchange = () => { S.excl = $('exclTest').checked; show(S.page); };
  $('ovRefresh').onclick = () => show('overview');
  ['fRes', 'fAge'].forEach(id => $(id).onchange = loadProducts);
  ['fCat'].forEach(id => $(id).onchange = renderProducts);
  $('fSearch').oninput = renderProducts; $('fBrand').onchange = renderProducts;
  $('vFilter').onchange = renderVisitors; $('vSearch').oninput = renderVisitors;
  $('prCsv').onclick = () => csv(sortRows(S.products, S.sort.products), [['rank', (r) => S.products.indexOf(r) + 1], ['sku', 'sku'], ['brand', 'brand'], ['name_en', 'name_en'], ['step', 'sub_en'], ['live', 'active'], ['name_ar', 'name_ar'], ['category', 'category'], ['seen_by', 'reach'], ['favorites', 'favorites'], ['fav_rate_pct', 'fav_rate'], ['opened', 'clicks'], ['passed', 'passes'], ['top25_picks', 'top_picks'], ['score', 'score'], ['supplier_link', 'source_url']], `jejat-products-${new Date().toISOString().slice(0, 10)}.csv`);
  $('viCsv').onclick = () => csv(S.visitors, [['first_name', 'first_name'], ['last_name', 'last_name'], ['email', 'email'], ['phone', 'phone'], ['residence', 'residence'], ['age', 'age_band'], ['country', 'country'], ['registered_at', 'registered_at'], ['last_seen_at', 'last_seen_at'], ['visits', 'sessions'], ['minutes', 'minutes'], ['seen', 'seen'], ['opened', 'clicks'], ['favorites', 'favorites'], ['top25', 'top_picks'], ['invite_code', 'referral_code'], ['invited_by', 'referred_by_name'], ['is_test', 'is_test']], `jejat-visitors-${new Date().toISOString().slice(0, 10)}.csv`);
  $('drawerBg').onclick = closeDrawer;
  addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  addEventListener('hashchange', () => { const p = location.hash.replace('#', ''); if (p in loaders && p !== S.page && S.session) show(p); });

  const saved = store.get('jejat_admin');
  if (saved?.access_token) { S.session = saved; start().catch(() => logout()); }
})();
