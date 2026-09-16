// ===== HOOKAH SHOP webapp — vanilla JS SPA, hash-router, no build step =====

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
  notifReadCount: JSON.parse(localStorage.getItem('ambra_notifread') || '0'),
};
function saveState(){
  localStorage.setItem('ambra_cart', JSON.stringify(STATE.cart));
  localStorage.setItem('ambra_favs', JSON.stringify(STATE.favorites));
  localStorage.setItem('ambra_promo', JSON.stringify(STATE.promo));
  localStorage.setItem('ambra_bonus', JSON.stringify(STATE.bonusBalance));
  localStorage.setItem('ambra_spend', JSON.stringify(STATE.lifetimeSpend));
  localStorage.setItem('ambra_freeship', JSON.stringify(STATE.freeDeliveryCredits));
  localStorage.setItem('ambra_spins', JSON.stringify(STATE.wheelSpinsExtra));
  localStorage.setItem('ambra_notifread', JSON.stringify(STATE.notifReadCount));
  if(STATE.wheelLastFreeSpinDate) localStorage.setItem('ambra_lastspin', STATE.wheelLastFreeSpinDate);
}

// ephemeral per-view state
let productSelection = null;
let searchQuery = '';
let lastWheelResult = null;
let currentFilters = { brand:null, taste:null, strength:null, inStockOnly:false, minPrice:null, maxPrice:null };
let sortMode = 'popular';
let catalogChip = 'all';
let sheetOpen = null; // null | 'filter' | 'sort'
let confirmSheet = null; // {title, text, confirmLabel, action, payload}
let routeLoading = false;
let orderProcessing = false;

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
function isTobaccoLike(p){ return p.category==='tobacco' || p.category==='vape'; }

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
    code = 'HKS-' + Math.random().toString(36).slice(2,8).toUpperCase();
    localStorage.setItem('ambra_refcode', code);
  }
  return code;
}
function getReferralLink(){ return location.origin + location.pathname.replace(/index\.html$/,'') + '?ref=' + getReferralCode(); }

/* ---------- декоративный QR для карты лояльности (не для сканирования, только визуал) ---------- */
function seededRandom(seed){ let s = seed % 2147483647; if(s<=0) s += 2147483646; return function(){ s = (s*16807) % 2147483647; return (s-1)/2147483646; }; }
function qrPlaceholderSvg(seedText){
  const n = 21, cell = 8, size = n*cell;
  const seed = (seedText||'HKS').split('').reduce((a,c)=>a+c.charCodeAt(0)*7,1);
  const rand = seededRandom(seed);
  function isFinderZone(r,c){ return (r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7); }
  function finder(r0,c0){
    let s='';
    for(let r=0;r<7;r++) for(let c=0;c<7;c++){
      const border = r===0||r===6||c===0||c===6;
      const inner = r>=2&&r<=4&&c>=2&&c<=4;
      if(border||inner) s += '<rect x="'+(c0+c)*cell+'" y="'+(r0+r)*cell+'" width="'+cell+'" height="'+cell+'" fill="#15171A"/>';
    }
    return s;
  }
  let cells = '';
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      if(isFinderZone(r,c)) continue;
      if(rand()>0.55) cells += '<rect x="'+c*cell+'" y="'+r*cell+'" width="'+cell+'" height="'+cell+'" fill="#15171A"/>';
    }
  }
  cells += finder(0,0) + finder(0,n-7) + finder(n-7,0);
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="display:block;">'+cells+'</svg>';
}
function loyaltyQrCard(){
  const code = getReferralCode();
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:16px;">'+
    '<div style="padding:10px;background:#fff;border-radius:12px;">'+qrPlaceholderSvg(code)+'</div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'+
      '<span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Номер карты</span>'+
      '<span style="font-size:16px;font-weight:700;letter-spacing:1px;color:#fff;">'+code+'</span>'+
    '</div>'+
    '<span style="font-size:11px;color:rgba(255,255,255,0.6);text-align:center;max-width:260px;line-height:1.5;">Покажите QR-код на кассе, чтобы применить бонусы и скидку уровня '+currentTier().name+'</span>'+
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
    const textColor = p.color==='#F52B32' ? '#fff' : '#15171A';
    inner += '<path d="M'+cx+','+cy+' L'+x0+','+y0+' A'+r+','+r+' 0 0,1 '+x1+','+y1+' Z" fill="'+p.color+'" stroke="#fff" stroke-width="2"/>';
    const mid = (i*seg + seg/2 - 90) * Math.PI/180;
    const lx = (cx + r*0.64*Math.cos(mid)).toFixed(1), ly = (cy + r*0.64*Math.sin(mid)).toFixed(1);
    const rot = (i*seg + seg/2).toFixed(1);
    inner += '<text x="'+lx+'" y="'+ly+'" fill="'+textColor+'" font-size="17" font-weight="800" text-anchor="middle" dominant-baseline="middle" transform="rotate('+rot+' '+lx+' '+ly+')" font-family="Inter, sans-serif">'+p.label+'</text>';
  });
  return '<svg id="wheelDial" width="280" height="280" viewBox="0 0 280 280" style="display:block;transform-origin:140px 140px;transform:rotate('+(rotation||0)+'deg);">'+inner+
    '<circle cx="140" cy="140" r="128" fill="none" stroke="var(--border)" stroke-width="2"/>'+
    '<circle cx="140" cy="140" r="20" fill="#fff" stroke="var(--primary)" stroke-width="2"/></svg>';
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
window.addEventListener('hashchange', function(){
  lastWheelResult = null; sheetOpen = null; confirmSheet = null;
  const {name} = parseHash();
  clearTimeout(window.__loadT);
  if(name==='catalog' || name==='category'){
    routeLoading = true; render();
    window.__loadT = setTimeout(function(){ routeLoading=false; render(); }, 220);
  } else {
    routeLoading = false; render();
  }
});
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
      tg.setHeaderColor('#FFFFFF');
      tg.setBackgroundColor('#FFFFFF');
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
  document.addEventListener('change', onGlobalChange);
  document.addEventListener('submit', function(e){ e.preventDefault(); });
  render();
}

/* ---------- icon helper ---------- */
function svgIcon(pathHtml, size, extraClass){
  return '<svg class="icon '+(extraClass||'')+'" width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24">'+pathHtml+'</svg>';
}

/* ---------- product photo (real photo or clean monogram placeholder) ---------- */
function productPhotoHtml(p){
  if(p.image) return '<img src="'+p.image+'" alt="'+(p.name||'').replace(/"/g,'&quot;')+'" loading="lazy" onerror="this.remove()">';
  const initial = (p.brand||p.name||'?').charAt(0).toUpperCase();
  return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface);color:var(--text-tertiary);font-weight:800;font-size:30px;">'+initial+'</div>';
}
function photoImg(url, alt){
  return url ? '<img src="'+url+'" alt="'+(alt||'').replace(/"/g,'&quot;')+'" loading="lazy" onerror="this.remove()">' : '';
}

/* ---------- shell pieces ---------- */
function headerHome(){
  const unread = NOTIFICATIONS.filter(n=>n.unread).length;
  return '<div class="tg-header">'+
    '<div class="brand"><div class="brand-mark">H</div><div style="display:flex;flex-direction:column;"><span class="brand-name">'+BRAND_NAME+'</span><span class="brand-sub">ТАБАК · КАЛЬЯНЫ · АКСЕССУАРЫ</span></div></div>'+
    '<div style="display:flex;align-items:center;gap:2px;">'+
      '<button class="icon-btn" data-nav="search">'+svgIcon(ICONS.search,19)+'</button>'+
      '<button class="icon-btn" data-nav="notifications">'+svgIcon(ICONS.bell,19)+(unread>0?'<span class="nav-badge" style="top:4px;right:4px;">'+unread+'</span>':'')+'</button>'+
      '<button class="icon-btn" data-nav="cart">'+svgIcon(ICONS.cart,19)+(cartCount()>0?'<span class="nav-badge" style="top:4px;right:4px;">'+cartCount()+'</span>':'')+'</button>'+
    '</div>'+
  '</div>';
}
function headerBack(title, rightHtml){
  return '<div class="tg-header">'+
    '<div class="left"><button class="icon-btn" data-back>'+svgIcon(ICONS.back,19)+'</button>'+
    '<span class="title">'+title+'</span></div>'+
    (rightHtml || '<span style="width:36px"></span>')+
  '</div>';
}
function bottomNav(active){
  function item(route, iconName, label, badge){
    const isActive = active===route;
    return '<button class="nav-item'+(isActive?' active':'')+'" data-nav="'+route+'">'+
      svgIcon(ICONS[iconName],21)+
      (badge?'<span class="nav-badge">'+badge+'</span>':'')+
      '<span>'+label+'</span></button>';
  }
  const cc = cartCount();
  return '<div class="bottom-nav"><div class="bottom-nav-row">'+
      item('home','home','Главная')+
      item('catalog','grid','Каталог')+
      item('favorites','heart','Избранное')+
      item('cart','cart','Корзина', cc>0?cc:null)+
      item('profile','user','Профиль')+
    '</div></div>';
}

/* ---------- main render ---------- */
function render(){
  const app = document.getElementById('app');
  if(!STATE.ageConfirmed){ app.innerHTML = viewOnboarding(); updateTgBack(false); return; }

  const {name, param} = parseHash();
  let html = '';
  let nav = null;

  switch(name){
    case 'home': html = viewHome(); nav='home'; break;
    case 'catalog': html = viewCatalog(); nav='catalog'; break;
    case 'category': html = viewCategory(param || 'tobacco'); nav='catalog'; break;
    case 'favorites': html = viewFavorites(); nav='favorites'; break;
    case 'search': html = viewSearch(); break;
    case 'product': html = viewProduct(param); break;
    case 'cart': html = viewCart(); nav='cart'; break;
    case 'checkout': html = viewCheckout(); break;
    case 'order-success': html = viewOrderSuccess(param); break;
    case 'profile': html = viewProfile(); nav='profile'; break;
    case 'orders': html = viewOrders(); break;
    case 'order': html = viewOrderDetail(param); break;
    case 'promotions': html = viewPromotions(); break;
    case 'notifications': html = viewNotifications(); break;
    case 'wheel': html = viewWheel(); break;
    case 'referral': html = viewReferral(); break;
    case 'about': html = viewAbout(); break;
    default: html = viewHome(); nav='home';
  }

  html += confirmSheetHtml();
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
    product:'catalog', checkout:'cart', order:'orders', category:'catalog',
    notifications:'home', promotions:'profile', wheel:'promotions', referral:'promotions',
    about:'profile', orders:'profile', search:'catalog',
  };
  navigate('#/'+(map[name]||'home'));
}

