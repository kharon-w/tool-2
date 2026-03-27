(function () {
  function hasClass(el, cls) {
    return el && (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }

  function addClass(el, cls) {
    if (!el || hasClass(el, cls)) return;
    el.className += (el.className ? ' ' : '') + cls;
  }

  function removeClass(el, cls) {
    var reg;
    if (!el || !el.className) return;
    reg = new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g');
    el.className = el.className.replace(reg, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }

  function trim(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  function getByClass(cls, root) {
    root = root || document;
    if (root.getElementsByClassName) return root.getElementsByClassName(cls);
    return root.querySelectorAll('.' + cls);
  }

  function findParentByClass(el, cls) {
    while (el && el !== document) {
      if (hasClass(el, cls)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function clearActive(className) {
    var list = getByClass(className);
    var i;
    for (i = 0; i < list.length; i++) {
      removeClass(list[i], 'active');
    }
  }

  function flashCopied(el) {
    if (!el) return;
    addClass(el, 'copied');
    setTimeout(function () {
      removeClass(el, 'copied');
    }, 600);
  }

  function copyText(text) {
    var input;
    text = String(text || '');
    if (!text) return false;

    input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    document.body.appendChild(input);
    input.focus();
    input.select();

    try {
      document.execCommand('copy');
    } catch (e) {}

    document.body.removeChild(input);
    return true;
  }

  function getPlash() {
    return document.getElementById('plImage') || document.querySelector('.pf-plash');
  }

  function buildCode(kind, url) {
    var plash, text;
    url = trim(url);
    if (!url) return '';

    if (kind === 'profile') {
      return '<img src="' + url + '">';
    }

    if (kind === 'page') {
      return '<img class="fon" src="' + url + '">';
    }

    if (kind === 'plash') {
      plash = getPlash();
      if (!plash) return '';
      text = trim(plash.innerHTML);
      return '<div class="pf-plash" style="background: url(' + url + ')">' + text + '</div>';
    }

    if (kind === 'icon') {
      return '<div class="char-tip"><img src="' + url + '"><span>Текст</span></div>';
    }

    return '';
  }

  function applyProfileBg(url, thumb) {
    var bigImg = document.getElementById('bigImage');
    if (!bigImg || !url) return;

    clearActive('smallClick');
    if (thumb) addClass(thumb, 'active');
    bigImg.src = url;
  }

  function applyPlashBg(url, thumb) {
    var plash = getPlash();
    if (!plash || !url) return;

    clearActive('plashClick');
    if (thumb) addClass(thumb, 'active');
    plash.style.backgroundImage = 'url(' + url + ')';
  }

  function applyPageBg(url, thumb) {
    var page = document.getElementById('lzPreview');
    var all;
    var i;

    if (thumb) {
      all = document.getElementsByTagName('img');
      for (i = 0; i < all.length; i++) {
        if (hasClass(all[i], 'lzbg')) removeClass(all[i], 'active');
      }
      addClass(thumb, 'active');
    }

    if (page && url) {
      page.style.backgroundImage = 'url(' + url + ')';
    }
  }

  function getInputFromMagazBody(body) {
    var wrap, inputs;
    if (!body) return null;

    wrap = body.getElementsByTagName('div');
    var i, j, inp;
    for (i = 0; i < wrap.length; i++) {
      if (hasClass(wrap[i], 'magaz-input')) {
        inputs = wrap[i].getElementsByTagName('input');
        for (j = 0; j < inputs.length; j++) {
          inp = inputs[j];
          if (!inp.type || inp.type === 'text') return inp;
        }
      }
    }

    return null;
  }

  function bodyHasClassBlock(body, cls) {
    var divs, i;
    if (!body) return false;
    divs = body.getElementsByTagName('*');
    for (i = 0; i < divs.length; i++) {
      if (hasClass(divs[i], cls)) return true;
    }
    return false;
  }

  document.onclick = function (e) {
    var ev = e || window.event;
    var target = ev.target || ev.srcElement;
    var body, input, url;

    if (!target) return;

    if (hasClass(target, 'smallClick')) {
      applyProfileBg(target.src, target);
      return;
    }

    if (hasClass(target, 'plashClick')) {
      applyPlashBg(target.src, target);
      return;
    }

    if (target.tagName && target.tagName.toLowerCase() === 'img' && hasClass(target, 'lzbg')) {
      applyPageBg(target.src, target);
      return;
    }

    if (target.tagName && target.tagName.toLowerCase() === 'button') {
      body = findParentByClass(target, 'magaz-body');
      input = getInputFromMagazBody(body);
      url = input ? trim(input.value) : '';

      if (!url) return;

      if (bodyHasClassBlock(body, 'bg-magaz')) {
        applyProfileBg(url, null);
        return;
      }

      if (bodyHasClassBlock(body, 'bg-plash')) {
        applyPlashBg(url, null);
        return;
      }
    }
  };

  document.ondblclick = function (e) {
    var ev = e || window.event;
    var target = ev.target || ev.srcElement;
    var text = '';

    if (!target) return;

    if (hasClass(target, 'icn')) {
      text = buildCode('icon', target.src);
    } else if (target.tagName && target.tagName.toLowerCase() === 'img' && hasClass(target, 'lzbg')) {
      text = buildCode('page', target.src);
      applyPageBg(target.src, target);
    } else if (hasClass(target, 'smallClick')) {
      text = buildCode('profile', target.src);
      applyProfileBg(target.src, target);
    } else if (hasClass(target, 'plashClick')) {
      text = buildCode('plash', target.src);
      applyPlashBg(target.src, target);
    }

    if (!text) return;

    copyText(text);
    flashCopied(target);
  };
})();
