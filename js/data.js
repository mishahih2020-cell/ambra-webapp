// Мок-данные каталога. В боевом варианте заменяются на запросы к API магазина.

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>',
  cart: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  heart: '<path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.8 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.2 0 4.8 3 3.3 6.2C19 15.6 12 20 12 20z"/>',
  heartFill: '<path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.8 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.2 0 4.8 3 3.3 6.2C19 15.6 12 20 12 20z" fill="currentColor" stroke="none"/>',
  star: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.5 6.3L12 16.9 6.3 20.1l1.5-6.3-4.8-4.3 6.4-.6L12 3z" fill="currentColor" stroke="none"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  bell: '<path d="M18 8a6 6 0 00-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10 20a2 2 0 004 0"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  gift: '<path d="M20 12V8a2 2 0 00-2-2h-3l-2-2H9L7 6H4a2 2 0 00-2 2v10a2 2 0 002 2h7"/><path d="M16 19l2 2 4-4"/>',
  truck: '<path d="M3 13l2-6h9l2 4h5v6h-2M3 13v4h2M3 13h13"/><circle cx="7.5" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>',
  mapPin: '<path d="M12 21c-4.4-3-7-6.4-7-10a7 7 0 0114 0c0 3.6-2.6 7-7 10z"/><circle cx="12" cy="11" r="2.3"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  cash: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M2 11h20"/><circle cx="17" cy="15" r="1.4"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  alert: '<path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/>',
  wifiOff: '<path d="M2 8.8a16 16 0 0120 0"/><path d="M5.5 12.5a11 11 0 0113 0"/><path d="M9 16a6 6 0 016 0"/><path d="M12 20h.01"/><path d="M3 3l18 18"/>',
  box: '<path d="M4 4h16v5H4z"/><path d="M4 9l1.5 11h13L20 9"/><path d="M9 13h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5"/><path d="M12 17h.01"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 20c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.6c2.7.4 4 2 4.7 5.4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  share: '<circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4"/>'
};
function icon(name, size){size=size||20;return '<svg class="icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24">'+ICONS[name]+'</svg>';}

const CATEGORIES = [
  {id:'tobacco', name:'Табак', count:128, icon:ICONS.gift.replace(/gift/,'')},
  {id:'hookahs', name:'Кальяны', count:46},
  {id:'coal', name:'Угли', count:31},
  {id:'bowls', name:'Чаши', count:24},
  {id:'accessories', name:'Аксессуары', count:57},
];
const CATEGORY_ICON_PATH = {
  tobacco:'<path d="M12 2C9 6 8 9 8 12a4 4 0 008 0c0-1.2-.4-2.2-1.1-3.2.1 1.4-.6 2.2-1.4 2.2-1 0-1.2-.9-1-1.8.4-1.6-.2-3.4-1.5-4.2z"/>',
  hookahs:'<path d="M8 21h8M12 17v4M6 3h12l-1 9a5 5 0 01-10 0L6 3z"/>',
  coal:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  bowls:'<path d="M7 3h10l-1 15a4 4 0 01-8 0L7 3z"/><path d="M7 9h10"/>',
  accessories:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/>'
};

