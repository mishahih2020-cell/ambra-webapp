// Мок-данные каталога. В боевом варианте заменяются на запросы к API магазина.

const BRAND_NAME = 'Gорчит Shop';

const ICONS = {
  home: '<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9"/><path d="M10 20v-6h4v6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>',
  cart: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  heartFill: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" stroke="none"/>',
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
const CATEGORIES = [
  {id:'tobacco', name:'Табак', count:7, from:780},
  {id:'hookahs', name:'Кальяны', count:2, from:9990},
  {id:'bowls', name:'Чаши', count:2, from:990},
  {id:'coal', name:'Уголь', count:2, from:450},
  {id:'accessories', name:'Аксессуары', count:4, from:290},
  {id:'drinks', name:'Напитки', count:2, from:120},
  {id:'vape', name:'Жидкости', count:2, from:590},
];
// Единая иконочная система (в стиле Lucide — чистые геометричные line-иконки,
// без "рисованных" силуэтов) — используется в категориях каталога.
const CATEGORY_ICON_PATH = {
  tobacco:'<path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
  hookahs:'<path d="M9 2h6l1 3H8l1-3z"/><path d="M7 5h10l-1.2 8.5a3.8 3.8 0 01-7.6 0L7 5z"/><path d="M12 13.5V19"/><path d="M8 22h8"/><path d="M15 19c2 0 3.6-1 4.5-2.8"/>',
  coal:'<path d="M8.5 14.5a2.5 2.5 0 002.5-2.5c0-1.4-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/>',
  bowls:'<path d="M5 4h14l-1.6 12.3a5.5 5.5 0 01-10.8 0L5 4z"/><path d="M5.4 6.5h13.2"/>',
  accessories:'<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.1-3.1a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.1 3.1z"/>',
  drinks:'<path d="M10.2 2h3.6l1.4 3H8.8l1.4-3z"/><path d="M5 6h14l-1.4 12.2A2.5 2.5 0 0115.1 20H8.9a2.5 2.5 0 01-2.5-1.8L5 6z"/><path d="M5.6 10h12.8"/>',
  vape:'<rect x="9" y="2.5" width="6" height="4.5" rx="1"/><path d="M8 8.5h8l1.2 3.5L16 20a2 2 0 01-2 2h-4a2 2 0 01-2-2l-1.2-8L8 8.5z"/><path d="M9.5 13h5"/>',
  new:'<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.5 6.3L12 16.9 6.3 20.1l1.5-6.3-4.8-4.3 6.4-.6L12 3z"/>'
};

// Версия ассетов — приходит из index.html (window.ASSET_V), бампается там при каждом
// деплое, меняющем фото. Приклеена ко всем путям картинок ниже, чтобы Telegram WebView
// и браузерный кэш не держали старые файлы под тем же URL.
const ASSET_V = (typeof window !== 'undefined' && window.ASSET_V) || String(Date.now());
function assetUrl(path){ return path + '?v=' + ASSET_V; }

// Реальные фото табаков (собственная съёмка упаковки) — лежат в img/tobacco/.
const TPHOTO = {
  blackburn: assetUrl('img/tobacco/blackburn-mandarin-soda.jpg'),
  overdose: assetUrl('img/tobacco/overdose-coffee.jpg'),
  darkside: assetUrl('img/tobacco/darkside-top-gum.jpg'),
  musthave: assetUrl('img/tobacco/musthave-marula.jpg'),
  bonche: assetUrl('img/tobacco/bonche-dark-chocolate.jpg'),
};
// Реальные фото остальных категорий — лежат в img/<категория>/.
const RPHOTO = {
  alphaHookah: assetUrl('img/hookahs/alpha-hookah-modelx.jpg'),
  hoobSirius: assetUrl('img/hookahs/hoob-sirius.jpg'),
  bowlPhunnel: assetUrl('img/bowls/bowl-phunnel.jpg'),
  bowlAlpha: assetUrl('img/bowls/bowl-alpha-kama.jpg'),
  coal: assetUrl('img/coal/cocoloco.jpg'),
  tongs: assetUrl('img/accessories/tongs-mista.jpg'),
  mouthpiece: assetUrl('img/accessories/mouthpiece-silicone.jpg'),
  shaft: assetUrl('img/accessories/shaft.jpg'),
  foil: assetUrl('img/accessories/foil.jpg'),
  cola: assetUrl('img/drinks/cola.jpg'),
  mors: assetUrl('img/drinks/mors.jpg'),
  vapeMango: assetUrl('img/vape/mango-ice.jpg'),
  vapeCola: assetUrl('img/vape/cola-lime.jpg'),
};

const PRODUCTS = [
  {id:'darkside-topgum', category:'tobacco', brand:'Dark Side', name:'Top Gum', volumeDefault:'100г', price:1590, oldPrice:1990, badge:'sale', rating:4.9, reviews:124, image:TPHOTO.darkside, inStock:true, country:'Россия',
    taste:'Ягоды', strengthTag:'Средняя',
    flavors:['#B8703F','#8AA06B'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г'], volumeIndex:1,
    description:'Ягодная жевательная резинка — сладкий, узнаваемый вкус линейки Core. Ровное горение весь сеанс, плотный дым.'},
  {id:'tangiers-canemint', category:'tobacco', brand:'Tangiers', name:'Noir Cane Mint', volumeDefault:'100г', price:1890, badge:'new', rating:4.7, reviews:156, image:null, inStock:true, country:'США',
    taste:'Мята', strengthTag:'Крепкая',
    flavors:['#8AA06B','#2E3A24'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['100г','250г'], volumeIndex:0,
    description:'Насыщенный табак линейки Noir с холодной мятой и тростниковой сладостью. Для опытных курильщиков, долгое густое облако.'},
  {id:'serbetli-mango', category:'tobacco', brand:'Serbetli', name:'Mango', volumeDefault:'50г', price:790, badge:null, rating:4.6, reviews:88, image:null, inStock:true, country:'Россия',
    taste:'Фрукты', strengthTag:'Лёгкая',
    flavors:['#D9A441','#F5C242'], strengths:['Лёгкий','Средний'], strengthDefault:0, volumes:['50г'], volumeIndex:0,
    description:'Сочный спелый манго — лёгкая, некрепкая смесь для длинных дружеских сессий.'},
  {id:'blackburn-mandarin', category:'tobacco', brand:'Blackburn', name:'Мандариновая газировка', volumeDefault:'100г', price:850, badge:'hit', rating:4.8, reviews:186, image:TPHOTO.blackburn, inStock:true, country:'Россия',
    taste:'Фрукты', strengthTag:'Средняя',
    flavors:['#D9A441','#C1553D'], strengths:['Лёгкий','Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Освежающий вкус мандариновой газировки — цитрусовая кислинка и лёгкая сладость с игристой ноткой.'},
  {id:'overdose-coffee', category:'tobacco', brand:'Overdose', name:'Кофе', volumeDefault:'100г', price:830, badge:null, rating:4.7, reviews:134, image:TPHOTO.overdose, inStock:true, country:'Россия',
    taste:'Кофе', strengthTag:'Крепкая',
    flavors:['#4A3A20','#8B5E34'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Насыщенный вкус свежесваренного кофе с лёгкой горчинкой. Плотная тяга, густой дым.'},
  {id:'musthave-marula', category:'tobacco', brand:'Must Have', name:'Marula', volumeDefault:'100г', price:780, badge:null, rating:4.6, reviews:97, image:TPHOTO.musthave, inStock:true, country:'Россия',
    taste:'Фрукты', strengthTag:'Лёгкая',
    flavors:['#D9A441','#8AA06B'], strengths:['Лёгкий','Средний'], strengthDefault:0, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Экзотический фрукт марула — сладкий, слегка терпкий вкус с фруктовой сочностью.'},
  {id:'bonche-chocolate', category:'tobacco', brand:'Bonche', name:'Dark Chocolate', volumeDefault:'100г', price:820, badge:null, rating:4.7, reviews:112, image:TPHOTO.bonche, inStock:true, country:'Россия',
    taste:'Шоколад', strengthTag:'Крепкая',
    flavors:['#4A3A20','#241D15'], strengths:['Средний','Крепкий'], strengthDefault:1, volumes:['25г','100г','250г'], volumeIndex:1,
    description:'Тёмный шоколад — глубокий, слегка горьковатый вкус какао без лишней приторности.'},

  {id:'alpha-hookah-modelx', category:'hookahs', brand:'Alpha Hookah', name:'Model X', volumeDefault:'', price:12990, badge:null, rating:4.8, reviews:63, image:RPHOTO.alphaHookah, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Флагманская модель для домашних и лаунж-сессий. Устойчивая база, тройная система очистки дыма.'},
  {id:'hoob-sirius', category:'hookahs', brand:'HOOB', name:'Sirius', volumeDefault:'', price:9990, badge:'new', rating:4.6, reviews:29, image:RPHOTO.hoobSirius, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Компактный кальян с керамической чашей в комплекте. Лёгкая протяжка, стабильный жар.'},

  {id:'bowl-phunnel', category:'bowls', brand:BRAND_NAME, name:'Чаша Phunnel M', volumeDefault:'', price:990, badge:null, rating:4.8, reviews:44, image:RPHOTO.bowlPhunnel, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['M','L'], volumeIndex:0,
    description:'Керамическая чаша фаннел для плотного дыма и равномерного прогрева табака.'},
  {id:'bowl-alpha', category:'bowls', brand:'Alpha Hookah', name:'Чаша Kama', volumeDefault:'', price:1290, badge:'new', rating:4.7, reviews:21, image:RPHOTO.bowlAlpha, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['M'], volumeIndex:0,
    description:'Глиняная чаша с толстыми стенками — держит жар дольше, подходит для крепких смесей.'},

  {id:'coal-cocobrico-24', category:'coal', brand:'Cocobrico', name:'Кокосовый уголь 24мм', volumeDefault:'1 кг', price:450, badge:'hit', rating:4.9, reviews:301, image:RPHOTO.coal, inStock:true, country:'Индонезия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['0.5 кг','1 кг','3 кг'], volumeIndex:1,
    description:'Быстрое розжигание, долгое горение без запаха и лишнего пепла. 72 кубика на упаковку.'},
  {id:'coal-cocobrico-26', category:'coal', brand:'Cocobrico', name:'Кокосовый уголь 26мм', volumeDefault:'1 кг', price:480, badge:null, rating:4.8, reviews:118, image:RPHOTO.coal, inStock:true, country:'Индонезия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['1 кг','3 кг'], volumeIndex:0,
    description:'Крупный кубик для долгих сессий, ровный жар без перепадов температуры.'},

  {id:'acc-tongs', category:'accessories', brand:'SVERDLOVSK Wings', name:'Щипцы для углей «Радуга»', volumeDefault:'', price:350, badge:'hit', rating:4.7, reviews:23, image:RPHOTO.tongs, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Нержавеющая сталь, удобный хват, подходит для любых углей.'},
  {id:'acc-mouthpiece', category:'accessories', brand:BRAND_NAME, name:'Мундштук силиконовый', volumeDefault:'', price:450, badge:null, rating:4.6, reviews:38, image:RPHOTO.mouthpiece, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Многоразовый силиконовый мундштук, легко моется, плотно садится на шланг.'},
  {id:'acc-shaft', category:'accessories', brand:BRAND_NAME, name:'Шахта для кальяна (запасная)', volumeDefault:'', price:3500, badge:null, rating:4.8, reviews:12, image:RPHOTO.shaft, inStock:false, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['Стандарт'], volumeIndex:0,
    description:'Запасная шахта из нержавеющей стали, совместима с большинством современных кальянов.'},
  {id:'acc-foil', category:'accessories', brand:BRAND_NAME, name:'Фольга для чаши', volumeDefault:'10 м', price:290, badge:null, rating:4.5, reviews:19, image:RPHOTO.foil, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['10 м'], volumeIndex:0,
    description:'Плотная пищевая фольга для розжига на чаше. Держит жар равномерно, не рвётся при проколе.'},

  {id:'drink-cola', category:'drinks', brand:BRAND_NAME, name:'Кола, стекло', volumeDefault:'0.33 л', price:190, badge:null, rating:4.7, reviews:52, image:RPHOTO.cola, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['0.33 л'], volumeIndex:0,
    description:'Классический освежающий напиток к кальяну. Подаётся охлаждённым.'},
  {id:'drink-mors', category:'drinks', brand:BRAND_NAME, name:'Морс ягодный', volumeDefault:'0.3 л', price:120, badge:'new', rating:4.8, reviews:27, image:RPHOTO.mors, inStock:true, country:'Россия',
    flavors:[], strengths:[], strengthDefault:0, volumes:['0.3 л'], volumeIndex:0,
    description:'Домашний ягодный морс без сахара — освежает и подчёркивает вкус табака.'},

  {id:'vape-mango', category:'vape', brand:BRAND_NAME+' Liquids', name:'Манго-лёд', volumeDefault:'30мл', price:590, badge:'hit', rating:4.8, reviews:142, image:RPHOTO.vapeMango, inStock:true, country:'Россия',
    flavors:['#D9A441','#8AA06B'], strengths:['0мг','3мг','6мг'], strengthDefault:1, volumes:['30мл','60мл'], volumeIndex:0,
    description:'Сочный манго с прохладным холодком на выдохe. Плотный пар, насыщенный вкус в каждой затяжке.'},
  {id:'vape-cola', category:'vape', brand:BRAND_NAME+' Liquids', name:'Кола-лайм', volumeDefault:'30мл', price:590, badge:'new', rating:4.6, reviews:64, image:RPHOTO.vapeCola, inStock:true, country:'Россия',
    flavors:['#B8703F','#8AA06B'], strengths:['0мг','3мг','6мг'], strengthDefault:0, volumes:['30мл','60мл'], volumeIndex:0,
    description:'Классическая кола с лёгкой лаймовой кислинкой. Сбалансированная сладость, лёгкий бросок в горло.'},
];

// Заводской набор товаров (для кнопки "Сбросить к заводским настройкам" в админке) —
// снимок делается ДО применения сохранённых правок пользователя.
const FACTORY_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS));
(function loadProductOverrides(){
  try{
    const saved = JSON.parse(localStorage.getItem('hks_products_override') || 'null');
    if(saved && Array.isArray(saved) && saved.length){
      PRODUCTS.length = 0;
      saved.forEach(p=>PRODUCTS.push(p));
    }
  }catch(e){}
})();
// Вызывать после любого изменения PRODUCTS через админку — сохраняет текущий
// массив целиком (заводские товары + правки) как единственный источник правды
// при следующей загрузке. В боевом варианте здесь будет запрос к API.
function saveProductOverrides(){
  try{ localStorage.setItem('hks_products_override', JSON.stringify(PRODUCTS)); }catch(e){}
}
function resetProductOverrides(){
  localStorage.removeItem('hks_products_override');
  PRODUCTS.length = 0;
  JSON.parse(JSON.stringify(FACTORY_PRODUCTS)).forEach(p=>PRODUCTS.push(p));
}
function slugify(text){
  return (text||'').toLowerCase()
    .replace(/[а-яё]/g, function(ch){
      const map = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
      return map[ch] || ch;
    })
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'item';
}
function uniqueProductId(base){
  let id = base, n = 2;
  while(getProduct(id)){ id = base+'-'+n; n++; }
  return id;
}

function getProduct(id){return PRODUCTS.find(p=>p.id===id);}
function getCategory(id){return CATEGORIES.find(c=>c.id===id);}
function categoryBrands(catId){ return [...new Set(PRODUCTS.filter(p=>p.category===catId).map(p=>p.brand))]; }

const PROMO_CODES = {
  'SMOKE20': {discount:0.2, label:'-20% на угли', appliesTo:'coal', expiry:'20.09'}
};

// Магазин работает только на самовывоз: онлайн-оплаты и доставки нет, товар
// можно отложить через приложение и забрать/оплатить на месте.
const STORE_INFO = {
  name: BRAND_NAME,
  address: 'ул. Тверская, 24, стр. 1',
  hours: 'Ежедневно, 12:00–23:00',
  phone: '+7 999 000-00-00',
  holdHours: 24,
};

// Статусы брони: reserved (отложен, ждёт в магазине) → done (забран) / cancelled (отменён).
const ORDERS = [
  {id:'10482', date:'13 сентября', itemsCount:3, total:1750, status:'reserved',
    items:[{productId:'darkside-topgum', qty:1, price:1590}, {productId:'coal-cocobrico-24', qty:2, price:480}],
    address:STORE_INFO.address, eta:'заберите сегодня до 23:00'},
  {id:'10365', date:'2 сентября', itemsCount:2, total:1180, status:'done',
    items:[{productId:'bonche-chocolate', qty:1, price:820}, {productId:'acc-tongs', qty:1, price:360}],
    address:STORE_INFO.address, eta:'забрано 2 сентября'},
  {id:'10201', date:'21 августа', itemsCount:1, total:450, status:'cancelled',
    items:[{productId:'coal-cocobrico-24', qty:1, price:450}],
    address:STORE_INFO.address, eta:'—'},
];
function getOrder(id){return ORDERS.find(o=>o.id===id);}

const PROMOTIONS = [
  {title:'-20% на все угли', desc:'по промокоду SMOKE20 · до 20 сентября'},
  {title:'2 чаши по цене 1', desc:'при заказе от 3 000 ₽ · весь сентябрь'},
];

const RECENT_SEARCHES = ['Dark Side Top Gum', 'Угли кокосовые', 'Tangiers'];

const ADDRESSES = [
  {id:'a1', label:'Дом', address:'ул. Тверская, 24, кв. 56', comment:'Домофон 56К · этаж 4', isDefault:true},
  {id:'a2', label:'Работа', address:'Пресненская наб., 8, офис 312', comment:'', isDefault:false},
];

const PROFILE_USER = {name:'Ринат М.', phone:'+7 999 123-45-67', email:''};

const NOTIFICATIONS = [
  {icon:'check', title:'Товар готов к выдаче', text:'Бронь №1244 ждёт вас в магазине', time:'10.05', unread:true},
  {icon:'gift', title:'Скидка 20% на Dark Side', text:'Любимые вкусы по выгодной цене', time:'08.05', unread:true},
  {icon:'wheel', title:'Бонусы начислены', text:'+250 баллов за покупку', time:'05.05', unread:false},
  {icon:'box', title:'Новинки в каталоге', text:'Поступление табаков Tangiers', time:'02.05', unread:false},
  {icon:'check', title:'Время забрать бронь', text:'Заказ №1242 готов к выдаче', time:'28.04', unread:false},
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

/* ---------- колесо фортуны ----------
   Состав призов и их веса в реальном проекте отдаёт бэкенд (probability logic
   не должна жить во фронтенде) — здесь это заглушка, инкапсулированная в
   WheelService (см. js/services.js), а не разбросанная по обработчикам кликов. */
const WHEEL_PRIZES = [
  {label:'−5%', type:'promo', code:'WHEEL5', discount:0.05, title:'Промокод −5%', color:'#F1F2F4'},
  {label:'+100', type:'bonus', value:100, title:'+100 бонусов', color:'#F52B32'},
  {label:'−10%', type:'promo', code:'WHEEL10', discount:0.10, title:'Промокод −10%', color:'#F1F2F4'},
  {label:'+200', type:'bonus', value:200, title:'+200 бонусов', color:'#F52B32'},
  {label:'+150', type:'bonus', value:150, title:'+150 бонусов', color:'#F1F2F4'},
  {label:'+50', type:'bonus', value:50, title:'+50 бонусов', color:'#F52B32'},
  {label:'−15%', type:'promo', code:'WHEEL15', discount:0.15, title:'Промокод −15%', color:'#F1F2F4'},
  {label:'↻', type:'again', title:'Попробуйте ещё раз', color:'#F52B32'},
];
const WHEEL_WEIGHTS = [15, 12, 8, 8, 12, 18, 5, 22];
