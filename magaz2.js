(function(){
  var CONFIG = {
    bg:{
      title:'фоны профиля',
      price:75,
      custom:90,
      hint:'клик — выбрать фон профиля · повторный клик — снять · можно включить множественный выбор',
      placeholder:'Вставь ссылку на фон профиля'
    },
    plash:{
      title:'плашки',
      price:50,
      custom:60,
      hint:'клик — выбрать плашку · повторный клик — снять · при множественном режиме можно набрать несколько',
      placeholder:'Вставь ссылку на фон плашки'
    },
    aplash:{
      title:'анимированные плашки',
      price:70,
      custom:90,
      hint:'клик — выбрать анимированную плашку · повторный клик — снять',
      placeholder:'Вставь ссылку на анимированную плашку'
    },
    ls:{
      title:'фоны личных страниц',
      price:100,
      custom:120,
      hint:'клик — выбрать фон лс · повторный клик — снять · предпросмотр стоит слева под профилем',
      placeholder:'Вставь ссылку на фон личной страницы'
    },
    gift:{
      title:'подарки',
      price:30,
      custom:60,
      hint:'клик — выбрать подарок · повторный клик — снять · по умолчанию подпись сердечко',
      placeholder:'Вставь ссылку на подарок'
    }
  };

  var state = {
    tab:'bg',
    multi:{
      bg:false,
      plash:false,
      ls:false,
      gift:false
    },
    selected:{
      bg:[],
      plash:[],
      ls:[],
      gift:[]
    },
    preview:{
      bg:'',
      plash:'',
      ls:''
    }
  };

  var bigImage = document.getElementById('bigImage');
  var plImage = document.getElementById('plImage');
  var plMainText = document.getElementById('plMainText');
  var plSubText = document.getElementById('plSubText');
  var lsBgImg = document.getElementById('magaz4LsBgImg');
  var giftPreview = document.getElementById('magaz4GiftPreview');

  var metaTitle = document.getElementById('magaz4MetaTitle');
  var metaPrice = document.getElementById('magaz4MetaPrice');
  var hint = document.getElementById('magaz4Hint');
  var customInput = document.getElementById('magaz4CustomInput');
  var multiBtn = document.getElementById('magaz4MultiBtn');
  var output = document.getElementById('magaz4Output');

  var plashTopInput = document.getElementById('magaz4PlashTop');
  var plashBottomInput = document.getElementById('magaz4PlashBottom');
  var giftTextInput = document.getElementById('magaz4GiftText');

  var defaultPreview = {
    bg: bigImage.getAttribute('src') || '',
    plash: parseBg(plImage.style.backgroundImage || ''),
    ls: lsBgImg.getAttribute('src') || ''
  };

  state.preview.bg = defaultPreview.bg;
  state.preview.plash = defaultPreview.plash;
  state.preview.ls = defaultPreview.ls;

  function escHtml(str){
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function parseBg(value){
    var m = String(value || '').match(/url\((['"]?)(.*?)\1\)/);
    return m ? m[2] : '';
  }

  function getGroup(tab){
    return tab === 'aplash' ? 'plash' : tab;
  }

  function getArray(group){
    return state.selected[group] || [];
  }

  function getPrice(item){
    if(item.group === 'gift'){
      return item.custom ? CONFIG.gift.custom : CONFIG.gift.price;
    }

    if(item.group === 'plash'){
      if(item.variant === 'aplash'){
        return item.custom ? CONFIG.aplash.custom : CONFIG.aplash.price;
      }
      return item.custom ? CONFIG.plash.custom : CONFIG.plash.price;
    }

    if(item.group === 'bg'){
      return item.custom ? CONFIG.bg.custom : CONFIG.bg.price;
    }

    if(item.group === 'ls'){
      return item.custom ? CONFIG.ls.custom : CONFIG.ls.price;
    }

    return 0;
  }

  function getThumbTarget(node){
    while(node && node !== document){
      if(node.className && typeof node.className === 'string' && node.className.indexOf('magaz4__thumb') !== -1){
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function findSelectedIndex(group, id){
    var arr = getArray(group);
    var i;
    for(i = 0; i < arr.length; i++){
      if(arr[i].id === id){
        return i;
      }
    }
    return -1;
  }

  function clearGroup(group){
    state.selected[group] = [];

    if(group === 'bg'){
      state.preview.bg = defaultPreview.bg;
      bigImage.src = defaultPreview.bg;
    }else if(group === 'plash'){
      state.preview.plash = defaultPreview.plash;
      plImage.style.backgroundImage = 'url(' + defaultPreview.plash + ')';
    }else if(group === 'ls'){
      state.preview.ls = defaultPreview.ls;
      lsBgImg.src = defaultPreview.ls;
    }
  }

  function syncPreview(group){
    var arr = getArray(group);
    var last = arr.length ? arr[arr.length - 1] : null;

    if(group === 'bg'){
      state.preview.bg = last ? last.url : defaultPreview.bg;
      bigImage.src = state.preview.bg;
    }else if(group === 'plash'){
      state.preview.plash = last ? last.url : defaultPreview.plash;
      plImage.style.backgroundImage = 'url(' + state.preview.plash + ')';
    }else if(group === 'ls'){
      state.preview.ls = last ? last.url : defaultPreview.ls;
      lsBgImg.src = state.preview.ls;
    }
  }

  function updatePlashText(){
    var top = plashTopInput.value || 'the crow';
    var bottom = plashBottomInput.value || '';

    plMainText.textContent = top;
    plSubText.textContent = bottom;

    if(bottom){
      plSubText.style.display = 'block';
    }else{
      plSubText.style.display = 'none';
    }
  }

  function renderGiftPreview(){
    var arr = getArray('gift');
    var i, html = '';
    var text = giftTextInput.value || '♥';

    for(i = 0; i < arr.length; i++){
      html += '<div class="char-tip"><img src="' + escHtml(arr[i].url) + '" alt=""><span>' + escHtml(text) + '</span></div>';
    }

    giftPreview.innerHTML = html;
  }

  function markActive(){
    var thumbs = document.querySelectorAll('.magaz4__thumb');
    var i, thumb, kind, group, active;

    for(i = 0; i < thumbs.length; i++){
      thumb = thumbs[i];
      kind = thumb.getAttribute('data-kind');
      group = getGroup(kind);
      active = findSelectedIndex(group, thumb.getAttribute('data-id')) !== -1;
      thumb.className = thumb.className.replace(/\s?is-active/g,'');

      if(active){
        thumb.className += ' is-active';
      }
    }
  }

  function getItemFromThumb(thumb){
    var kind = thumb.getAttribute('data-kind');
    return {
      id: thumb.getAttribute('data-id'),
      group: getGroup(kind),
      variant: kind,
      url: thumb.getAttribute('data-url'),
      custom: thumb.getAttribute('data-custom') === '1'
    };
  }

  function toggleItem(thumb){
    var item = getItemFromThumb(thumb);
    var arr = getArray(item.group);
    var idx = findSelectedIndex(item.group, item.id);

    if(idx !== -1){
      arr.splice(idx, 1);
      syncPreview(item.group);
    }else{
      if(!state.multi[item.group]){
        clearGroup(item.group);
        arr = getArray(item.group);
      }
      arr.push(item);
      syncPreview(item.group);
    }

    markActive();
    renderGiftPreview();
    updateAllOutputs();
  }

  function addCustomThumb(kind, url){
    var panelId, panel, cls, id, button, img;

    if(kind === 'bg'){
      panelId = 'magaz4BgList';
      cls = 'magaz4__thumb magaz4__thumb--bg is-custom';
    }else if(kind === 'plash'){
      panelId = 'magaz4PlashList';
      cls = 'magaz4__thumb magaz4__thumb--plash is-custom';
    }else if(kind === 'aplash'){
      panelId = 'magaz4AplashList';
      cls = 'magaz4__thumb magaz4__thumb--plash is-custom';
    }else if(kind === 'ls'){
      panelId = 'magaz4LsList';
      cls = 'magaz4__thumb magaz4__thumb--ls is-custom';
    }else{
      panelId = 'magaz4GiftList';
      cls = 'magaz4__thumb magaz4__thumb--gift is-custom';
    }

    panel = document.getElementById(panelId);
    id = 'custom-' + kind + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000);

    button = document.createElement('button');
    button.type = 'button';
    button.className = cls;
    button.setAttribute('data-kind', kind);
    button.setAttribute('data-id', id);
    button.setAttribute('data-url', url);
    button.setAttribute('data-custom', '1');

    img = document.createElement('img');
    img.src = url;
    img.alt = '';
    button.appendChild(img);

    panel.insertBefore(button, panel.firstChild);
    return button;
  }

  function getBgCodes(){
    var arr = getArray('bg');
    var i, out = [];
    for(i = 0; i < arr.length; i++){
      out.push(arr[i].url);
    }
    return out.join('\n');
  }

  function getPlashCode(item){
    var top = escHtml(plashTopInput.value || 'the crow');
    var bottom = escHtml(plashBottomInput.value || '');

    if(bottom){
      return '<div class="pf-plash" style="background-image:url(' + item.url + ');"><span>' + top + '</span><span class="pf-plash__sub">' + bottom + '</span></div>';
    }

    return '<div class="pf-plash" style="background-image:url(' + item.url + ');"><span>' + top + '</span></div>';
  }

  function getPlashCodes(){
    var arr = getArray('plash');
    var i, out = [];
    for(i = 0; i < arr.length; i++){
      out.push(getPlashCode(arr[i]));
    }
    return out.join('\n');
  }

  function getLsCodes(){
    var arr = getArray('ls');
    var i, out = [];
    for(i = 0; i < arr.length; i++){
      out.push('<img class="fon" src="' + arr[i].url + '" alt="">');
    }
    return out.join('\n');
  }

  function getGiftCode(item){
    var text = escHtml(giftTextInput.value || '♥');
    return '<div class="char-tip"><img src="' + item.url + '" alt=""><span>' + text + '</span></div>';
  }

  function getGiftCodes(){
    var arr = getArray('gift');
    var i, out = [];
    for(i = 0; i < arr.length; i++){
      out.push(getGiftCode(arr[i]));
    }
    return out.join('\n');
  }

  function buildAllCodeText(){
    var parts = [];
    var bg = getBgCodes();
    var plash = getPlashCodes();
    var ls = getLsCodes();
    var gift = getGiftCodes();

    if(bg){
      parts.push('=== ФОН ПРОФИЛЯ ===\n' + bg);
    }

    if(plash){
      parts.push('=== ПЛАШКИ ===\n' + plash);
    }

    if(ls){
      parts.push('=== ФОНЫ ЛС ===\n' + ls);
    }

    if(gift){
      parts.push('=== ПОДАРКИ ===\n' + gift);
    }

    return parts.join('\n\n');
  }

  function updateOutput(){
    output.value = buildAllCodeText();
  }

  function updateTabMeta(){
    var cfg = CONFIG[state.tab];
    var group = getGroup(state.tab);
    var multiText = state.multi[group] ? 'выбрать несколько: вкл' : 'выбрать несколько: выкл';

    metaTitle.textContent = cfg.title;
    hint.textContent = cfg.hint;
    customInput.placeholder = cfg.placeholder;
    metaPrice.innerHTML = '<b>' + cfg.price + '$</b> / свой ' + cfg.custom + '$';

    multiBtn.textContent = multiText;
    multiBtn.className = multiBtn.className.replace(/\s?is-on/g,'');

    if(state.multi[group]){
      multiBtn.className += ' is-on';
    }
  }

  function updateSumAndOrder(){
    var sum = 0;
    var rows = [];
    var i;
    var groups = ['bg','plash','ls','gift'];

    for(i = 0; i < groups.length; i++){
      var arr = getArray(groups[i]);
      var j;
      for(j = 0; j < arr.length; j++){
        sum += getPrice(arr[j]);

        if(arr[j].group === 'bg'){
          rows.push('<div class="magaz4__list-row">фон профиля — ' + getPrice(arr[j]) + '$</div>');
        }else if(arr[j].group === 'ls'){
          rows.push('<div class="magaz4__list-row">фон лс — ' + getPrice(arr[j]) + '$</div>');
        }else if(arr[j].group === 'gift'){
          rows.push('<div class="magaz4__list-row">подарок — ' + getPrice(arr[j]) + '$</div>');
        }else if(arr[j].variant === 'aplash'){
          rows.push('<div class="magaz4__list-row">аним. плашка — ' + getPrice(arr[j]) + '$</div>');
        }else{
          rows.push('<div class="magaz4__list-row">плашка — ' + getPrice(arr[j]) + '$</div>');
        }
      }
    }

    document.getElementById('magaz4Sum').textContent = 'итого: ' + sum + '$';

    if(rows.length){
      document.getElementById('magaz4OrderList').innerHTML = rows.join('');
    }else{
      document.getElementById('magaz4OrderList').innerHTML = '<div class="magaz4__list-empty">пока ничего не выбрано</div>';
    }
  }

  function updateAllOutputs(){
    updateOutput();
    updateSumAndOrder();
  }

  function setCopied(el){
    if(!el){ return; }
    if(el.className.indexOf('is-copied') === -1){
      el.className += ' is-copied';
    }
    setTimeout(function(){
      el.className = el.className.replace(/\s?is-copied/g,'');
    }, 800);
  }

  function fallbackCopy(text){
    output.focus();
    output.select();
    try{
      document.execCommand('copy');
    }catch(e){}
  }

  function copyText(text, el){
    output.value = text || '';
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text || '').then(function(){
        setCopied(el);
      }, function(){
        fallbackCopy(text || '');
        setCopied(el);
      });
    }else{
      fallbackCopy(text || '');
      setCopied(el);
    }
  }

  function buildOrderText(){
    var lines = [];
    var groups = ['bg','plash','ls','gift'];
    var i, j;

    lines.push('Заявка на покупку оформления');
    lines.push('');

    for(i = 0; i < groups.length; i++){
      var arr = getArray(groups[i]);

      for(j = 0; j < arr.length; j++){
        if(arr[j].group === 'bg'){
          lines.push('Фон профиля: ' + arr[j].url + ' — ' + getPrice(arr[j]) + '$');
        }else if(arr[j].group === 'ls'){
          lines.push('Фон лс: ' + arr[j].url + ' — ' + getPrice(arr[j]) + '$');
        }else if(arr[j].group === 'gift'){
          lines.push('Подарок: ' + arr[j].url + ' — ' + getPrice(arr[j]) + '$');
        }else if(arr[j].variant === 'aplash'){
          lines.push('Аним. плашка: ' + arr[j].url + ' — ' + getPrice(arr[j]) + '$');
        }else{
          lines.push('Плашка: ' + arr[j].url + ' — ' + getPrice(arr[j]) + '$');
        }
      }
    }

    if(getArray('plash').length){
      lines.push('Текст плашки: ' + (plashTopInput.value || 'the crow') + ' / ' + (plashBottomInput.value || ''));
    }

    if(getArray('gift').length){
      lines.push('Текст подарка: ' + (giftTextInput.value || '♥'));
    }

    lines.push('');
    lines.push(document.getElementById('magaz4Sum').textContent.replace(/^итого:\s*/,'Итого: '));

    return lines.join('\n');
  }

  function setTab(tab){
    var tabs = document.querySelectorAll('.magaz4__tab');
    var panels = document.querySelectorAll('.magaz4__panel');
    var i;

    state.tab = tab;

    for(i = 0; i < tabs.length; i++){
      tabs[i].className = tabs[i].className.replace(/\s?is-active/g,'');
      if(tabs[i].getAttribute('data-tab') === tab){
        tabs[i].className += ' is-active';
      }
    }

    for(i = 0; i < panels.length; i++){
      panels[i].className = panels[i].className.replace(/\s?is-active/g,'');
      if(panels[i].getAttribute('data-panel') === tab){
        panels[i].className += ' is-active';
      }
    }

    updateTabMeta();
  }

  function applyCustom(){
    var val = String(customInput.value || '').replace(/^\s+|\s+$/g,'');
    var button;
    if(!val){ return; }

    button = addCustomThumb(state.tab, val);
    toggleItem(button);
    customInput.value = '';
  }

  function bindGalleries(){
    var wrap = document.getElementById('magaz4Wrap');

    wrap.onclick = function(e){
      var target = e.target || e.srcElement;
      var thumb = getThumbTarget(target);

      if(thumb){
        toggleItem(thumb);
        return;
      }
    };
  }

  function bindControls(){
    var tabs = document.querySelectorAll('.magaz4__tab');
    var i;

    for(i = 0; i < tabs.length; i++){
      tabs[i].onclick = function(){
        setTab(this.getAttribute('data-tab'));
      };
    }

    document.getElementById('magaz4ApplyBtn').onclick = applyCustom;

    customInput.onkeydown = function(e){
      e = e || window.event;
      if(e.keyCode === 13){
        applyCustom();
        return false;
      }
    };

    multiBtn.onclick = function(){
      var group = getGroup(state.tab);
      state.multi[group] = !state.multi[group];
      updateTabMeta();
    };

    plashTopInput.oninput = function(){
      updatePlashText();
      updateOutput();
    };

    plashBottomInput.oninput = function(){
      updatePlashText();
      updateOutput();
    };

    giftTextInput.oninput = function(){
      renderGiftPreview();
      updateOutput();
    };

    document.getElementById('copyBgBtn').onclick = function(){
      copyText(getBgCodes(), this);
    };

    document.getElementById('copyPlashBtn').onclick = function(){
      copyText(getPlashCodes(), this);
    };

    document.getElementById('copyLsBtn').onclick = function(){
      copyText(getLsCodes(), this);
    };

    document.getElementById('copyGiftBtn').onclick = function(){
      copyText(getGiftCodes(), this);
    };

    document.getElementById('copyAllBtn').onclick = function(){
      copyText(buildAllCodeText(), this);
    };

    document.getElementById('magaz4CopyOrderBtn').onclick = function(){
      copyText(buildOrderText(), this);
    };
  }

  updatePlashText();
  renderGiftPreview();
  markActive();
  updateAllOutputs();
  updateTabMeta();
  bindGalleries();
  bindControls();
  setTab('bg');
})();
