// Мок-данные каталога. В боевом варианте заменяются на запросы к API магазина.

const BRAND_NAME = 'HOOKAH SHOP';

const ICONS = {
  home: '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9"/><path d="M10 20v-6h4v6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>',
  cart: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  heart: '<path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.8 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.2 0 4.8 3 3.3 6.2C19 15.6 12 20 12 20z"/>',
  heartFill: '<path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.8 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.2 0 4.8 3 3.3 6.2C19 15.6 12 20 12 20z" fill="currentColor" stroke="none"/>',
  star: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.5 6.3L12 16.9 6.3 20.1l1.5-6.3-4.8-4.3 6.4-.6L12 3z" fill="currentColor" stroke="none"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort: '<path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/>',
  bell: '<path d="M18 8a6 6 0 00-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10 20a2 2 0 004 0"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
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
  share: '<circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>'
};
function icon(name, size){size=size||20;return '<svg class="icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24">'+ICONS[name]+'</svg>';}

const CATEGORIES = [
  {id:'tobacco', name:'Табак', count:7, from:680},
  {id:'hookahs', name:'Кальяны', count:2, from:9990},
  {id:'accessories', name:'Аксессуары', count:5, from:290},
  {id:'coal', name:'Уголь', count:2, from:450},
  {id:'vape', name:'Жидкости', count:2, from:590},
];
const CATEGORY_ICON_PATH = {
  tobacco:'<path d="M12 2C9 6 8 9 8 12a4 4 0 008 0c0-1.2-.4-2.2-1.1-3.2.1 1.4-.6 2.2-1.4 2.2-1 0-1.2-.9-1-1.8.4-1.6-.2-3.4-1.5-4.2z"/>',
  hookahs:'<path d="M8 21h8M12 17v4M6 3h12l-1 9a5 5 0 01-10 0L6 3z"/>',
  coal:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  bowls:'<path d="M7 3h10l-1 15a4 4 0 01-8 0L7 3z"/><path d="M7 9h10"/>',
  accessories:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/>',
  vape:'<rect x="10" y="2" width="4" height="7" rx="1.5"/><path d="M8 9h8l1 4-1 9H9L8 13z"/><path d="M10 13h4"/>'
};

// Фото — открытые файлы Wikimedia Commons (свободные лицензии), отдаются через Special:FilePath.
// Используются как наглядные категорийные фотографии, а не как студийная съёмка конкретного SKU.
const IMG = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const PHOTO = {
  coal: IMG+'Charcoal_briquettes_Namibia.jpg?width=500',
  hookah: IMG+'Hookah_2.jpg?width=500',
  hose: IMG+'Hookah_2.jpg?width=500',
  tongs: IMG+'Tongs1.JPG?width=500',
  foil: IMG+'Aluminium_foil_closeup.jpg?width=500',
  vape1: IMG+'Vape_juice.jpg?width=500',
  vape2: IMG+'CBD_Vape_Oil_E-Liquid_Bottles.jpg?width=500',
};
// Реальные фото табаков (собственная съёмка упаковки) — лежат в img/tobacco/.
const TPHOTO = {
  blackburn: 'img/tobacco/blackburn-mandarin-soda.jpg',
  overdose: 'img/tobacco/overdose-coffee.jpg',
  darkside: 'img/tobacco/darkside-top-gum.jpg',
  musthave: 'img/tobacco/musthave-marula.jpg',
  bonche: 'img/tobacco/bonche-dark-chocolate.jpg',
};