const PRODUCTS = [
  {id:'nox-apple', category:'tobacco', brand:'NOX Tobacco', name:'Двойное яблоко', volumeDefault:'100г', price:712, oldPrice:890, badge:'sale', rating:4.8, reviews:214,
    flavors:['#C1553D','#8AA06B','#D9A441','#B8703F'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['50г','100г','250г'], volumeIndex:1,
    description:'Насыщенная табачная смесь с ярким вкусом спелого яблока и лёгкой кислинкой. Плотный густой дым, стабильное раскуривание, среднее время сессии — 60–90 минут.'},
  {id:'dune-peach', category:'tobacco', brand:'DUNE Line', name:'Персик со сливками', volumeDefault:'100г', price:820, badge:null, rating:4.6, reviews:98,
    flavors:['#D9A441','#C1553D','#8AA06B'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:0, volumes:['50г','100г','250г'], volumeIndex:1,
    description:'Кремовый вкус персика с нотами ванильных сливок. Мягкая смесь для долгих вечерних сессий.'},
  {id:'onyx-grape', category:'tobacco', brand:'ONYX Blend', name:'Виноград-мята', volumeDefault:'100г', price:780, badge:'new', rating:4.7, reviews:52,
    flavors:['#8AA06B','#B8703F'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['50г','100г','250г'], volumeIndex:1,
    description:'Сочный виноград с прохладной мятой на выдохе. Освежающий профиль, плотный дым.'},
  {id:'nox-mint', category:'tobacco', brand:'NOX Tobacco', name:'Ледяная мята', volumeDefault:'100г', price:890, badge:null, rating:4.5, reviews:167,
    flavors:['#8AA06B','#C9A467'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:2, volumes:['50г','100г','250г'], volumeIndex:1,
    description:'Интенсивный холод и чистый вкус мяты. Для тех, кто любит выразительные, бодрящие смеси.'},
  {id:'onyx-coal-24', category:'coal', brand:'ONYX Coal', name:'Кокосовый уголь 24мм', volumeDefault:'1 кг', price:450, badge:'new', rating:4.9, reviews:301,
    flavors:[], strengths:[], strengthDefault:0, volumes:['0.5 кг','1 кг','3 кг'], volumeIndex:1,
    description:'Быстрое розжигание, долгое горение без запаха и лишнего пепла. 72 кубика на упаковку.'},
  {id:'phunnel-m', category:'bowls', brand:'Чаши', name:'Phunnel M', volumeDefault:'', price:1290, badge:null, rating:4.8, reviews:44,
    flavors:[], strengths:[], strengthDefault:0, volumes:['M','L'], volumeIndex:0,
    description:'Керамическая чаша фаннел для плотного дыма и равномерного прогрева табака.'},
  {id:'hookah-overdose', category:'hookahs', brand:'ГОРЧИТ Lounge', name:'Кальян Overdose 72см', volumeDefault:'', price:12900, badge:'hit', rating:4.9, reviews:76,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Флагманская модель для домашних и лаунж-сессий. Тройная система очистки дыма.'},
  {id:'acc-tongs', category:'accessories', brand:'ГОРЧИТ', name:'Щипцы для углей', volumeDefault:'', price:990, badge:null, rating:4.7, reviews:23,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Нержавеющая сталь, удобный хват, подходит для любых углей.'},
];

function getProduct(id){return PRODUCTS.find(p=>p.id===id);}
function getCategory(id){return CATEGORIES.find(c=>c.id===id);}

const PROMO_CODES = {
  'SMOKE20': {discount:0.2, label:'-20% на угли', appliesTo:'coal', expiry:'20.09'}
};

const ORDERS = [
  {id:'10482', date:'13 сентября', itemsCount:3, total:1734, status:'transit',
    items:[{productId:'nox-apple', qty:1, price:712}, {productId:'onyx-coal-24', qty:2, price:900}],
    address:'ул. Тверская, 24, кв. 56', eta:'сегодня, 18:00–20:00'},
  {id:'10365', date:'2 сентября', itemsCount:2, total:1190, status:'delivered',
    items:[{productId:'dune-peach', qty:1, price:820}, {productId:'acc-tongs', qty:1, price:370}],
    address:'ул. Тверская, 24, кв. 56', eta:'доставлен 2 сентября'},
  {id:'10201', date:'21 августа', itemsCount:1, total:450, status:'cancelled',
    items:[{productId:'onyx-coal-24', qty:1, price:450}],
    address:'ул. Тверская, 24, кв. 56', eta:'—'},
];
function getOrder(id){return ORDERS.find(o=>o.id===id);}

const PROMOTIONS = [
  {title:'-20% на все угли', desc:'по промокоду SMOKE20 · до 20 сентября'},
  {title:'2 чаши по цене 1', desc:'при заказе от 3 000 ₽ · весь сентябрь'},
];

const RECENT_SEARCHES = ['Двойное яблоко', 'Угли кокосовые', 'Overdose'];

/* ---------- лояльность ---------- */
const TIERS = [
  {name:'Silver', threshold:0, cashback:0.05},
  {name:'Gold', threshold:15000, cashback:0.07},
  {name:'Platinum', threshold:50000, cashback:0.10},
];

/* ---------- реферальная программа ---------- */
const REFERRAL_REWARD = 200;
const REFERRALS = [
  {name:'Игорь П.', date:'10 сентября', status:'ordered', reward:200},
  {name:'Мария С.', date:'5 сентября', status:'pending', reward:0},
];

/* ---------- колесо фортуны ---------- */
const WHEEL_PRIZES = [
  {label:'+20', type:'bonus', value:20, title:'+20 бонусов', color:'#241D15'},
  {label:'+50', type:'bonus', value:50, title:'+50 бонусов', color:'#4A3A20'},
  {label:'−10%', type:'promo', code:'WHEEL10', discount:0.10, title:'Промокод −10%', color:'#241D15'},
  {label:'+100', type:'bonus', value:100, title:'+100 бонусов', color:'#4A3A20'},
  {label:'0 ₽', type:'freeDelivery', title:'Бесплатная доставка', color:'#241D15'},
  {label:'+200', type:'bonus', value:200, title:'+200 бонусов', color:'#4A3A20'},
  {label:'↻', type:'again', title:'Ещё одна попытка', color:'#241D15'},
  {label:'+30', type:'bonus', value:30, title:'+30 бонусов', color:'#4A3A20'},
];
const WHEEL_WEIGHTS = [18, 15, 8, 10, 12, 5, 20, 12];

