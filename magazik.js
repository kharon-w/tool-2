(function(){
  var root = document.getElementById('magazCompact');
  if(!root) return;

  var previewProfile = root.querySelector('#bigImage');
  var previewPlash = root.querySelector('#plImage');
  var previewPage = root.querySelector('#lzPreview');
  var output = root.querySelector('#magcCurrentCode');
  var statusLine = root.querySelector('#magcStatus');
  var buyCode = root.querySelector('#magcBuyCode');

  function trim(value){
    return (value || '').replace(/^\\s+|\\s+$/g,'');
  }

  function getBackgroundUrl(el){
    if(!el) return '';
    var bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage || '';
    var match = bg.match(/^url\\((['"]?)(.*?)\\1\\)$/);
    return match ? match[2] : '';
  }

  function setStatus(text){
    if(statusLine) statusLine.textContent = text;
  }

  function copyText(text){
    text = String(text || '');
    if(!text) return;

    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text);
      return;
    }

    var area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }

  var state = {
    activeTab: 'profile-bg',
    currentKind: 'profile-bg',
    profileBg: previewProfile ? previewProfile.getAttribute('src') : '',
    plash: getBackgroundUrl(previewPlash),
    pageBg: getBackgroundUrl(previewPage)
  };

  function makeCode(kind, url){
    url = trim(url);
    if(!url) return '';

    if(kind === 'profile-bg'){
      return '<img src="' + url + '">';
    }

    if(kind === 'page-bg'){
      return '<img class="fon" src="' + url + '">';
    }

    if(kind === 'plash'){
      var html = previewPlash ? previewPlash.innerHTML.replace(/^\\s+|\\s+$/g,'') : 'the crow <span class="pf-plash__sub">bewails the sheep</span>';
      return '<div class="pf-plash" style="background: url(' + url + ')">' + html + '</div>';
    }

    return '';
  }

  function updateOutput(kind){
    if(kind) state.currentKind = kind;
    if(output) output.value = makeCode(state.currentKind, state[state.currentKind]);
  }

  function setActiveThumb(panel, url){
    if(!panel) return;
    panel.querySelectorAll('.magc-thumb').forEach(function(img){
      img.classList.toggle('is-active', img.getAttribute('src') === url);
    });
  }

  function applyKind(kind, url, panel){
    url = trim(url);
    if(!url) return;

    if(kind === 'profile-bg' && previewProfile){
      state.profileBg = url;
      previewProfile.src = url;
    }

    if(kind === 'plash' && previewPlash){
      state.plash = url;
      previewPlash.style.backgroundImage = 'url("' + url + '")';
    }

    if(kind === 'page-bg' && previewPage){
      state.pageBg = url;
      previewPage.style.backgroundImage = 'url("' + url + '")';
    }

    if(panel) setActiveThumb(panel, url);

    updateOutput(kind);
    setStatus('код обновлён');
  }

  function switchTab(tabName){
    state.activeTab = tabName;

    root.querySelectorAll('.magc-tab').forEach(function(btn){
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabName);
    });

    root.querySelectorAll('.magc-panel').forEach(function(panel){
      panel.classList.toggle('is-active', panel.getAttribute('data-tab-panel') === tabName);
    });

    var currentPanel = root.querySelector('.magc-panel[data-tab-panel="' + tabName + '"]');
    if(currentPanel){
      updateOutput(currentPanel.getAttribute('data-kind'));
    }
  }

  root.addEventListener('click', function(e){
    var tabBtn = e.target.closest('.magc-tab');
    if(tabBtn){
      switchTab(tabBtn.getAttribute('data-tab'));
      return;
    }

    var thumb = e.target.closest('.magc-thumb');
    if(thumb){
      var thumbPanel = thumb.closest('.magc-panel');
      if(!thumbPanel) return;
      applyKind(thumbPanel.getAttribute('data-kind'), thumb.getAttribute('src'), thumbPanel);
      return;
    }

    var customBtn = e.target.closest('[data-apply-custom]');
    if(customBtn){
      var customPanel = customBtn.closest('.magc-panel');
      if(!customPanel) return;
      var input = customPanel.querySelector('.magc-input input');
      if(!input) return;
      applyKind(customPanel.getAttribute('data-kind'), input.value, customPanel);
      return;
    }

    var copySectionBtn = e.target.closest('[data-copy-section]');
    if(copySectionBtn){
      var copyPanel = copySectionBtn.closest('.magc-panel');
      if(!copyPanel) return;
      var copyKind = copyPanel.getAttribute('data-kind');
      copyText(makeCode(copyKind, state[copyKind]));
      setStatus('код скопирован');
      return;
    }

    if(e.target.closest('[data-copy-current]')){
      copyText(output ? output.value : '');
      setStatus('текущий код скопирован');
      return;
    }

    if(e.target.closest('[data-copy-buy]')){
      copyText(buyCode ? buyCode.value : '');
      setStatus('шаблон покупки скопирован');
      return;
    }

    var copyTemplateBtn = e.target.closest('[data-copy-template]');
    if(copyTemplateBtn){
      var key = copyTemplateBtn.getAttribute('data-copy-template');
      var area = root.querySelector('[data-template="' + key + '"]');
      if(area){
        copyText(area.value);
        setStatus('шаблон скопирован');
      }
    }
  });

  root.addEventListener('dblclick', function(e){
    var thumb = e.target.closest('.magc-thumb');
    if(!thumb) return;

    var panel = thumb.closest('.magc-panel');
    if(!panel) return;

    var kind = panel.getAttribute('data-kind');
    applyKind(kind, thumb.getAttribute('src'), panel);
    copyText(makeCode(kind, state[kind]));
    setStatus('код скопирован');
  });

  setActiveThumb(root.querySelector('.magc-panel[data-tab-panel="profile-bg"]'), state.profileBg);
  setActiveThumb(root.querySelector('.magc-panel[data-tab-panel="plash"]'), state.plash);
  setActiveThumb(root.querySelector('.magc-panel[data-tab-panel="plash-anim"]'), state.plash);
  setActiveThumb(root.querySelector('.magc-panel[data-tab-panel="page-bg"]'), state.pageBg);
  updateOutput('profile-bg');
})();
