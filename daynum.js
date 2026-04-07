(function () {
  if (!/viewtopic\.php/.test(location.pathname)) return;

  var ALLOWED_CHILD_ORIGIN = 'https://forumscripts.ru';
  var ALLOWED_TOPIC_IDS = [647]; 
  var cache = {};

  function cleanText(s) {
    return String(s || '')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function getCurrentTopicId() {
    return new URLSearchParams(location.search).get('id') || '';
  }

  function isTopicAllowed(topicId) {
    if (!ALLOWED_TOPIC_IDS.length) return true;
    return ALLOWED_TOPIC_IDS.indexOf(String(topicId)) !== -1;
  }

  function getCurrentUserName() {
    if (typeof UserLogin === 'string' && UserLogin.trim()) {
      return UserLogin.trim();
    }

    if (window.User) {
      return (
        User.login ||
        User.username ||
        User.name ||
        User.Login ||
        User.Username ||
        User.Name ||
        ''
      ).trim();
    }

    var selectors = [
      '#navprofile a[href*="profile.php"]',
      '#navprofile a',
      '#navuserlist a[href*="profile.php"]'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }

    return '';
  }

  function isTrustedHtmlInPostsFrame(sourceWindow) {
    var frames = document.querySelectorAll('iframe[src*="forumscripts.ru/html_in_posts/"]');

    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === sourceWindow) {
        return true;
      }
    }

    return false;
  }

  function removeNodes(root, selector) {
    var nodes = root.querySelectorAll(selector);
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i] && nodes[i].parentNode) {
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
  }

  function getTopLevelSpoilers(root, selector) {
    var all = root.querySelectorAll(selector);
    var result = [];

    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var parent = el.parentElement;
      var nested = false;

      while (parent) {
        if (parent.matches && parent.matches(selector)) {
          nested = true;
          break;
        }
        parent = parent.parentElement;
      }

      if (!nested) result.push(el);
    }

    return result;
  }

  function extractSpoilerBody(root) {
    var body = null;

    body =
      root.querySelector(':scope > .spoiler-text') ||
      root.querySelector(':scope > .spoiler-body') ||
      root.querySelector(':scope > .spoiler-content') ||
      root.querySelector(':scope > .spoil_text') ||
      root.querySelector(':scope > blockquote') ||
      root.querySelector(':scope > .quote-box__body');

    if (body) return body;

    if (root.children && root.children.length > 1) {
      for (var i = root.children.length - 1; i >= 0; i--) {
        var child = root.children[i];
        if (!child) continue;

        var cls = (child.className || '').toString();
        if (/title|head|header|switch|button|legend|summary|hide/i.test(cls)) continue;

        if (cleanText(child.textContent)) {
          return child;
        }
      }
    }

    return null;
  }

  function getSpoilerText(contentEl) {
    var clone = contentEl.cloneNode(true);

    removeNodes(clone, 'script, style, iframe, object, embed, form, textarea, input, button');

    var spoilerSelector = [
      '.spoiler-box',
      '.spoiler',
      '.spoiler_outer',
      '.spoiler-block',
      '[class*="spoiler"]',
      '[id*="spoiler"]'
    ].join(', ');

    var roots = getTopLevelSpoilers(clone, spoilerSelector);
    if (!roots.length) return '';

    var parts = [];

    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];

      var headerText = '';
      var headerNode =
        root.querySelector(':scope > legend') ||
        root.querySelector(':scope > summary') ||
        root.querySelector(':scope > .switch') ||
        root.querySelector(':scope > .spoil_title') ||
        root.querySelector(':scope > .spoiler-title') ||
        root.querySelector(':scope > .spoiler-head') ||
        root.querySelector(':scope > .spoiler-header') ||
        root.querySelector(':scope > .hide_text') ||
        root.querySelector(':scope > .spoiler-btn') ||
        root.querySelector(':scope > .spoiler_button');

      if (headerNode) {
        headerText = cleanText(headerNode.textContent);
      }

      var bodyNode = extractSpoilerBody(root);
      var source = (bodyNode || root).cloneNode(true);

      removeNodes(
        source,
        'legend, summary, .switch, .spoil_title, .spoiler-title, .spoiler-head, .spoiler-header, .hide_text, .spoiler-btn, .spoiler_button, .quote-box__title'
      );

      var text = cleanText(source.textContent);

      if (headerText && text.indexOf(headerText) === 0) {
        text = cleanText(text.slice(headerText.length));
      }

      if (text) parts.push(text);
    }

    return cleanText(parts.join('\n\n'));
  }

  function parseLastPost(html, topicId) {
    var doc = new DOMParser().parseFromString(html, 'text/html');

    var block =
      doc.querySelector('#pun-main .blockpost') ||
      doc.querySelector('#pun-main .post') ||
      doc.querySelector('#pun-main .topicpost') ||
      doc.querySelector('.punbb .blockpost') ||
      doc.querySelector('.punbb .post') ||
      doc.querySelector('.punbb .topicpost') ||
      doc.querySelector('.main .blockpost') ||
      doc.querySelector('.main .post');

    if (!block) {
      return {
        text: 'Вы еще не писали в этой теме.'
      };
    }

    var content =
      block.querySelector('.post-content') ||
      block.querySelector('.entry-content') ||
      block.querySelector('.post-body .post-box') ||
      block.querySelector('.post-body') ||
      block.querySelector('.post-inner');

    var linkEl =
      block.querySelector('a.permalink') ||
      block.querySelector('a[href*="#p"]') ||
      block.querySelector('a[href*="viewtopic.php?id=' + topicId + '"]') ||
      block.querySelector('a[href*="viewtopic.php?pid="]');

    if (!content) {
      return {
        text: 'Не удалось получить текст сообщения.',
        link: linkEl ? linkEl.href : ''
      };
    }

    var spoilerText = getSpoilerText(content);

    if (!spoilerText) {
      return {
        text: 'В вашем последнем сообщении нет текста в spoiler.',
        link: linkEl ? linkEl.href : ''
      };
    }

    return {
      text: spoilerText,
      link: linkEl ? linkEl.href : ''
    };
  }

  async function readHtml(res) {
    var buf = await res.arrayBuffer();
    var charset = 'windows-1251';

    var header = res.headers.get('content-type') || '';
    var m = header.match(/charset=([^\s;]+)/i);
    if (m && m[1]) charset = m[1].toLowerCase();

    try {
      return new TextDecoder(charset).decode(buf);
    } catch (e) {
      return new TextDecoder('windows-1251').decode(buf);
    }
  }

  async function getLastPost(topicId, author) {
    var key = topicId + '::' + author;
    if (cache[key]) return cache[key];

    var url =
      '/search.php?action=search' +
      '&keywords=' +
      '&author=' + encodeURIComponent(author) +
      '&forum=' +
      '&topics=' + encodeURIComponent(topicId) +
      '&search_in=0' +
      '&sort_by=0' +
      '&sort_dir=DESC' +
      '&show_as=posts';

    var res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    var html = await readHtml(res);
    var data = parseLastPost(html, topicId);

    cache[key] = data;
    return data;
  }

  window.addEventListener('message', async function (e) {
    if (e.origin !== ALLOWED_CHILD_ORIGIN) return;
    if (!e.data || e.data.type !== 'crw:lastPost:request') return;
    if (!e.source) return;
    if (!isTrustedHtmlInPostsFrame(e.source)) return;

    var requestId = e.data.requestId;
    if (!requestId) return;

    var topicId = getCurrentTopicId();

    if (!topicId) {
      e.source.postMessage({
        type: 'crw:lastPost:response',
        requestId: requestId,
        text: 'Не удалось определить тему.'
      }, e.origin);
      return;
    }

    if (!isTopicAllowed(topicId)) {
      e.source.postMessage({
        type: 'crw:lastPost:response',
        requestId: requestId,
        text: 'Этот блок недоступен в данной теме.'
      }, e.origin);
      return;
    }

    var author = cleanText(getCurrentUserName());

    if (!author || /^(гость|guest|login|вход)$/i.test(author)) {
      e.source.postMessage({
        type: 'crw:lastPost:response',
        requestId: requestId,
        text: 'Только для авторизованных пользователей.'
      }, e.origin);
      return;
    }

    try {
      var data = await getLastPost(topicId, author);

      e.source.postMessage({
        type: 'crw:lastPost:response',
        requestId: requestId,
        text: data.text || '',
        link: data.link || ''
      }, e.origin);
    } catch (err) {
      console.error(err);

      e.source.postMessage({
        type: 'crw:lastPost:response',
        requestId: requestId,
        text: 'Ошибка при загрузке сообщения.'
      }, e.origin);
    }
  });
})();