/* ================= ONBOARDING ================= */

function viewOnboarding(){
  return '<div style="flex:1;display:flex;flex-direction:column;">'+
    '<div style="flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(160deg,#1D1416 0%,#3A1113 60%,#F52B32 140%);">'+
      '<div style="width:64px;height:64px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:18px;"><span style="font-size:26px;font-weight:800;color:var(--primary);">H</span></div>'+
      '<div style="font-size:26px;font-weight:800;letter-spacing:1px;color:#fff;">'+BRAND_NAME+'</div>'+
      '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-top:8px;font-weight:600;">Табак и кальянная культура</div>'+
    '</div>'+
    '<div style="background:var(--bg);border-top-left-radius:24px;border-top-right-radius:24px;padding:26px 24px calc(24px + var(--tg-safe-bottom));display:flex;flex-direction:column;gap:16px;margin-top:-20px;position:relative;">'+
      '<div style="font-size:19px;font-weight:700;color:var(--text);">Подтвердите возраст</div>'+
      '<div style="font-size:13px;line-height:1.6;color:var(--text-secondary);">Продукция предназначена для лиц старше 18 лет. Табак и никотин вредят вашему здоровью.</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">'+
        '<button class="btn btn-primary btn-block" data-action="confirm-age">Мне есть 18 лет</button>'+
        '<button class="btn btn-secondary btn-block" data-action="deny-age">Мне нет 18</button>'+
      '</div>'+
      '<div style="font-size:11px;line-height:1.6;color:var(--text-tertiary);text-align:center;">Продолжая, вы принимаете <a href="#">Условия использования</a> и <a href="#">Политику конфиденциальности</a></div>'+
    '</div>'+
  '</div>';
}

/* ================= PRODUCT CARD / GRID ================= */

function productCardHtml(p, wide){
  const fav = isFav(p.id);
  const badge = p.badge==='sale' ? '<div class="badge badge-sale" style="position:absolute;top:8px;left:8px;">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</div>'
    : p.badge==='new' ? '<div class="badge badge-new" style="position:absolute;top:8px;left:8px;">NEW</div>'
    : p.badge==='hit' ? '<div class="badge badge-hit" style="position:absolute;top:8px;left:8px;">ХИТ</div>' : '';
  const oos = p.inStock===false ? '<div class="badge badge-oos" style="position:absolute;top:8px;left:8px;">НЕТ В НАЛИЧИИ</div>' : '';
  return '<div class="product-card'+(wide?' wide':'')+'" data-nav="product/'+p.id+'">'+
    '<div class="product-photo">'+productPhotoHtml(p)+(oos||badge)+
      '<button class="product-fav'+(fav?' active':'')+'" data-action="toggle-fav" data-id="'+p.id+'">'+svgIcon(fav?ICONS.heartFill:ICONS.heart,15)+'</button>'+
      (p.inStock!==false?'<button class="product-quickadd" data-action="quick-add" data-id="'+p.id+'">'+svgIcon(ICONS.plus,15)+'</button>':'')+
    '</div>'+
    '<div class="product-body">'+
      '<div class="product-brand">'+p.brand+'</div>'+
      '<div class="product-name">'+p.name+(p.volumeDefault?', '+p.volumeDefault:'')+'</div>'+
      '<div class="product-rating">'+svgIcon(ICONS.star,11)+' '+p.rating+' <span style="color:var(--text-tertiary);">('+p.reviews+')</span></div>'+
      '<div class="product-price-row"><span class="price">'+formatPrice(p.price)+'</span>'+
        (p.oldPrice?'<span class="price-old">'+formatPrice(p.oldPrice)+'</span>':'')+
      '</div>'+
    '</div>'+
  '</div>';
}

function skeletonCard(){
  return '<div class="skeleton-card"><div class="skeleton"></div><div class="skeleton skeleton-line" style="width:50%;"></div><div class="skeleton skeleton-line" style="width:80%;"></div><div class="skeleton skeleton-line" style="width:35%;"></div></div>';
}
function skeletonGrid(n){
  let s = '<div class="grid-2" style="padding-top:14px;">';
  for(let i=0;i<(n||6);i++) s += skeletonCard();
  return s+'</div>';
}

/* ================= FILTER / SORT / CONFIRM SHEETS ================= */

function applyFilters(list){
  let out = list.filter(function(p){
    if(currentFilters.brand && p.brand!==currentFilters.brand) return false;
    if(currentFilters.taste && p.taste!==currentFilters.taste) return false;
    if(currentFilters.strength && p.strengthTag!==currentFilters.strength) return false;
    if(currentFilters.inStockOnly && p.inStock===false) return false;
    if(currentFilters.minPrice!=null && p.price<currentFilters.minPrice) return false;
    if(currentFilters.maxPrice!=null && p.price>currentFilters.maxPrice) return false;
    return true;
  });
  if(sortMode==='price-asc') out = out.slice().sort(function(a,b){return a.price-b.price;});
  else if(sortMode==='price-desc') out = out.slice().sort(function(a,b){return b.price-a.price;});
  else if(sortMode==='rating') out = out.slice().sort(function(a,b){return b.rating-a.rating;});
  else out = out.slice().sort(function(a,b){return (b.rating*b.reviews)-(a.rating*a.reviews);});
  return out;
}
function hasActiveFilters(){
  const f = currentFilters;
  return !!(f.brand||f.taste||f.strength||f.inStockOnly||f.minPrice!=null||f.maxPrice!=null);
}
const SORT_LABELS = {popular:'По популярности', 'price-asc':'Сначала дешёвые', 'price-desc':'Сначала дорогие', rating:'По рейтингу'};

