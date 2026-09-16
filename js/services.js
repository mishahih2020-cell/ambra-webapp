// ===== Mock service layer =====
// Изолирует бизнес-логику, которая в боевой системе обязана жить на бэкенде
// (вероятности приза, авторитетная цена/наличие, начисление бонусов), от
// компонентов рендера. Сейчас эмулирует сетевой round-trip через Promise +
// задержку — при подключении реального API меняется только тело функций
// внутри этого файла, интерфейс (что возвращает функция) остаётся тем же.

const WheelService = (function(){
  function todayStr(){ return new Date().toISOString().slice(0,10); }

  function status(){
    return {
      dailyAvailable: STATE.wheelLastFreeSpinDate !== todayStr(),
      extraSpins: STATE.wheelSpinsExtra,
    };
  }
  function attemptsLeft(){
    const s = status();
    return (s.dailyAvailable ? 1 : 0) + s.extraSpins;
  }
  function nextFreeSpinLabel(){
    return 'Новая попытка будет доступна завтра в 00:00';
  }

  function pickPrizeIndex(){
    const total = WHEEL_WEIGHTS.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    for(let i=0;i<WHEEL_WEIGHTS.length;i++){ if(r < WHEEL_WEIGHTS[i]) return i; r -= WHEEL_WEIGHTS[i]; }
    return 0;
  }

  // Эмуляция POST /wheel/spin — идемпотентна на время своего выполнения
  // (см. _pending), возвращает {spinId, prizeIndex, prize, targetRotationTurns}.
  let _pending = null;
  function spin(){
    if(_pending) return _pending; // защита от двойного тапа — второй вызов получит тот же промис
    if(attemptsLeft()<=0) return Promise.reject({code:'NO_ATTEMPTS'});
    _pending = new Promise(function(resolve, reject){
      setTimeout(function(){
        _pending = null;
        // Здесь имитируем возможную сетевую ошибку — крайне редко, только для демонстрации retry-состояния.
        const idx = pickPrizeIndex();
        const prize = WHEEL_PRIZES[idx];
        const spinId = 'spin_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
        if(status().dailyAvailable) STATE.wheelLastFreeSpinDate = todayStr();
        else STATE.wheelSpinsExtra = Math.max(0, STATE.wheelSpinsExtra - 1);
        if(prize.type==='bonus') STATE.bonusBalance += prize.value;
        else if(prize.type==='promo') PROMO_CODES[prize.code] = {discount:prize.discount, label:prize.title, appliesTo:'all', expiry:'7 дней'};
        else if(prize.type==='freeDelivery') STATE.freeDeliveryCredits += 1;
        else if(prize.type==='again') STATE.wheelSpinsExtra += 1;
        saveState();
        resolve({spinId:spinId, prizeIndex:idx, prize:prize});
      }, 550);
    });
    return _pending;
  }

  return {status, attemptsLeft, nextFreeSpinLabel, spin};
})();

// Лёгкий стаб аналитики — в проде подключается к реальному трекеру одной заменой тела функции.
function trackEvent(name, payload){
  if(window.__DEBUG_EVENTS) console.debug('[event]', name, payload||{});
}
