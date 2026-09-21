/* Jejat beta study — visitor app v2 (category-first). No framework, plain fetch to Supabase RPC. */
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
      tagline: 'اختاري فئة وابدئي. كل فئة رحلة صغيرة 🧡',
      seen: 'شفتي {n} من {total}',
      products_n: '{n} منتج', of_n: '{a} من {b}',
      st_new: '✨ جديد', st_go: '🔥 كمّلي', st_done: '✓ خلصتي', st_off: 'مو إلي',
      skip_tip: 'مو إلي', unskip_tip: 'رجّعيها',
      discover: 'الفئات', favorites: 'المفضلة', share: 'شاركي',
      mode_grid: 'تصفّح', mode_quick: 'سريع: منتج منتج',
      quick_hint: 'اسحبي يمين إذا بتحبيه، يسار إذا لا',
      quick_love: 'بحبه', quick_pass: 'لا',
      all_sub: 'الكل',
      cat_done_title: 'خلصتي {cat}! 🎉', cat_done_sub: 'شفتي كل منتجات هي الفئة. يلا للفئة الجاية؟', cat_done_btn: 'رجعي للفئات',
      all_done_title: 'شفتي كل شي! 🎉', all_done_sub: 'ذوقك رح يقرر شو بيوصل لحلب. اختاري أهم 25 هلق', all_done_btn: 'اختاري أهم 25',
      missing_title: 'شو ناقص بـ{cat}؟ 💭', missing_sub: 'شي بتتمني نجيبه وما لقيتيه هون؟', missing_ph: 'اكتبي هون…', send: 'أرسلي', missing_thanks: 'شكراً! سجّلناها 🧡',
      fav_title: 'مفضلاتك',
      fav_empty: 'لسا ما اخترتي شي… دوسي على القلب لأول شي بيعجبك!',
      top_cta_title: 'اختاري أهم 25', top_cta_sub: 'من مفضلاتك، شو أكتر 25 شي بدك ياهن يوصلوا لحلب أول؟', top_cta_btn: 'يلا',
      top_pick_mode: 'دوسي على المنتجات بالترتيب اللي بتحبيه', top_save: 'احفظي', cancel: 'إلغاء',
      top_edit: 'عدّلي أهم 25', top_saved: 'تم! ذوقك رح يوصل لحلب 🎉', top_min: 'اختاري على الأقل منتج واحد',
      add_fav: 'أضيفي للمفضلة', remove_fav: 'بالمفضلة ♥',
      share_text: 'شوفي جيجات 🧡 اختاري المنتجات اللي بتحبي توصل لحلب: {url}',
      m_fav10: 'عشر مفضلات! عم نسجّل ذوقك 📝', m_fav25: '25 مفضلة! بتقدري تختاري أهم 25 هلق ✨',
      welcome_toast: 'أهلاً {name}! اختاري فئة وبلشي',
      optout_toast: 'تمام، خبّينا {cat}', optin_toast: 'رجّعنا {cat} 🙂',
      offline: 'ما في نت… رح نحفظ اختياراتك بس يرجع',
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
      tagline: 'Pick a category to start. Each one is a short trip 🧡',
      seen: 'Seen {n} of {total}',
      products_n: '{n} products', of_n: '{a} of {b}',
      st_new: '✨ New', st_go: '🔥 Continue', st_done: '✓ Done', st_off: 'Not for me',
      skip_tip: 'Not for me', unskip_tip: 'Bring it back',
      discover: 'Categories', favorites: 'Favorites', share: 'Share',
      mode_grid: 'Browse', mode_quick: 'Quick: one by one',
      quick_hint: 'Swipe right if you love it, left if not',
      quick_love: 'Love', quick_pass: 'Pass',
      all_sub: 'All',
      cat_done_title: '{cat} done! 🎉', cat_done_sub: "You've seen everything here. On to the next one?", cat_done_btn: 'Back to categories',
      all_done_title: "You've seen it all! 🎉", all_done_sub: 'Your taste decides what reaches Aleppo. Pick your top 25 now', all_done_btn: 'Pick my top 25',
      missing_title: "What's missing in {cat}? 💭", missing_sub: 'Something you wish we had here?', missing_ph: 'Type here…', send: 'Send', missing_thanks: 'Thanks! Noted 🧡',
      fav_title: 'Your favorites',
      fav_empty: 'Nothing yet… tap the heart on the first thing you love!',
      top_cta_title: 'Pick your top 25', top_cta_sub: 'From your favorites, which 25 should reach Aleppo first?', top_cta_btn: 'Go',
      top_pick_mode: 'Tap products in the order you love them', top_save: 'Save', cancel: 'Cancel',
      top_edit: 'Edit top 25', top_saved: 'Saved! Your taste is on its way to Aleppo 🎉', top_min: 'Pick at least one product',
      add_fav: 'Add to favorites', remove_fav: 'In favorites ♥',
      share_text: 'Check out Jejat 🧡 pick the products you want delivered in Aleppo: {url}',
      m_fav10: 'Ten favorites! We are taking notes 📝', m_fav25: '25 favorites! You can pick your top 25 now ✨',
      welcome_toast: 'Hi {name}! Pick a category and start',
      optout_toast: 'Okay, {cat} is hidden', optin_toast: '{cat} is back 🙂',
      offline: 'No connection… we will save your picks when it is back',
    }
  };
  const TAGS = {
    en: { dehydration: 'Dehydration', dryness: 'Dryness', acne: 'Acne & blackheads', pores: 'Pores', oily: 'Oily skin', pigmentation: 'Dark spots', wrinkles: 'Wrinkles & firmness', sensitivity: 'Sensitivity & redness', glow: 'Glow', dark_circles: 'Dark circles',
          hyaluronic: 'Hyaluronic acid', aha: 'AHA / PHA', bha: 'BHA', retinol: 'Retinol', centella: 'Centella', ceramide: 'Ceramides', niacinamide: 'Niacinamide', peptide: 'Peptides', vitamin_c: 'Vitamin C', pdrn: 'PDRN', collagen: 'Collagen' },
    ar: { dehydration: 'جفاف داخلي', dryness: 'بشرة جافة', acne: 'حبوب ورؤوس سوداء', pores: 'مسام واسعة', oily: 'بشرة دهنية', pigmentation: 'بقع داكنة', wrinkles: 'تجاعيد وشدّ', sensitivity: 'حساسية واحمرار', glow: 'إشراق', dark_circles: 'هالات سوداء',
          hyaluronic: 'هيالورونيك', aha: 'AHA / PHA', bha: 'BHA', retinol: 'ريتينول', centella: 'سنتيلا', ceramide: 'سيراميد', niacinamide: 'نياسيناميد', peptide: 'ببتيد', vitamin_c: 'فيتامين C', pdrn: 'PDRN', collagen: 'كولاجين' }
  };
  const tag = (k) => TAGS[S.lang][k] || TAGS.en[k] || k;
  const RES = ['aleppo', 'damascus', 'syria_other', 'abroad'];
  const AGE = ['18_24', '25_34', '35_44', '45_plus'];

  // ---------- state ----------
  const S = {
    lang: 'ar', vid: null, session: null, profile: null,
    cats: [], products: [], byId: new Map(), order: [], byCat: new Map(),
    favorites: new Set(), favOrder: [], topPicks: [], seen: new Set(), optouts: new Set(), passed: new Set(),
    view: 'home', cat: null, sub: '', mode: 'grid', list: [], rendered: 0,
    quick: { list: [], i: 0 },
    picking: false, picks: [],
    sheetList: [], sheetIdx: -1,
    pendingImps: [], impTimers: new Map(),
    isTest: false, ref: null
  };
  const $ = (id) => document.getElementById(id);
  const t = (k, vars) => { let s = (I18N[S.lang][k] ?? I18N.en[k] ?? k); if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll('{' + a + '}', b); return s; };
  const catName = (c) => S.lang === 'ar' ? c.name_ar : c.name_en;
  const pName = (p) => S.lang === 'ar' ? p.name_ar : p.name_en;
  const pSub = (p) => S.lang === 'ar' ? p.sub_ar : p.sub_en;
  const catOf = (p) => S.cats.find(c => c.key === p.category) || { key: p.category, name_ar: p.category, name_en: p.category, emoji: '' };
  const money = (p) => p.price == null ? '' : (p.currency === 'USD' || !p.currency ? '$' : p.currency + ' ') + Number(p.price).toFixed(2).replace(/\.00$/, '');
  const imgUrl = (p) => /^https?:/.test(p.image_url) ? p.image_url : SITE_ROOT + p.image_url;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.1C.7 8.2 3.1 4.5 6.8 4.5c2 0 3.4 1 4.2 2.3.8-1.3 2.2-2.3 4.2-2.3 3.7 0 6.1 3.7 4.4 7.4C19.5 16.4 12 21 12 21z"/></svg>';

  // ---------- network ----------
  async function rpc(fn, params, opts = {}) {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, { method: 'POST', keepalive: !!opts.keepalive, headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}) });
    if (!r.ok) { const e = await r.text().catch(() => ''); throw new Error(`${fn} ${r.status} ${e}`); }
    const txt = await r.text(); return txt ? JSON.parse(txt) : null;
  }
  async function rest(path) { const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: { apikey: SUPA_KEY } }); if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }
  const track = (type, product, category, meta) => rpc('log_event', { p_visitor: S.vid, p_session: S.session, p_type: type, p_product: product ?? null, p_category: category ?? null, p_meta: meta ?? null }).catch(() => {});

  // ---------- seeded shuffle ----------
  function seedFrom(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  function shuffled(arr, seed) { const r = mulberry32(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- language ----------
  function applyLang(lang, log) {
    S.lang = lang; store.set('jejat_lang', lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i]').forEach(el => { el.innerHTML = t(el.dataset.i); });
    document.querySelectorAll('.lang-pill span').forEach(s => s.classList.toggle('on', s.dataset.l === lang));
    $('missingInput').placeholder = t('missing_ph');
    renderOptions(); updateGreeting(); updateProgress(); updateFavUI();
    if (S.products.length) { renderTiles(); if (S.view === 'cat') { renderCatHead(); renderSubChips(); relabelCards(); if (S.mode === 'quick') renderQuick(); } }
    if (S.sheetIdx >= 0) fillSheet();
    if (log) track('lang', null, null, { lang });
  }
  function relabelCards() {
    document.querySelectorAll('#grid .card, #favGrid .card').forEach(card => {
      const p = S.byId.get(+card.dataset.id); if (!p) return;
      card.querySelector('.name').textContent = pName(p);
      const c = catOf(p); card.querySelector('.cat').textContent = pSub(p) || `${c.emoji || ''} ${catName(c)}`.trim();
    });
  }

  // ---------- welcome ----------
  function renderOptions() {
    const mk = (id, keys, prefix) => {
      const box = $(id); const cur = box.dataset.value || ''; box.innerHTML = '';
      keys.forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.className = 'opt-chip' + (cur === k ? ' on' : ''); b.textContent = t(prefix + k); b.dataset.v = k; b.onclick = () => { box.dataset.value = k; box.querySelectorAll('.opt-chip').forEach(x => x.classList.toggle('on', x === b)); }; box.appendChild(b); });
    };
    mk('resOpts', RES, 'res_'); mk('ageOpts', AGE, 'age_');
  }
  async function submitWelcome(e) {
    e.preventDefault();
    const first = $('fFirst').value.trim(), last = $('fLast').value.trim(), email = $('fEmail').value.trim(), phone = $('fPhone').value.trim();
    const res = $('resOpts').dataset.value || '', age = $('ageOpts').dataset.value || '', err = $('werr');
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
      closeWelcome(); toast(t('welcome_toast', { name: first }), true);
    } catch (ex) { err.textContent = t('err_net'); console.error(ex); }
    btn.disabled = false;
  }
  function closeWelcome() { $('welcome').classList.add('off'); document.body.classList.remove('locked'); updateGreeting(); }

  // ---------- per-category stats ----------
  function catStats(key) {
    const list = S.byCat.get(key) || [];
    let seen = 0, hearts = 0;
    list.forEach(p => { if (S.seen.has(p.id)) seen++; if (S.favorites.has(p.id)) hearts++; });
    return { total: list.length, seen, hearts, done: list.length > 0 && seen >= list.length, off: S.optouts.has(key) };
  }

  // ---------- home tiles ----------
  function renderTiles() {
    const box = $('tiles'); box.innerHTML = '';
    let allDone = true;
    S.cats.forEach((c, idx) => {
      const st = catStats(c.key); const list = S.byCat.get(c.key) || [];
      if (!st.done && !st.off) allDone = false;
      const previews = (c.preview_images && c.preview_images.length) ? c.preview_images : list.slice(0, 3).map(p => p.image_url);
      const pics = previews.slice(0, 3).map(u => `<img src="${/^https?:/.test(u) ? u : SITE_ROOT + u}" alt="" loading="lazy">`).join('');
      const tile = document.createElement('button');
      tile.className = 'tile' + (st.done ? ' done' : '') + (st.off ? ' off' : '');
      tile.style.setProperty('--tint', `var(--tint-${c.key}, var(--cream))`);
      const badge = st.off ? t('st_off') : st.done ? t('st_done') : st.seen > 0 ? t('st_go') : t('st_new');
      tile.innerHTML = `<span class="badge">${badge}</span>
        <span class="skip" role="button" title="${st.off ? t('unskip_tip') : t('skip_tip')}" aria-label="${st.off ? t('unskip_tip') : t('skip_tip')}">${st.off ? '↩' : '✕'}</span>
        <div class="pics">${pics}</div>
        <h3>${c.emoji || ''} ${catName(c)}</h3>
        <div class="meta"><span>${st.seen > 0 ? t('of_n', { a: st.seen, b: st.total }) : t('products_n', { n: st.total })}</span><span class="hearts">${st.hearts ? '♥ ' + st.hearts : ''}</span></div>
        <div class="bar"><i></i></div>`;
      tile.querySelector('.skip').onclick = (e) => { e.stopPropagation(); toggleOptout(c); };
      tile.onclick = () => { if (S.optouts.has(c.key)) { toggleOptout(c); return; } openCat(c.key); };
      box.appendChild(tile);
      requestAnimationFrame(() => { setTimeout(() => { tile.classList.add('in'); tile.querySelector('.bar i').style.width = (st.total ? 100 * st.seen / st.total : 0) + '%'; }, 40 * idx); });
    });
    $('allDone').hidden = !(allDone && S.products.length);
  }
  async function toggleOptout(c) {
    const was = S.optouts.has(c.key);
    if (was) S.optouts.delete(c.key); else S.optouts.add(c.key);
    renderTiles(); toast(t(was ? 'optin_toast' : 'optout_toast', { cat: catName(c) }));
    try { await rpc('toggle_category_optout', { p_visitor: S.vid, p_session: S.session, p_category: c.key }); }
    catch (ex) { console.error(ex); if (was) S.optouts.add(c.key); else S.optouts.delete(c.key); renderTiles(); toast(t('offline')); }
  }

  // ---------- category screen ----------
  function openCat(key) {
    S.cat = key; S.sub = '';
    S.mode = store.get('jejat_mode', 'grid');
    showView('cat'); track('category', null, key);
    buildCatList(); renderCatHead(); renderSubChips(); setMode(S.mode, false);
  }
  function buildCatList() {
    // unseen first (in the visitor's shuffled order), then seen; computed once per open so the order is stable while she browses
    const all = S.byCat.get(S.cat) || [];
    const unseen = all.filter(p => !S.seen.has(p.id)), seen = all.filter(p => S.seen.has(p.id));
    S.catList = unseen.concat(seen);
  }
  function currentList() { return S.sub ? S.catList.filter(p => (p.sub_en || '') === S.sub) : S.catList; }
  function renderCatHead() {
    const c = S.cats.find(x => x.key === S.cat); if (!c) return;
    const st = catStats(S.cat);
    $('catTitle').querySelector('.t').textContent = `${c.emoji || ''} ${catName(c)}`;
    $('catTitle').querySelector('.s').textContent = t('of_n', { a: st.seen, b: st.total }) + (st.hearts ? ` · ♥ ${st.hearts}` : '');
    const pct = st.total ? Math.round(100 * st.seen / st.total) : 0;
    $('catRing').style.setProperty('--p', pct + '%'); $('catRing').querySelector('span').textContent = pct + '%';
    $('missingTitle').textContent = t('missing_title', { cat: catName(c) });
    $('catDoneTitle').textContent = t('cat_done_title', { cat: catName(c) });
    $('catDone').hidden = !st.done;
  }
  function renderSubChips() {
    const box = $('subChips'); box.innerHTML = '';
    const all = S.products.filter(p => p.category === S.cat); // catalog order, so chips follow the routine order
    const subs = []; all.forEach(p => { if (p.sub_en && !subs.some(s => s.en === p.sub_en)) subs.push({ en: p.sub_en, ar: p.sub_ar || p.sub_en }); });
    if (subs.length < 2) return;
    const mk = (key, label) => { const b = document.createElement('button'); b.className = 'chip' + (S.sub === key ? ' on' : ''); b.textContent = label; b.onclick = () => { S.sub = key; box.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); track('subcategory', null, S.cat, { sub: key || 'all' }); if (S.mode === 'grid') renderGrid(); else startQuick(); }; box.appendChild(b); };
    mk('', t('all_sub')); subs.forEach(s => mk(s.en, S.lang === 'ar' ? s.ar : s.en));
  }
  function setMode(mode, log) {
    S.mode = mode; store.set('jejat_mode', mode);
    $('modeGrid').classList.toggle('on', mode === 'grid'); $('modeQuick').classList.toggle('on', mode === 'quick');
    $('gridWrap').hidden = mode !== 'grid'; $('quick').hidden = mode !== 'quick';
    if (log) track('mode', null, S.cat, { mode });
    if (mode === 'grid') renderGrid(); else { startQuick(); requestAnimationFrame(scrollQuickIntoView); }
  }

  // ---------- grid ----------
  function makeCard(p, opts = {}) {
    const c = catOf(p);
    const card = document.createElement('article'); card.className = 'card'; card.dataset.id = p.id;
    card.style.setProperty('--tint', `var(--tint-${p.category}, var(--cream))`);
    card.innerHTML = `
      <button class="ph" aria-label="${pName(p)}"><img alt="" loading="lazy" decoding="async" width="800" height="800"></button>
      <button class="heart${S.favorites.has(p.id) ? ' on' : ''}" aria-label="favorite">${HEART}</button>
      <div class="body">${p.brand ? `<p class="brand">${p.brand}</p>` : ''}<p class="name">${pName(p)}</p><div class="row"><span class="cat">${pSub(p) || `${c.emoji || ''} ${catName(c)}`.trim()}</span>${p.price != null ? `<span class="price">${money(p)}</span>` : ''}</div></div>`;
    const img = card.querySelector('img'); const ph = card.querySelector('.ph');
    img.onload = () => { img.classList.add('ok'); ph.classList.add('loaded'); }; img.onerror = () => ph.classList.add('loaded');
    img.src = imgUrl(p);
    ph.onclick = () => { if (S.picking) return togglePick(p, card); openSheet(p, opts.list || S.list); };
    card.querySelector('.heart').onclick = (e) => { e.stopPropagation(); toggleFav(p, card.querySelector('.heart')); };
    if (S.picking) card.onclick = (e) => { if (!e.target.closest('.ph')) togglePick(p, card); };
    return card;
  }
  function renderGrid() { $('grid').innerHTML = ''; S.rendered = 0; S.list = currentList(); renderMore(); }
  function renderMore() {
    const frag = document.createDocumentFragment(); const end = Math.min(S.rendered + CHUNK, S.list.length);
    for (let i = S.rendered; i < end; i++) { const card = makeCard(S.list[i]); frag.appendChild(card); observe(card); }
    S.rendered = end; $('grid').appendChild(frag);
  }

  // ---------- quick mode ----------
  function startQuick() {
    const list = currentList();
    const firstUnseen = list.findIndex(p => !S.seen.has(p.id));
    S.quick = { list, i: firstUnseen >= 0 ? firstUnseen : list.length };
    renderQuick();
  }
  function fitQuick() {
    // quick mode sits right under the sticky header; size the stack to the space left above the dock on this phone
    const header = document.querySelector('.top').offsetHeight;
    const countH = $('qCount').offsetHeight + 10, btnsH = 68 + 10, hintH = 22 + 10, dockH = 62 + 14 + 8;
    const avail = window.innerHeight - header - 8 - countH - btnsH - hintH - dockH;
    $('qStack').style.height = Math.max(220, Math.min(560, avail)) + 'px';
  }
  function scrollQuickIntoView() {
    const header = document.querySelector('.top').offsetHeight;
    const y = $('quick').getBoundingClientRect().top + window.scrollY - header - 6;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
  addEventListener('resize', fitQuick);
  function renderQuick() {
    const q = S.quick, stack = $('qStack'); stack.innerHTML = ''; fitQuick();
    $('qCount').textContent = q.list.length ? t('of_n', { a: Math.min(q.i + 1, q.list.length), b: q.list.length }) : '';
    if (q.i >= q.list.length) { $('qStack').innerHTML = ''; $('qbtnsWrap')?.remove(); $('quick').querySelector('.qbtns').hidden = true; $('quick').querySelector('.qhint').hidden = true; renderCatHead(); $('catDone').hidden = false; return; }
    $('quick').querySelector('.qbtns').hidden = false; $('quick').querySelector('.qhint').hidden = false;
    const mk = (p, under) => {
      const el = document.createElement('div'); el.className = 'qcard' + (under ? ' under' : ''); el.dataset.id = p.id;
      el.innerHTML = `<span class="stamp love">${t('quick_love')} ♥</span><span class="stamp pass">${t('quick_pass')} ✕</span><img src="${imgUrl(p)}" alt="" draggable="false"><div class="qbody">${p.brand ? `<div class="qbrand">${p.brand}</div>` : ''}<div class="qname">${pName(p)}</div><div class="qsub">${pSub(p) || (S.lang === 'ar' ? p.name_en : p.name_ar)}${p.price != null ? ` · <b class="qprice">${money(p)}</b>` : ''}</div></div>`;
      return el;
    };
    if (q.list[q.i + 1]) stack.appendChild(mk(q.list[q.i + 1], true));
    const top = mk(q.list[q.i], false); stack.appendChild(top);
    attachSwipe(top, q.list[q.i]);
    markSeen(q.list[q.i].id);
  }
  function attachSwipe(el, p) {
    let x0 = 0, y0 = 0, dx = 0, dragging = false;
    const rtl = () => S.lang === 'ar';
    const dir = (d) => rtl() ? -d : d; // +1 = love side
    const love = el.querySelector('.stamp.love'), pass = el.querySelector('.stamp.pass');
    el.addEventListener('pointerdown', e => { if (e.button) return; dragging = true; x0 = e.clientX; y0 = e.clientY; dx = 0; el.classList.add('drag'); el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (!dragging) return; dx = e.clientX - x0; const dy = e.clientY - y0;
      el.style.transform = `translate(${dx}px, ${dy * .3}px) rotate(${dx / 18}deg)`;
      const v = dir(dx); love.style.opacity = Math.min(1, Math.max(0, v / 70)); pass.style.opacity = Math.min(1, Math.max(0, -v / 70));
    });
    const end = () => {
      if (!dragging) return; dragging = false; el.classList.remove('drag');
      const v = dir(dx);
      if (v > 90) decide(p, el, true); else if (v < -90) decide(p, el, false);
      else { el.style.transform = ''; love.style.opacity = 0; pass.style.opacity = 0; }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  function decide(p, el, loved) {
    el = el || $('qStack').querySelector('.qcard:not(.under)'); if (!el) return;
    el.style.transform = ''; el.classList.add(loved ? 'fly-love' : 'fly-pass');
    if (loved) { if (!S.favorites.has(p.id)) toggleFav(p, null); }
    else { S.passed.add(p.id); if (S.favorites.has(p.id)) toggleFav(p, null); track('pass', p.id, p.category); }
    S.quick.i++;
    setTimeout(renderQuick, 220);
  }

  // ---------- observers ----------
  let revealObs, impObs, moreObs;
  function setupObservers() {
    revealObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -5% 0px' });
    impObs = new IntersectionObserver(es => es.forEach(e => {
      const id = +e.target.dataset.id;
      if (e.isIntersecting) { if (S.seen.has(id) || S.impTimers.has(id)) return; S.impTimers.set(id, setTimeout(() => { S.impTimers.delete(id); markSeen(id); impObs.unobserve(e.target); }, 600)); }
      else if (S.impTimers.has(id)) { clearTimeout(S.impTimers.get(id)); S.impTimers.delete(id); }
    }), { threshold: 0.6 });
    moreObs = new IntersectionObserver(es => { if (es[0].isIntersecting && S.rendered < S.list.length) renderMore(); }, { rootMargin: '600px 0px' });
    moreObs.observe($('sentinel'));
  }
  function observe(card) { revealObs.observe(card); if (!S.seen.has(+card.dataset.id) && !S.picking) impObs.observe(card); }
  function markSeen(id) {
    if (S.seen.has(id)) return;
    S.seen.add(id); S.pendingImps.push(id); updateProgress();
    if (S.view === 'cat') { renderCatHead(); const st = catStats(S.cat); if (st.done) { const k = 'cat_' + S.cat, shown = store.get('jejat_ms', {}); if (!shown[k]) { shown[k] = 1; store.set('jejat_ms', shown); toast(t('cat_done_title', { cat: catName(S.cats.find(c => c.key === S.cat)) }), true); confetti(); } } }
  }
  async function flushImps(keepalive) {
    if (!S.pendingImps.length || !S.vid) return;
    const batch = S.pendingImps.splice(0);
    try { await rpc('log_impressions', { p_visitor: S.vid, p_products: batch }, { keepalive }); } catch { S.pendingImps.unshift(...batch); }
  }
  setInterval(() => flushImps(false), 3000);
  setInterval(() => { if (document.visibilityState === 'visible' && S.session) rpc('heartbeat', { p_visitor: S.vid, p_session: S.session }).catch(() => {}); }, 30000);
  addEventListener('pagehide', () => flushImps(true));
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushImps(true); });

  // ---------- progress & greeting ----------
  function updateProgress() {
    const total = S.products.length || 1, n = Math.min(S.seen.size, total), pct = Math.round(100 * n / total);
    $('progFill').style.width = pct + '%'; $('walker').style.insetInlineStart = pct + '%';
    $('progLabel').textContent = t('seen', { n, total });
  }
  function updateGreeting() { const name = S.profile?.first_name; $('greet').innerHTML = name ? t('greet', { name }) : t('greet_anon'); $('tagline').textContent = t('tagline'); }
  function checkFavMilestones() {
    const shown = store.get('jejat_ms', {}); const f = S.favorites.size;
    const fire = (k, msg) => { if (shown[k]) return; shown[k] = 1; store.set('jejat_ms', shown); toast(msg, true); };
    if (f === 10) fire('fav10', t('m_fav10')); if (f === 25) fire('fav25', t('m_fav25'));
  }

  // ---------- favorites ----------
  async function toggleFav(p, heartEl) {
    const was = S.favorites.has(p.id);
    const apply = (on) => { if (on) { S.favorites.add(p.id); if (!S.favOrder.includes(p.id)) S.favOrder.push(p.id); } else { S.favorites.delete(p.id); S.favOrder = S.favOrder.filter(x => x !== p.id); S.topPicks = S.topPicks.filter(x => x !== p.id); } };
    apply(!was); syncHearts(p.id, !was, heartEl); updateFavUI(); if (!was) checkFavMilestones();
    if (S.view === 'cat') renderCatHead();
    try { const now = await rpc('toggle_favorite', { p_visitor: S.vid, p_session: S.session, p_product: p.id }); if (now !== !was) { apply(now); syncHearts(p.id, now); updateFavUI(); } }
    catch (ex) { console.error(ex); toast(t('offline')); apply(was); syncHearts(p.id, was); updateFavUI(); }
  }
  function syncHearts(id, on, sourceEl) {
    document.querySelectorAll(`.card[data-id="${id}"] .heart`).forEach(h => { h.classList.toggle('on', on); if (on) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); if (h === sourceEl || !sourceEl) sparkle(h); } });
    if (S.sheetIdx >= 0 && S.sheetList[S.sheetIdx]?.id === id) fillSheetHeart();
    if (on) { const pill = $('favPill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }
  function sparkle(el) {
    const colors = ['#E8446B', '#F7941D', '#FFD9AE', '#FF8FA3', '#FFC857'];
    for (let i = 0; i < 9; i++) { const s = document.createElement('span'); s.className = 'spark'; const a = (i / 9) * Math.PI * 2 + Math.random() * .5, d = 26 + Math.random() * 18; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); s.style.setProperty('--c', colors[i % colors.length]); el.appendChild(s); setTimeout(() => s.remove(), 800); }
  }
  function updateFavUI() {
    const n = S.favorites.size;
    $('favCount').textContent = n; $('favCount2').textContent = n; $('favBadge').textContent = n; $('favBadge').hidden = n === 0;
    const has = S.topPicks.length > 0;
    $('topCta').hidden = S.picking || has || n < 3; $('topBtn').hidden = S.picking || !has; $('topBtn').textContent = t('top_edit');
    $('favEmpty').hidden = n > 0;
    if (S.view === 'fav') renderFavGrid();
  }
  function renderFavGrid() {
    const grid = $('favGrid'); grid.innerHTML = '';
    const ranked = S.topPicks.filter(id => S.favorites.has(id)); const rest = S.favOrder.filter(id => !ranked.includes(id)).slice().reverse();
    const list = ranked.concat(rest).map(id => S.byId.get(id)).filter(Boolean); const frag = document.createDocumentFragment();
    list.forEach(p => { const card = makeCard(p, { list }); card.classList.add('in'); const r = S.picking ? S.picks.indexOf(p.id) : ranked.indexOf(p.id); if (r >= 0) { const b = document.createElement('span'); b.className = 'rank'; b.textContent = r + 1; card.appendChild(b); if (S.picking) card.classList.add('picked'); } frag.appendChild(card); });
    grid.appendChild(frag);
  }

  // ---------- top 25 ----------
  function startPicking() { S.picking = true; S.picks = S.topPicks.filter(id => S.favorites.has(id)).slice(0, TOP_MAX); $('pickbar').classList.add('on'); $('favGrid').classList.add('picking'); updatePickCount(); updateFavUI(); $('pickbar').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function stopPicking() { S.picking = false; S.picks = []; $('pickbar').classList.remove('on'); $('favGrid').classList.remove('picking'); updateFavUI(); }
  function togglePick(p) { const i = S.picks.indexOf(p.id); if (i >= 0) S.picks.splice(i, 1); else { if (S.picks.length >= TOP_MAX) { toast(`${TOP_MAX} / ${TOP_MAX} ✋`); return; } S.picks.push(p.id); } updatePickCount(); renderFavGrid(); }
  function updatePickCount() { $('pickCount').textContent = `${S.picks.length} / ${TOP_MAX}`; $('pickSave').disabled = S.picks.length === 0; }
  async function savePicks() {
    if (!S.picks.length) { toast(t('top_min')); return; }
    const picks = S.picks.slice(); $('pickSave').disabled = true;
    try { await rpc('save_top_picks', { p_visitor: S.vid, p_session: S.session, p_products: picks }); S.topPicks = picks; stopPicking(); confetti(); toast(t('top_saved'), true); }
    catch (ex) { console.error(ex); toast(t('offline')); $('pickSave').disabled = false; }
  }

  // ---------- suggestions ----------
  async function submitMissing(e) {
    e.preventDefault(); const txt = $('missingInput').value.trim(); if (!txt) return;
    $('missingInput').value = ''; $('missingThanks').hidden = false; setTimeout(() => { $('missingThanks').hidden = true; }, 4000);
    try { await rpc('add_suggestion', { p_visitor: S.vid, p_session: S.session, p_category: S.cat, p_text: txt }); } catch (ex) { console.error(ex); toast(t('offline')); }
  }

  // ---------- sheet ----------
  function openSheet(p, list) { S.sheetList = list; S.sheetIdx = list.indexOf(p); S.sheetImg = 0; S.sheetVar = -1; fillSheet(); $('sheetBg').classList.add('on'); $('sheet').classList.add('on'); document.body.classList.add('locked'); track('click', p.id, p.category); markSeen(p.id); }
  function fillSheet() {
    const p = S.sheetList[S.sheetIdx]; if (!p) return; const c = catOf(p);
    S.sheetImg = 0; S.sheetVar = (p.variants && p.variants.length > 1) ? 0 : -1; setSheetImg(p); renderSwatches(p); $('sheetName').textContent = pName(p);
    $('sheetBrand').textContent = p.brand || ''; $('sheetBrand').hidden = !p.brand;
    $('sheetPrice').textContent = money(p); $('sheetPrice').hidden = p.price == null;
    const alt = S.lang === 'ar' ? p.name_en : p.name_ar; $('sheetSub').textContent = alt !== pName(p) ? alt : ''; $('sheetSub').hidden = alt === pName(p);
    const desc = S.lang === 'ar' ? (p.desc_ar || p.desc_en) : (p.desc_en || p.desc_ar); $('sheetDesc').textContent = desc || ''; $('sheetDesc').hidden = !desc;
    const tags = (p.concerns || []).map(k => `<span class="tg c">${tag(k)}</span>`).concat((p.ingredients || []).map(k => `<span class="tg i">${tag(k)}</span>`));
    $('sheetTags').innerHTML = tags.join(''); $('sheetTags').hidden = !tags.length;
    
    $('sheetCat').textContent = `${c.emoji || ''} ${catName(c)}${pSub(p) ? ' · ' + pSub(p) : ''}`.trim();
    $('sheetCat').style.setProperty('--tint', `var(--tint-${p.category}, var(--cream))`);
    $('sheetPrev').hidden = S.sheetIdx <= 0; $('sheetNext').hidden = S.sheetIdx >= S.sheetList.length - 1;
    fillSheetHeart();
  }
  function sheetImages(p) {
    if (S.sheetVar >= 0 && p.variants && p.variants[S.sheetVar] && p.variants[S.sheetVar].images && p.variants[S.sheetVar].images.length) return p.variants[S.sheetVar].images;
    return [p.image_url, p.image2_url].filter(Boolean);
  }
  function setSheetImg(p) {
    const imgs = sheetImages(p); if (!imgs.length) return;
    const u = imgs[S.sheetImg % imgs.length];
    $('sheetImg').src = /^https?:/.test(u) ? u : SITE_ROOT + u; $('sheetImg').alt = pName(p);
    $('sheetDots').hidden = imgs.length < 2; $('sheetDots').innerHTML = imgs.map((_, i) => `<i class="${i === S.sheetImg % imgs.length ? 'on' : ''}"></i>`).join('');
  }
  function renderSwatches(p) {
    const box = $('sheetColours'); const all = p.variants || []; const vs = all.filter(v => v.images && v.images.length);
    if (vs.length < 2 && all.length > 1) {
      // shades without photos (makeup): show the names as chips, first 14 then a count
      const MAX = 14; const names = all.map(v => S.lang === 'ar' ? v.colour_ar : v.colour_en).filter(Boolean);
      box.hidden = false; box.classList.add('names');
      box.innerHTML = names.slice(0, MAX).map(n => `<span class="shade">${n}</span>`).join('') + (names.length > MAX ? `<span class="shade more">+${names.length - MAX}</span>` : '');
      return;
    }
    box.classList.remove('names');
    box.hidden = vs.length < 2; if (vs.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = vs.map((v, i) => `<button class="sw ${i === S.sheetVar ? 'on' : ''}" data-i="${i}" title="${S.lang === 'ar' ? v.colour_ar : v.colour_en}"><img src="${/^https?:/.test(v.images[0]) ? v.images[0] : SITE_ROOT + v.images[0]}" alt=""><span>${S.lang === 'ar' ? v.colour_ar : v.colour_en}</span></button>`).join('');
    box.querySelectorAll('.sw').forEach(b => b.onclick = () => { S.sheetVar = +b.dataset.i; S.sheetImg = 0; setSheetImg(p); box.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); const v = vs[S.sheetVar]; if (v.price != null) $('sheetPrice').textContent = money({ price: v.price, currency: p.currency }); track('click', p.id, p.category, { via: 'colour', colour: v.colour_en }); });
  }
  function fillSheetHeart() { const p = S.sheetList[S.sheetIdx]; if (!p) return; const on = S.favorites.has(p.id); $('sheetHeart').classList.toggle('on', on); $('sheetHeartLabel').textContent = on ? t('remove_fav') : t('add_fav'); }
  function closeSheet() { $('sheetBg').classList.remove('on'); $('sheet').classList.remove('on'); if ($('welcome').classList.contains('off')) document.body.classList.remove('locked'); S.sheetIdx = -1; }
  function sheetStep(d) { const i = S.sheetIdx + d; if (i < 0 || i >= S.sheetList.length) return; S.sheetIdx = i; fillSheet(); const p = S.sheetList[i]; track('click', p.id, p.category, { via: 'swipe' }); markSeen(p.id); }

  // ---------- views ----------
  function showView(name) {
    S.view = name;
    $('viewHome').classList.toggle('on', name === 'home'); $('viewCat').classList.toggle('on', name === 'cat'); $('viewFav').classList.toggle('on', name === 'fav');
    $('dockHome').classList.toggle('on', name !== 'fav'); $('dockFav').classList.toggle('on', name === 'fav');
    if (name === 'fav') renderFavGrid(); else if (S.picking) stopPicking();
    if (name === 'home' && S.products.length) renderTiles();
    window.scrollTo({ top: 0 });
    if (name !== 'cat') track('tab', null, null, { tab: name });
  }
  async function share() {
    const url = SHARE_URL + (S.profile?.referral_code ? '?r=' + S.profile.referral_code : ''); const text = t('share_text', { url });
    track('share');
    if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }

  // ---------- toasts & confetti ----------
  function toast(msg, mascot) {
    const box = $('toasts'); const el = document.createElement('div'); el.className = 'toast' + (mascot ? '' : ' plain');
    el.innerHTML = (mascot ? '<img src="../assets/chicken-logo.png" alt="">' : '') + '<span></span>'; el.querySelector('span').textContent = msg; box.appendChild(el);
    setTimeout(() => { el.classList.add('bye'); setTimeout(() => el.remove(), 450); }, 3600);
  }
  function confetti() {
    const cv = $('confetti'); cv.hidden = false; const ctx = cv.getContext('2d');
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ['#F7941D', '#E8446B', '#FFD9AE', '#CE2029', '#FFC857', '#FBE3DC'];
    const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 14, vy: -8 - Math.random() * 12, r: 4 + Math.random() * 5, c: colors[Math.random() * colors.length | 0], a: Math.random() * 6, s: (Math.random() - .5) * .3 }));
    const t0 = performance.now();
    (function frame(now) { const dt = (now - t0) / 1000; ctx.clearRect(0, 0, innerWidth, innerHeight); ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.s; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - dt / 2.6); ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); }); if (dt < 2.8) requestAnimationFrame(frame); else { cv.hidden = true; ctx.clearRect(0, 0, innerWidth, innerHeight); } })(t0);
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
    applyLang(S.lang, false); setupObservers();

    $('langBtn').onclick = $('langBtn2').onclick = () => applyLang(S.lang === 'ar' ? 'en' : 'ar', true);
    $('wform').onsubmit = submitWelcome;
    $('favPill').onclick = () => showView('fav');
    $('dockHome').onclick = () => showView('home'); $('dockFav').onclick = () => showView('fav'); $('dockShare').onclick = share;
    $('catBack').onclick = () => showView('home'); $('catDoneBtn').onclick = () => showView('home');
    $('allDoneBtn').onclick = () => { showView('fav'); if (S.favorites.size) startPicking(); };
    $('modeGrid').onclick = () => setMode('grid', true); $('modeQuick').onclick = () => setMode('quick', true);
    $('qLove').onclick = () => { const p = S.quick.list[S.quick.i]; if (p) decide(p, null, true); };
    $('qPass').onclick = () => { const p = S.quick.list[S.quick.i]; if (p) decide(p, null, false); };
    $('missingForm').onsubmit = submitMissing;
    $('topStart').onclick = startPicking; $('topBtn').onclick = startPicking; $('pickCancel').onclick = stopPicking; $('pickSave').onclick = savePicks;
    $('sheetBg').onclick = closeSheet; $('sheetClose').onclick = closeSheet; $('sheetPrev').onclick = () => sheetStep(-1); $('sheetNext').onclick = () => sheetStep(1);
    $('sheetHeart').onclick = () => { const p = S.sheetList[S.sheetIdx]; if (p) toggleFav(p, null); };
    $('sheetImg').onclick = () => { const p = S.sheetList[S.sheetIdx]; if (!p) return; const n = sheetImages(p).length; if (n > 1) { S.sheetImg = (S.sheetImg + 1) % n; setSheetImg(p); track('click', p.id, p.category, { via: 'image' + (S.sheetImg + 1) }); } };
    $('sheetDots').onclick = (e) => { const p = S.sheetList[S.sheetIdx]; const i = [...$('sheetDots').children].indexOf(e.target); if (p && i >= 0) { S.sheetImg = i; setSheetImg(p); } };
    addEventListener('keydown', e => {
      if (S.sheetIdx >= 0) { if (e.key === 'Escape') closeSheet(); const rtl = S.lang === 'ar'; if (e.key === 'ArrowLeft') sheetStep(rtl ? 1 : -1); if (e.key === 'ArrowRight') sheetStep(rtl ? -1 : 1); return; }
      if (S.view === 'cat' && S.mode === 'quick') { const p = S.quick.list[S.quick.i]; if (!p) return; const rtl = S.lang === 'ar'; if (e.key === 'ArrowRight') decide(p, null, !rtl); if (e.key === 'ArrowLeft') decide(p, null, rtl); }
    });
    let tx = 0, ty = 0;
    $('sheet').addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    $('sheet').addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 60 && Math.abs(dy) < 50) sheetStep(dx < 0 ? (S.lang === 'ar' ? -1 : 1) : (S.lang === 'ar' ? 1 : -1)); else if (dy > 90 && Math.abs(dx) < 60 && $('sheet').scrollTop === 0) closeSheet(); }, { passive: true });

    const startVisit = () => rpc('start_visit', { p_visitor: S.vid, p_referred_by: S.ref, p_lang: S.lang, p_device: deviceType(), p_ua: navigator.userAgent, p_referrer: document.referrer || null, p_screen: `${screen.width}x${screen.height}`, p_is_test: S.isTest });
    try {
      const [cats, products, visit] = await Promise.all([
        rest('categories?select=key,name_en,name_ar,emoji,sort,preview_images&order=sort'),
        rest('products?select=id,sku,category,sub_en,sub_ar,brand,name_en,name_ar,desc_en,desc_ar,image_url,image2_url,concerns,ingredients,price,currency,variants,sort&active=eq.true&order=sort'),
        startVisit().catch(async e => { console.warn('retry start_visit', e); await new Promise(r => setTimeout(r, 1500)); return startVisit(); })
      ]);
      S.cats = cats.filter(c => products.some(p => p.category === c.key));
      S.products = products; products.forEach(p => S.byId.set(p.id, p));
      S.order = shuffled(products, seedFrom(S.vid));
      S.cats.forEach(c => S.byCat.set(c.key, S.order.filter(p => p.category === c.key)));
      S.session = visit.session_id; S.profile = visit.profile;
      (visit.favorites || []).forEach(id => { S.favorites.add(id); S.favOrder.push(id); });
      S.topPicks = (visit.top_picks || []).filter(id => S.favorites.has(id));
      (visit.seen || []).forEach(id => S.seen.add(id)); (visit.optouts || []).forEach(k => S.optouts.add(k)); (visit.passed || []).forEach(id => S.passed.add(id));
    } catch (ex) {
      console.error(ex);
      $('loader').innerHTML = `<img src="../assets/chicken-logo.png" alt=""><div>${t('offline')}</div><button class="btn sm" style="margin-top:12px" onclick="location.reload()">↻</button>`;
      return;
    }
    $('loader').hidden = true;
    renderTiles(); updateProgress(); updateFavUI(); updateGreeting();
    if (S.profile?.registered) closeWelcome();
    else { $('welcome').classList.remove('off'); setTimeout(() => $('fFirst').focus({ preventScroll: true }), 400); }
  }
  boot();
})();
