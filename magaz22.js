(function(){
  var root = document.getElementById('magaz4Wrap');
  if(!root){ return; }

  var PRICE_MAP = {
    bg:     { title:'Фон профиля', short:'фон профиля', price:75, custom:90 },
    plash:  { title:'Плашка', short:'плашка', price:50, custom:60 },
    aplash: { title:'Аним. плашка', short:'аним. плашка', price:70, custom:90 },
    ls:     { title:'Фон ЛС', short:'фон лс', price:100, custom:120 },
    gift:   { title:'Подарок', short:'подарок', price:30, custom:60 }
  };

  var TAB_INFO = {
    bg:     { title:'фоны профиля',        hint:'клик — выбрать · повторный клик — снять выбор · справа можно включить множественный режим', placeholder:'Вставь ссылку на фон профиля' },
    plash:  { title:'плашки',              hint:'клик — выбрать плашку · повторный клик — снять выбор', placeholder:'Вставь ссылку на фон плашки' },
    aplash: { title:'аним. плашки',        hint:'клик — выбрать аним. плашку · повторный клик — снять выбор', placeholder:'Вставь ссылку на аним. плашку' },
    ls:     { title:'фоны лс',             hint:'клик — выбрать фон лс · повторный клик — снять выбор', placeholder:'Вставь ссылку на фон лс' },
    gift:   { title:'подарки',             hint:'клик — выбрать подарок · повторный клик — снять выбор', placeholder:'Вставь ссылку на подарок' }
  };

  var GALLERY_IDS = {
    bg:'magaz4BgList',
    plash:'magaz4PlashList',
    aplash:'magaz4AplashList',
    ls:'magaz4LsList',
    gift:'magaz4GiftList'
  };

  var state = {
    tab:'bg',
    multi:{ bg:false, plash:false, aplash:false, ls:false, gift:false },
    selected:{ bg:[], plash:[], aplash:[], ls:[], gift:[] },
    counter:0
  };

  var defaults = {
    bigImage:getImgSrc('bigImage'),
    lsBg:getImgSrc('magaz4LsBgImg'),
    plashBg:getBgUrl(document.getElementById('plImage')),
    plashTop:getValue('magaz4PlashTop', 'the crow'),
    plashBottom:getValue('magaz4PlashBottom', 'bewails the sheep'),
    giftText:getValue('magaz4GiftText', '♥')
  };

  injectExtras();
  injectExtraStyles();

  var els = {
    bigImage:document.getElementById('bigImage'),
    lsBgImg:document.getElementById('magaz4LsBgImg'),
    plImage:document.getElementById('plImage'),
    plMainText:document.getElementById('plMainText'),
    plSubText:document.getElementById('plSubText'),
    giftPreview:document.getElementById('magaz4GiftPreview'),
    tabs:root.querySelectorAll('.magaz4__tab'),
    panels:root.querySelectorAll('.magaz4__panel'),
    metaTitle:document.getElementById('magaz4MetaTitle'),
    metaPrice:document.getElementById('magaz4MetaPrice'),
    hint:document.getElementById('magaz4Hint'),
    customInput:document.getElementById('magaz4CustomInput'),
    applyBtn:document.getElementById('magaz4ApplyBtn'),
    multiBtn:document.getElementById('magaz4MultiBtn'),
    plashTop:document.getElementById('magaz4PlashTop'),
    plashBottom:document.getElementById('magaz4PlashBottom'),
    giftText:document.getElementById('magaz4GiftText'),
    output:document.getElementById('magaz4Output'),
    orderList:document.getElementById('magaz4OrderList'),
    sum:document.getElementById('magaz4Sum'),
    copyBgBtn:document.getElementById('copyBgBtn'),
    copyPlashBtn:document.getElementById('copyPlashBtn'),
    copyLsBtn:document.getElementById('copyLsBtn'),
    copyGiftBtn:document.getElementById('copyGiftBtn'),
    copyAllBtn:document.getElementById('copyAllBtn'),
    copyOrderBtn:document.getElementById('magaz4CopyOrderBtn'),
    orderTarget:document.getElementById('magaz4OrderTarget'),
    clearBtn:document.getElementById('magaz4ClearBtn')
  };

  bindTabs();
  bindGalleries();
  bindControls();
  setTab('bg');
  syncAll();

  function injectExtras(){
    var orderBoxes = root.querySelectorAll('.magaz4__box');
    var orderBox = null;
    var i, title;

    for(i = 0; i < orderBoxes.length; i++){
      title = orderBoxes[i].querySelector('.magaz4__box-title');
      if(title && normalize(title.innerHTML).indexOf('заявка на покупку') !== -1){
        orderBox = orderBoxes[i];
        break;
      }
    }

    if(!orderBox){ return; }

    if(!document.getElementById('magaz4OrderTarget')){
      var extra = document.createElement('div');
      extra.className = 'magaz4__order-extra';
      extra.innerHTML = '' +
        '<input type="text" id="magaz4OrderTarget" class="magaz4__order-input" placeholder="Кому покупаете: имя или ссылка на профиль">' +
        '<div class="magaz4__radios" id="magaz4PlacementWrap">' +
          '<label class="magaz4__checkline"><input type="radio" name="magaz4Placement" value="profile" checked> <span>Ставим сразу в профиль</span></label>' +
          '<label class="magaz4__checkline"><input type="radio" name="magaz4Placement" value="page"> <span>Только на страницу</span></label>' +
        '</div>';
      orderBox.insertBefore(extra, orderBox.firstChild.nextSibling);
    }

    if(!document.getElementById('magaz4ClearBtn')){
      var copyBtn = document.getElementById('magaz4CopyOrderBtn');
      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'magaz4__btn magaz4__btn--clear';
      clearBtn.id = 'magaz4ClearBtn';
      clearBtn.innerHTML = 'очистить всё';
      if(copyBtn && copyBtn.parentNode){
        copyBtn.parentNode.insertBefore(clearBtn, copyBtn.nextSibling);
      }else{
        orderBox.appendChild(clearBtn);
      }
    }
  }

  function injectExtraStyles(){
    if(document.getElementById('magaz4ExtraJsStyles')){ return; }
    var style = document.createElement('style');
    style.id = 'magaz4ExtraJsStyles';
    style.type = 'text/css';
    style.innerHTML = '' +
      '.magaz4__order-extra{display:flex;flex-direction:column;gap:8px;margin:0 0 12px;}' +
      '.magaz4__order-input{width:100%;min-width:0;background:var(--pf-bg);color:var(--text);border:1px solid var(--bord);border-radius:6px;padding:8px 10px;font:400 11px/1.35 var(--main-font),Arial,sans-serif;}' +
      '.magaz4__radios{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:1px solid var(--bord);border-radius:6px;background:var(--pf-bg);}' +
      '.magaz4__checkline{display:flex;align-items:center;gap:8px;color:var(--sec-text);font:500 11px/1.25 var(--main-font),Arial,sans-serif;}' +
      '.magaz4__checkline input{accent-color:var(--accent);}' +
      '.magaz4__btn--clear{margin-top:8px;background:var(--pf-bg);color:var(--text);}' +
      '.magaz4__btn--clear:hover{background:var(--quote);}' +
      '.magaz4__list{display:flex;flex-direction:column;gap:6px;max-height:230px;overflow:auto;}' +
      '.magaz4__list-line{padding:7px 8px;border:1px solid var(--bord);border-radius:6px;background:var(--pf-bg);color:var(--text);font:400 11px/1.35 var(--main-font),Arial,sans-serif;word-break:break-word;}' +
      '.magaz4__list-line b{color:var(--accent2);}' +
      '.magaz4__thumb.is-active{outline:2px solid var(--accent);outline-offset:2px;}' +
      '.magaz4__thumb.is-copied::after{opacity:1;transform:translateY(0);}' +
      '.magaz4__thumb::after{content:"скопировано";position:absolute;top:6px;right:6px;z-index:3;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.94);color:var(--text);border:1px solid var(--bord);font:600 9px/1 var(--main-font),Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:0;transform:translateY(-4px);pointer-events:none;transition:.18s ease;}' +
      '.magaz4__copygrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}' +
      '@media (max-width:700px){.magaz4__copygrid{grid-template-columns:1fr;}}';
    (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
  }

  function bindTabs(){
    var i;
    for(i = 0; i < els.tabs.length; i++){
      els.tabs[i].onclick = function(){
        setTab(this.getAttribute('data-tab'));
      };
    }
  }

  function bindGalleries(){
    bindGallery('bg');
    bindGallery('plash');
    bindGallery('aplash');
    bindGallery('ls');
    bindGallery('gift');
  }

  function bindGallery(kind){
    var box = document.getElementById(GALLERY_IDS[kind]);
    if(!box){ return; }

    box.onclick = function(e){
      e = e || window.event;
      var target = getThumbTarget(e.target || e.srcElement);
      if(!target){ return; }
      toggleItemByThumb(target);
    };

    box.ondblclick = function(e){
      e = e || window.event;
      var target = getThumbTarget(e.target || e.srcElement);
      if(!target){ return false; }
      copyThumbCode(target);
      if(e.preventDefault){ e.preventDefault(); }
      return false;
    };
  }

  function bindControls(){
    if(els.applyBtn){
      els.applyBtn.onclick = function(){ applyCustom(); };
    }

    if(els.customInput){
      els.customInput.onkeydown = function(e){
        e = e || window.event;
        if((e.keyCode || e.which) === 13){
          applyCustom();
          return false;
        }
      };
    }

    if(els.multiBtn){
      els.multiBtn.onclick = function(){
        state.multi[state.tab] = !state.multi[state.tab];
        updateMultiButton();
      };
    }

    if(els.plashTop){
      els.plashTop.oninput = function(){ updatePlashPreview(); updateOutput(); };
    }
    if(els.plashBottom){
      els.plashBottom.oninput = function(){ updatePlashPreview(); updateOutput(); };
    }
    if(els.giftText){
      els.giftText.oninput = function(){ renderGiftPreview(); updateOutput(); };
    }

    if(els.orderTarget){
      els.orderTarget.oninput = function(){ updateOrder(); };
    }

    bindPlacementInputs();

    if(els.copyBgBtn){ els.copyBgBtn.onclick = function(){ copyText(buildCodeForKind('bg'), this); }; }
    if(els.copyPlashBtn){ els.copyPlashBtn.onclick = function(){ copyText(buildCodeForKind('plash'), this); }; }
    if(els.copyLsBtn){ els.copyLsBtn.onclick = function(){ copyText(buildCodeForKind('ls'), this); }; }
    if(els.copyGiftBtn){ els.copyGiftBtn.onclick = function(){ copyText(buildCodeForKind('gift'), this); }; }
    if(els.copyAllBtn){ els.copyAllBtn.onclick = function(){ copyText(buildAllCode(), this); }; }
    if(els.copyOrderBtn){ els.copyOrderBtn.onclick = function(){ copyText(buildOrderText(), this); }; }
    if(els.clearBtn){ els.clearBtn.onclick = function(){ clearAll(); }; }
  }

  function bindPlacementInputs(){
    var radios = document.getElementsByName('magaz4Placement');
    var i;
    for(i = 0; i < radios.length; i++){
      radios[i].onclick = updateOrder;
      radios[i].onchange = updateOrder;
    }
  }

  function setTab(tab){
    var i, panelTab;
    state.tab = tab;

    for(i = 0; i < els.tabs.length; i++){
      toggleClass(els.tabs[i], 'is-active', els.tabs[i].getAttribute('data-tab') === tab);
    }

    for(i = 0; i < els.panels.length; i++){
      panelTab = els.panels[i].getAttribute('data-panel');
      toggleClass(els.panels[i], 'is-active', panelTab === tab);
    }

    updateMeta();
    updateMultiButton();
  }

  function updateMeta(){
    var info = TAB_INFO[state.tab] || TAB_INFO.bg;
    var priceInfo = PRICE_MAP[state.tab] || PRICE_MAP.bg;
    if(els.metaTitle){ els.metaTitle.innerHTML = info.title; }
    if(els.hint){ els.hint.innerHTML = info.hint; }
    if(els.customInput){ els.customInput.setAttribute('placeholder', info.placeholder); }
    if(els.metaPrice){
      els.metaPrice.innerHTML = '<b>' + priceInfo.price + '$</b> / свой ' + priceInfo.custom + '$';
    }
  }

  function updateMultiButton(){
    if(!els.multiBtn){ return; }
    els.multiBtn.innerHTML = 'выбрать несколько: ' + (state.multi[state.tab] ? 'вкл' : 'выкл');
  }

  function applyCustom(){
    if(!els.customInput){ return; }
    var url = trim(els.customInput.value || '');
    var kind = state.tab;
    var box, id, html;
    if(!url){ return; }

    box = document.getElementById(GALLERY_IDS[kind]);
    id = kind + '-custom-' + (++state.counter);

    if(box){
      html = '' +
        '<button type="button" class="magaz4__thumb ' + getThumbClass(kind) + '" data-kind="' + kind + '" data-id="' + id + '" data-url="' + escAttr(url) + '" data-custom="1">' +
          '<img src="' + escAttr(url) + '" alt="">' +
        '</button>';
      box.insertAdjacentHTML('afterbegin', html);
    }

    setSelected(kind, { id:id, url:url, custom:true, kind:kind }, false);
    els.customInput.value = '';
  }

  function toggleItemByThumb(thumb){
    var kind = thumb.getAttribute('data-kind');
    var item = getItemFromThumb(thumb);
    var exists = hasSelected(kind, item.id);

    if(state.multi[kind]){
      if(exists){
        removeSelected(kind, item.id);
      }else{
        state.selected[kind].push(item);
      }
    }else{
      if(exists && state.selected[kind].length === 1){
        state.selected[kind] = [];
      }else{
        state.selected[kind] = [item];
      }
    }

    syncAll();
  }

  function setSelected(kind, item, append){
    if(state.multi[kind] || append){
      if(!hasSelected(kind, item.id)){
        state.selected[kind].push(item);
      }
    }else{
      state.selected[kind] = [item];
    }
    syncAll();
  }

  function removeSelected(kind, id){
    var src = state.selected[kind];
    var out = [];
    var i;
    for(i = 0; i < src.length; i++){
      if(src[i].id !== id){ out.push(src[i]); }
    }
    state.selected[kind] = out;
  }

  function hasSelected(kind, id){
    var arr = state.selected[kind];
    var i;
    for(i = 0; i < arr.length; i++){
      if(arr[i].id === id){ return true; }
    }
    return false;
  }

  function syncAll(){
    markActiveAll();
    updateProfilePreview();
    updateLsPreview();
    updatePlashPreview();
    renderGiftPreview();
    updateOutput();
    updateOrder();
  }

  function markActiveAll(){
    markActive('bg');
    markActive('plash');
    markActive('aplash');
    markActive('ls');
    markActive('gift');
  }

  function markActive(kind){
    var box = document.getElementById(GALLERY_IDS[kind]);
    var thumbs, i, id;
    if(!box){ return; }
    thumbs = box.querySelectorAll('.magaz4__thumb');
    for(i = 0; i < thumbs.length; i++){
      id = thumbs[i].getAttribute('data-id');
      toggleClass(thumbs[i], 'is-active', hasSelected(kind, id));
    }
  }

  function updateProfilePreview(){
    var item = getLastSelected('bg');
    if(!els.bigImage){ return; }
    els.bigImage.src = item ? item.url : defaults.bigImage;
  }

  function updateLsPreview(){
    var item = getLastSelected('ls');
    if(!els.lsBgImg){ return; }
    els.lsBgImg.src = item ? item.url : defaults.lsBg;
  }

  function updatePlashPreview(){
    var item = getLastSelected('aplash') || getLastSelected('plash');
    var top = getValue('magaz4PlashTop', defaults.plashTop);
    var bottom = getValue('magaz4PlashBottom', defaults.plashBottom);

    if(els.plImage){
      els.plImage.style.backgroundImage = 'url(' + (item ? item.url : defaults.plashBg) + ')';
    }
    if(els.plMainText){ els.plMainText.innerHTML = top; }
    if(els.plSubText){
      els.plSubText.innerHTML = bottom;
      els.plSubText.style.display = bottom ? 'block' : 'none';
    }
  }

  function renderGiftPreview(){
    if(!els.giftPreview){ return; }
    var html = '';
    var gifts = state.selected.gift;
    var text = getValue('magaz4GiftText', defaults.giftText) || '♥';
    var i;

    for(i = 0; i < gifts.length; i++){
      html += '<div class="char-tip"><img src="' + escAttr(gifts[i].url) + '" alt=""><span>' + escHtml(text) + '</span></div>';
    }

    els.giftPreview.innerHTML = html;
  }

  function buildCodeForKind(kind){
    var arr, i, out = [];

    if(kind === 'bg'){
      arr = state.selected.bg;
      for(i = 0; i < arr.length; i++){
        out.push(arr[i].url);
      }
      return out.join('\n');
    }

    if(kind === 'plash'){
      arr = state.selected.plash;
      for(i = 0; i < arr.length; i++){
        out.push(getPlashCode(arr[i].url));
      }
      arr = state.selected.aplash;
      for(i = 0; i < arr.length; i++){
        out.push(getPlashCode(arr[i].url));
      }
      return out.join('\n\n');
    }

    if(kind === 'ls'){
      arr = state.selected.ls;
      for(i = 0; i < arr.length; i++){
        out.push('<img class="fon" src="' + escAttr(arr[i].url) + '" alt="">');
      }
      return out.join('\n');
    }

    if(kind === 'gift'){
      arr = state.selected.gift;
      for(i = 0; i < arr.length; i++){
        out.push(getGiftCode(arr[i].url));
      }
      return out.join('\n');
    }

    return '';
  }

  function buildAllCode(){
    var parts = [];
    var bg = buildCodeForKind('bg');
    var pl = buildCodeForKind('plash');
    var ls = buildCodeForKind('ls');
    var gift = buildCodeForKind('gift');

    if(bg){ parts.push('[Фон профиля]\n' + bg); }
    if(pl){ parts.push('[Плашки]\n' + pl); }
    if(ls){ parts.push('[Фон ЛС]\n' + ls); }
    if(gift){ parts.push('[Подарки]\n' + gift); }

    return parts.join('\n\n');
  }

  function getPlashCode(url){
    var top = escHtml(getValue('magaz4PlashTop', defaults.plashTop));
    var bottom = escHtml(getValue('magaz4PlashBottom', defaults.plashBottom));
    if(bottom){
      return '<div class="pf-plash" style="background-image:url(' + escAttr(url) + ');"><span>' + top + '</span><span class="pf-plash__sub">' + bottom + '</span></div>';
    }
    return '<div class="pf-plash" style="background-image:url(' + escAttr(url) + ');"><span>' + top + '</span></div>';
  }

  function getGiftCode(url){
    var text = escHtml(getValue('magaz4GiftText', defaults.giftText) || '♥');
    return '<div class="char-tip"><img src="' + escAttr(url) + '" alt=""><span>' + text + '</span></div>';
  }

  function updateOutput(){
    if(els.output){
      els.output.value = buildAllCode();
    }
  }

  function updateOrder(){
    if(!els.orderList || !els.sum){ return; }
    var lines = [];
    var total = 0;
    var i, arr, item, price;
    var target = trim(els.orderTarget ? els.orderTarget.value : '');
    var placement = getPlacementText();

    if(target){
      lines.push('<div class="magaz4__list-line"><b>Кому покупаете:</b> ' + escHtml(target) + '</div>');
    }

    if(placement){
      lines.push('<div class="magaz4__list-line"><b>Куда ставим:</b> ' + escHtml(placement) + '</div>');
    }

    arr = state.selected.bg;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('bg', item.custom);
      total += price;
      lines.push('<div class="magaz4__list-line"><b>Фон профиля</b> — ' + price + '$<br>' + escHtml(item.url) + '</div>');
    }

    arr = state.selected.plash;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('plash', item.custom);
      total += price;
      lines.push('<div class="magaz4__list-line"><b>Плашка</b> — ' + price + '$<br>' + escHtml(item.url) + '<br>Текст: ' + escHtml(getValue('magaz4PlashTop', defaults.plashTop)) + ' / ' + escHtml(getValue('magaz4PlashBottom', defaults.plashBottom)) + '</div>');
    }

    arr = state.selected.aplash;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('aplash', item.custom);
      total += price;
      lines.push('<div class="magaz4__list-line"><b>Аним. плашка</b> — ' + price + '$<br>' + escHtml(item.url) + '<br>Текст: ' + escHtml(getValue('magaz4PlashTop', defaults.plashTop)) + ' / ' + escHtml(getValue('magaz4PlashBottom', defaults.plashBottom)) + '</div>');
    }

    arr = state.selected.ls;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('ls', item.custom);
      total += price;
      lines.push('<div class="magaz4__list-line"><b>Фон ЛС</b> — ' + price + '$<br>' + escHtml(item.url) + '</div>');
    }

    arr = state.selected.gift;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('gift', item.custom);
      total += price;
      lines.push('<div class="magaz4__list-line"><b>Подарок</b> — ' + price + '$<br>' + escHtml(item.url) + '<br>Текст: ' + escHtml(getValue('magaz4GiftText', defaults.giftText) || '♥') + '</div>');
    }

    if(!lines.length){
      lines.push('<div class="magaz4__list-line">Пока ничего не выбрано.</div>');
    }

    els.orderList.innerHTML = lines.join('');
    els.sum.innerHTML = 'итого: ' + total + '$';
  }

  function buildOrderText(){
    var lines = [];
    var total = 0;
    var i, arr, item, price;
    var target = trim(els.orderTarget ? els.orderTarget.value : '');
    var placement = getPlacementText();

    lines.push('Заявка на покупку оформления');

    if(target){ lines.push('Кому покупаете: ' + target); }
    if(placement){ lines.push('Куда ставим: ' + placement); }

    arr = state.selected.bg;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('bg', item.custom);
      total += price;
      lines.push('Фон профиля — ' + price + '$');
      lines.push(item.url);
    }

    arr = state.selected.plash;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('plash', item.custom);
      total += price;
      lines.push('Плашка — ' + price + '$');
      lines.push(item.url);
      lines.push('Текст: ' + getValue('magaz4PlashTop', defaults.plashTop) + ' / ' + getValue('magaz4PlashBottom', defaults.plashBottom));
    }

    arr = state.selected.aplash;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('aplash', item.custom);
      total += price;
      lines.push('Аним. плашка — ' + price + '$');
      lines.push(item.url);
      lines.push('Текст: ' + getValue('magaz4PlashTop', defaults.plashTop) + ' / ' + getValue('magaz4PlashBottom', defaults.plashBottom));
    }

    arr = state.selected.ls;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('ls', item.custom);
      total += price;
      lines.push('Фон ЛС — ' + price + '$');
      lines.push(item.url);
    }

    arr = state.selected.gift;
    for(i = 0; i < arr.length; i++){
      item = arr[i];
      price = getItemPrice('gift', item.custom);
      total += price;
      lines.push('Подарок — ' + price + '$');
      lines.push(item.url);
      lines.push('Текст: ' + (getValue('magaz4GiftText', defaults.giftText) || '♥'));
    }

    lines.push('Итого: ' + total + '$');
    return lines.join('\n');
  }

  function getPlacementText(){
    var radios = document.getElementsByName('magaz4Placement');
    var i;
    for(i = 0; i < radios.length; i++){
      if(radios[i].checked){
        return radios[i].value === 'profile' ? 'Ставим сразу в профиль' : 'Только на страницу';
      }
    }
    return '';
  }

  function getItemPrice(kind, isCustom){
    var cfg = PRICE_MAP[kind];
    if(!cfg){ return 0; }
    return isCustom ? cfg.custom : cfg.price;
  }

  function copyThumbCode(thumb){
    var item = getItemFromThumb(thumb);
    var kind = thumb.getAttribute('data-kind');
    var text = '';

    if(kind === 'bg'){
      text = item.url;
    }else if(kind === 'plash' || kind === 'aplash'){
      text = getPlashCode(item.url);
    }else if(kind === 'ls'){
      text = '<img class="fon" src="' + escAttr(item.url) + '" alt="">';
    }else if(kind === 'gift'){
      text = getGiftCode(item.url);
    }

    copyText(text, thumb);
  }

  function clearAll(){
    state.selected.bg = [];
    state.selected.plash = [];
    state.selected.aplash = [];
    state.selected.ls = [];
    state.selected.gift = [];
    state.multi.bg = false;
    state.multi.plash = false;
    state.multi.aplash = false;
    state.multi.ls = false;
    state.multi.gift = false;

    setValue('magaz4PlashTop', defaults.plashTop);
    setValue('magaz4PlashBottom', defaults.plashBottom);
    setValue('magaz4GiftText', defaults.giftText);
    if(els.customInput){ els.customInput.value = ''; }
    if(els.orderTarget){ els.orderTarget.value = ''; }

    var radios = document.getElementsByName('magaz4Placement');
    var i;
    for(i = 0; i < radios.length; i++){
      radios[i].checked = radios[i].value === 'profile';
    }

    removeCustomThumbs();
    syncAll();
    updateMultiButton();
  }

  function removeCustomThumbs(){
    var thumbs = root.querySelectorAll('.magaz4__thumb[data-custom="1"]');
    var i;
    for(i = thumbs.length - 1; i >= 0; i--){
      if(thumbs[i] && thumbs[i].parentNode){
        thumbs[i].parentNode.removeChild(thumbs[i]);
      }
    }
  }

  function getThumbTarget(node){
    while(node && node !== document){
      if(hasClass(node, 'magaz4__thumb')){ return node; }
      node = node.parentNode;
    }
    return null;
  }

  function getItemFromThumb(thumb){
    return {
      id:thumb.getAttribute('data-id') || ('item-' + (++state.counter)),
      url:thumb.getAttribute('data-url') || '',
      custom:thumb.getAttribute('data-custom') === '1',
      kind:thumb.getAttribute('data-kind') || ''
    };
  }

  function getLastSelected(kind){
    var arr = state.selected[kind];
    if(!arr || !arr.length){ return null; }
    return arr[arr.length - 1];
  }

  function getThumbClass(kind){
    if(kind === 'bg'){ return 'magaz4__thumb--bg'; }
    if(kind === 'plash' || kind === 'aplash'){ return 'magaz4__thumb--plash'; }
    if(kind === 'ls'){ return 'magaz4__thumb--ls'; }
    return 'magaz4__thumb--gift';
  }

  function copyText(text, btn){
    text = String(text || '');
    if(els.output){ els.output.value = text; }
    if(!text){ return; }

    if(window.navigator && navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){
        flashCopied(btn);
      }, function(){
        fallbackCopy(text, btn);
      });
    }else{
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn){
    if(!els.output){ return; }
    els.output.focus();
    els.output.select();
    try{ document.execCommand('copy'); }catch(err){}
    flashCopied(btn);
  }

  function flashCopied(node){
    if(!node){ return; }
    toggleClass(node, 'is-copied', true);
    window.setTimeout(function(){
      toggleClass(node, 'is-copied', false);
    }, 900);
  }

  function getImgSrc(id){
    var el = document.getElementById(id);
    return el ? (el.getAttribute('src') || '') : '';
  }

  function getBgUrl(el){
    if(!el){ return ''; }
    var s = '';
    if(el.style && el.style.backgroundImage){ s = el.style.backgroundImage; }
    if(!s){ s = el.getAttribute('style') || ''; }
    var m = String(s).match(/url\((['"]?)(.*?)\1\)/);
    return m ? m[2] : '';
  }

  function getValue(id, fallback){
    var el = document.getElementById(id);
    if(!el){ return fallback || ''; }
    return typeof el.value === 'string' ? el.value : (fallback || '');
  }

  function setValue(id, value){
    var el = document.getElementById(id);
    if(el){ el.value = value; }
  }

  function escHtml(str){
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str){
    return escHtml(str).replace(/'/g, '&#39;');
  }

  function trim(str){
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  function normalize(str){
    return trim(String(str || '').toLowerCase());
  }

  function hasClass(el, cls){
    return (' ' + (el.className || '') + ' ').indexOf(' ' + cls + ' ') !== -1;
  }

  function toggleClass(el, cls, flag){
    if(!el){ return; }
    var cn = ' ' + (el.className || '') + ' ';
    var has = cn.indexOf(' ' + cls + ' ') !== -1;
    if(flag && !has){
      el.className = trim((el.className || '') + ' ' + cls);
    }
    if(!flag && has){
      el.className = trim(cn.replace(' ' + cls + ' ', ' '));
    }
  }
})();
