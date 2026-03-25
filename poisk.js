(function(){
  if (typeof jQuery === 'undefined') return;
  var $ = jQuery;

  function getTopicId(){
    var m = location.href.match(/viewtopic\.php\?id=(\d+)/);
    return m ? m[1] : '';
  }

  function getAuthorName($post){
    var $a = $post.find('.pa-author a:first, .post-author a:first, .pl-name a:first, .username a:first').first();
    if ($a.length) return $.trim($a.text());

    var $strong = $post.find('.pa-author strong:first, .post-author strong:first').first();
    if ($strong.length) return $.trim($strong.text());

    return '';
  }

  function getInsertPlace($post){
    return $post.find('.pa-author:first, .post-author:first, #profile-left:first').first();
  }

  function normalizeText(text){
    return $.trim(String(text || '').replace(/\s+/g, ' '));
  }

  function cutText(text, max){
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  function extractPostText(html){
    var doc = new DOMParser().parseFromString(html, 'text/html');

    var post =
      doc.querySelector('.post') ||
      doc.querySelector('.postlink + .post') ||
      doc.querySelector('#pun-main .post');

    if (!post) return '';

    var body =
      post.querySelector('.post-content') ||
      post.querySelector('.post-body') ||
      post.querySelector('.entry-content') ||
      post.querySelector('.post-box') ||
      post;

    var clone = body.cloneNode(true);

    var trash = clone.querySelectorAll(
      'blockquote, .quote-box, .code-box, .post-sig, .signature, script, style, .edit, .post-links'
    );
    for (var i = 0; i < trash.length; i++) trash[i].remove();

    return normalizeText(clone.textContent || clone.innerText || '');
  }

  var topicId = getTopicId();
  if (!topicId) return;

  var authorsMap = {};

  $('.post').each(function(){
    var $post = $(this);
    var author = getAuthorName($post);
    if (!author) return;

    if (!authorsMap[author]) authorsMap[author] = [];
    authorsMap[author].push($post);
  });

  var authors = Object.keys(authorsMap);
  if (!authors.length) return;

  function renderForAuthor(author, text){
    var finalText = cutText(text || 'Нет текста', 260);

    authorsMap[author].forEach(function($post){
      var $place = getInsertPlace($post);
      if (!$place.length) return;

      $place.find('.topic-last-text').remove();
      $('<div class="topic-last-text"></div>').text(finalText).appendTo($place);
    });
  }

  function loadAuthor(author, done){
    var cacheKey = 'topic-last-text:' + topicId + ':' + author;
    var cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      renderForAuthor(author, cached);
      done();
      return;
    }

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

    fetch(url, { credentials: 'same-origin' })
      .then(function(r){ return r.text(); })
      .then(function(html){
        var text = extractPostText(html);
        if (!text) text = 'Сообщение не найдено';
        sessionStorage.setItem(cacheKey, text);
        renderForAuthor(author, text);
        done();
      })
      .catch(function(){
        renderForAuthor(author, 'Ошибка загрузки');
        done();
      });
  }

  var i = 0;
  function next(){
    if (i >= authors.length) return;
    loadAuthor(authors[i], function(){
      i++;
      setTimeout(next, 150);
    });
  }

  next();
})();