const PRODUCTS = [
  {id:'darkside-topgum', category:'tobacco', brand:'Dark Side', name:'Top Gum', volumeDefault:'100г', price:1590, oldPrice:1990, badge:'sale', rating:4.9, reviews:124, image:TPHOTO.darkside, inStock:true,
    taste:'Ягоды', strengthTag:'Средняя',
    flavors:['#B8703F','#8AA06B'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г'], volumeIndex:1,
    description:'Ягодная жевательная резинка — сладкий, узнаваемый вкус линейки Core. Ровное горение весь сеанс, плотный дым.'},
  {id:'tangiers-canemint', category:'tobacco', brand:'Tangiers', name:'Noir Cane Mint', volumeDefault:'100г', price:1890, badge:'new', rating:4.7, reviews:156, image:null, inStock:true,
    taste:'Мята', strengthTag:'Крепкая',
    flavors:['#8AA06B','#2E3A24'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['100г','250г'], volumeIndex:0,
    description:'Насыщенный табак линейки Noir с холодной мятой и тростниковой сладостью. Для опытных курильщиков, долгое густое облако.'},
  {id:'serbetli-mango', category:'tobacco', brand:'Serbetli', name:'Mango', volumeDefault:'50г', price:790, badge:null, rating:4.6, reviews:88, image:null, inStock:true,
    taste:'Фрукты', strengthTag:'Лёгкая',
    flavors:['#D9A441','#F5C242'], strengths:['Лёгкий','Средний'], strengthDefault:0, volumes:['50г'], volumeIndex:0,
    description:'Сочный спелый манго — лёгкая, некрепкая смесь для длинных дружеских сессий.'},
  {id:'blackburn-mandarin', category:'tobacco', brand:'Blackburn', name:'Мандариновая газировка', volumeDefault:'100г', price:850, badge:'hit', rating:4.8, reviews:186, image:TPHOTO.blackburn, inStock:true,
    taste:'Фрукты', strengthTag:'Средняя',
    flavors:['#D9A441','#C1553D'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Освежающий вкус мандариновой газировки — цитрусовая кислинка и лёгкая сладость с игристой ноткой.'},
  {id:'overdose-coffee', category:'tobacco', brand:'Overdose', name:'Кофе', volumeDefault:'100г', price:830, badge:null, rating:4.7, reviews:134, image:TPHOTO.overdose, inStock:true,
    taste:'Кофе', strengthTag:'Крепкая',
    flavors:['#4A3A20','#8B5E34'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Насыщенный вкус свежесваренного кофе с лёгкой горчинкой. Плотная тяга, густой дым.'},
  {id:'musthave-marula', category:'tobacco', brand:'Must Have', name:'Marula', volumeDefault:'100г', price:780, badge:null, rating:4.6, reviews:97, image:TPHOTO.musthave, inStock:true,
    taste:'Фрукты', strengthTag:'Лёгкая',
    flavors:['#D9A441','#8AA06B'], strengths:['Лёгкий','Средний'], strengthDefault:0, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Экзотический фрукт марула — сладкий, слегка терпкий вкус с фруктовой сочностью.'},
  {id:'bonche-chocolate', category:'tobacco', brand:'Bonche', name:'Dark Chocolate', volumeDefault:'100г', price:820, badge:null, rating:4.7, reviews:112, image:TPHOTO.bonche, inStock:true,
    taste:'Шоколад', strengthTag:'Крепкая',
    flavors:['#4A3A20','#241D15'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Тёмный шоколад — глубокий, слегка горьковатый вкус какао без лишней приторности.'},

  {id:'alpha-hookah-modelx', category:'hookahs', brand:'Alpha Hookah', name:'Model X', volumeDefault:'', price:12990, badge:null, rating:4.8, reviews:63, image:PHOTO.hookah, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Флагманская модель для домашних и лаунж-сессий. Устойчивая база, тройная система очистки дыма.'},
  {id:'hoob-sirius', category:'hookahs', brand:'HOOB', name:'Sirius', volumeDefault:'', price:9990, badge:'new', rating:4.6, reviews:29, image:PHOTO.hookah, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Компактный кальян с керамической чашей в комплекте. Лёгкая протяжка, стабильный жар.'},

  {id:'coal-cocobrico-24', category:'coal', brand:'Cocobrico', name:'Кокосовый уголь 24мм', volumeDefault:'1 кг', price:450, badge:'hit', rating:4.9, reviews:301, image:PHOTO.coal, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['0.5 кг','1 кг','3 кг'], volumeIndex:1,
    description:'Быстрое розжигание, долгое горение без запаха и лишнего пепла. 72 кубика на упаковку.'},
  {id:'coal-cocobrico-26', category:'coal', brand:'Cocobrico', name:'Кокосовый уголь 26мм', volumeDefault:'1 кг', price:480, badge:null, rating:4.8, reviews:118, image:PHOTO.coal, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['1 кг','3 кг'], volumeIndex:0,
    description:'Крупный кубик для долгих сессий, ровный жар без перепадов температуры.'},

  {id:'acc-tongs', category:'accessories', brand:'SVERDLOVSK Wings', name:'Щипцы для углей «Радуга»', volumeDefault:'', price:350, badge:'hit', rating:4.7, reviews:23, image:PHOTO.tongs, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Нержавеющая сталь, удобный хват, подходит для любых углей.'},
  {id:'acc-mouthpiece', category:'accessories', brand:BRAND_NAME, name:'Мундштук силиконовый', volumeDefault:'', price:450, badge:null, rating:4.6, reviews:38, image:null, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Многоразовый силиконовый мундштук, легко моется, плотно садится на шланг.'},
  {id:'acc-shaft', category:'accessories', brand:BRAND_NAME, name:'Шахта для кальяна (запасная)', volumeDefault:'', price:3500, badge:null, rating:4.8, reviews:12, image:PHOTO.hookah, inStock:false,
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Запасная шахта из нержавеющей стали, совместима с большинством современных кальянов.'},
  {id:'acc-hose', category:'accessories', brand:BRAND_NAME, name:'Силиконовый шланг', volumeDefault:'1.5 м', price:1450, badge:null, rating:4.6, reviews:31, image:PHOTO.hose, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['1.5 м','2 м'], volumeIndex:0,
    description:'Моющийся силиконовый шланг без запаха пластика. Съёмный мундштук, лёгкая протяжка дыма.'},
  {id:'acc-foil', category:'accessories', brand:BRAND_NAME, name:'Фольга для чаши', volumeDefault:'10 м', price:290, badge:null, rating:4.5, reviews:19, image:PHOTO.foil, inStock:true,
    flavors:[], strengths:[], strengthDefault:0, volumes:['10 м'], volumeIndex:0,
    description:'Плотная пищевая фольга для розжига на чаше. Держит жар равномерно, не рвётся при проколе.'},

  {id:'vape-mango', category:'vape', brand:BRAND_NAME+' Liquids', name:'Манго-лёд', volumeDefault:'30мл', price:590, badge:'hit', rating:4.8, reviews:142, image:PHOTO.vape1, inStock:true,
    flavors:['#D9A441','#8AA06B'], strengths:['0мг','3мг','6мг'], strengthDefault:1, volumes:['30мл','60мл'], volumeIndex:0,
    description:'Сочный манго с прохладным холодком на выдохe. Плотный пар, насыщенный вкус в каждой затяжке.'},
  {id:'vape-cola', category:'vape', brand:BRAND_NAME+' Liquids', name:'Кола-лайм', volumeDefault:'30мл', price:590, badge:'new', rating:4.6, reviews:64, image:PHOTO.vape2, inStock:true,
    flavors:['#B8703F','#8AA06B'], strengths:['0мг','3мг','6мг'], strengthDefault:0, volumes:['30мл','60мл'], volumeIndex:0,
    description:'Классическая кола с лёгкой лаймовой кислинкой. Сбалансированная сладость, лёгкий бросок в горло.'},
];

function getProduct(id){return PRODUCTS.find(p=>p.id===id);}
function getCategory(id){return CATEGORIES.find(c=>c.id===id);}
function categoryBrands(catId){ return [...new Set(PRODUCTS.filter(p=>p.category===catId).map(p=>p.brand))]; }
function categoryPriceRange(catId){
  const items = catId ? PRODUCTS.filter(p=>p.category===catId) : PRODUCTS;
  const prices = items.map(p=>p.price);
  return {min: Math.min(...prices), max: Math.max(...prices)};
}

const PROMO_CODES = {
  'SMOKE20': {discount:0.2, label:'-20% на угли', appliesTo:'coal', expiry:'20.09'}
};

const ORDERS = [
  {id:'10482', date:'13 сентября', itemsCount:3, total:1750, status:'transit',
    items:[{productId:'darkside-topgum', qty:1, price:1590}, {productId:'coal-cocobrico-24', qty:2, price:480}],
    address:'ул. Тверская, 24, кв. 56', eta:'сегодня, 18:00–20:00'},
  {id:'10365', date:'2 сентября', itemsCount:2, total:1180, status:'delivered',
    items:[{productId:'bonche-chocolate', qty:1, price:820}, {productId:'acc-tongs', qty:1, price:360}],
    address:'ул. Тверская, 24, кв. 56', eta:'доставлен 2 сентября'},
  {id:'10201', date:'21 августа', itemsCount:1, total:450, status:'cancelled',
    items:[{productId:'coal-cocobrico-24', qty:1, price:450}],
    address:'ул. Тверская, 24, кв. 56', eta:'—'},
];
function getOrder(id){return ORDERS.find(o=>o.id===id);}

const PROMOTIONS = [
  {title:'-20% на все угли', desc:'по промокоду SMOKE20 · до 20 сентября'},
  {title:'2 чаши по цене 1', desc:'при заказе от 3 000 ₽ · весь сентябрь'},
];

const RECENT_SEARCHES = ['Dark Side Top Gum', 'Угли кокосовые', 'Tangiers'];

const NOTIFICATIONS = [
  {icon:'truck', title:'Ваша посылка в пути', text:'Заказ №1244 уже в городе', time:'10.05', unread:true},
  {icon:'gift', title:'Скидка 20% на Dark Side', text:'Любимые вкусы по выгодной цене', time:'08.05', unread:true},
  {icon:'wheel', title:'Бонусы начислены', text:'+250 баллов за покупку', time:'05.05', unread:false},
  {icon:'box', title:'Новинки в каталоге', text:'Поступление табаков Tangiers', time:'02.05', unread:false},
  {icon:'check', title:'Время забрать заказ', text:'Заказ №1242 готов к выдаче', time:'28.04', unread:false},
];

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
  {label:'+20', type:'bonus', value:20, title:'+20 бонусов', color:'#F1F2F4'},
  {label:'+50', type:'bonus', value:50, title:'+50 бонусов', color:'#F52B32'},
  {label:'−10%', type:'promo', code:'WHEEL10', discount:0.10, title:'Промокод −10%', color:'#F1F2F4'},
  {label:'+100', type:'bonus', value:100, title:'+100 бонусов', color:'#F52B32'},
  {label:'0 ₽', type:'freeDelivery', title:'Бесплатная доставка', color:'#F1F2F4'},
  {label:'+200', type:'bonus', value:200, title:'+200 бонусов', color:'#F52B32'},
  {label:'↻', type:'again', title:'Ещё одна попытка', color:'#F1F2F4'},
  {label:'+30', type:'bonus', value:30, title:'+30 бонусов', color:'#F52B32'},
];
const WHEEL_WEIGHTS = [18, 15, 8, 10, 12, 5, 20, 12];