function filterSheetHtml(baseList){
  const brands = [...new Set(baseList.map(function(p){return p.brand;}))];
  const tastes = [...new Set(baseList.map(function(p){return p.taste;}).filter(Boolean))];
  const strengthTags = [...new Set(baseList.map(function(p){return p.strengthTag;}).filter(Boolean))];
  const prices = baseList.map(function(p){return p.price;});
  const lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
  const f = currentFilters;
  const minV = f.minPrice!=null ? f.minPrice : lo;
  const maxV = f.maxPrice!=null ? f.maxPrice : hi;
  const count = applyFilters(baseList).length;
  return '<div class="sheet-overlay open" data-action="sheet-backdrop">'+
    '<div class="sheet">'+
      '<div class="sheet-handle"><span></span></div>'+
      '<div class="sheet-head"><div class="h3">Фильтры</div><button class="icon-btn" data-action="sheet-close">'+svgIcon(ICONS.close,18)+'</button></div>'+
      '<div class="sheet-body">'+
        '<div class="filter-group">'+
          '<label class="flabel">Цена</label>'+
          '<div class="range-row"><span id="filterPriceLabel">'+formatPrice(minV)+' — '+formatPrice(maxV)+'</span></div>'+
          '<input class="range-slider" type="range" id="filterMinPrice" min="'+lo+'" max="'+hi+'" value="'+minV+'" aria-label="Минимальная цена">'+
          '<input class="range-slider" type="range" id="filterMaxPrice" min="'+lo+'" max="'+hi+'" value="'+maxV+'" aria-label="Максимальная цена">'+
        '</div>'+
        '<div class="filter-group">'+
          '<label class="flabel">Бренд</label>'+
          '<select class="select" id="filterBrand"><option value="">Все бренды</option>'+
            brands.map(function(b){return '<option value="'+b+'"'+(f.brand===b?' selected':'')+'>'+b+'</option>';}).join('')+
          '</select>'+
        '</div>'+
        (tastes.length ? (
          '<div class="filter-group">'+
            '<label class="flabel">Вкус</label>'+
            '<select class="select" id="filterTaste"><option value="">Все вкусы</option>'+
              tastes.map(function(t){return '<option value="'+t+'"'+(f.taste===t?' selected':'')+'>'+t+'</option>';}).join('')+
            '</select>'+
          '</div>'
        ) : '')+
        (strengthTags.length ? (
          '<div class="filter-group">'+
            '<label class="flabel">Крепость</label>'+
            '<select class="select" id="filterStrength"><option value="">Все крепости</option>'+
              strengthTags.map(function(s){return '<option value="'+s+'"'+(f.strength===s?' selected':'')+'>'+s+'</option>';}).join('')+
            '</select>'+
          '</div>'
        ) : '')+
        '<div class="switch-row">'+
          '<span class="h3" style="font-size:14px;">Только в наличии</span>'+
          '<div class="switch'+(f.inStockOnly?' on':'')+'" data-action="toggle-instock"></div>'+
        '</div>'+
      '</div>'+
      '<div class="sheet-footer">'+
        '<button class="btn btn-secondary" style="flex:1;" data-action="filter-reset">Сбросить</button>'+
        '<button class="btn btn-primary" style="flex:1.6;" data-action="sheet-close">Показать '+count+' товаров</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function sortSheetHtml(){
  return '<div class="sheet-overlay open" data-action="sheet-backdrop">'+
    '<div class="sheet">'+
      '<div class="sheet-handle"><span></span></div>'+
      '<div class="sheet-head"><div class="h3">Сортировка</div><button class="icon-btn" data-action="sheet-close">'+svgIcon(ICONS.close,18)+'</button></div>'+
      '<div class="sheet-body" style="gap:0;">'+
        Object.keys(SORT_LABELS).map(function(k){
          return '<div class="sort-option'+(sortMode===k?' active':'')+'" data-action="pick-sort" data-mode="'+k+'">'+SORT_LABELS[k]+(sortMode===k?svgIcon(ICONS.check,16):'')+'</div>';
        }).join('')+
      '</div>'+
    '</div>'+
  '</div>';
}
function confirmSheetHtml(){
  if(!confirmSheet) return '';
  const c = confirmSheet;
  return '<div class="sheet-overlay open" data-action="confirm-cancel">'+
    '<div class="sheet" style="max-height:none;">'+
      '<div class="sheet-handle"><span></span></div>'+
      '<div style="padding:8px 20px 4px;display:flex;flex-direction:column;gap:8px;">'+
        '<div class="h3">'+c.title+'</div>'+
        '<div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">'+c.text+'</div>'+
      '</div>'+
      '<div class="sheet-footer confirm-sheet-actions">'+
        '<button class="btn btn-secondary" style="flex:1;" data-action="confirm-cancel">Отмена</button>'+
        '<button class="btn btn-primary" style="flex:1;" data-action="confirm-ok">'+c.confirmLabel+'</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function openConfirm(title, text, confirmLabel, action, payload){
  confirmSheet = {title:title, text:text, confirmLabel:confirmLabel, action:action, payload:payload};
  render();
}

/* ================= HOME ================= */

function viewHome(){
  const bestsellers = [getProduct('darkside-topgum'), getProduct('alpha-hookah-modelx')];
  return headerHome()+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:14px 0 18px;">'+
    '<button class="list-row" data-nav="profile" style="padding:0 var(--sp-4);border:none;">'+svgIcon(ICONS.mapPin,15,'')+
      '<span style="flex:1;font-size:12px;color:var(--text-secondary);font-weight:500;">Москва, ул. Ленина, 12</span>'+
      svgIcon(ICONS.chevronDown,13,'')+
    '</button>'+
    '<div class="section" style="padding:0 var(--sp-4);">'+
      '<button class="search-field" data-nav="search" style="width:100%;">'+svgIcon(ICONS.search,16)+
        '<span style="color:var(--text-tertiary);font-size:14px;">Поиск товаров, брендов...</span>'+
      '</button>'+
    '</div>'+
    '<div class="hero-banner" data-nav="catalog">'+
      '<div class="h1">Премиальные табаки и кальяны</div>'+
      '<p>Только оригинальная продукция</p>'+
      '<button class="btn btn-primary" style="background:#fff;color:var(--primary);width:fit-content;margin-top:6px;">Перейти в каталог</button>'+
    '</div>'+
    '<div class="category-row">'+
      CATEGORIES.map(function(c){return (
        '<button class="category-item" data-nav="category/'+c.id+'">'+
          '<div class="category-icon">'+svgIcon(CATEGORY_ICON_PATH[c.id],22)+'</div>'+
          '<span>'+c.name+'</span>'+
        '</button>'
      );}).join('')+
    '</div>'+
    '<div class="section">'+
      '<div class="section-head"><div class="h2">Популярные товары</div><button class="section-link" data-nav="catalog">Все →</button></div>'+
    '</div>'+
    '<div class="grid-2">'+bestsellers.map(function(p){return productCardHtml(p,true);}).join('')+'</div>'+
    '<div class="bonus-banner" data-nav="promotions">'+
      '<div class="icon-wrap">'+svgIcon(ICONS.gift,22)+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;font-weight:700;">Бонусы за покупки</span><span style="font-size:12px;opacity:0.85;">Копите баллы и получайте скидки</span></div>'+
    '</div>'+
  '</div></div>'+
  bottomNav('home');
}

/* ================= CATALOG (весь каталог, чипы по категориям) ================= */

function viewCatalog(){
  const base = catalogChip==='all' ? PRODUCTS : PRODUCTS.filter(function(p){return p.category===catalogChip;});
  const items = applyFilters(base);
  return '<div class="tg-header"><span class="title">Каталог</span><span style="width:36px"></span></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:14px;padding:14px 0 18px;">'+
    '<div class="section"><button class="search-field" data-nav="search" style="width:100%;">'+svgIcon(ICONS.search,16)+
      '<span style="color:var(--text-tertiary);font-size:14px;">Поиск товаров, брендов...</span></button></div>'+
    '<div class="hscroll">'+
      '<div class="chip'+(catalogChip==='all'?' active':'')+'" data-action="catalog-chip" data-cat="all">Все</div>'+
      CATEGORIES.map(function(c){return '<div class="chip'+(catalogChip===c.id?' active':'')+'" data-action="catalog-chip" data-cat="'+c.id+'">'+c.name+'</div>';}).join('')+
    '</div>'+
    '<div class="section" style="flex-direction:row;align-items:center;justify-content:space-between;">'+
      '<div style="font-size:13px;color:var(--text-secondary);font-weight:500;">'+items.length+' товаров</div>'+
      '<div style="display:flex;gap:4px;">'+
        '<button class="icon-btn" data-action="open-sort">'+svgIcon(ICONS.sort,18)+'</button>'+
        '<button class="icon-btn" data-action="open-filter" style="position:relative;">'+svgIcon(ICONS.filter,18)+(hasActiveFilters()?'<span class="nav-badge" style="top:2px;right:2px;">•</span>':'')+'</button>'+
      '</div>'+
    '</div>'+
    (STATE.simulateOffline ? offlineBanner() :
      routeLoading ? skeletonGrid(6) :
      (items.length ? '<div class="grid-2">'+items.map(function(p){return productCardHtml(p,true);}).join('')+'</div>' : emptyFilterState())
    )+
  '</div></div>'+
  bottomNav('catalog')+
  (sheetOpen==='filter' ? filterSheetHtml(base) : sheetOpen==='sort' ? sortSheetHtml() : '');
}

function emptyFilterState(){
  return '<div class="empty-state" style="flex:none;padding:40px 24px;">'+
    '<div class="empty-icon">'+svgIcon(ICONS.search,28)+'</div>'+
    '<div class="empty-title">Ничего не найдено</div>'+
    '<div class="empty-text">Попробуйте сбросить фильтры или изменить критерии поиска</div>'+
    '<button class="btn btn-primary" data-action="filter-reset" style="margin-top:6px;">Сбросить фильтры</button>'+
  '</div>';
}
function offlineBanner(){
  return '<div class="state-banner err">'+svgIcon(ICONS.wifiOff,16)+'<span style="flex:1;">Нет подключения к интернету</span>'+
    '<button class="section-link" style="color:var(--error);font-weight:700;" data-action="retry-online">Повторить</button></div>';
}

/* ================= CATEGORY (конкретная категория, с бэком) ================= */

