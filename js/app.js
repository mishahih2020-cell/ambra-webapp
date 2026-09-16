// ===== Горчит webapp — vanilla JS SPA, hash-router, no build step =====

const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

/* ---------- state ---------- */
const STATE = {
  ageConfirmed: localStorage.getItem('ambra_age') === '1',
  cart: JSON.parse(localStorage.getItem('ambra_cart') || '[]'),
  favorites: JSON.parse(localStorage.getItem('ambra_favs') || '[]'),
  promo: JSON.parse(localStorage.getItem('ambra_promo') || 'null'),
  simulateOffline: false,
  bonusBalance: JSON.parse(localStorage.getItem('ambra_bonus') || '1240'),
  lifetimeSpend: JSON.parse(localStorage.getItem('ambra_spend') || '18000'),
  useBonuses: false,
  freeDeliveryCredits: JSON.parse(localStorage.getItem('ambra_freeship') || '0'),
  wheelSpinsExtra: JSON.parse(localStorage.getItem('ambra_spins') || '0'),
  wheelLastFreeSpinDate: localStorage.getItem('ambra_lastspin') || null,
};
function saveState(){
  localStorage.setItem('ambra_cart', JSON.stringify(STATE.cart));
  localStorage.setItem('ambra_favs', JSON.stringify(STATE.favorites));
  localStorage.setItem('ambra_promo', JSON.stringify(STATE.promo));
  localStorage.setItem('ambra_bonus', JSON.stringify(STATE.bonusBalance));
  localStorage.setItem('ambra_spend', JSON.stringify(STATE.lifetimeSpend));
  localStorage.setItem('ambra_freeship', JSON.stringify(STATE.freeDeliveryCredits));
  localStorage.setItem('ambra_spins', JSON.stringify(STATE.wheelSpinsExtra));
  if(STATE.wheelLastFreeSpinDate) localStorage.setItem('ambra_lastspin', STATE.wheelLastFreeSpinDate);
}

// ephemeral per-view selection for the product screen
let productSelection = null;
let searchQuery = '';
let lastWheelResult = null;

/* ---------- helpers ---------- */
function formatPrice(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
function cartLine(item){ return getProduct(item.productId).price * item.qty; }
function cartCount(){ return STATE.cart.reduce((s,i)=>s+i.qty,0); }
function cartSubtotal(){ return STATE.cart.reduce((s,i)=>s+cartLine(i),0); }
function cartDiscount(){
  if(!STATE.promo) return 0;
  const p = PROMO_CODES[STATE.promo];
  if(!p) return 0;
  const base = p.appliesTo==='all' ? cartSubtotal() : STATE.cart.filter(i=>getProduct(i.productId).category===p.appliesTo).reduce((s,i)=>s+cartLine(i),0);
  return Math.round(base * p.discount);
}
function cartDeliveryFee(){ return (cartSubtotal() > 3000 || STATE.freeDeliveryCredits > 0) ? 0 : 300; }
function cartTotal(){ return Math.max(0, cartSubtotal() - cartDiscount() + cartDeliveryFee()); }
function isFav(id){ return STATE.favorites.includes(id); }

/* ---------- лояльность / кешбэк ---------- */
function currentTier(){ let t = TIERS[0]; for(const tier of TIERS){ if(STATE.lifetimeSpend >= tier.threshold) t = tier; } return t; }
function nextTier(){ const idx = TIERS.indexOf(currentTier()); return TIERS[idx+1] || null; }
function tierProgress(){
  const cur = currentTier(), nxt = nextTier();
  if(!nxt) return {pct:100, remaining:0, nextName:null};
  const span = nxt.threshold - cur.threshold;
  const done = STATE.lifetimeSpend - cur.threshold;
  return {pct: Math.max(0,Math.min(100, Math.round(done/span*100))), remaining: nxt.threshold - STATE.lifetimeSpend, nextName: nxt.name};
}
function maxBonusRedeem(){ return Math.max(0, Math.min(STATE.bonusBalance, Math.floor(cartSubtotal()*0.3))); }
function checkoutBonusDiscount(){ return STATE.useBonuses ? maxBonusRedeem() : 0; }
function checkoutTotal(){ return Math.max(0, cartTotal() - checkoutBonusDiscount()); }

/* ---------- реферальная программа ---------- */
function getReferralCode(){
  let code = localStorage.getItem('ambra_refcode');
  if(!code){
    code = 'GRCH-' + Math.random().toString(36).slice(2,8).toUpperCase();
    localStorage.setItem('ambra_refcode', code);
  }
  return code;
}
function getReferralLink(){ return location.origin + location.pathname.replace(/index\.html$/,'') + '?ref=' + getReferralCode(); }

/* ---------- декоративный QR для карты лояльности (не для сканирования, только визуал) ---------- */
function seededRandom(seed){ let s = seed % 2147483647; if(s<=0) s += 2147483646; return function(){ s = (s*16807) % 2147483647; return (s-1)/2147483646; }; }
function qrPlaceholderSvg(seedText){
  const n = 21, cell = 8, size = n*cell;
  const seed = (seedText||'GRCH').split('').reduce((a,c)=>a+c.charCodeAt(0)*7,1);
  const rand = seededRandom(seed);
  function isFinderZone(r,c){ return (r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7); }
  function finder(r0,c0){
    let s='';
    for(let r=0;r<7;r++) for(let c=0;c<7;c++){
      const border = r===0||r===6||c===0||c===6;
      const inner = r>=2&&r<=4&&c>=2&&c<=4;
      if(border||inner) s += '<rect x="'+(c0+c)*cell+'" y="'+(r0+r)*cell+'" width="'+cell+'" height="'+cell+'" fill="#15110D"/>';
    }
    return s;
  }
  let cells = '';
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      if(isFinderZone(r,c)) continue;
      if(rand()>0.55) cells += '<rect x="'+c*cell+'" y="'+r*cell+'" width="'+cell+'" height="'+cell+'" fill="#15110D"/>';
    }
  }
  cells += finder(0,0) + finder(0,n-7) + finder(n-7,0);
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="display:block;">'+cells+'</svg>';
}
function loyaltyQrCard(){
  const code = getReferralCode();
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:16px;">'+
    '<div style="padding:10px;background:#F3ECE0;border-radius:12px;">'+qrPlaceholderSvg(code)+'</div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'+
      '<span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--text-secondary);">Номер карты</span>'+
      '<span class="serif" style="font-size:16px;letter-spacing:2px;color:var(--cream);">'+code+'</span>'+
    '</div>'+
    '<span style="font-size:11px;color:var(--text-tertiary);text-align:center;max-width:260px;line-height:1.5;">Покажите QR-код на кассе, чтобы применить бонусы и скидку уровня '+currentTier().name+'</span>'+
  '</div>';
}

