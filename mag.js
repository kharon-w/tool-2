(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function initMagazik() {
    const root = document;

    const preview = {
      profileBg: root.getElementById('bigImage'),
      plash: root.getElementById('plImage') || root.querySelector('.post-author-magaz .pf-plash'),
      pageBg:
        root.getElementById('lzPreview') ||
        root.querySelector('.magc-page__view') ||
        root.querySelector('.magaz-demo-page__view')
    };

    const output =
      root.getElementById('magcCurrentCode') ||
      root.getElementById('magazCurrentCode') ||
      root.querySelector('[data-output]');

    const statusLine =
      root.getElementById('magcStatus') ||
      root.getElementById('magazStatus') ||
      root.querySelector('[data-status]');

    const state = {
      profileBg: preview.profileBg ? preview.profileBg.getAttribute('src') : '',
      plash: getBackgroundUrl(preview.plash),
      pageBg: getBackgroundUrl(preview.pageBg),
      currentKind: 'profile-bg'
    };

    function trim(value) {
      return String(value || '').replace(/^\s+|\s+$/g, '');
    }

    function getBackgroundUrl(node) {
      if (!node) return '';
      const bg = node.style.backgroundImage || window.getComputedStyle(node).backgroundImage || '';
      const match = bg.match(/^url\((['"]?)(.*?)\1\)$/);
      return match ? match[2] : '';
    }

    function setStatus(text) {
      if (statusLine) statusLine.textContent = text;
    }

    function copyText(text) {
      const value = String(text || '');
      if (!value) return Promise.resolve(false);

      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(value).then(
          function () { return true; },
          function () { return fallbackCopy(value); }
        );
      }

      return Promise.resolve(fallbackCopy(value));
    }

    function fallbackCopy(text) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      area.style.pointerEvents = 'none';
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, area.value.length);

      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }

      document.body.removeChild(area);
      return ok;
    }

    function flashCopied(node) {
      if (!node) return;
      node.classList.add('copied');
      setTimeout(function () {
        node.classList.remove('copied');
      }, 650);
    }

    function clearActive(selector) {
      root.querySelectorAll(selector).forEach(function (item) {
        item.classList.remove('active');
      });
    }

    function setActiveByElement(kind, element) {
      if (kind === 'profile-bg') clearActive('.smallClick');
      if (kind === 'plash') clearActive('.plashClick');
      if (kind === 'page-bg') clearActive('img.lzbg');

      if (element) element.classList.add('active');
    }

    function getPlashInner() {
      if (!preview.plash) {
        return 'the crow <span class="pf-plash__sub">bewails the sheep</span>';
      }
      return trim(preview.plash.innerHTML);
    }

    function makeCode(kind, url) {
      const cleanUrl = trim(url);
      if (!cleanUrl) return '';

      if (kind === 'profile-bg') {
        return '<img src="' + cleanUrl + '">';
      }

      if (kind === 'page-bg') {
        return '<img class="fon" src="' + cleanUrl + '">';
      }

      if (kind === 'plash') {
        return '<div class="pf-plash" style="background: url(' + cleanUrl + ')">' + getPlashInner() + '</div>';
      }

      return '';
    }

    function updateOutput(kind) {
      if (kind) state.currentKind = kind;
      if (output) {
        output.value = makeCode(state.currentKind, state[state.currentKind]);
      }
    }

    function applyPreview(kind, url, sourceEl) {
      const cleanUrl = trim(url);
      if (!cleanUrl) return;

      if (kind === 'profile-bg' && preview.profileBg) {
        state.profileBg = cleanUrl;
        preview.profileBg.src = cleanUrl;
      }

      if (kind === 'plash' && preview.plash) {
        state.plash = cleanUrl;
        preview.plash.style.backgroundImage = 'url("' + cleanUrl + '")';
      }

      if (kind === 'page-bg' && preview.pageBg) {
        state.pageBg = cleanUrl;
        preview.pageBg.style.backgroundImage = 'url("' + cleanUrl + '")';
      }

      setActiveByElement(kind, sourceEl || null);
      updateOutput(kind);
      setStatus('код обновлён');
    }

    function detectKindFromThumb(node) {
      if (!node) return '';
      if (node.classList.contains('smallClick')) return 'profile-bg';
      if (node.classList.contains('plashClick')) return 'plash';
      if (node.matches('img.lzbg')) return 'page-bg';
      return '';
    }

    function detectKindFromInputButton(button) {
      const body = button.closest('.magaz-body, .magc-body');
      if (!body) return '';

      if (body.querySelector('.bg-magaz, .magc-grid .smallClick')) return 'profile-bg';
      if (body.querySelector('.bg-plash, .magc-grid .plashClick')) return 'plash';
      if (body.querySelector('.lzbg, .magc-grid img.lzbg, .magc-grid [data-kind="page-bg"]')) return 'page-bg';

      return '';
    }

    function findInputForButton(button) {
      const wrap = button.closest('.magaz-input, .magc-input');
      if (!wrap) return null;
      return wrap.querySelector('input[type="text"], input:not([type])');
    }

    root.addEventListener('click', function (e) {
      const thumb = e.target.closest('.smallClick, .plashClick, img.lzbg');
      if (thumb) {
        const kind = detectKindFromThumb(thumb);
        if (!kind) return;
        applyPreview(kind, thumb.getAttribute('src'), thumb);
        return;
      }

      const customBtn = e.target.closest(
        '#applyImg, #applyPlash, [data-apply-custom], .magaz-input button, .magc-input button'
      );

      if (customBtn) {
        const input = findInputForButton(customBtn);
        const kind = detectKindFromInputButton(customBtn);
        if (!input || !kind) return;

        applyPreview(kind, input.value, null);
        return;
      }

      const copyCurrentBtn = e.target.closest('[data-copy-current]');
      if (copyCurrentBtn && output) {
        copyText(output.value).then(function () {
          setStatus('текущий код скопирован');
        });
      }

      const copyBuyBtn = e.target.closest('[data-copy-buy]');
      if (copyBuyBtn) {
        const buyCode =
          root.getElementById('magcBuyCode') ||
          root.getElementById('magazBuyCode');

        if (buyCode) {
          copyText(buyCode.value).then(function () {
            setStatus('шаблон покупки скопирован');
          });
        }
      }

      const copyTemplateBtn = e.target.closest('[data-copy-template]');
      if (copyTemplateBtn) {
        const key = copyTemplateBtn.getAttribute('data-copy-template');
        const area = root.querySelector('[data-template="' + key + '"]');
        if (area) {
          copyText(area.value).then(function () {
            setStatus('шаблон скопирован');
          });
        }
      }

      const copySectionBtn = e.target.closest('[data-copy-section]');
      if (copySectionBtn) {
        const kind = detectKindFromInputButton(copySectionBtn);
        if (!kind) return;

        copyText(makeCode(kind, state[kind])).then(function () {
          setStatus('код скопирован');
        });
      }
    });

    root.addEventListener('dblclick', function (e) {
      const thumb = e.target.closest('.smallClick, .plashClick, img.lzbg');
      if (!thumb) return;

      const kind = detectKindFromThumb(thumb);
      if (!kind) return;

      applyPreview(kind, thumb.getAttribute('src'), thumb);

      copyText(makeCode(kind, state[kind])).then(function () {
        flashCopied(thumb);
        setStatus('код скопирован');
      });
    });

    updateOutput('profile-bg');
  });
})();
