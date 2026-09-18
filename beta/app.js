/* Jejat beta study — visitor app (no framework, no SDK: plain fetch to Supabase RPC) */
(() => {
  'use strict';

  const SUPA_URL = 'https://mbzzbfvletthtvixdxxm.supabase.co';
  const SUPA_KEY = 'sb_publishable_1KLmNT9BdmikAfZM5YG2GA_4Gmqy2fD';
  const SITE_ROOT = location.origin + (location.pathname.replace(/beta\/?.*$/, ''));
  const SHARE_URL = 'https://jejat.com/beta/';
  const TOP_MAX = 25;
  const CHUNK = 30;

  // ---------- copy ----------
  const I18N = {
    ar: {
      loading: 'عم نحضّر المنتجات…',
      welcome_title: 'أهلاً فيكِ بجيجات 🧡',
      welcome_sub: 'خلينا نعرف شو بتحبي. اختاري كل منتج بتتمني يوصل لعندك بحلب، ونحنا منجيبه.',
      first_name: 'الاسم الأول', last_name: 'الكنية', phone: 'رقم الموبايل', email: 'الإيميل', optional: '(اختياري)',
      residence: 'وين ساكنة؟', age: 'عمرك؟',
      res_aleppo: 'حلب', res_damascus: 'دمشق', res_syria_other: 'مدينة سورية ثانية', res_abroad: 'خارج سوريا',
      age_18_24: '18 – 24', age_25_34: '25 – 34', age_35_44: '35 – 44', age_45_plus: '45+',
      start: 'يلا نبلش ✨',
      privacy: 'معلوماتك بتضل عنا وما منشاركها مع حدا.',
      err_names: 'الاسم الأول والكنية مطلوبين 🙏', err_email: 'الإيميل مو صحيح', err_res: 'اختاري وين ساكنة', err_age: 'اختاري عمرك', err_net: 'ما قدرنا نحفظ، جرّبي كمان مرة',
      greet: 'أهلاً <em>{name}</em> ✨', greet_anon: 'أهلاً فيكِ ✨',
      tagline: 'دوسي على القلب لكل شي بيعجبك 🧡',
      seen: 'شفتي {n} من {total}',
      all: 'الكل',
      discover: 'اكتشفي', favorites: 'المفضلة', share: 'شاركي',
      fav_title: 'مفضلاتك',
      fav_empty: 'لسا ما اخترتي شي… دوسي على القلب لأول شي بيعجبك!',
      top_cta_title: 'اختاري أهم 25', top_cta_sub: 'من مفضلاتك، شو أكتر 25 شي بدك ياهن يوصلوا لحلب أول؟', top_cta_btn: 'يلا',
      top_pick_mode: 'دوسي على المنتجات بالترتيب اللي بتحبيه', top_save: 'احفظي', cancel: 'إلغاء',
      top_edit: 'عدّلي أهم 25', top_saved: 'تم! ذوقك رح يوصل لحلب 🎉', top_min: 'اختاري على الأقل منتج واحد',
      add_fav: 'أضيفي للمفضلة', remove_fav: 'بالمفضلة ♥',
      share_text: 'شوفي جيجات 🧡 اختاري المنتجات اللي بتحبي توصل لحلب: {url}',
      link_copied: 'تم نسخ الرابط 🔗',
      end_all: 'هي كل المنتجات لهلق! شوفي مفضلاتك 🧡',
      m_start: 'بلشتي منيح! كمّلي 😍', m_half: 'نص الطريق! ذوقك حلو 🧡', m_all: 'شفتي كل شي! يلا اختاري أهم 25 🎉',
      m_fav10: 'عشر مفضلات! عم نسجّل ذوقك 📝', m_fav25: '25 مفضلة! بتقدري تختاري أهم 25 هلق ✨',
      welcome_toast: 'أهلاً {name}! دوسي على القلب لكل شي بيعجبك',
      offline: 'ما في نت… رح نحفظ اختياراتك بس يرجع',
      cats: {}
    },
    en: {
      loading: 'Preparing the products…',
      welcome_title: 'Welcome to Jejat 🧡',
      welcome_sub: 'Help us learn what you love. Pick every product you wish could reach you in Aleppo, and we will bring it.',
      first_name: 'First name', last_name: 'Last name', phone: 'Phone number', email: 'Email', optional: '(optional)',
      residence: 'Where do you live?', age: 'Your age?',
      res_aleppo: 'Aleppo', res_damascus: 'Damascus', res_syria_other: 'Elsewhere in Syria', res_abroad: 'Outside Syria',
      age_18_24: '18 – 24', age_25_34: '25 – 34', age_35_44: '35 – 44', age_45_plus: '45+',
      start: "Let's go ✨",
      privacy: 'Your details stay with us and are never shared.',
      err_names: 'First and last name are required 🙏', err_email: 'That email looks wrong', err_res: 'Pick where you live', err_age: 'Pick your age range', err_net: 'Could not save, please try again',
      greet: 'Hi <em>{name}</em> ✨', greet_anon: 'Welcome ✨',
      tagline: 'Tap the heart on everything you love 🧡',
      seen: 'Seen {n} of {total}',
      all: 'All',
      discover: 'Discover', favorites: 'Favorites', share: 'Share',
      fav_title: 'Your favorites',
      fav_empty: 'Nothing yet… tap the heart on the first thing you love!',
      top_cta_title: 'Pick your top 25', top_cta_sub: 'From your favorites, which 25 should reach Aleppo first?', top_cta_btn: 'Go',
      top_pick_mode: 'Tap products in the order you love them', top_save: 'Save', cancel: 'Cancel',
      top_edit: 'Edit top 25', top_saved: 'Saved! Your taste is on its way to Aleppo 🎉', top_min: 'Pick at least one product',
      add_fav: 'Add to favorites', remove_fav: 'In favorites ♥',
      share_text: 'Check out Jejat 🧡 pick the products you want delivered in Aleppo: {url}',
      link_copied: 'Link copied 🔗',
      end_all: "That's every product for now! Check your favorites 🧡",
      m_start: 'Great start! Keep going 😍', m_half: 'Halfway there! Nice taste 🧡', m_all: "You've seen everything! Now pick your top 25 🎉",
      m_fav10: 'Ten favorites! We are taking notes 📝', m_fav25: '25 favorites! You can pick your top 25 now ✨',
      welcome_toast: 'Hi {name}! Tap the heart on everything you love',
      offline: 'No connection… we will save your picks when it is back',
      cats: {}
    }
  };
  const RES = ['aleppo', 'damascus', 'syria_other', 'abroad'];
  const AGE = ['18_24', '25_34', '35_44', '45_plus'];

  // ---------- state ----------
  const S = {
    lang: 'ar', vid: null, session: null, profile: null,
    cats: [], products: [], byId: new Map(), order: [],
    favorites: new Set(), favOrder: [], topPicks: [], seen: new Set(),
    cat: 'all', rendered: 0, list: [],
    picking: false, picks: [],
    sheetList: [], sheetIdx: -1,
    pendingImps: [], impTimers: new Map(),
    isTest: false, ref: null, online: true
  };
  const $ = (id) => document.getElementById(id);
  const t = (k, vars) => {
    let s = (I18N[S.lang][k] ?? I18N.en[k] ?? k);
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll('{' + a + '}', b);
    return s;
  };
  const catName = (c) => S.lang === 'ar' ? c.name_ar : c.name_en;
  const pName = (p) => S.lang === 'ar' ? p.name_ar : p.name_en;
  const catOf = (p) => S.cats.find(c => c.key === p.category) || { key: p.category, name_ar: p.category, name_en: p.category, emoji: '' };
  const imgUrl = (p) => /^https?:/.test(p.image_url) ? p.image_url : SITE_ROOT + p.image_url;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ---------- network ----------
  async function rpc(fn, params, opts = {}) {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST', keepalive: !!opts.keepalive,
      headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    if (!r.ok) { const e = await r.text().catch(() => ''); throw new Error(`${fn} ${r.status} ${e}`); }
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }
  async function rest(path) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: { apikey: SUPA_KEY } });
    if (!r.ok) throw new Error(path + ' ' + r.status);
    return r.json();
  }
  const track = (type, product, category, meta) =>
    rpc('log_event', { p_visitor: S.vid, p_session: S.session, p_type: type, p_product: product ?? null, p_category: category ?? null, p_meta: meta ?? null }).catch(() => {});

  // ---------- seeded shuffle (same order for the same visitor, different across visitors) ----------
  function seedFrom(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  function shuffled(arr, seed) { const r = mulberry32(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- language ----------
  function applyLang(lang, log) {
    S.lang = lang; store.set('jejat_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = t(el.dataset.i); });
    document.querySelectorAll('.lang-pill span').forEach(s => s.classList.toggle('on', s.dataset.l === lang));
    renderChips(); renderOptions(); updateGreeting(); updateProgress(); updateFavUI();
    document.querySelectorAll('#grid .card, #favGrid .card').forEach(card => {
      const p = S.byId.get(+card.dataset.id); if (!p) return;
      card.querySelector('.name').textContent = pName(p);
      const c = catOf(p); card.querySelector('.cat').textContent = `${c.emoji || ''} ${catName(c)}`.trim();
    });
    if (S.sheetIdx >= 0) fillSheet();
    if (log) track('lang', null, null, { lang });
  }

  // ---------- welcome form ----------
  function renderOptions() {
    const mk = (id, keys, prefix) => {
      const box = $(id); const cur = box.dataset.value || '';
      box.innerHTML = '';
      keys.forEach(k => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'opt-chip' + (cur === k ? ' on' : '');
        b.textContent = t(prefix + k); b.dataset.v = k;
        b.onclick = () => { box.dataset.value = k; box.querySelectorAll('.opt-chip').forEach(x => x.classList.toggle('on', x === b)); };
        box.appendChild(b);
      });
    };
    mk('resOpts', RES, 'res_'); mk('ageOpts', AGE, 'age_');
  }
  async function submitWelcome(e) {
    e.preventDefault();
    const first = $('fFirst').value.trim(), last = $('fLast').value.trim();
    const email = $('fEmail').value.trim(), phone = $('fPhone').value.trim();
    const res = $('resOpts').dataset.value || '', age = $('ageOpts').dataset.value || '';
    const err = $('werr');
    $('fFirst').classList.toggle('bad', !first); $('fLast').classList.toggle('bad', !last);
    if (!first || !last) { err.textContent = t('err_names'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = t('err_email'); $('fEmail').classList.add('bad'); return; }
    $('fEmail').classList.remove('bad');
    if (!res) { err.textContent = t('err_res'); return; }
    if (!age) { err.textContent = t('err_age'); return; }
    err.textContent = '';
    const btn = e.target.querySelector('.go'); btn.disabled = true;
    try {
      S.profile = await rpc('register_visitor', { p_visitor: S.vid, p_session: S.session, p_first: first, p_last: last, p_email: email || null, p_phone: phone || null, p_residence: res, p_age_band: age, p_lang: S.lang });
      closeWelcome();
      toast(t('welcome_toast', { name: first }), true);
    } catch (ex) { err.textContent = t('err_net'); console.error(ex); }
    btn.disabled = false;
  }
  function closeWelcome() { $('welcome').classList.add('off'); document.body.classList.remove('locked'); updateGreeting(); }

  // ---------- chips ----------
  function renderChips() {
    const box = $('chips'); box.innerHTML = '';
    const counts = {}; S.products.forEach(p => counts[p.category] = (counts[p.category] || 0) + 1);
    const mk = (key, label, emoji, n) => {
      const b = document.createElement('button'); b.className = 'chip' + (S.cat === key ? ' on' : '');
      if (key !== 'all') b.style.setProperty('--tint', `var(--tint-${key}, var(--cream))`);
      b.innerHTML = `<span class="em">${emoji}</span><span>${label}</span><span class="cnt">${n}</span>`;
      b.onclick = () => setCategory(key, b);
      box.appendChild(b);
    };
    mk('all', t('all'), '✨', S.products.length);
    S.cats.forEach(c => mk(c.key, catName(c), c.emoji || '', counts[c.key] || 0));
  }
  function setCategory(key, btn) {
    if (S.cat === key) return;
    S.cat = key;
    document.querySelectorAll('#chips .chip').forEach(c => c.classList.toggle('on', c === btn));
    btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    track('category', null, key === 'all' ? null : key);
    renderGrid();
    window.scrollTo({ top: Math.min(window.scrollY, $('viewDiscover').offsetTop + 80), behavior: 'smooth' });
  }

  // ---------- cards ----------
  function makeCard(p, opts = {}) {
    const c = catOf(p);
    const card = document.createElement('article'); card.className = 'card'; card.dataset.id = p.id;
    card.style.setProperty('--tint', `var(--tint-${p.category}, var(--cream))`);
    card.innerHTML = `
      <button class="ph" aria-label="${pName(p)}"><img alt="" loading="lazy" decoding="async" width="800" height="800"></button>
      <button class="heart${S.favorites.has(p.id) ? ' on' : ''}" aria-label="favorite"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.1C.7 8.2 3.1 4.5 6.8 4.5c2 0 3.4 1 4.2 2.3.8-1.3 2.2-2.3 4.2-2.3 3.7 0 6.1 3.7 4.4 7.4C19.5 16.4 12 21 12 21z"/></svg></button>
      <div class="body"><p class="name">${pName(p)}</p><span class="cat">${c.emoji || ''} ${catName(c)}</span></div>`;
    const img = card.querySelector('img'); const ph = card.querySelector('.ph');
    img.onload = () => { img.classList.add('ok'); ph.classList.add('loaded'); };
    img.onerror = () => ph.classList.add('loaded');
    img.src = imgUrl(p);
    ph.onclick = () => { if (S.picking) return togglePick(p, card); openSheet(p, opts.list || S.list); };
    card.querySelector('.heart').onclick = (e) => { e.stopPropagation(); toggleFav(p, card.querySelector('.heart')); };
    if (S.picking) card.onclick = (e) => { if (!e.target.closest('.ph')) togglePick(p, card); };
    return card;
  }
  function renderGrid() {
    const grid = $('grid'); grid.innerHTML = ''; S.rendered = 0;
    S.list = S.cat === 'all' ? S.order : S.order.filter(p => p.category === S.cat);
    $('endNote').hidden = true;
    renderMore();
  }
  function renderMore() {
    const grid = $('grid'); const frag = document.createDocumentFragment();
    const end = Math.min(S.rendered + CHUNK, S.list.length);
    for (let i = S.rendered; i < end; i++) { const card = makeCard(S.list[i]); frag.appendChild(card); observe(card); }
    S.rendered = end; grid.appendChild(frag);
    if (S.rendered >= S.list.length && S.list.length) $('endNote').hidden = false;
  }

  // ---------- observers: reveal, impressions, infinite render ----------
  let revealObs, impObs, moreObs;
  function setupObservers() {
    revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -5% 0px' });
    impObs = new IntersectionObserver(es => es.forEach(e => {
      const id = +e.target.dataset.id;
      if (e.isIntersecting) {
        if (S.seen.has(id) || S.impTimers.has(id)) return;
        S.impTimers.set(id, setTimeout(() => { S.impTimers.delete(id); markSeen(id); impObs.unobserve(e.target); }, 600));
      } else if (S.impTimers.has(id)) { clearTimeout(S.impTimers.get(id)); S.impTimers.delete(id); }
    }), { threshold: 0.6 });
    moreObs = new IntersectionObserver(es => { if (es[0].isIntersecting && S.rendered < S.list.length) renderMore(); }, { rootMargin: '600px 0px' });
    moreObs.observe($('sentinel'));
  }
  function observe(card) { revealObs.observe(card); if (!S.seen.has(+card.dataset.id) && !S.picking) impObs.observe(card); }
  function markSeen(id) {
    if (S.seen.has(id)) return;
    S.seen.add(id); S.pendingImps.push(id); updateProgress(); checkMilestones();
  }
  async function flushImps(keepalive) {
    if (!S.pendingImps.length || !S.vid) return;
    const batch = S.pendingImps.splice(0);
    try { await rpc('log_impressions', { p_visitor: S.vid, p_products: batch }, { keepalive }); }
    catch { S.pendingImps.unshift(...batch); }
  }
  setInterval(() => flushImps(false), 3000);
  setInterval(() => { if (document.visibilityState === 'visible' && S.session) rpc('heartbeat', { p_visitor: S.vid, p_session: S.session }).catch(() => {}); }, 30000);
  addEventListener('pagehide', () => flushImps(true));
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushImps(true); });

  // ---------- progress, greeting, milestones ----------
  function updateProgress() {
    const total = S.products.length || 1, n = Math.min(S.seen.size, total), pct = Math.round(100 * n / total);
    $('progFill').style.width = pct + '%';
    $('walker').style.insetInlineStart = pct + '%';
    $('progLabel').textContent = t('seen', { n, total });
  }
  function updateGreeting() {
    const name = S.profile?.first_name;
    $('greet').innerHTML = name ? t('greet', { name }) : t('greet_anon');
    $('tagline').textContent = t('tagline');
  }
  function checkMilestones() {
    const total = S.products.length, n = S.seen.size, shown = store.get('jejat_ms', {});
    const fire = (k, msg) => { if (shown[k]) return; shown[k] = 1; store.set('jejat_ms', shown); toast(msg, true); };
    if (total >= 20 && n >= Math.ceil(total * 0.1) && n < total * 0.5) fire('start', t('m_start'));
    if (n >= Math.ceil(total * 0.5) && n < total) fire('half', t('m_half'));
    if (n >= total) fire('all', t('m_all'));
    const f = S.favorites.size;
    if (f === 10) fire('fav10', t('m_fav10'));
    if (f === 25) fire('fav25', t('m_fav25'));
  }

  // ---------- favorites ----------
  async function toggleFav(p, heartEl) {
    const was = S.favorites.has(p.id);
    if (was) { S.favorites.delete(p.id); S.favOrder = S.favOrder.filter(x => x !== p.id); S.topPicks = S.topPicks.filter(x => x !== p.id); }
    else { S.favorites.add(p.id); S.favOrder.push(p.id); }
    syncHearts(p.id, !was, heartEl);
    updateFavUI(); if (!was) checkMilestones();
    try {
      const now = await rpc('toggle_favorite', { p_visitor: S.vid, p_session: S.session, p_product: p.id });
      if (now !== !was) { // server disagrees: resync
        if (now) { S.favorites.add(p.id); if (!S.favOrder.includes(p.id)) S.favOrder.push(p.id); } else { S.favorites.delete(p.id); S.favOrder = S.favOrder.filter(x => x !== p.id); }
        syncHearts(p.id, now); updateFavUI();
      }
    } catch (ex) {
      console.error(ex); toast(t('offline'));
      if (was) { S.favorites.add(p.id); S.favOrder.push(p.id); } else { S.favorites.delete(p.id); S.favOrder = S.favOrder.filter(x => x !== p.id); }
      syncHearts(p.id, was); updateFavUI();
    }
  }
  function syncHearts(id, on, sourceEl) {
    document.querySelectorAll(`.card[data-id="${id}"] .heart`).forEach(h => {
      h.classList.toggle('on', on);
      if (on) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); if (h === sourceEl || !sourceEl) sparkle(h); }
    });
    if (S.sheetIdx >= 0 && S.sheetList[S.sheetIdx]?.id === id) fillSheetHeart();
    if (on) { const pill = $('favPill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }
  function sparkle(el) {
    const colors = ['#E8446B', '#F7941D', '#FFD9AE', '#FF8FA3', '#FFC857'];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('span'); s.className = 'spark';
      const a = (i / 9) * Math.PI * 2 + Math.random() * .5, d = 26 + Math.random() * 18;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.setProperty('--c', colors[i % colors.length]);
      el.appendChild(s); setTimeout(() => s.remove(), 800);
    }
  }
  function updateFavUI() {
    const n = S.favorites.size;
    $('favCount').textContent = n; $('favCount2').textContent = n;
    $('favBadge').textContent = n; $('favBadge').hidden = n === 0;
    const has = S.topPicks.length > 0;
    $('topCta').hidden = S.picking || has || n < 3;
    $('topBtn').hidden = S.picking || !has;
    $('topBtn').textContent = t('top_edit');
    $('favEmpty').hidden = n > 0;
    if ($('viewFav').classList.contains('on')) renderFavGrid();
  }
  function renderFavGrid() {
    const grid = $('favGrid'); grid.innerHTML = '';
    const ranked = S.topPicks.filter(id => S.favorites.has(id));
    const rest = S.favOrder.filter(id => !ranked.includes(id)).slice().reverse();
    const ids = ranked.concat(rest);
    const list = ids.map(id => S.byId.get(id)).filter(Boolean);
    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = makeCard(p, { list }); card.classList.add('in');
      const r = S.picking ? S.picks.indexOf(p.id) : ranked.indexOf(p.id);
      if (r >= 0) { const b = document.createElement('span'); b.className = 'rank'; b.textContent = r + 1; card.appendChild(b); if (S.picking) card.classList.add('picked'); }
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  // ---------- top 25 picking ----------
  function startPicking() {
    S.picking = true; S.picks = S.topPicks.filter(id => S.favorites.has(id)).slice(0, TOP_MAX);
    $('pickbar').classList.add('on'); $('favGrid').classList.add('picking');
    updatePickCount(); updateFavUI();
    $('pickbar').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function stopPicking() { S.picking = false; S.picks = []; $('pickbar').classList.remove('on'); $('favGrid').classList.remove('picking'); updateFavUI(); }
  function togglePick(p, card) {
    const i = S.picks.indexOf(p.id);
    if (i >= 0) S.picks.splice(i, 1);
    else { if (S.picks.length >= TOP_MAX) { toast(`${TOP_MAX} / ${TOP_MAX} ✋`); return; } S.picks.push(p.id); }
    updatePickCount(); renderFavGrid();
  }
  function updatePickCount() { $('pickCount').textContent = `${S.picks.length} / ${TOP_MAX}`; $('pickSave').disabled = S.picks.length === 0; }
  async function savePicks() {
    if (!S.picks.length) { toast(t('top_min')); return; }
    const picks = S.picks.slice(); $('pickSave').disabled = true;
    try {
      await rpc('save_top_picks', { p_visitor: S.vid, p_session: S.session, p_products: picks });
      S.topPicks = picks; stopPicking(); confetti(); toast(t('top_saved'), true);
    } catch (ex) { console.error(ex); toast(t('offline')); $('pickSave').disabled = false; }
  }

  // ---------- product sheet ----------
  function openSheet(p, list) {
    S.sheetList = list; S.sheetIdx = list.indexOf(p);
    fillSheet(); $('sheetBg').classList.add('on'); $('sheet').classList.add('on'); document.body.classList.add('locked');
    track('click', p.id, p.category);
    markSeen(p.id);
  }
  function fillSheet() {
    const p = S.sheetList[S.sheetIdx]; if (!p) return; const c = catOf(p);
    $('sheetImg').src = imgUrl(p); $('sheetImg').alt = pName(p);
    $('sheetName').textContent = pName(p);
    $('sheetSub').textContent = S.lang === 'ar' ? p.name_en : p.name_ar;
    $('sheetCat').textContent = `${c.emoji || ''} ${catName(c)}`.trim();
    $('sheetCat').style.setProperty('--tint', `var(--tint-${p.category}, var(--cream))`);
    $('sheetPrev').hidden = S.sheetIdx <= 0; $('sheetNext').hidden = S.sheetIdx >= S.sheetList.length - 1;
    fillSheetHeart();
  }
  function fillSheetHeart() {
    const p = S.sheetList[S.sheetIdx]; if (!p) return;
    const on = S.favorites.has(p.id);
    $('sheetHeart').classList.toggle('on', on); $('sheetHeartLabel').textContent = on ? t('remove_fav') : t('add_fav');
  }
  function closeSheet() { $('sheetBg').classList.remove('on'); $('sheet').classList.remove('on'); if ($('welcome').classList.contains('off')) document.body.classList.remove('locked'); S.sheetIdx = -1; }
  function sheetStep(d) {
    const i = S.sheetIdx + d; if (i < 0 || i >= S.sheetList.length) return;
    S.sheetIdx = i; fillSheet(); const p = S.sheetList[i]; track('click', p.id, p.category, { via: 'swipe' }); markSeen(p.id);
  }

  // ---------- views ----------
  function showView(name) {
    const fav = name === 'fav';
    $('viewDiscover').classList.toggle('on', !fav); $('viewFav').classList.toggle('on', fav);
    $('dockDiscover').classList.toggle('on', !fav); $('dockFav').classList.toggle('on', fav);
    $('progress').style.visibility = fav ? 'hidden' : '';
    if (fav) renderFavGrid(); else if (S.picking) stopPicking();
    window.scrollTo({ top: 0 });
    track('tab', null, null, { tab: name });
  }
  async function share() {
    const url = SHARE_URL + (S.profile?.referral_code ? '?r=' + S.profile.referral_code : '');
    const text = t('share_text', { url });
    track('share');
    if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  // ---------- toasts & confetti ----------
  function toast(msg, mascot) {
    const box = $('toasts'); const el = document.createElement('div'); el.className = 'toast' + (mascot ? '' : ' plain');
    el.innerHTML = (mascot ? '<img src="../assets/chicken-logo.png" alt="">' : '') + '<span></span>'; el.querySelector('span').textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('bye'); setTimeout(() => el.remove(), 450); }, 3600);
  }
  function confetti() {
    const cv = $('confetti'); cv.hidden = false; const ctx = cv.getContext('2d');
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ['#F7941D', '#E8446B', '#FFD9AE', '#CE2029', '#FFC857', '#FBE3DC'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 14, vy: -8 - Math.random() * 12, r: 4 + Math.random() * 5, c: colors[Math.random() * colors.length | 0], a: Math.random() * 6, s: (Math.random() - .5) * .3 }));
    const t0 = performance.now();
    (function frame(now) {
      const dt = (now - t0) / 1000; ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.s; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - dt / 2.6); ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); });
      if (dt < 2.8) requestAnimationFrame(frame); else { cv.hidden = true; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    })(t0);
  }

  // ---------- boot ----------
  function deviceType() { const ua = navigator.userAgent; if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return 'tablet'; return /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop'; }
  function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

  async function boot() {
    const q = new URLSearchParams(location.search);
    S.lang = q.get('lang') || store.get('jejat_lang', 'ar');
    if (q.get('r')) store.set('jejat_ref', q.get('r').toUpperCase());
    if (q.get('test') === '1') store.set('jejat_test', true);
    S.ref = store.get('jejat_ref', null); S.isTest = store.get('jejat_test', false);
    S.vid = store.get('jejat_vid', null) || uuid(); store.set('jejat_vid', S.vid);
    applyLang(S.lang, false);
    setupObservers();

    // wire UI
    $('langBtn').onclick = $('langBtn2').onclick = () => applyLang(S.lang === 'ar' ? 'en' : 'ar', true);
    $('wform').onsubmit = submitWelcome;
    $('favPill').onclick = () => showView('fav');
    $('dockDiscover').onclick = () => showView('discover');
    $('dockFav').onclick = () => showView('fav');
    $('dockShare').onclick = share;
    $('topStart').onclick = startPicking; $('topBtn').onclick = startPicking;
    $('pickCancel').onclick = stopPicking; $('pickSave').onclick = savePicks;
    $('sheetBg').onclick = closeSheet; $('sheetClose').onclick = closeSheet;
    $('sheetPrev').onclick = () => sheetStep(-1); $('sheetNext').onclick = () => sheetStep(1);
    $('sheetHeart').onclick = () => { const p = S.sheetList[S.sheetIdx]; if (p) toggleFav(p, null); };
    addEventListener('keydown', e => { if (S.sheetIdx < 0) return; if (e.key === 'Escape') closeSheet(); const rtl = S.lang === 'ar'; if (e.key === 'ArrowLeft') sheetStep(rtl ? 1 : -1); if (e.key === 'ArrowRight') sheetStep(rtl ? -1 : 1); });
    let tx = 0, ty = 0;
    $('sheet').addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    $('sheet').addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 50) sheetStep(dx < 0 ? (S.lang === 'ar' ? -1 : 1) : (S.lang === 'ar' ? 1 : -1));
      else if (dy > 90 && Math.abs(dx) < 60 && $('sheet').scrollTop === 0) closeSheet();
    }, { passive: true });

    // data
    const startVisit = () => rpc('start_visit', {
      p_visitor: S.vid, p_referred_by: S.ref, p_lang: S.lang, p_device: deviceType(), p_ua: navigator.userAgent,
      p_referrer: document.referrer || null, p_screen: `${screen.width}x${screen.height}`, p_is_test: S.isTest
    });
    try {
      const [cats, products, visit] = await Promise.all([
        rest('categories?select=key,name_en,name_ar,emoji,sort&order=sort'),
        rest('products?select=id,sku,category,name_en,name_ar,desc_en,desc_ar,image_url,sort&active=eq.true&order=sort'),
        startVisit().catch(async e => { console.warn('retry start_visit', e); await new Promise(r => setTimeout(r, 1500)); return startVisit(); })
      ]);
      S.cats = cats; S.products = products; products.forEach(p => S.byId.set(p.id, p));
      S.order = shuffled(products, seedFrom(S.vid));
      S.session = visit.session_id; S.profile = visit.profile;
      (visit.favorites || []).forEach(id => { S.favorites.add(id); S.favOrder.push(id); });
      S.topPicks = (visit.top_picks || []).filter(id => S.favorites.has(id));
      (visit.seen || []).forEach(id => S.seen.add(id));
      I18N.ar.cats = Object.fromEntries(cats.map(c => [c.key, c.name_ar])); I18N.en.cats = Object.fromEntries(cats.map(c => [c.key, c.name_en]));
    } catch (ex) {
      console.error(ex);
      $('loader').innerHTML = `<img src="../assets/chicken-logo.png" alt=""><div>${t('offline')}</div><button class="btn sm" style="margin-top:12px" onclick="location.reload()">↻</button>`;
      return;
    }
    $('loader').hidden = true;
    renderChips(); renderGrid(); updateProgress(); updateFavUI(); updateGreeting();
    if (S.profile?.registered) closeWelcome();
    else { $('welcome').classList.remove('off'); setTimeout(() => $('fFirst').focus({ preventScroll: true }), 400); }
  }
  boot();
})();