/* ---------- колесо фортуны ---------- */
function todayStr(){ return new Date().toISOString().slice(0,10); }
function dailySpinAvailable(){ return STATE.wheelLastFreeSpinDate !== todayStr(); }
function spinsAvailable(){ return (dailySpinAvailable()?1:0) + STATE.wheelSpinsExtra; }
function consumeSpin(){
  if(dailySpinAvailable()) STATE.wheelLastFreeSpinDate = todayStr();
  else STATE.wheelSpinsExtra = Math.max(0, STATE.wheelSpinsExtra - 1);
}
function pickPrizeIndex(){
  const total = WHEEL_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for(let i=0;i<WHEEL_WEIGHTS.length;i++){ if(r < WHEEL_WEIGHTS[i]) return i; r -= WHEEL_WEIGHTS[i]; }
  return 0;
}
function applyWheelPrize(idx){
  const prize = WHEEL_PRIZES[idx];
  if(prize.type==='bonus') STATE.bonusBalance += prize.value;
  else if(prize.type==='promo') PROMO_CODES[prize.code] = {discount:prize.discount, label:prize.title, appliesTo:'all', expiry:'7 дней'};
  else if(prize.type==='freeDelivery') STATE.freeDeliveryCredits += 1;
  else if(prize.type==='again') STATE.wheelSpinsExtra += 1;
  return prize;
}
function wheelSvg(rotation){
  const n = WHEEL_PRIZES.length, cx=140, cy=140, r=134, seg=360/n;
  let inner = '';
  WHEEL_PRIZES.forEach((p,i)=>{
    const a0 = (i*seg - 90) * Math.PI/180, a1 = ((i+1)*seg - 90) * Math.PI/180;
    const x0 = (cx + r*Math.cos(a0)).toFixed(1), y0 = (cy + r*Math.sin(a0)).toFixed(1);
    const x1 = (cx + r*Math.cos(a1)).toFixed(1), y1 = (cy + r*Math.sin(a1)).toFixed(1);
    inner += '<path d="M'+cx+','+cy+' L'+x0+','+y0+' A'+r+','+r+' 0 0,1 '+x1+','+y1+' Z" fill="'+p.color+'" stroke="#0A0806" stroke-width="2"/>';
    const mid = (i*seg + seg/2 - 90) * Math.PI/180;
    const lx = (cx + r*0.64*Math.cos(mid)).toFixed(1), ly = (cy + r*0.64*Math.sin(mid)).toFixed(1);
    const rot = (i*seg + seg/2).toFixed(1);
    inner += '<text x="'+lx+'" y="'+ly+'" fill="var(--brass-soft)" font-size="17" font-weight="800" text-anchor="middle" dominant-baseline="middle" transform="rotate('+rot+' '+lx+' '+ly+')" font-family="Marcellus, serif">'+p.label+'</text>';
  });
  return '<svg id="wheelDial" width="280" height="280" viewBox="0 0 280 280" style="display:block;transform-origin:140px 140px;transform:rotate('+(rotation||0)+'deg);">'+inner+
    '<circle cx="140" cy="140" r="128" fill="none" stroke="var(--brass)" stroke-width="2"/>'+
    '<circle cx="140" cy="140" r="20" fill="#15110D" stroke="var(--brass)" stroke-width="2"/></svg>';
}

function haptic(kind){
  if(!tg || !tg.HapticFeedback) return;
  if(kind==='success') tg.HapticFeedback.notificationOccurred('success');
  else if(kind==='error') tg.HapticFeedback.notificationOccurred('error');
  else tg.HapticFeedback.impactOccurred('light');
}

function toast(message, type){
  let el = document.getElementById('toast');
  if(!el){
    el = document.createElement('div');
    el.id='toast';
    document.body.appendChild(el);
  }
  el.className = 'toast show ' + (type==='err'?'err':'ok');
  el.innerHTML = '<span class="dot"></span><span>'+message+'</span>';
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ el.classList.remove('show'); }, 2200);
}

/* ---------- router ---------- */
function parseHash(){
  const h = (location.hash || '#/home').replace(/^#\//,'');
  const parts = h.split('/').filter(Boolean);
  return {name: parts[0] || 'home', param: parts[1]};
}
window.addEventListener('hashchange', function(){ lastWheelResult = null; render(); });
window.addEventListener('DOMContentLoaded', init);

function navigate(hash){ location.hash = hash; }

// Реальная высота видимой области Telegram (учитывает шторку клавиатуры, safe area,
// разницу между "развёрнуто" и "на весь экран") — надёжнее чем 100vh/100dvh в WebView.
function applyViewportHeight(){
  const h = (tg && tg.viewportStableHeight) ? tg.viewportStableHeight
          : (tg && tg.viewportHeight) ? tg.viewportHeight
          : window.innerHeight;
  document.documentElement.style.setProperty('--tg-viewport-height', h + 'px');
}

function init(){
  if(tg){
    tg.ready();
    tg.expand();
    try{ tg.requestFullscreen && tg.requestFullscreen(); }catch(e){}
    try{ tg.disableVerticalSwipes && tg.disableVerticalSwipes(); }catch(e){}
    try{
      tg.setHeaderColor('#15110D');
      tg.setBackgroundColor('#15110D');
    }catch(e){}
    if(tg.onEvent){ tg.onEvent('viewportChanged', applyViewportHeight); tg.onEvent('fullscreenChanged', applyViewportHeight); }
  }
  applyViewportHeight();
  window.addEventListener('resize', applyViewportHeight);
  window.addEventListener('orientationchange', applyViewportHeight);

  const refFromUrl = new URLSearchParams(location.search).get('ref');
  if(refFromUrl && !localStorage.getItem('ambra_referred_by')) localStorage.setItem('ambra_referred_by', refFromUrl);
  document.addEventListener('click', onGlobalClick);
  document.addEventListener('input', onGlobalInput);
  document.addEventListener('submit', function(e){ e.preventDefault(); });
  render();
}

/* ---------- icons for bottom nav (need path only, using data.js ICONS) ---------- */
function svgIcon(pathHtml, size, extraClass){
  return '<svg class="icon '+(extraClass||'')+'" width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24">'+pathHtml+'</svg>';
}

/* ---------- shell pieces ---------- */
function headerBrand(){
  const spins = spinsAvailable();
  return '<div class="tg-header">'+
    '<div class="brand"><div class="brand-mark">G</div><div class="brand-name">Gорчит</div></div>'+
    '<div style="display:flex;align-items:center;gap:4px;">'+
      '<button class="icon-btn" data-nav="wheel" style="position:relative;">'+svgIcon(ICONS.wheel,18)+
        (spins>0?'<span class="nav-badge" style="top:2px;right:2px;">'+spins+'</span>':'')+
      '</button>'+
      '<button class="icon-btn" data-nav="promotions">'+svgIcon(ICONS.bell,18)+'</button>'+
    '</div>'+
  '</div>';
}
function headerBack(title, rightHtml){
  return '<div class="tg-header">'+
    '<div class="left"><button class="icon-btn" data-back>'+svgIcon(ICONS.back,18)+'</button>'+
    '<span class="title">'+title+'</span></div>'+
    (rightHtml || '<span style="width:32px"></span>')+
  '</div>';
}
function bottomNav(active){
  function item(route, iconName, label, badge){
    const isActive = active===route;
    return '<button class="nav-item'+(isActive?' active':'')+'" data-nav="'+route+'">'+
      svgIcon(ICONS[iconName],19)+
      (badge?'<span class="nav-badge">'+badge+'</span>':'')+
      '<span>'+label+'</span></button>';
  }
  const cc = cartCount();
  return '<div class="bottom-nav"><div style="width:100%;">'+
    '<div class="bottom-nav-row">'+
      item('home','grid','Каталог')+
      item('search','search','Поиск')+
      item('cart','cart','Корзина', cc>0?cc:null)+
      item('profile','user','Профиль')+
    '</div>'+
    '<div class="nav-indicator"><div class="bar"></div></div>'+
  '</div></div>';
}

/* ---------- main render ---------- */
function render(){
  const app = document.getElementById('app');
  if(!STATE.ageConfirmed){ app.innerHTML = viewOnboarding(); updateTgBack(false); return; }

  const {name, param} = parseHash();
  let html = '';
  let nav = null;
  let backTitle = null;

  switch(name){
    case 'home': html = viewHome(); nav='home'; break;
    case 'category': html = viewCategory(param || 'tobacco'); nav='home'; break;
    case 'search': html = viewSearch(); nav='search'; break;
    case 'product': html = viewProduct(param); backTitle=''; break;
    case 'cart': html = viewCart(); break;
    case 'checkout': html = viewCheckout(); backTitle='Оформление заказа'; break;
    case 'order-success': html = viewOrderSuccess(param); break;
    case 'profile': html = viewProfile(); nav='profile'; break;
    case 'orders': html = viewOrders(); backTitle='История заказов'; break;
    case 'order': html = viewOrderDetail(param); backTitle='Заказ № '+param; break;
    case 'promotions': html = viewPromotions(); backTitle='Акции и бонусы'; break;
    case 'favorites': html = viewFavorites(); backTitle='Избранное'; break;
    case 'wheel': html = viewWheel(); backTitle='Колесо фортуны'; break;
    case 'referral': html = viewReferral(); backTitle='Пригласить друзей'; break;
    default: html = viewHome(); nav='home';
  }

  app.innerHTML = html;
  updateTgBack(!nav && name!=='order-success');
  window.scrollTo(0,0);
  const cEl = app.querySelector('.content'); if(cEl) cEl.scrollTop = 0;
}

function updateTgBack(show){
  if(!tg || !tg.BackButton) return;
  if(show){ tg.BackButton.show(); tg.BackButton.onClick(goBack); }
  else { tg.BackButton.hide(); }
}
function goBack(){
  const {name} = parseHash();
  const map = {
    product:'home', checkout:'cart', order:'orders', category:'home',
  };
  navigate('#/'+(map[name]||'home'));
}

/* ================= VIEWS ================= */

function viewOnboarding(){
  return '<div style="flex:1;display:flex;flex-direction:column;">'+
    '<div style="flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 30%,#211A11 0%,#15110D 65%);">'+
      '<div style="width:64px;height:64px;border-radius:50%;border:1px solid var(--brass);display:flex;align-items:center;justify-content:center;margin-bottom:18px;"><span class="serif" style="font-size:28px;color:var(--brass-soft);">G</span></div>'+
      '<div class="serif" style="font-size:34px;letter-spacing:4px;color:var(--cream);">Gорчит</div>'+
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--text-tertiary);margin-top:8px;font-weight:600;">Табак &amp; кальянная культура</div>'+
    '</div>'+
    '<div style="background:var(--bg-elev);border-top-left-radius:28px;border-top-right-radius:28px;padding:26px 24px calc(24px + var(--tg-safe-bottom));display:flex;flex-direction:column;gap:16px;">'+
      '<div style="font-size:19px;font-weight:700;color:var(--cream);">Подтвердите возраст</div>'+
      '<div style="font-size:13px;line-height:1.6;color:var(--text-secondary);">Продукция предназначена для лиц старше 18 лет. Табак и никотин вредят вашему здоровью.</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">'+
        '<button class="btn btn-primary btn-block" data-action="confirm-age">Мне есть 18 лет</button>'+
        '<button class="btn btn-secondary btn-block" data-action="deny-age" style="border-color:var(--border);color:var(--text-secondary);">Мне нет 18</button>'+
      '</div>'+
      '<div style="font-size:11px;line-height:1.6;color:var(--text-tertiary);text-align:center;">Продолжая, вы принимаете <a href="#">Условия использования</a> и <a href="#">Политику конфиденциальности</a></div>'+
    '</div>'+
  '</div>';
}