function viewCategory(catId){
  const cat = getCategory(catId) || CATEGORIES[0];
  const base = PRODUCTS.filter(function(p){return p.category===catId;});
  const brands = categoryBrands(catId);
  const items = applyFilters(base);
  return headerBack(cat.name)+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:14px;padding:14px 0 18px;">'+
    '<div class="section"><button class="search-field" data-nav="search" style="width:100%;">'+svgIcon(ICONS.search,16)+
      '<span style="color:var(--text-tertiary);font-size:14px;">Поиск в категории «'+cat.name+'»</span></button></div>'+
    '<div class="hscroll">'+
      '<div class="chip'+(!currentFilters.brand?' active':'')+'" data-action="pick-brand" data-brand="">Все</div>'+
      brands.map(function(b){return '<div class="chip'+(currentFilters.brand===b?' active':'')+'" data-action="pick-brand" data-brand="'+b+'">'+b+'</div>';}).join('')+
    '</div>'+
    '<div class="section" style="flex-direction:row;align-items:center;justify-content:space-between;">'+
      '<div style="font-size:13px;color:var(--text-secondary);font-weight:500;">'+items.length+' товаров</div>'+
      '<div style="display:flex;gap:4px;">'+
        '<button class="icon-btn" data-action="open-sort">'+svgIcon(ICONS.sort,18)+'</button>'+
        '<button class="icon-btn" data-action="open-filter" style="position:relative;">'+svgIcon(ICONS.filter,18)+(hasActiveFilters()?'<span class="nav-badge" style="top:2px;right:2px;">•</span>':'')+'</button>'+
      '</div>'+
    '</div>'+
    (STATE.simulateOffline ? offlineBanner() :
      routeLoading ? skeletonGrid(4) :
      (items.length ? '<div class="grid-2">'+items.map(function(p){return productCardHtml(p,true);}).join('') + '</div>' : emptyFilterState())
    )+
  '</div></div>'+
  bottomNav('catalog')+
  (sheetOpen==='filter' ? filterSheetHtml(base) : sheetOpen==='sort' ? sortSheetHtml() : '');
}

/* ================= SEARCH ================= */