function photoImg(url, alt){
  return url ? '<img src="'+url+'" alt="'+(alt||'').replace(/"/g,'&quot;')+'" loading="lazy" onerror="this.remove()">' : '';
}

function productCardHtml(p, wide){
  const fav = isFav(p.id);
  const badge = p.badge==='sale' ? '<div class="badge badge-sale" style="position:absolute;top:8px;left:8px;">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</div>'
    : p.badge==='new' ? '<div class="badge badge-new" style="position:absolute;top:8px;left:8px;">NEW</div>'
    : p.badge==='hit' ? '<div class="badge badge-hit" style="position:absolute;top:8px;left:8px;">ХИТ</div>' : '';
  return '<div class="product-card'+(wide?' wide':'')+'" data-nav="product/'+p.id+'">'+
    '<div class="product-photo">'+photoImg(p.image,p.name)+badge+
      '<button class="product-fav" data-action="toggle-fav" data-id="'+p.id+'" style="color:'+(fav?'var(--brass-soft)':'#F3ECE0')+';">'+svgIcon(fav?ICONS.heartFill:ICONS.heart,18)+'</button>'+
    '</div>'+
    '<div class="product-body">'+
      '<div class="product-brand">'+p.brand+'</div>'+
      '<div class="product-name">'+p.name+(p.volumeDefault?', '+p.volumeDefault:'')+'</div>'+
      '<div class="product-price-row"><span class="price" style="font-size:14px;">'+formatPrice(p.price)+'</span>'+
        (p.oldPrice?'<span class="price-old">'+formatPrice(p.oldPrice)+'</span>':'')+
      '</div>'+
    '</div>'+
  '</div>';
}

function viewHome(){
  const bestsellers = [PRODUCTS[0], PRODUCTS[1]];
  const newItems = [PRODUCTS[4], PRODUCTS[5]];
  return headerBrand()+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:18px 0 18px;">'+
    '<div class="promo-banner" data-nav="promotions">'+
      '<div class="eyebrow" style="color:var(--brass-soft);">Акция недели</div>'+
      '<div class="serif" style="font-size:22px;color:var(--cream);max-width:220px;">Скидка 20% на угли для кальяна</div>'+
      '<div style="font-size:11px;color:var(--text-tertiary);">до 20 сентября · промокод SMOKE20</div>'+
    '</div>'+
    '<div class="category-row">'+
      CATEGORIES.map(c=>(
        '<button class="category-item" data-nav="category/'+c.id+'">'+
          '<div class="category-icon">'+svgIcon(CATEGORY_ICON_PATH[c.id],22)+'</div>'+
          '<span>'+c.name+'</span>'+
        '</button>'
      )).join('')+
    '</div>'+
    '<div class="section">'+
      '<div class="section-head"><div class="h2">Хиты продаж</div><button class="section-link" data-nav="category/tobacco">Все →</button></div>'+
    '</div>'+
    '<div class="hscroll">'+bestsellers.map(p=>productCardHtml(p)).join('')+'</div>'+
    '<div class="section">'+
      '<div class="section-head"><div class="h2">Новинки</div><button class="section-link" data-nav="category/coal">Все →</button></div>'+
    '</div>'+
    '<div class="grid-2">'+newItems.map(p=>productCardHtml(p,true)).join('')+'</div>'+
  '</div></div>'+
  bottomNav('home');
}

function viewCategory(catId){
  const cat = getCategory(catId) || CATEGORIES[0];
  const items = PRODUCTS.filter(p=>p.category===catId);
  return headerBack(cat.name, '<button class="icon-btn">'+svgIcon(ICONS.filter,18)+'</button>')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:14px;padding:16px 0 18px;">'+
    '<div class="section" style="flex-direction:row;align-items:center;justify-content:space-between;">'+
      '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--cream);font-weight:700;">По популярности '+svgIcon(ICONS.chevronDown,12)+'</div>'+
      '<div style="font-size:11px;color:var(--text-tertiary);">'+items.length+' товаров</div>'+
    '</div>'+
    '<div class="hscroll" style="overflow-x:auto;">'+
      '<div class="chip active">Крепость</div><div class="chip">Бренд</div><div class="chip">Цена</div><div class="chip">Вкус</div>'+
    '</div>'+
    '<div class="grid-2">'+(items.length? items.map(p=>productCardHtml(p,true)).join('') : '<div style="grid-column:1/-1;color:var(--text-tertiary);font-size:13px;padding:20px 0;">В этой категории пока нет товаров.</div>')+'</div>'+
  '</div></div>'+
  bottomNav('home');
}

function viewSearch(){
  const q = searchQuery.trim().toLowerCase();
  const results = q ? PRODUCTS.filter(p=> (p.name+' '+p.brand).toLowerCase().includes(q)) : [];
  return '<div class="tg-header"><div class="left" style="flex:1;">'+
      '<button class="icon-btn" data-back>'+svgIcon(ICONS.back,18)+'</button>'+
      '<div class="search-field" style="margin-left:4px;">'+svgIcon(ICONS.search,15)+
        '<input id="searchInput" type="text" placeholder="Поиск по каталогу" value="'+searchQuery.replace(/"/g,'&quot;')+'" autocomplete="off">'+
      '</div></div></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:18px 0;">'+
  (!q ? (
    '<div class="section">'+
      '<div class="section-head"><div class="eyebrow">Недавние запросы</div></div>'+
      '<div class="hscroll" style="flex-wrap:wrap;overflow:visible;">'+RECENT_SEARCHES.map(s=>'<div class="chip" data-action="set-search" data-q="'+s+'">'+s+'</div>').join('')+'</div>'+
    '</div>'+
    '<div class="section">'+
      '<div class="eyebrow">Категории</div>'+
      '<div style="display:flex;flex-direction:column;">'+CATEGORIES.map(c=>(
        '<button class="list-row" data-nav="category/'+c.id+'"><div class="category-icon" style="width:40px;height:40px;border-radius:10px;">'+svgIcon(CATEGORY_ICON_PATH[c.id],18)+'</div>'+
        '<span style="flex:1;font-size:14px;">'+c.name+'</span><span style="color:var(--text-tertiary);font-size:12px;">'+c.count+'</span></button>'
      )).join('')+'</div>'+
    '</div>'
  ) : (results.length ? (
    '<div class="section"><div class="eyebrow">Найдено '+results.length+'</div></div>'+
    '<div class="grid-2">'+results.map(p=>productCardHtml(p,true)).join('')+'</div>'
  ) : (
    '<div class="empty-state">'+
      '<div class="empty-icon">'+svgIcon(ICONS.search,30)+'</div>'+
      '<div class="empty-title">Ничего не найдено</div>'+
      '<div class="empty-text">Проверьте запрос «'+searchQuery+'» или посмотрите категории каталога</div>'+
    '</div>'
  )))+
  '</div></div>'+
  bottomNav('search');
}

function viewProduct(id){
  const p = getProduct(id);
  if(!p) return '<div class="empty-state"><div class="empty-title">Товар не найден</div></div>';
  if(!productSelection || productSelection.id !== id){
    productSelection = {id, strengthIndex: p.strengthDefault||0, volumeIndex: p.volumeIndex||0, flavorIndex: 0, qty:1};
  }
  const sel = productSelection;
  const total = p.price * sel.qty;
  return headerBack('', '<div style="display:flex;gap:8px;"><button class="icon-btn" data-action="toggle-fav" data-id="'+p.id+'" style="'+(isFav(p.id)?'color:var(--brass-soft)':'')+'">'+svgIcon(isFav(p.id)?ICONS.heartFill:ICONS.heart,18)+'</button></div>')+
  '<div class="content"><div style="display:flex;flex-direction:column;">'+
    '<div class="thumb-photo" style="height:270px;border-radius:0;flex-shrink:0;">'+photoImg(p.image,p.name)+'</div>'+
    '<div style="padding:18px 20px;display:flex;flex-direction:column;gap:18px;">'+
      '<div style="display:flex;flex-direction:column;gap:6px;">'+
        '<div class="eyebrow">'+p.brand+'</div>'+
        '<div class="serif" style="font-size:24px;color:var(--cream);">'+p.name+'</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);">'+svgIcon(ICONS.star,13,'')+' '+p.rating+' · '+p.reviews+' отзывов</div>'+
        '<div style="display:flex;align-items:baseline;gap:10px;margin-top:4px;">'+
          '<span class="serif" style="font-size:26px;color:var(--brass-soft);">'+formatPrice(p.price)+'</span>'+
          (p.oldPrice?'<span class="price-old">'+formatPrice(p.oldPrice)+'</span><span class="badge badge-sale">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</span>':'')+
        '</div>'+
      '</div>'+
      (p.flavors.length? (
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div style="font-size:12px;font-weight:700;color:var(--cream);">Вкус</div>'+
          '<div style="display:flex;gap:10px;">'+p.flavors.map((c,i)=>'<div class="swatch'+(i===sel.flavorIndex?' active':'')+'" style="background:'+c+';" data-action="pick-flavor" data-i="'+i+'"></div>').join('')+'</div>'+
        '</div>'
      ):'')+
      (p.strengths.length? (
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div style="font-size:12px;font-weight:700;color:var(--cream);">Крепость</div>'+
          '<div class="segmented">'+p.strengths.map((s,i)=>'<button class="seg'+(i===sel.strengthIndex?' active':'')+'" data-action="pick-strength" data-i="'+i+'">'+s+'</button>').join('')+'</div>'+
        '</div>'
      ):'')+
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;">'+
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div style="font-size:12px;font-weight:700;color:var(--cream);">Объём</div>'+
          '<div style="display:flex;gap:8px;">'+p.volumes.map((v,i)=>'<div class="chip'+(i===sel.volumeIndex?' active':'')+'" data-action="pick-volume" data-i="'+i+'">'+v+'</div>').join('')+'</div>'+
        '</div>'+
        '<div class="qty-stepper">'+
          '<button data-action="qty-dec">–</button><span>'+sel.qty+'</span><button class="plus" data-action="qty-inc">+</button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border-soft);padding-top:16px;">'+
        '<div style="font-size:12px;font-weight:700;color:var(--cream);">Описание</div>'+
        '<div style="font-size:13px;line-height:1.7;color:var(--text-secondary);">'+p.description+'</div>'+
      '</div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar">'+
    '<div style="display:flex;flex-direction:column;"><span style="font-size:10px;color:var(--text-tertiary);font-weight:600;">Итого</span><span class="serif" style="font-size:19px;color:var(--cream);">'+formatPrice(total)+'</span></div>'+
    '<button class="btn btn-primary" style="flex:1;" data-action="add-to-cart">'+svgIcon(ICONS.cart,16)+' В корзину</button>'+
  '</div>';
}

function cartItemRow(item){
  const p = getProduct(item.productId);
  const variantBits = [];
  if(p.strengths.length) variantBits.push(p.strengths[item.strengthIndex]);
  if(p.volumes.length) variantBits.push(p.volumes[item.volumeIndex]);
  return '<div style="display:flex;gap:12px;background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:16px;padding:12px;">'+
    '<div class="thumb-photo" style="width:64px;height:64px;">'+photoImg(p.image,p.name)+'</div>'+
    '<div style="flex:1;display:flex;flex-direction:column;gap:4px;">'+
      '<div class="product-brand">'+p.brand+'</div>'+
      '<div style="font-size:13px;color:var(--cream);font-weight:700;">'+p.name+'</div>'+
      (variantBits.length?'<div style="font-size:11px;color:var(--text-tertiary);">'+variantBits.join(' · ')+'</div>':'')+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">'+
        '<div class="qty-stepper" style="padding:4px 10px;">'+
          '<button data-action="cart-dec" data-key="'+item.key+'">–</button><span>'+item.qty+'</span><button class="plus" data-action="cart-inc" data-key="'+item.key+'">+</button>'+
        '</div>'+
        '<span class="price" style="font-size:14px;">'+formatPrice(cartLine(item))+'</span>'+
      '</div>'+
    '</div>'+
    '<button class="icon-btn" data-action="cart-remove" data-key="'+item.key+'" style="align-self:flex-start;">'+svgIcon(ICONS.close,16)+'</button>'+
  '</div>';
}

function viewCart(){
  STATE.cart.forEach((i,idx)=>{ if(!i.key) i.key = i.productId+'-'+idx+'-'+i.strengthIndex+'-'+i.volumeIndex; });
  if(STATE.cart.length===0){
    return headerBack('Корзина')+
    '<div class="content" style="display:flex;">'+
      '<div class="empty-state">'+
        '<div class="empty-icon">'+svgIcon(ICONS.cart,30)+'</div>'+
        '<div class="empty-title">Корзина пуста</div>'+
        '<div class="empty-text">Добавьте товары из каталога, чтобы оформить заказ</div>'+
        '<button class="btn btn-primary" data-nav="home" style="margin-top:6px;">Перейти в каталог</button>'+
      '</div>'+
    '</div>'+
    bottomNav('cart');
  }
  const promo = STATE.promo && PROMO_CODES[STATE.promo];
  return headerBack('Корзина · '+cartCount())+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:14px;padding:16px 20px 0;">'+
    STATE.cart.map(cartItemRow).join('')+
    '<div style="display:flex;gap:10px;margin-top:6px;">'+
      '<input id="promoInput" class="input" style="flex:1;border-radius:999px;padding-left:16px;" placeholder="Промокод" value="'+(STATE.promo||'')+'">'+
      '<button class="btn btn-secondary btn-sm" data-action="apply-promo" style="border-radius:12px;">Применить</button>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border-soft);padding-top:16px;padding-bottom:16px;">'+
      '<div class="summary-row"><span>Товары ('+cartCount()+')</span><span class="val">'+formatPrice(cartSubtotal())+'</span></div>'+
      (promo?'<div class="summary-row"><span>Скидка · '+STATE.promo+'</span><span class="val" style="color:var(--success);">–'+formatPrice(cartDiscount())+'</span></div>':'')+
      '<div class="summary-row"><span>Доставка</span><span class="val">'+(cartDeliveryFee()===0?'бесплатно':formatPrice(cartDeliveryFee()))+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar" style="flex-direction:column;align-items:stretch;gap:12px;">'+
    '<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">Итого</span><span class="serif" style="font-size:22px;color:var(--cream);">'+formatPrice(cartTotal())+'</span></div>'+
    '<button class="btn btn-primary btn-block" data-nav="checkout">Оформить заказ</button>'+
  '</div>';
}

function viewCheckout(){
  const promo = STATE.promo && PROMO_CODES[STATE.promo];
  const maxRedeem = maxBonusRedeem();
  const bonusDiscount = checkoutBonusDiscount();
  return headerBack('Оформление заказа')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:20px;padding:16px 20px 0;">'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Доставка</div>'+
      '<div class="segmented"><button class="seg active">Курьером</button><button class="seg">Самовывоз</button></div>'+
      '<div style="display:flex;gap:12px;background:var(--bg-elev);border:1px solid var(--brass-deep);border-radius:14px;padding:14px;">'+
        svgIcon(ICONS.mapPin,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:3px;"><span style="font-size:13px;color:var(--cream);font-weight:700;">ул. Тверская, 24, кв. 56</span><span style="font-size:11px;color:var(--text-tertiary);">Домофон 56К · этаж 4</span></div>'+
        '<span style="font-size:12px;color:var(--brass-soft);font-weight:700;">Изменить</span>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Способ оплаты</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;">'+
        '<label class="list-row" style="border:1px solid var(--brass);border-radius:14px;padding:13px 14px;" data-action="pick-pay" data-i="0"><div class="pin active"></div>'+svgIcon(ICONS.card,18,'')+'<span style="flex:1;font-size:13px;color:var(--cream);font-weight:700;">Банковская карта</span><span style="font-size:11px;color:var(--text-tertiary);">•• 4821</span></label>'+
        '<label class="list-row" style="border:1px solid var(--border-soft);border-radius:14px;padding:13px 14px;" data-action="pick-pay" data-i="1"><div class="pin"></div>'+svgIcon(ICONS.cash,18,'')+'<span style="font-size:13px;color:var(--cream);font-weight:700;">Наличными курьеру</span></label>'+
      '</div>'+
    '</div>'+
    (promo?'<div style="display:flex;align-items:center;gap:10px;background:#241A0E;border:1px solid var(--brass-deep);border-radius:12px;padding:11px 14px;">'+svgIcon(ICONS.gift,16,'')+'<span style="font-size:12px;color:var(--brass-soft);font-weight:700;flex:1;">Промокод '+STATE.promo+' применён</span><span style="font-size:11px;color:var(--success);font-weight:700;">–'+formatPrice(cartDiscount())+'</span></div>':'')+
    (STATE.freeDeliveryCredits>0 && cartSubtotal()<=3000 ? '<div style="display:flex;align-items:center;gap:10px;background:#1C2418;border:1px solid #3E4E32;border-radius:12px;padding:11px 14px;">'+svgIcon(ICONS.truck,16,'')+'<span style="font-size:12px;color:var(--success);font-weight:700;flex:1;">Бесплатная доставка — приз колеса фортуны</span></div>' : '')+
    (maxRedeem>0 ? (
      '<label class="list-row" style="border:1px solid '+(STATE.useBonuses?'var(--brass)':'var(--border-soft)')+';border-radius:14px;padding:13px 14px;" data-action="toggle-use-bonuses">'+
        '<div class="pin'+(STATE.useBonuses?' active':'')+'"></div>'+
        '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--cream);font-weight:700;">Списать бонусы</span><span style="font-size:11px;color:var(--text-tertiary);">Доступно '+STATE.bonusBalance+' · максимум к списанию '+maxRedeem+'</span></div>'+
        (STATE.useBonuses?'<span style="font-size:12px;color:var(--success);font-weight:700;">–'+formatPrice(bonusDiscount)+'</span>':'')+
      '</label>'
    ) : '')+
    '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border-soft);padding:14px 0 16px;">'+
      '<div class="summary-row"><span>Товары ('+cartCount()+')</span><span class="val">'+formatPrice(cartSubtotal())+'</span></div>'+
      (promo?'<div class="summary-row"><span>Скидка по промокоду</span><span class="val" style="color:var(--success);">–'+formatPrice(cartDiscount())+'</span></div>':'')+
      (bonusDiscount>0?'<div class="summary-row"><span>Списание бонусов</span><span class="val" style="color:var(--success);">–'+formatPrice(bonusDiscount)+'</span></div>':'')+
      '<div class="summary-row"><span>Доставка</span><span class="val">'+(cartDeliveryFee()===0?'бесплатно':formatPrice(cartDeliveryFee()))+'</span></div>'+
      '<div class="summary-row"><span>Кешбэк за заказ · '+currentTier().name+' '+Math.round(currentTier().cashback*100)+'%</span><span class="val" style="color:var(--brass-soft);">+'+Math.round(checkoutTotal()*currentTier().cashback)+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar" style="flex-direction:column;align-items:stretch;gap:12px;">'+
    '<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">Итого к оплате</span><span class="serif" style="font-size:22px;color:var(--cream);">'+formatPrice(checkoutTotal())+'</span></div>'+
    '<button class="btn btn-primary btn-block" data-action="place-order">Оплатить заказ</button>'+
  '</div>';
}

function viewOrderSuccess(orderId){
  const order = getOrder(orderId);
  return '<div class="content" style="display:flex;">'+
    '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:32px;text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;background:radial-gradient(circle,#2E3A24,#1B160F 70%);box-shadow:0 0 40px rgba(138,160,107,0.35);display:flex;align-items:center;justify-content:center;">'+svgIcon(ICONS.check,38,'')+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><div class="serif" style="font-size:26px;color:var(--cream);">Заказ оформлен!</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;max-width:260px;">Спасибо за заказ. Мы уже готовим его к отправке.</div></div>'+
      '<div style="width:100%;background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;">'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Номер заказа</span><span style="color:var(--cream);font-weight:700;">№ '+(order?order.id:orderId)+'</span></div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Ожидаемая доставка</span><span style="color:var(--cream);font-weight:700;">'+(order?order.eta:'сегодня, 18:00–20:00')+'</span></div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Начислено бонусов</span><span style="color:var(--brass-soft);font-weight:700;">+'+(order?order.cashback:0)+'</span></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:10px;background:var(--bg-elev);border:1px solid var(--brass-deep);border-radius:12px;padding:12px 14px;width:100%;">'+
        svgIcon(ICONS.wheel,17,'')+
        '<span style="font-size:12px;color:var(--brass-soft);font-weight:700;">+1 попытка колеса фортуны — можно крутить прямо сейчас</span>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;width:100%;margin-top:6px;">'+
        '<button class="btn btn-primary btn-block" data-nav="order/'+orderId+'">Отследить заказ</button>'+
        '<button class="btn btn-secondary btn-block" data-nav="wheel">Крутить колесо фортуны</button>'+
        '<button class="btn btn-ghost btn-block" data-nav="home">На главную</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function viewProfile(){
  const tier = currentTier(), prog = tierProgress();
  const spins = spinsAvailable();
  return headerBack('Профиль', '<button class="icon-btn">'+svgIcon(ICONS.settings,18)+'</button>')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:20px;padding:18px 20px 18px;">'+
    '<div style="display:flex;align-items:center;gap:14px;">'+
      '<div class="avatar">Р</div>'+
      '<div style="display:flex;flex-direction:column;gap:3px;"><div style="font-size:16px;font-weight:700;color:var(--cream);">Ринат М.</div><div style="font-size:12px;color:var(--text-tertiary);">@rinat_m · +7 999 123-45-67</div></div>'+
    '</div>'+
    '<div class="loyalty-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;"><div class="eyebrow" style="color:var(--brass-soft);">Уровень '+tier.name+'</div><div style="font-size:11px;color:var(--text-secondary);">кэшбэк '+Math.round(tier.cashback*100)+'%</div></div>'+
      '<div class="serif" style="font-size:30px;color:var(--cream);">'+STATE.bonusBalance+' бонусов</div>'+
      (prog.nextName ? '<div style="display:flex;flex-direction:column;gap:6px;"><div style="height:6px;border-radius:3px;background:#3A2E1A;overflow:hidden;"><div style="width:'+prog.pct+'%;height:100%;background:linear-gradient(90deg,var(--brass),var(--brass-soft));"></div></div><div style="font-size:11px;color:var(--text-secondary);">До уровня '+prog.nextName+' — '+formatPrice(prog.remaining)+' покупок</div></div>' : '<div style="font-size:11px;color:var(--text-secondary);">Максимальный уровень достигнут</div>')+
      '<details class="loyalty-qr-toggle">'+
        '<summary>Показать карту лояльности'+svgIcon(ICONS.chevronRight,14,'chev')+'</summary>'+
        loyaltyQrCard()+
      '</details>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;">'+
      '<button class="list-row" data-nav="wheel"><span style="flex:1;font-size:14px;font-weight:600;">Колесо фортуны</span>'+(spins>0?'<span class="badge badge-hit" style="margin-right:8px;">'+spins+'</span>':'')+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row" data-nav="referral"><span style="flex:1;font-size:14px;font-weight:600;">Пригласить друзей</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row" data-nav="orders"><span style="flex:1;font-size:14px;font-weight:600;">История заказов</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row" data-nav="favorites"><span style="flex:1;font-size:14px;font-weight:600;">Избранное</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row" data-nav="promotions"><span style="flex:1;font-size:14px;font-weight:600;">Акции и бонусы</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row"><span style="flex:1;font-size:14px;font-weight:600;">Адреса доставки</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row"><span style="flex:1;font-size:14px;font-weight:600;">Уведомления</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
      '<button class="list-row" data-action="toggle-offline"><span style="flex:1;font-size:14px;font-weight:600;">Поддержка</span>'+svgIcon(ICONS.chevronRight,14,'chev')+'</button>'+
    '</div>'+
  '</div></div>'+
  bottomNav('profile');
}

function orderStatusLabel(s){
  return s==='transit' ? '<span style="color:var(--brass-soft);">В пути</span>' : s==='delivered' ? '<span style="color:var(--success);">Доставлен</span>' : '<span style="color:var(--text-tertiary);">Отменён</span>';
}

function viewOrders(){
  if(ORDERS.length===0){
    return headerBack('История заказов')+
    '<div class="content" style="display:flex;"><div class="empty-state">'+
      '<div class="empty-icon">'+svgIcon(ICONS.box,30)+'</div>'+
      '<div class="empty-title">Заказов пока нет</div>'+
      '<div class="empty-text">Здесь появится история ваших покупок</div>'+
      '<button class="btn btn-primary" data-nav="home" style="margin-top:6px;">Начать покупки</button>'+
    '</div></div>';
  }
  return headerBack('История заказов')+
  '<div class="content"><div style="display:flex;flex-direction:column;padding:8px 0;">'+
    ORDERS.map(o=>(
      '<button class="list-row" style="align-items:flex-start;" data-nav="order/'+o.id+'">'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;">'+
          '<div style="display:flex;align-items:center;justify-content:between;gap:8px;"><span style="font-size:13px;color:var(--cream);font-weight:700;">Заказ № '+o.id+'</span></div>'+
          '<span style="font-size:11px;color:var(--text-tertiary);">'+o.date+' · '+o.itemsCount+' товара</span>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">'+
          '<span style="font-size:12px;font-weight:700;">'+orderStatusLabel(o.status)+'</span>'+
          '<span class="serif" style="font-size:15px;color:var(--cream);">'+formatPrice(o.total)+'</span>'+
        '</div>'+
      '</button>'
    )).join('')+
  '</div></div>';
}

function viewOrderDetail(id){
  const o = getOrder(id);
  if(!o) return headerBack('Заказ')+'<div class="content"><div class="empty-state"><div class="empty-title">Заказ не найден</div></div></div>';
  const steps = ['Принят','Готовится','В пути','Доставлен'];
  const stepIndex = o.status==='delivered'?3 : o.status==='transit'?2 : o.status==='cancelled'?0 : 1;
  return headerBack('Заказ № '+o.id)+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:20px;padding:18px 20px;">'+
    '<div style="display:flex;align-items:center;">'+
      steps.map((s,i)=>(
        '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;">'+
          '<div style="width:26px;height:26px;border-radius:50%;background:'+(i<=stepIndex&&o.status!=='cancelled'?'linear-gradient(135deg,var(--brass-soft),var(--brass))':'var(--bg-elev-2)')+';border:'+(i<=stepIndex&&o.status!=='cancelled'?'none':'1px solid var(--border)')+';'+(i===stepIndex&&o.status==='transit'?'box-shadow:0 0 0 4px rgba(201,164,103,0.2);':'')+'"></div>'+
          '<span style="font-size:9px;font-weight:700;text-align:center;color:'+(i<=stepIndex&&o.status!=='cancelled'?'var(--cream)':'var(--text-tertiary)')+';">'+s+'</span>'+
        '</div>'+
        (i<steps.length-1?'<div style="flex:1;height:2px;background:'+(i<stepIndex&&o.status!=='cancelled'?'var(--brass)':'var(--border)')+';margin-bottom:18px;"></div>':'')
      )).join('')+
    '</div>'+
    '<div style="display:flex;gap:12px;background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:14px;padding:14px;">'+svgIcon(ICONS.mapPin,18,'')+
      '<div style="display:flex;flex-direction:column;gap:3px;"><span style="font-size:13px;color:var(--cream);font-weight:700;">'+o.address+'</span><span style="font-size:11px;color:var(--text-tertiary);">'+o.eta+'</span></div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Состав заказа</div>'+
      o.items.map(it=>{ const p=getProduct(it.productId); return '<div style="display:flex;gap:12px;">'+
        '<div class="thumb-photo" style="width:52px;height:52px;">'+photoImg(p.image,p.name)+'</div>'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:13px;color:var(--cream);font-weight:700;">'+p.brand+' '+p.name+'</span><span style="font-size:11px;color:var(--text-tertiary);">× '+it.qty+'</span></div>'+
        '<span class="price" style="font-size:13px;">'+formatPrice(it.price*it.qty)+'</span>'+
      '</div>'; }).join('')+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border-soft);padding:14px 0 4px;">'+
      '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;"><span style="color:var(--cream);">Итого</span><span class="serif" style="color:var(--brass-soft);font-size:17px;">'+formatPrice(o.total)+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar">'+
    '<button class="btn btn-secondary" style="flex:1;">Поддержка</button>'+
    '<button class="btn btn-primary" style="flex:1.4;" data-action="reorder" data-id="'+o.id+'">Повторить заказ</button>'+
  '</div>';
}

function viewPromotions(){
  const tier = currentTier();
  const wonPromoCodes = Object.keys(PROMO_CODES).filter(c=>c!=='SMOKE20');
  return headerBack('Акции и бонусы')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:18px 20px;">'+
    '<div class="loyalty-card" style="margin:0;">'+
      '<div class="eyebrow" style="color:var(--brass-soft);">Ваш баланс</div>'+
      '<div class="serif" style="font-size:30px;color:var(--cream);">'+STATE.bonusBalance+' бонусов</div>'+
      '<div class="loyalty-tiers">'+TIERS.map(t=>'<div class="loyalty-tier'+(t.name===tier.name?' active':'')+'">'+t.name+'<br>'+Math.round(t.cashback*100)+'%</div>').join('')+'</div>'+
    '</div>'+
    '<button class="list-row" data-nav="wheel" style="background:var(--bg-elev);border:1px solid var(--brass-deep);border-radius:14px;padding:14px;">'+svgIcon(ICONS.wheel,20,'')+
      '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--cream);font-weight:700;">Колесо фортуны</span><span style="font-size:11px;color:var(--text-tertiary);">Доступно попыток: '+spinsAvailable()+'</span></div>'+
      svgIcon(ICONS.chevronRight,14,'chev')+
    '</button>'+
    '<button class="list-row" data-nav="referral" style="background:var(--bg-elev);border:1px solid var(--border-soft);border-radius:14px;padding:14px;">'+svgIcon(ICONS.users,20,'')+
      '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--cream);font-weight:700;">Пригласить друзей</span><span style="font-size:11px;color:var(--text-tertiary);">+'+REFERRAL_REWARD+' бонусов за каждого</span></div>'+
      svgIcon(ICONS.chevronRight,14,'chev')+
    '</button>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Мои промокоды</div>'+
      '<div style="display:flex;align-items:center;gap:12px;background:var(--bg-elev);border:1px dashed var(--brass-deep);border-radius:14px;padding:14px;">'+svgIcon(ICONS.gift,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;color:var(--cream);font-weight:800;">SMOKE20</span><span style="font-size:11px;color:var(--text-tertiary);">-20% на угли · до 20.09</span></div>'+
        '<button class="section-link" style="color:var(--brass-soft);" data-action="copy-promo" data-code="SMOKE20">Скопировать</button>'+
      '</div>'+
      wonPromoCodes.map(c=>{ const pc=PROMO_CODES[c]; return '<div style="display:flex;align-items:center;gap:12px;background:var(--bg-elev);border:1px dashed var(--brass-deep);border-radius:14px;padding:14px;">'+svgIcon(ICONS.wheel,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;color:var(--cream);font-weight:800;">'+c+'</span><span style="font-size:11px;color:var(--text-tertiary);">'+pc.label+' · приз колеса фортуны</span></div>'+
        '<button class="section-link" style="color:var(--brass-soft);" data-action="copy-promo" data-code="'+c+'">Скопировать</button>'+
      '</div>'; }).join('')+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Текущие акции</div>'+
      PROMOTIONS.map(p=>'<div style="height:auto;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#2E2313,#1B140C 70%);border:1px solid var(--border);display:flex;flex-direction:column;gap:4px;"><div style="font-size:14px;color:var(--cream);font-weight:800;">'+p.title+'</div><div style="font-size:11px;color:var(--text-secondary);">'+p.desc+'</div></div>').join('')+
    '</div>'+
  '</div></div>';
}

function viewFavorites(){
  const items = PRODUCTS.filter(p=>isFav(p.id));
  if(items.length===0){
    return headerBack('Избранное')+
    '<div class="content" style="display:flex;"><div class="empty-state">'+
      svgIcon(ICONS.heart,30,'')+
      '<div class="empty-title">Список избранного пуст</div>'+
      '<div class="empty-text">Отмечайте товары сердечком, чтобы быстро находить их здесь</div>'+
      '<button class="btn btn-primary" data-nav="home" style="margin-top:6px;">Перейти в каталог</button>'+
    '</div></div>';
  }
  return headerBack('Избранное · '+items.length)+
  '<div class="content"><div class="grid-2" style="padding-top:16px;padding-bottom:16px;">'+items.map(p=>productCardHtml(p,true)).join('')+'</div></div>';
}

function resultBanner(p){
  return '<div style="width:100%;background:var(--bg-elev);border:1px solid var(--brass-deep);border-radius:16px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">'+
    '<div class="eyebrow" style="color:var(--brass-soft);">Ваш приз</div>'+
    '<div class="serif" style="font-size:22px;color:var(--cream);">'+p.title+'</div>'+
    (p.type==='promo' ? '<div style="font-size:12px;color:var(--text-secondary);">Промокод <b style="color:var(--brass-soft);">'+p.code+'</b> активен 7 дней — примените его в корзине</div>' : '')+
    (p.type==='freeDelivery' ? '<div style="font-size:12px;color:var(--text-secondary);">Бесплатная доставка спишется автоматически на следующем заказе</div>' : '')+
    (p.type==='again' ? '<div style="font-size:12px;color:var(--text-secondary);">Можно крутить ещё раз прямо сейчас</div>' : '')+
  '</div>';
}

function viewWheel(){
  const spins = spinsAvailable();
  return headerBack('Колесо фортуны')+
  '<div class="content"><div style="display:flex;flex-direction:column;align-items:center;gap:22px;padding:26px 20px 30px;">'+
    '<div style="position:relative;">'+
      '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:18px solid var(--brass);z-index:2;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));"></div>'+
      wheelSvg(0)+
    '</div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">'+
      '<div class="serif" style="font-size:19px;color:var(--cream);">Доступно попыток: '+spins+'</div>'+
      '<div style="font-size:12px;color:var(--text-tertiary);text-align:center;">1 бесплатная попытка в день · +1 попытка за каждую покупку</div>'+
    '</div>'+
    '<button id="spinBtn" class="btn btn-primary btn-block" data-action="spin-wheel"'+(spins<=0?' disabled':'')+'>'+(spins>0?'Крутить колесо':'Приходите завтра')+'</button>'+
    (lastWheelResult ? resultBanner(lastWheelResult) : '')+
  '</div></div>';
}

function viewReferral(){
  const code = getReferralCode();
  const link = getReferralLink();
  const earned = REFERRALS.filter(r=>r.status==='ordered').reduce((s,r)=>s+r.reward,0);
  return headerBack('Пригласить друзей')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:20px 20px 24px;">'+
    '<div style="display:flex;flex-direction:column;gap:8px;">'+
      '<div class="serif" style="font-size:24px;color:var(--cream);line-height:1.25;">Приглашайте друзей — получайте бонусы</div>'+
      '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">За каждого друга, который сделает первый заказ, вам начислят <b style="color:var(--brass-soft);">'+REFERRAL_REWARD+' бонусов</b>. Друг получит промокод на первую покупку.</div>'+
    '</div>'+
    '<div style="background:var(--bg-elev);border:1px dashed var(--brass-deep);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Ваш код</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;">'+
        '<span class="serif" style="font-size:22px;letter-spacing:2px;color:var(--cream);">'+code+'</span>'+
        '<button class="icon-btn" data-action="copy-referral">'+svgIcon(ICONS.copy,18)+'</button>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:10px;">'+
      '<button class="btn btn-primary" style="flex:1;" data-action="share-referral">'+svgIcon(ICONS.share,16)+' Поделиться</button>'+
      '<button class="btn btn-secondary" style="flex:1;" data-action="copy-referral-link">Скопировать ссылку</button>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div style="display:flex;align-items:baseline;justify-content:space-between;">'+
        '<div class="eyebrow">Ваши приглашения</div>'+
        '<span style="font-size:12px;color:var(--brass-soft);font-weight:700;">Заработано '+earned+' бонусов</span>'+
      '</div>'+
      (REFERRALS.length===0 ? '<div style="font-size:12px;color:var(--text-tertiary);">Пока никто не присоединился по вашей ссылке</div>' :
        REFERRALS.map(r=>(
          '<div style="display:flex;align-items:center;gap:12px;">'+
            '<div class="avatar" style="width:40px;height:40px;font-size:15px;">'+r.name.charAt(0)+'</div>'+
            '<div style="flex:1;display:flex;flex-direction:column;">'+
              '<span style="font-size:13px;color:var(--cream);font-weight:600;">'+r.name+'</span>'+
              '<span style="font-size:11px;color:var(--text-tertiary);">'+(r.status==='ordered' ? 'Первый заказ · '+r.date : 'Ожидает первый заказ')+'</span>'+
            '</div>'+
            (r.status==='ordered' ? '<span style="font-size:13px;color:var(--success);font-weight:700;">+'+r.reward+'</span>' : '<span style="font-size:11px;color:var(--text-tertiary);">—</span>')+
          '</div>'
        )).join(''))+
    '</div>'+
  '</div></div>';
}

/* ================= EVENTS ================= */

function onGlobalClick(e){
  const navEl = e.target.closest('[data-nav]');
  const backEl = e.target.closest('[data-back]');
  const actEl = e.target.closest('[data-action]');

  if(navEl){ haptic(); navigate('#/'+navEl.getAttribute('data-nav')); return; }
  if(backEl){ haptic(); goBack(); return; }
  if(!actEl) return;

  const action = actEl.getAttribute('data-action');
  switch(action){
    case 'confirm-age':
      STATE.ageConfirmed = true; localStorage.setItem('ambra_age','1'); haptic('success'); render(); break;
    case 'deny-age':
      toast('Доступ к магазину ограничен по возрасту', 'err'); break;

    case 'toggle-fav': {
      const id = actEl.getAttribute('data-id');
      const idx = STATE.favorites.indexOf(id);
      if(idx>-1){ STATE.favorites.splice(idx,1); toast('Убрано из избранного'); }
      else { STATE.favorites.push(id); toast('Добавлено в избранное'); }
      saveState(); haptic(); render();
      break;
    }

    case 'pick-flavor': productSelection.flavorIndex = +actEl.getAttribute('data-i'); haptic(); render(); break;
    case 'pick-strength': productSelection.strengthIndex = +actEl.getAttribute('data-i'); haptic(); render(); break;
    case 'pick-volume': productSelection.volumeIndex = +actEl.getAttribute('data-i'); haptic(); render(); break;
    case 'qty-inc': productSelection.qty++; render(); break;
    case 'qty-dec': if(productSelection.qty>1) productSelection.qty--; render(); break;

    case 'add-to-cart': {
      const sel = productSelection;
      const key = sel.id+'-'+sel.strengthIndex+'-'+sel.volumeIndex;
      const existing = STATE.cart.find(i=>i.key===key);
      if(existing) existing.qty += sel.qty;
      else STATE.cart.push({productId: sel.id, key, qty: sel.qty, strengthIndex: sel.strengthIndex, volumeIndex: sel.volumeIndex, flavorIndex: sel.flavorIndex});
      saveState(); haptic('success'); toast('Товар добавлен в корзину');
      break;
    }

    case 'cart-inc': { const it = STATE.cart.find(i=>i.key===actEl.getAttribute('data-key')); if(it) it.qty++; saveState(); render(); break; }
    case 'cart-dec': { const it = STATE.cart.find(i=>i.key===actEl.getAttribute('data-key')); if(it){ it.qty--; if(it.qty<=0) STATE.cart = STATE.cart.filter(x=>x!==it); } saveState(); render(); break; }
    case 'cart-remove': { STATE.cart = STATE.cart.filter(i=>i.key!==actEl.getAttribute('data-key')); saveState(); haptic(); render(); break; }

    case 'apply-promo': {
      const input = document.getElementById('promoInput');
      const code = (input.value||'').trim().toUpperCase();
      if(PROMO_CODES[code]){ STATE.promo = code; saveState(); haptic('success'); toast('Промокод применён'); render(); }
      else { haptic('error'); toast('Промокод не найден', 'err'); }
      break;
    }
    case 'copy-promo': {
      const code = actEl.getAttribute('data-code');
      if(navigator.clipboard) navigator.clipboard.writeText(code).catch(()=>{});
      toast('Промокод '+code+' скопирован'); haptic('success');
      break;
    }

    case 'pick-pay': {
      document.querySelectorAll('[data-action="pick-pay"]').forEach(el=>{
        el.style.borderColor = 'var(--border-soft)';
        el.querySelector('.pin').classList.remove('active');
      });
      actEl.style.borderColor = 'var(--brass)';
      actEl.querySelector('.pin').classList.add('active');
      break;
    }

    case 'toggle-use-bonuses': {
      STATE.useBonuses = !STATE.useBonuses; render();
      break;
    }

    case 'place-order': {
      if(STATE.cart.length===0){ toast('Корзина пуста', 'err'); return; }
      const paidTotal = checkoutTotal();
      const bonusSpent = checkoutBonusDiscount();
      const usedFreeShipCredit = STATE.freeDeliveryCredits > 0 && cartSubtotal() <= 3000;
      const cashback = Math.round(paidTotal * currentTier().cashback);
      const newId = String(10000 + Math.floor(Math.random()*899));
      const order = {
        id:newId, date:'сегодня', itemsCount:cartCount(), total:paidTotal, status:'transit', cashback:cashback,
        items: STATE.cart.map(i=>({productId:i.productId, qty:i.qty, price:getProduct(i.productId).price})),
        address:'ул. Тверская, 24, кв. 56', eta:'сегодня, 18:00–20:00'
      };
      ORDERS.unshift(order);
      STATE.bonusBalance = STATE.bonusBalance - bonusSpent + cashback;
      STATE.lifetimeSpend += paidTotal;
      STATE.wheelSpinsExtra += 1;
      if(usedFreeShipCredit) STATE.freeDeliveryCredits -= 1;
      STATE.cart = []; STATE.promo = null; STATE.useBonuses = false;
      saveState();
      haptic('success');
      navigate('#/order-success/'+newId);
      break;
    }
    case 'reorder': {
      const o = getOrder(actEl.getAttribute('data-id'));
      if(o){ o.items.forEach(it=>{ const key=it.productId+'-0-0'; const ex=STATE.cart.find(c=>c.key===key); if(ex) ex.qty+=it.qty; else STATE.cart.push({productId:it.productId,key,qty:it.qty,strengthIndex:0,volumeIndex:0,flavorIndex:0}); }); saveState(); toast('Товары добавлены в корзину'); haptic('success'); navigate('#/cart'); }
      break;
    }

    case 'spin-wheel': {
      if(spinsAvailable()<=0){ toast('Нет доступных попыток', 'err'); return; }
      const wheelEl = document.getElementById('wheelDial');
      const btnEl = document.getElementById('spinBtn');
      if(!wheelEl || wheelEl.dataset.spinning) return;
      wheelEl.dataset.spinning = '1';
      if(btnEl) btnEl.setAttribute('disabled','disabled');
      const idx = pickPrizeIndex();
      const seg = 360/WHEEL_PRIZES.length;
      const target = 360*6 - (idx*seg + seg/2);
      wheelEl.style.transition = 'transform 4s cubic-bezier(0.12,0.67,0.1,1)';
      wheelEl.style.transform = 'rotate('+target+'deg)';
      haptic();
      setTimeout(function(){
        const prize = applyWheelPrize(idx);
        consumeSpin();
        saveState();
        lastWheelResult = prize;
        haptic('success');
        toast('Выигрыш: '+prize.title);
        render();
      }, 4150);
      break;
    }

    case 'copy-referral': case 'copy-referral-link': {
      const text = action==='copy-referral' ? getReferralCode() : getReferralLink();
      if(navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
      toast('Скопировано'); haptic('success');
      break;
    }
    case 'share-referral': {
      const link = getReferralLink();
      const shareText = 'Загляни в Gорчит — премиальный магазин табака и кальянов. Мой код на бонус: '+getReferralCode();
      if(tg && tg.openTelegramLink){
        tg.openTelegramLink('https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(shareText));
      } else if(navigator.share){
        navigator.share({title:'Gорчит', text:shareText, url:link}).catch(()=>{});
      } else if(navigator.clipboard){
        navigator.clipboard.writeText(link).catch(()=>{});
        toast('Ссылка скопирована');
      }
      haptic();
      break;
    }
  }
}

function onGlobalInput(e){
  if(e.target.id==='searchInput'){
    searchQuery = e.target.value;
    const app = document.getElementById('app');
    const scrollY = window.scrollY;
    render();
    const input = document.getElementById('searchInput');
    if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
}