function viewSearch(){
  const q = searchQuery.trim().toLowerCase();
  const results = q ? applyFilters(PRODUCTS.filter(function(p){ return (p.name+' '+p.brand).toLowerCase().includes(q); })) : [];
  return '<div class="tg-header"><div class="left" style="flex:1;">'+
      '<button class="icon-btn" data-back>'+svgIcon(ICONS.back,19)+'</button>'+
      '<div class="search-field" style="margin-left:2px;">'+svgIcon(ICONS.search,15)+
        '<input id="searchInput" type="text" placeholder="Поиск товаров, брендов..." value="'+searchQuery.replace(/"/g,'&quot;')+'" autocomplete="off" autofocus>'+
        (searchQuery?'<button class="clear-btn" data-action="clear-search">'+svgIcon(ICONS.close,15)+'</button>':'')+
      '</div></div></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:18px 0;">'+
  (!q ? (
    '<div class="section">'+
      '<div class="section-head"><div class="eyebrow">Недавние запросы</div></div>'+
      '<div class="hscroll" style="flex-wrap:wrap;overflow:visible;">'+RECENT_SEARCHES.map(function(s){return '<div class="chip" data-action="set-search" data-q="'+s+'">'+s+'</div>';}).join('')+'</div>'+
    '</div>'+
    '<div class="section">'+
      '<div class="eyebrow">Категории</div>'+
      '<div style="display:flex;flex-direction:column;">'+CATEGORIES.map(function(c){return (
        '<button class="list-row" data-nav="category/'+c.id+'"><div class="category-icon" style="width:40px;height:40px;border-radius:10px;">'+svgIcon(CATEGORY_ICON_PATH[c.id],18)+'</div>'+
        '<span style="flex:1;font-size:14px;">'+c.name+'</span><span style="color:var(--text-tertiary);font-size:12px;">'+c.count+'</span></button>'
      );}).join('')+'</div>'+
    '</div>'
  ) : (results.length ? (
    '<div class="section"><div class="eyebrow">Найдено '+results.length+'</div></div>'+
    '<div class="grid-2">'+results.map(function(p){return productCardHtml(p,true);}).join('')+'</div>'
  ) : (
    '<div class="empty-state">'+
      '<div class="empty-icon">'+svgIcon(ICONS.search,30)+'</div>'+
      '<div class="empty-title">Ничего не найдено</div>'+
      '<div class="empty-text">Проверьте запрос «'+searchQuery+'» или посмотрите категории каталога</div>'+
    '</div>'
  )))+
  '</div></div>';
}

/* ================= PRODUCT DETAIL ================= */

function viewProduct(id){
  const p = getProduct(id);
  if(!p) return headerBack('Товар')+'<div class="content"><div class="empty-state"><div class="empty-title">Товар не найден</div></div></div>';
  if(!productSelection || productSelection.id !== id){
    productSelection = {id, strengthIndex: p.strengthDefault||0, volumeIndex: p.volumeIndex||0, flavorIndex: 0, qty:1};
  }
  const sel = productSelection;
  const total = p.price * sel.qty;
  const fav = isFav(p.id);
  return headerBack('', '<div style="display:flex;gap:4px;"><button class="icon-btn" data-action="toggle-fav" data-id="'+p.id+'" style="'+(fav?'color:var(--primary)':'')+'">'+svgIcon(fav?ICONS.heartFill:ICONS.heart,19)+'</button><button class="icon-btn" data-action="share-product">'+svgIcon(ICONS.share,18)+'</button></div>')+
  '<div class="content"><div style="display:flex;flex-direction:column;">'+
    '<div class="thumb-photo" style="height:300px;border-radius:0;flex-shrink:0;">'+productPhotoHtml(p)+'</div>'+
    '<div style="padding:18px 20px;display:flex;flex-direction:column;gap:18px;">'+
      '<div style="display:flex;flex-direction:column;gap:6px;">'+
        '<div class="eyebrow">'+p.brand+'</div>'+
        '<div class="h1">'+p.name+'</div>'+
        '<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);">'+svgIcon(ICONS.star,14,'')+' '+p.rating+' · '+p.reviews+' отзывов</div>'+
        '<div style="display:flex;align-items:baseline;gap:10px;margin-top:4px;flex-wrap:wrap;">'+
          '<span class="price-lg">'+formatPrice(p.price)+'</span>'+
          (p.oldPrice?'<span class="price-old">'+formatPrice(p.oldPrice)+'</span><span class="badge badge-sale">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</span>':'')+
        '</div>'+
        (isTobaccoLike(p) ? '<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">18+ Продукция содержит никотин. Только для лиц старше 18 лет.</div>' : '')+
      '</div>'+
      (p.flavors.length? (
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div class="h3" style="font-size:13px;">Вкус</div>'+
          '<div style="display:flex;gap:10px;">'+p.flavors.map(function(c,i){return '<div class="swatch'+(i===sel.flavorIndex?' active':'')+'" style="background:'+c+';" data-action="pick-flavor" data-i="'+i+'"></div>';}).join('')+'</div>'+
        '</div>'
      ):'')+
      (p.strengths.length? (
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div class="h3" style="font-size:13px;">Крепость</div>'+
          '<div class="segmented">'+p.strengths.map(function(s,i){return '<button class="seg'+(i===sel.strengthIndex?' active':'')+'" data-action="pick-strength" data-i="'+i+'">'+s+'</button>';}).join('')+'</div>'+
        '</div>'
      ):'')+
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px;">'+
        '<div style="display:flex;flex-direction:column;gap:10px;">'+
          '<div class="h3" style="font-size:13px;">Объём</div>'+
          '<div style="display:flex;gap:8px;">'+p.volumes.map(function(v,i){return '<div class="chip'+(i===sel.volumeIndex?' active':'')+'" data-action="pick-volume" data-i="'+i+'">'+v+'</div>';}).join('')+'</div>'+
        '</div>'+
        '<div class="qty-stepper">'+
          '<button data-action="qty-dec">–</button><span>'+sel.qty+'</span><button class="plus" data-action="qty-inc">+</button>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border);padding-top:16px;">'+
        '<div class="h3" style="font-size:13px;">О товаре</div>'+
        '<div style="font-size:14px;line-height:1.65;color:var(--text-secondary);">'+p.description+'</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--border);padding-top:16px;">'+
        '<div class="h3" style="font-size:13px;margin-bottom:8px;">Характеристики</div>'+
        charRow('Крепость', p.strengthTag || (p.strengths[sel.strengthIndex]||'—'))+
        charRow('Вкус', p.taste || '—')+
        charRow('Вес', p.volumes[sel.volumeIndex] || p.volumeDefault || '—')+
        charRow('Производитель', p.brand)+
      '</div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar">'+
    '<div style="display:flex;flex-direction:column;"><span style="font-size:10px;color:var(--text-tertiary);font-weight:600;">Итого</span><span class="h2" style="font-size:18px;">'+formatPrice(total)+'</span></div>'+
    '<button class="btn btn-primary" id="addToCartBtn" style="flex:1;" data-action="add-to-cart">'+svgIcon(ICONS.cart,17)+' В корзину</button>'+
  '</div>';
}
function charRow(label, val){
  return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13px;"><span style="color:var(--text-tertiary);">'+label+'</span><span style="color:var(--text);font-weight:500;">'+val+'</span></div>';
}

/* ================= CART ================= */

function cartItemRow(item){
  const p = getProduct(item.productId);
  const variantBits = [];
  if(p.strengths.length) variantBits.push(p.strengths[item.strengthIndex]);
  if(p.volumes.length) variantBits.push(p.volumes[item.volumeIndex]);
  return '<div style="display:flex;gap:12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-card);padding:12px;">'+
    '<div class="thumb-photo" style="width:64px;height:64px;">'+productPhotoHtml(p)+'</div>'+
    '<div style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0;">'+
      '<div class="product-brand">'+p.brand+'</div>'+
      '<div style="font-size:14px;color:var(--text);font-weight:600;">'+p.name+'</div>'+
      (variantBits.length?'<div style="font-size:12px;color:var(--text-tertiary);">'+variantBits.join(' · ')+'</div>':'')+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">'+
        '<div class="qty-stepper" style="padding:4px 10px;height:32px;">'+
          '<button data-action="cart-dec" data-key="'+item.key+'">–</button><span>'+item.qty+'</span><button class="plus" data-action="cart-inc" data-key="'+item.key+'">+</button>'+
        '</div>'+
        '<span class="price" style="font-size:15px;">'+formatPrice(cartLine(item))+'</span>'+
      '</div>'+
    '</div>'+
    '<button class="icon-btn" data-action="cart-remove" data-key="'+item.key+'" style="align-self:flex-start;color:var(--text-tertiary);">'+svgIcon(ICONS.close,17)+'</button>'+
  '</div>';
}

function viewCart(){
  STATE.cart.forEach((i,idx)=>{ if(!i.key) i.key = i.productId+'-'+idx+'-'+i.strengthIndex+'-'+i.volumeIndex; });
  if(STATE.cart.length===0){
    return '<div class="tg-header"><span class="title">Корзина</span><span style="width:36px"></span></div>'+
    '<div class="content" style="display:flex;">'+
      '<div class="empty-state">'+
        '<div class="empty-icon">'+svgIcon(ICONS.cart,30)+'</div>'+
        '<div class="empty-title">Корзина пуста</div>'+
        '<div class="empty-text">Добавьте товары из каталога, чтобы оформить заказ</div>'+
        '<button class="btn btn-primary" data-nav="catalog" style="margin-top:6px;">Перейти в каталог</button>'+
      '</div>'+
    '</div>'+
    bottomNav('cart');
  }
  const promo = STATE.promo && PROMO_CODES[STATE.promo];
  return '<div class="tg-header"><span class="title">Корзина</span><button class="section-link" style="color:var(--error);font-weight:600;font-size:13px;" data-action="clear-cart">Очистить</button></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:14px;padding:16px 20px 0;">'+
    STATE.cart.map(cartItemRow).join('')+
    '<div style="display:flex;gap:10px;margin-top:6px;">'+
      '<input id="promoInput" class="input" style="flex:1;" placeholder="Промокод" value="'+(STATE.promo||'')+'">'+
      '<button class="btn btn-secondary btn-sm" data-action="apply-promo">Применить</button>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border);padding-top:16px;padding-bottom:16px;">'+
      '<div class="summary-row"><span>Товары ('+cartCount()+')</span><span class="val">'+formatPrice(cartSubtotal())+'</span></div>'+
      (promo?'<div class="summary-row"><span>Скидка · '+STATE.promo+'</span><span class="val" style="color:var(--success);">–'+formatPrice(cartDiscount())+'</span></div>':'')+
      '<div class="summary-row"><span>Доставка</span><span class="val">'+(cartDeliveryFee()===0?'бесплатно':formatPrice(cartDeliveryFee()))+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar" style="flex-direction:column;align-items:stretch;gap:12px;">'+
    '<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">Итого</span><span class="h2">'+formatPrice(cartTotal())+'</span></div>'+
    '<button class="btn btn-primary btn-block" data-nav="checkout">Оформить заказ</button>'+
  '</div>';
}

/* ================= CHECKOUT ================= */

function viewCheckout(){
  const promo = STATE.promo && PROMO_CODES[STATE.promo];
  const maxRedeem = maxBonusRedeem();
  const bonusDiscount = checkoutBonusDiscount();
  return headerBack('Оформление заказа')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:20px;padding:16px 20px 0;">'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Доставка</div>'+
      '<div class="segmented"><button class="seg active">Курьером</button><button class="seg">Самовывоз</button></div>'+
      '<div style="display:flex;gap:12px;background:var(--surface);border:1px solid var(--primary);border-radius:var(--radius-card);padding:14px;">'+
        svgIcon(ICONS.mapPin,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:3px;"><span style="font-size:13px;color:var(--text);font-weight:600;">ул. Тверская, 24, кв. 56</span><span style="font-size:11px;color:var(--text-tertiary);">Домофон 56К · этаж 4</span></div>'+
        '<span style="font-size:12px;color:var(--primary);font-weight:600;">Изменить</span>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Способ оплаты</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;">'+
        '<label class="list-row" style="border:1px solid var(--primary);background:var(--primary-tint);border-radius:var(--radius-card);padding:13px 14px;" data-action="pick-pay" data-i="0"><div class="pin active"></div>'+svgIcon(ICONS.card,18,'')+'<span style="flex:1;font-size:13px;color:var(--text);font-weight:600;">Банковская карта</span><span style="font-size:11px;color:var(--text-tertiary);">•• 4821</span></label>'+
        '<label class="list-row" style="border:1px solid var(--border);border-radius:var(--radius-card);padding:13px 14px;" data-action="pick-pay" data-i="1"><div class="pin"></div>'+svgIcon(ICONS.cash,18,'')+'<span style="font-size:13px;color:var(--text);font-weight:600;">Наличными курьеру</span></label>'+
      '</div>'+
    '</div>'+
    (promo?'<div style="display:flex;align-items:center;gap:10px;background:var(--primary-tint);border:1px solid var(--primary);border-radius:var(--radius-card);padding:11px 14px;">'+svgIcon(ICONS.gift,16,'')+'<span style="font-size:12px;color:var(--primary);font-weight:700;flex:1;">Промокод '+STATE.promo+' применён</span><span style="font-size:11px;color:var(--success);font-weight:700;">–'+formatPrice(cartDiscount())+'</span></div>':'')+
    (STATE.freeDeliveryCredits>0 && cartSubtotal()<=3000 ? '<div style="display:flex;align-items:center;gap:10px;background:var(--success-tint);border:1px solid var(--success);border-radius:var(--radius-card);padding:11px 14px;">'+svgIcon(ICONS.truck,16,'')+'<span style="font-size:12px;color:var(--success);font-weight:700;flex:1;">Бесплатная доставка — приз колеса фортуны</span></div>' : '')+
    (maxRedeem>0 ? (
      '<label class="list-row" style="border:1px solid '+(STATE.useBonuses?'var(--primary)':'var(--border)')+';border-radius:var(--radius-card);padding:13px 14px;" data-action="toggle-use-bonuses">'+
        '<div class="pin'+(STATE.useBonuses?' active':'')+'"></div>'+
        '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--text);font-weight:600;">Списать бонусы</span><span style="font-size:11px;color:var(--text-tertiary);">Доступно '+STATE.bonusBalance+' · максимум к списанию '+maxRedeem+'</span></div>'+
        (STATE.useBonuses?'<span style="font-size:12px;color:var(--success);font-weight:700;">–'+formatPrice(bonusDiscount)+'</span>':'')+
      '</label>'
    ) : '')+
    '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border);padding:14px 0 16px;">'+
      '<div class="summary-row"><span>Товары ('+cartCount()+')</span><span class="val">'+formatPrice(cartSubtotal())+'</span></div>'+
      (promo?'<div class="summary-row"><span>Скидка по промокоду</span><span class="val" style="color:var(--success);">–'+formatPrice(cartDiscount())+'</span></div>':'')+
      (bonusDiscount>0?'<div class="summary-row"><span>Списание бонусов</span><span class="val" style="color:var(--success);">–'+formatPrice(bonusDiscount)+'</span></div>':'')+
      '<div class="summary-row"><span>Доставка</span><span class="val">'+(cartDeliveryFee()===0?'бесплатно':formatPrice(cartDeliveryFee()))+'</span></div>'+
      '<div class="summary-row"><span>Кешбэк за заказ · '+currentTier().name+' '+Math.round(currentTier().cashback*100)+'%</span><span class="val" style="color:var(--primary);">+'+Math.round(checkoutTotal()*currentTier().cashback)+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar" style="flex-direction:column;align-items:stretch;gap:12px;">'+
    '<div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:13px;color:var(--text-secondary);font-weight:600;">Итого к оплате</span><span class="h2">'+formatPrice(checkoutTotal())+'</span></div>'+
    '<button class="btn btn-primary btn-block" id="payBtn" data-action="place-order"'+(orderProcessing?' disabled':'')+'>'+(orderProcessing?'Обработка...':'Оплатить заказ')+'</button>'+
  '</div>';
}

/* ================= ORDER SUCCESS ================= */

function viewOrderSuccess(orderId){
  const order = getOrder(orderId);
  return '<div class="content" style="display:flex;">'+
    '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:32px;text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;background:var(--success-tint);display:flex;align-items:center;justify-content:center;color:var(--success);">'+svgIcon(ICONS.check,40,'')+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><div class="h1">Заказ оформлен!</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;max-width:260px;">Спасибо за заказ. Мы уже готовим его к отправке.</div></div>'+
      '<div style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;display:flex;flex-direction:column;gap:10px;">'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Номер заказа</span><span style="color:var(--text);font-weight:700;">№ '+(order?order.id:orderId)+'</span></div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Ожидаемая доставка</span><span style="color:var(--text);font-weight:700;">'+(order?order.eta:'сегодня, 18:00–20:00')+'</span></div>'+
        '<div style="display:flex;justify-content:space-between;font-size:12px;"><span style="color:var(--text-tertiary);">Начислено бонусов</span><span style="color:var(--primary);font-weight:700;">+'+(order?order.cashback:0)+'</span></div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px;width:100%;margin-top:6px;">'+
        '<button class="btn btn-primary btn-block" data-nav="orders">Перейти к заказам</button>'+
        '<button class="btn btn-secondary btn-block" data-nav="catalog">Вернуться в каталог</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ================= PROFILE ================= */

function viewProfile(){
  const tier = currentTier(), prog = tierProgress();
  return '<div class="tg-header"><span class="title">Профиль</span><button class="icon-btn" data-nav="about">'+svgIcon(ICONS.settings,19)+'</button></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:20px;padding:18px 0 18px;">'+
    '<div style="display:flex;align-items:center;gap:14px;padding:0 20px;">'+
      '<div class="avatar">Р</div>'+
      '<div style="display:flex;flex-direction:column;gap:3px;"><div style="font-size:16px;font-weight:700;color:var(--text);">Ринат М.</div><div style="font-size:12px;color:var(--text-tertiary);">+7 999 123-45-67</div></div>'+
    '</div>'+
    '<div class="loyalty-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;"><div class="eyebrow" style="color:rgba(255,255,255,0.7);">Уровень '+tier.name+'</div><div style="font-size:11px;color:rgba(255,255,255,0.7);">кэшбэк '+Math.round(tier.cashback*100)+'%</div></div>'+
      '<div class="h1" style="color:#fff;">'+STATE.bonusBalance+' бонусов</div>'+
      (prog.nextName ? '<div style="display:flex;flex-direction:column;gap:6px;"><div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.15);overflow:hidden;"><div style="width:'+prog.pct+'%;height:100%;background:var(--primary);"></div></div><div style="font-size:11px;color:rgba(255,255,255,0.7);">До уровня '+prog.nextName+' — '+formatPrice(prog.remaining)+' покупок</div></div>' : '<div style="font-size:11px;color:rgba(255,255,255,0.7);">Максимальный уровень достигнут</div>')+
      '<details class="loyalty-qr-toggle">'+
        '<summary>Показать карту лояльности'+svgIcon(ICONS.chevronRight,14,'chev')+'</summary>'+
        loyaltyQrCard()+
      '</details>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;">'+
      profileRow('user','Личные данные')+
      profileRow('mapPin','Адреса доставки')+
      profileRow('bell','Уведомления','notifications')+
      profileRow('gift','Бонусы и промокоды','promotions')+
      profileRow('heart','Избранное','favorites')+
      profileRow('box','История заказов','orders')+
      profileRow('support','Поддержка')+
      profileRow('info','О приложении','about')+
    '</div>'+
  '</div></div>'+
  bottomNav('profile');
}
function profileRow(iconName, label, route){
  return '<button class="list-row"'+(route?' data-nav="'+route+'"':'')+'>'+
    '<div class="row-icon">'+svgIcon(ICONS[iconName],17)+'</div>'+
    '<span style="flex:1;font-size:14px;font-weight:500;">'+label+'</span>'+svgIcon(ICONS.chevronRight,15,'chev')+
  '</button>';
}

function viewAbout(){
  return headerBack('О приложении')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:18px;padding:20px;">'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 0;">'+
      '<div style="width:56px;height:56px;border-radius:14px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:#fff;">H</div>'+
      '<div class="h2">'+BRAND_NAME+'</div>'+
      '<div style="font-size:12px;color:var(--text-tertiary);">Версия 1.0.0</div>'+
    '</div>'+
    '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Премиальный магазин табака, кальянов, угля и аксессуаров. Только оригинальная продукция от проверенных брендов.</div>'+
    '<div class="divider"></div>'+
    '<label class="switch-row" style="cursor:pointer;">'+
      '<span style="font-size:13px;color:var(--text-secondary);">Симулировать офлайн-режим (демо)</span>'+
      '<div class="switch'+(STATE.simulateOffline?' on':'')+'" data-action="toggle-offline"></div>'+
    '</label>'+
  '</div></div>';
}

/* ================= ORDERS ================= */

function orderStatusLabel(s){
  return s==='transit' ? '<span style="color:var(--primary);">В пути</span>' : s==='delivered' ? '<span style="color:var(--success);">Доставлен</span>' : '<span style="color:var(--text-tertiary);">Отменён</span>';
}

function viewOrders(){
  if(ORDERS.length===0){
    return headerBack('Мои заказы')+
    '<div class="content" style="display:flex;"><div class="empty-state">'+
      '<div class="empty-icon">'+svgIcon(ICONS.box,30)+'</div>'+
      '<div class="empty-title">Заказов пока нет</div>'+
      '<div class="empty-text">Здесь появится история ваших покупок</div>'+
      '<button class="btn btn-primary" data-nav="catalog" style="margin-top:6px;">Начать покупки</button>'+
    '</div></div>';
  }
  return headerBack('Мои заказы')+
  '<div class="tabs"><button class="tab active">Все</button><button class="tab">В обработке</button><button class="tab">Доставлены</button></div>'+
  '<div class="content"><div style="display:flex;flex-direction:column;padding:8px 0;">'+
    ORDERS.map(function(o){return (
      '<button class="list-row" style="align-items:flex-start;" data-nav="order/'+o.id+'">'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;">'+
          '<span style="font-size:13px;color:var(--text);font-weight:700;">Заказ № '+o.id+'</span>'+
          '<span style="font-size:11px;color:var(--text-tertiary);">'+o.date+' · '+o.itemsCount+' товара</span>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">'+
          '<span style="font-size:12px;font-weight:700;">'+orderStatusLabel(o.status)+'</span>'+
          '<span class="price" style="font-size:15px;">'+formatPrice(o.total)+'</span>'+
        '</div>'+
      '</button>'
    );}).join('')+
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
      steps.map(function(s,i){return (
        '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;">'+
          '<div style="width:26px;height:26px;border-radius:50%;background:'+(i<=stepIndex&&o.status!=='cancelled'?'var(--primary)':'var(--surface-2)')+';border:'+(i<=stepIndex&&o.status!=='cancelled'?'none':'1px solid var(--border)')+';"></div>'+
          '<span style="font-size:9px;font-weight:700;text-align:center;color:'+(i<=stepIndex&&o.status!=='cancelled'?'var(--text)':'var(--text-tertiary)')+';">'+s+'</span>'+
        '</div>'+
        (i<steps.length-1?'<div style="flex:1;height:2px;background:'+(i<stepIndex&&o.status!=='cancelled'?'var(--primary)':'var(--border)')+';margin-bottom:18px;"></div>':'')
      );}).join('')+
    '</div>'+
    '<div style="display:flex;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-card);padding:14px;">'+svgIcon(ICONS.mapPin,18,'')+
      '<div style="display:flex;flex-direction:column;gap:3px;"><span style="font-size:13px;color:var(--text);font-weight:600;">'+o.address+'</span><span style="font-size:11px;color:var(--text-tertiary);">'+o.eta+'</span></div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Состав заказа</div>'+
      o.items.map(function(it){ const p=getProduct(it.productId); return '<div style="display:flex;gap:12px;">'+
        '<div class="thumb-photo" style="width:52px;height:52px;">'+productPhotoHtml(p)+'</div>'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:13px;color:var(--text);font-weight:600;">'+p.brand+' '+p.name+'</span><span style="font-size:11px;color:var(--text-tertiary);">× '+it.qty+'</span></div>'+
        '<span class="price" style="font-size:14px;">'+formatPrice(it.price*it.qty)+'</span>'+
      '</div>'; }).join('')+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border);padding:14px 0 4px;">'+
      '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;"><span style="color:var(--text);">Итого</span><span class="h2" style="font-size:17px;">'+formatPrice(o.total)+'</span></div>'+
    '</div>'+
  '</div></div>'+
  '<div class="sticky-bar">'+
    '<button class="btn btn-secondary" style="flex:1;">Поддержка</button>'+
    '<button class="btn btn-primary" style="flex:1.4;" data-action="reorder" data-id="'+o.id+'">Повторить заказ</button>'+
  '</div>';
}

/* ================= PROMOTIONS / BONUSES ================= */

function viewPromotions(){
  const tier = currentTier();
  const wonPromoCodes = Object.keys(PROMO_CODES).filter(function(c){return c!=='SMOKE20';});
  return headerBack('Акции и бонусы')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:18px 20px;">'+
    '<div class="loyalty-card" style="margin:0;">'+
      '<div class="eyebrow" style="color:rgba(255,255,255,0.7);">Ваш баланс</div>'+
      '<div class="h1" style="color:#fff;">'+STATE.bonusBalance+' бонусов</div>'+
      '<div class="loyalty-tiers">'+TIERS.map(function(t){return '<div class="loyalty-tier'+(t.name===tier.name?' active':'')+'">'+t.name+'<br>'+Math.round(t.cashback*100)+'%</div>';}).join('')+'</div>'+
    '</div>'+
    '<button class="list-row" data-nav="wheel" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-card);padding:14px;">'+svgIcon(ICONS.wheel,20,'')+
      '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--text);font-weight:600;">Колесо фортуны</span><span style="font-size:11px;color:var(--text-tertiary);">Доступно попыток: '+spinsAvailable()+'</span></div>'+
      svgIcon(ICONS.chevronRight,14,'chev')+
    '</button>'+
    '<button class="list-row" data-nav="referral" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-card);padding:14px;">'+svgIcon(ICONS.users,20,'')+
      '<div style="flex:1;display:flex;flex-direction:column;"><span style="font-size:13px;color:var(--text);font-weight:600;">Пригласить друзей</span><span style="font-size:11px;color:var(--text-tertiary);">+'+REFERRAL_REWARD+' бонусов за каждого</span></div>'+
      svgIcon(ICONS.chevronRight,14,'chev')+
    '</button>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Мои промокоды</div>'+
      '<div style="display:flex;align-items:center;gap:12px;background:var(--surface);border:1px dashed var(--primary);border-radius:var(--radius-card);padding:14px;">'+svgIcon(ICONS.gift,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;color:var(--text);font-weight:800;">SMOKE20</span><span style="font-size:11px;color:var(--text-tertiary);">-20% на угли · до 20.09</span></div>'+
        '<button class="section-link" data-action="copy-promo" data-code="SMOKE20">Скопировать</button>'+
      '</div>'+
      wonPromoCodes.map(function(c){ const pc=PROMO_CODES[c]; return '<div style="display:flex;align-items:center;gap:12px;background:var(--surface);border:1px dashed var(--primary);border-radius:var(--radius-card);padding:14px;">'+svgIcon(ICONS.wheel,18,'')+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;color:var(--text);font-weight:800;">'+c+'</span><span style="font-size:11px;color:var(--text-tertiary);">'+pc.label+' · приз колеса фортуны</span></div>'+
        '<button class="section-link" data-action="copy-promo" data-code="'+c+'">Скопировать</button>'+
      '</div>'; }).join('')+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Текущие акции</div>'+
      PROMOTIONS.map(function(p){return '<div style="padding:14px 16px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;gap:4px;"><div style="font-size:14px;color:var(--text);font-weight:700;">'+p.title+'</div><div style="font-size:12px;color:var(--text-secondary);">'+p.desc+'</div></div>';}).join('')+
    '</div>'+
  '</div></div>';
}

/* ================= NOTIFICATIONS ================= */

function viewNotifications(){
  return headerBack('Уведомления')+
  '<div class="content"><div style="display:flex;flex-direction:column;">'+
    NOTIFICATIONS.map(function(n){return (
      '<div class="list-row" style="cursor:default;">'+
        '<div class="row-icon" style="background:'+(n.unread?'var(--primary-tint)':'var(--surface)')+';color:'+(n.unread?'var(--primary)':'var(--text-secondary)')+';">'+svgIcon(ICONS[n.icon]||ICONS.bell,17)+'</div>'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:2px;">'+
          '<span style="font-size:13px;font-weight:'+(n.unread?'700':'500')+';color:var(--text);">'+n.title+'</span>'+
          '<span style="font-size:12px;color:var(--text-secondary);">'+n.text+'</span>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">'+
          '<span style="font-size:11px;color:var(--text-tertiary);">'+n.time+'</span>'+
          (n.unread?'<span style="width:7px;height:7px;border-radius:50%;background:var(--primary);"></span>':'')+
        '</div>'+
      '</div>'
    );}).join('')+
  '</div></div>';
}

/* ================= FAVORITES ================= */

function viewFavorites(){
  const items = PRODUCTS.filter(function(p){return isFav(p.id);});
  if(items.length===0){
    return '<div class="tg-header"><span class="title">Избранное</span><span style="width:36px"></span></div>'+
    '<div class="content" style="display:flex;"><div class="empty-state">'+
      '<div class="empty-icon">'+svgIcon(ICONS.heart,28,'')+'</div>'+
      '<div class="empty-title">Здесь пока ничего нет</div>'+
      '<div class="empty-text">Добавляйте товары в избранное, чтобы не потерять их.</div>'+
      '<button class="btn btn-primary" data-nav="catalog" style="margin-top:6px;">Перейти в каталог</button>'+
    '</div></div>'+
    bottomNav('favorites');
  }
  return '<div class="tg-header"><span class="title">Избранное · '+items.length+'</span><span style="width:36px"></span></div>'+
  '<div class="tabs"><button class="tab active">Товары</button><button class="tab">Бренды</button></div>'+
  '<div class="content"><div class="grid-2" style="padding-top:16px;padding-bottom:16px;">'+items.map(function(p){return productCardHtml(p,true);}).join('')+'</div></div>'+
  bottomNav('favorites');
}

/* ================= WHEEL OF FORTUNE ================= */

function resultBanner(p){
  return '<div style="width:100%;background:var(--surface);border:1px solid var(--primary);border-radius:var(--radius-lg);padding:18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;">'+
    '<div class="eyebrow" style="color:var(--primary);">Ваш приз</div>'+
    '<div class="h2">'+p.title+'</div>'+
    (p.type==='promo' ? '<div style="font-size:12px;color:var(--text-secondary);">Промокод <b style="color:var(--primary);">'+p.code+'</b> активен 7 дней — примените его в корзине</div>' : '')+
    (p.type==='freeDelivery' ? '<div style="font-size:12px;color:var(--text-secondary);">Бесплатная доставка спишется автоматически на следующем заказе</div>' : '')+
    (p.type==='again' ? '<div style="font-size:12px;color:var(--text-secondary);">Можно крутить ещё раз прямо сейчас</div>' : '')+
  '</div>';
}

function viewWheel(){
  const spins = spinsAvailable();
  return headerBack('Колесо фортуны')+
  '<div class="content"><div style="display:flex;flex-direction:column;align-items:center;gap:22px;padding:26px 20px 30px;">'+
    '<div style="position:relative;">'+
      '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:18px solid var(--text);z-index:2;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25));"></div>'+
      wheelSvg(0)+
    '</div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">'+
      '<div class="h2">Доступно попыток: '+spins+'</div>'+
      '<div style="font-size:12px;color:var(--text-tertiary);text-align:center;">1 бесплатная попытка в день · +1 попытка за каждую покупку</div>'+
    '</div>'+
    '<button id="spinBtn" class="btn btn-primary btn-block" data-action="spin-wheel"'+(spins<=0?' disabled':'')+'>'+(spins>0?'Крутить колесо':'Приходите завтра')+'</button>'+
    (lastWheelResult ? resultBanner(lastWheelResult) : '')+
  '</div></div>';
}

/* ================= REFERRAL ================= */

function viewReferral(){
  const code = getReferralCode();
  const earned = REFERRALS.filter(function(r){return r.status==='ordered';}).reduce(function(s,r){return s+r.reward;},0);
  return headerBack('Пригласить друзей')+
  '<div class="content"><div style="display:flex;flex-direction:column;gap:22px;padding:20px 20px 24px;">'+
    '<div style="display:flex;flex-direction:column;gap:8px;">'+
      '<div class="h1">Приглашайте друзей — получайте бонусы</div>'+
      '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">За каждого друга, который сделает первый заказ, вам начислят <b style="color:var(--primary);">'+REFERRAL_REWARD+' бонусов</b>. Друг получит промокод на первую покупку.</div>'+
    '</div>'+
    '<div style="background:var(--surface);border:1px dashed var(--primary);border-radius:var(--radius-card);padding:16px;display:flex;flex-direction:column;gap:10px;">'+
      '<div class="eyebrow">Ваш код</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;">'+
        '<span class="h1" style="letter-spacing:1px;">'+code+'</span>'+
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
        '<span style="font-size:12px;color:var(--primary);font-weight:700;">Заработано '+earned+' бонусов</span>'+
      '</div>'+
      (REFERRALS.length===0 ? '<div style="font-size:12px;color:var(--text-tertiary);">Пока никто не присоединился по вашей ссылке</div>' :
        REFERRALS.map(function(r){return (
          '<div style="display:flex;align-items:center;gap:12px;">'+
            '<div class="avatar" style="width:40px;height:40px;font-size:15px;">'+r.name.charAt(0)+'</div>'+
            '<div style="flex:1;display:flex;flex-direction:column;">'+
              '<span style="font-size:13px;color:var(--text);font-weight:600;">'+r.name+'</span>'+
              '<span style="font-size:11px;color:var(--text-tertiary);">'+(r.status==='ordered' ? 'Первый заказ · '+r.date : 'Ожидает первый заказ')+'</span>'+
            '</div>'+
            (r.status==='ordered' ? '<span style="font-size:13px;color:var(--success);font-weight:700;">+'+r.reward+'</span>' : '<span style="font-size:11px;color:var(--text-tertiary);">—</span>')+
          '</div>'
        );}).join(''))+
    '</div>'+
  '</div></div>';
}

/* ================= EVENTS ================= */

function onGlobalClick(e){
  // Ищем ближайшего по дереву предка с data-action/data-nav/data-back — побеждает тот,
  // кто ближе к цели клика (иначе клик по кнопке-иконке внутри карточки товара
  // перехватывался бы переходом на страницу товара через внешний data-nav).
  const hit = e.target.closest('[data-action],[data-nav],[data-back]');
  if(!hit) return;

  // Клик по фону шторки (не по её содержимому) закрывает её — проверяем, что цель клика
  // это сам оверлей, а не всплытие из вложенной кнопки без своего data-action.
  if(hit.classList.contains('sheet-overlay') && e.target===hit){
    const bgAction = hit.getAttribute('data-action');
    if(bgAction==='sheet-backdrop'){ sheetOpen = null; render(); return; }
    if(bgAction==='confirm-cancel'){ confirmSheet = null; render(); return; }
  }
  if(hit.classList.contains('sheet-overlay')) return; // клик внутри шторки, но не на интерактивном элементе
  if(hit.hasAttribute('data-back')){ haptic(); goBack(); return; }
  if(hit.hasAttribute('data-nav')){ haptic(); navigate('#/'+hit.getAttribute('data-nav')); return; }

  const actEl = hit;
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
    case 'quick-add': {
      const p = getProduct(actEl.getAttribute('data-id'));
      if(!p || p.inStock===false) return;
      const key = p.id+'-'+(p.strengthDefault||0)+'-'+(p.volumeIndex||0);
      const existing = STATE.cart.find(i=>i.key===key);
      if(existing) existing.qty += 1;
      else STATE.cart.push({productId:p.id, key, qty:1, strengthIndex:p.strengthDefault||0, volumeIndex:p.volumeIndex||0, flavorIndex:0});
      saveState(); haptic('success'); toast('Добавлено в корзину');
      render();
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
      saveState(); haptic('success');
      const btn = document.getElementById('addToCartBtn');
      if(btn){ btn.style.transform='scale(0.96)'; setTimeout(()=>{btn.style.transform='scale(1)';},140); }
      toast('Добавлено ✓');
      break;
    }
    case 'share-product': {
      toast('Ссылка на товар скопирована'); haptic();
      break;
    }

    case 'cart-inc': { const it = STATE.cart.find(i=>i.key===actEl.getAttribute('data-key')); if(it) it.qty++; saveState(); render(); break; }
    case 'cart-dec': { const it = STATE.cart.find(i=>i.key===actEl.getAttribute('data-key')); if(it){ it.qty--; if(it.qty<=0) STATE.cart = STATE.cart.filter(x=>x!==it); } saveState(); render(); break; }
    case 'cart-remove': {
      const key = actEl.getAttribute('data-key');
      openConfirm('Удалить товар?', 'Товар будет убран из корзины. Это действие можно отменить, добавив его снова.', 'Удалить', 'cart-remove', key);
      break;
    }
    case 'clear-cart': {
      openConfirm('Очистить корзину?', 'Все товары будут удалены из корзины.', 'Очистить', 'clear-cart', null);
      break;
    }
    case 'confirm-cancel': confirmSheet = null; render(); break;
    case 'confirm-ok': {
      const c = confirmSheet;
      if(c){
        if(c.action==='cart-remove'){ STATE.cart = STATE.cart.filter(i=>i.key!==c.payload); saveState(); haptic(); toast('Товар удалён'); }
        else if(c.action==='clear-cart'){ STATE.cart = []; saveState(); haptic(); toast('Корзина очищена'); }
      }
      confirmSheet = null; render();
      break;
    }

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
        el.style.borderColor = 'var(--border)'; el.style.background='transparent';
        el.querySelector('.pin').classList.remove('active');
      });
      actEl.style.borderColor = 'var(--primary)'; actEl.style.background='var(--primary-tint)';
      actEl.querySelector('.pin').classList.add('active');
      break;
    }

    case 'toggle-use-bonuses': { STATE.useBonuses = !STATE.useBonuses; render(); break; }
    case 'toggle-instock': { currentFilters.inStockOnly = !currentFilters.inStockOnly; render(); break; }
    case 'toggle-offline': { STATE.simulateOffline = !STATE.simulateOffline; render(); break; }
    case 'retry-online': { STATE.simulateOffline = false; toast('Соединение восстановлено'); render(); break; }

    case 'catalog-chip': { catalogChip = actEl.getAttribute('data-cat'); currentFilters = {brand:null,taste:null,strength:null,inStockOnly:currentFilters.inStockOnly,minPrice:null,maxPrice:null}; haptic(); render(); break; }
    case 'pick-brand': { currentFilters.brand = actEl.getAttribute('data-brand') || null; haptic(); render(); break; }
    case 'open-filter': { sheetOpen = 'filter'; render(); break; }
    case 'open-sort': { sheetOpen = 'sort'; render(); break; }
    case 'sheet-close': { sheetOpen = null; render(); break; }
    case 'pick-sort': { sortMode = actEl.getAttribute('data-mode'); sheetOpen = null; haptic(); render(); break; }
    case 'filter-reset': { currentFilters = {brand:null,taste:null,strength:null,inStockOnly:false,minPrice:null,maxPrice:null}; haptic(); render(); break; }

    case 'clear-search': { searchQuery=''; render(); const el=document.getElementById('searchInput'); if(el) el.focus(); break; }
    case 'set-search': { searchQuery = actEl.getAttribute('data-q'); render(); break; }

    case 'place-order': {
      if(orderProcessing) return;
      if(STATE.cart.length===0){ toast('Корзина пуста', 'err'); return; }
      orderProcessing = true; render();
      setTimeout(function(){
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
        orderProcessing = false;
        haptic('success');
        navigate('#/order-success/'+newId);
      }, 700);
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
      const text = action === 'copy-referral' ? getReferralCode() : getReferralLink();
      if(navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
      toast('Скопировано'); haptic('success');
      break;
    }
    case 'share-referral': {
      const link = getReferralLink();
      const shareText = 'Загляни в '+BRAND_NAME+' — премиальный магазин табака и кальянов. Мой код на бонус: '+getReferralCode();
      if(tg && tg.openTelegramLink){
        tg.openTelegramLink('https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(shareText));
      } else if(navigator.share){
        navigator.share({title:BRAND_NAME, text:shareText, url:link}).catch(()=>{});
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
    render();
    const input = document.getElementById('searchInput');
    if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    return;
  }
  if(e.target.id==='filterMinPrice' || e.target.id==='filterMaxPrice'){
    let minV = +document.getElementById('filterMinPrice').value;
    let maxV = +document.getElementById('filterMaxPrice').value;
    if(minV>maxV){ const t=minV; minV=maxV; maxV=t; }
    const label = document.getElementById('filterPriceLabel');
    if(label) label.textContent = formatPrice(minV)+' — '+formatPrice(maxV);
  }
}
function onGlobalChange(e){
  if(e.target.id==='filterMinPrice' || e.target.id==='filterMaxPrice'){
    currentFilters.minPrice = +document.getElementById('filterMinPrice').value;
    currentFilters.maxPrice = +document.getElementById('filterMaxPrice').value;
    if(currentFilters.minPrice>currentFilters.maxPrice){ const t=currentFilters.minPrice; currentFilters.minPrice=currentFilters.maxPrice; currentFilters.maxPrice=t; }
    render();
  } else if(e.target.id==='filterBrand'){ currentFilters.brand = e.target.value || null; render(); }
  else if(e.target.id==='filterTaste'){ currentFilters.taste = e.target.value || null; render(); }
  else if(e.target.id==='filterStrength'){ currentFilters.strength = e.target.value || null; render(); }
}
