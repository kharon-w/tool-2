(function () {
  function initBank() {
    var root = document.getElementById('cdBankNative');
    if (!root) return;

    var currency = root.getAttribute('data-currency') || '$';
    var panel = document.getElementById('cdb2Panel');
    var subtabs = document.getElementById('cdb2Subtabs');
    var picked = document.getElementById('cdb2Picked');
    var baseInput = document.getElementById('cdb2BaseInput');
    var opsTotal = document.getElementById('cdb2OpsTotal');
    var afterTotal = document.getElementById('cdb2After');
    var pickedCount = document.getElementById('cdb2Count');
    var manualText = document.getElementById('cdb2ManualText');
    var manualValue = document.getElementById('cdb2ManualValue');

    if (
      !panel ||
      !subtabs ||
      !picked ||
      !baseInput ||
      !opsTotal ||
      !afterTotal ||
      !pickedCount ||
      !manualText ||
      !manualValue
    ) {
      return;
    }

    function trim(s) {
      return String(s == null ? '' : s).replace(/^\s+|\s+$/g, '');
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m];
      });
    }

    function format(n) {
      return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2
      }).format(Number(n) || 0);
    }

    function formatSigned(n) {
      n = Number(n) || 0;
      return (n > 0 ? '+' : '') + format(n);
    }

    function isNumericValue(v) {
      return /^-?\d+([.,]\d+)?$/.test(trim(v));
    }

    function toNumber(v) {
      return Number(String(v || '0').replace(',', '.')) || 0;
    }

    function parseLine(line) {
      var parts = line.split('|');
      var text = trim(parts[0]);
      var raw = trim(parts[1]);
      var url = trim(parts[2]);
      var mode = trim(parts[3]).toLowerCase();

      if (!text) return null;

      var manual = mode === 'manual' || !isNumericValue(raw);
      var value = manual ? 0 : toNumber(raw);

      return {
        text: text,
        raw: raw,
        url: url,
        manual: manual,
        value: value
      };
    }

    var groups = {
      earn: [],
      spend: []
    };

    var itemMap = {};
    var uid = 0;
    var dataBlocks = root.querySelectorAll('.cdb2__data');

    for (var i = 0; i < dataBlocks.length; i++) {
      var box = dataBlocks[i];
      var side = trim(box.getAttribute('data-side')).toLowerCase();

      if (side !== 'earn' && side !== 'spend') continue;

      var title = trim(box.getAttribute('data-title')) || 'Раздел';
      var note = trim(box.getAttribute('data-note'));
      var lines = box.value.split(/\r?\n/);
      var items = [];

      for (var j = 0; j < lines.length; j++) {
        var line = trim(lines[j]);
        if (!line) continue;

        var parsed = parseLine(line);
        if (!parsed) continue;

        var id = 'cdb2_' + (++uid);

        var item = {
          id: id,
          side: side,
          title: title,
          text: parsed.text,
          raw: parsed.raw,
          url: parsed.url,
          manual: parsed.manual,
          value: parsed.value
        };

        items.push(item);
        itemMap[id] = item;
      }

      groups[side].push({
        id: side + '_' + i,
        title: title,
        note: note,
        items: items
      });
    }

    function getFirstSectionId(side) {
      var arr = groups[side] || [];
      return arr.length ? arr[0].id : 'all';
    }

    function hasSection(side, secId) {
      var arr = groups[side] || [];

      if (secId === 'all') return true;

      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === secId) return true;
      }

      return false;
    }

    var state = {
      main: 'earn',
      sub: {
        earn: getFirstSectionId('earn'),
        spend: getFirstSectionId('spend')
      },
      base: toNumber(baseInput.value),
      counts: {},
      manual: []
    };

    function ensureValidSub(side) {
      if (!state.sub[side] || !hasSection(side, state.sub[side])) {
        state.sub[side] = getFirstSectionId(side);
      }
    }

    function sideSign(side) {
      return side === 'earn' ? 1 : -1;
    }

    function rowCount(id) {
      return Number(state.counts[id] || 0);
    }

    function getSections() {
      var arr = groups[state.main] || [];

      ensureValidSub(state.main);

      if (state.sub[state.main] === 'all') {
        return arr;
      }

      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === state.sub[state.main]) {
          out.push(arr[i]);
        }
      }

      return out;
    }

    function titleHtml(item) {
      if (item.url) {
        return '<a href="' + esc(item.url) + '">' + esc(item.text) + '</a>';
      }
      return esc(item.text);
    }

    function selectedItems() {
      var out = [];
      var sides = ['earn', 'spend'];

      for (var s = 0; s < sides.length; s++) {
        var side = sides[s];
        var sections = groups[side] || [];

        for (var i = 0; i < sections.length; i++) {
          var sec = sections[i];

          for (var j = 0; j < sec.items.length; j++) {
            var item = sec.items[j];
            var qty = rowCount(item.id);

            if (!item.manual && qty > 0) {
              out.push({
                id: item.id,
                manual: false,
                side: side,
                group: sec.title,
                text: item.text,
                qty: qty,
                single: item.value,
                sum: qty * item.value * sideSign(side)
              });
            }
          }
        }
      }

      for (var m = 0; m < state.manual.length; m++) {
        out.push(state.manual[m]);
      }

      return out;
    }

    function opsSum() {
      var list = selectedItems();
      var total = 0;

      for (var i = 0; i < list.length; i++) {
        total += Number(list[i].sum || 0);
      }

      return total;
    }

    function renderTabs() {
      ensureValidSub(state.main);

      var mains = root.querySelectorAll('.cdb2__tab');

      for (var i = 0; i < mains.length; i++) {
        var active = mains[i].getAttribute('data-main') === state.main;
        mains[i].classList.toggle('is-active', active);
      }

      var secs = groups[state.main] || [];
      var html = '';

      for (var j = 0; j < secs.length; j++) {
        html += '<button type="button" class="cdb2__subtab' +
          (state.sub[state.main] === secs[j].id ? ' is-active' : '') +
          '" data-sub="' + esc(secs[j].id) + '">' + esc(secs[j].title) + '</button>';
      }

      html += '<button type="button" class="cdb2__subtab' +
        (state.sub[state.main] === 'all' ? ' is-active' : '') +
        '" data-sub="all">все</button>';

      subtabs.innerHTML = html;
    }

    function renderPanel() {
      var secs = getSections();
      var html = '';

      if (!secs.length) {
        panel.innerHTML = '<div class="cdb2__empty">Здесь пока ничего нет.</div>';
        return;
      }

      for (var i = 0; i < secs.length; i++) {
        var sec = secs[i];

        html += '<section class="cdb2__section">';
        html += '<div class="cdb2__sectionhead">';
        html += '<div class="cdb2__sectiontitle">' + esc(sec.title) + '</div>';

        if (sec.note) {
          html += '<div class="cdb2__sectionpill">' + esc(sec.note) + '</div>';
        }

        html += '</div>';
        html += '<div class="cdb2__rows">';

        for (var j = 0; j < sec.items.length; j++) {
          var item = sec.items[j];
          var qty = rowCount(item.id);

          if (item.manual) {
            html += '<div class="cdb2__note">';
            html += '<div>';
            html += '<div class="cdb2__rowtitle">' + titleHtml(item) + '</div>';
            html += '<div class="cdb2__notetext">это не считается автоматически — добавь ниже вручную</div>';
            html += '</div>';
            html += '<div class="cdb2__notebadge"><b>' + esc(item.raw) + '</b><i>' + esc(currency) + '</i></div>';
            html += '</div>';
          } else {
            html += '<div class="cdb2__row' + (qty > 0 ? ' is-used' : '') + '" data-id="' + esc(item.id) + '">';
            html += '<div class="cdb2__rowmain">';
            html += '<div class="cdb2__rowtitle">' + titleHtml(item) + '</div>';
            html += '</div>';
            html += '<div class="cdb2__qty">';
            html += '<button type="button" class="cdb2__step" data-step="-1">−</button>';
            html += '<input type="number" min="0" class="cdb2__qtyinput" value="' + qty + '">';
            html += '<button type="button" class="cdb2__step" data-step="1">+</button>';
            html += '</div>';
            html += '<div class="cdb2__rowsum"><b>' + format(qty * item.value) + '</b><i>' + esc(currency) + '</i></div>';
            html += '</div>';
          }
        }

        html += '</div>';
        html += '</section>';
      }

      panel.innerHTML = html;
    }

    function renderPicked() {
      var list = selectedItems();
      var html = '';

      if (!list.length) {
        picked.innerHTML = '<div class="cdb2__empty">Пока ничего не выбрано.</div>';
        pickedCount.textContent = '0';
        return;
      }

      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        var cls = row.sum >= 0 ? 'is-earn' : 'is-spend';
        var id = row.manual ? row.mid : row.id;

        html += '<div class="cdb2__pickeditem">';
        html += '<div class="cdb2__pickedtext">';
        html += esc(row.text);
        html += '<small>' + esc(row.group || 'Ручная операция') + (row.qty ? ' × ' + row.qty : '') + '</small>';
        html += '</div>';
        html += '<div class="cdb2__pickedsum ' + cls + '">' + esc(formatSigned(row.sum)) + esc(currency) + '</div>';
        html += '<button type="button" class="cdb2__pickedremove" data-remove="' + esc(id) + '">×</button>';
        html += '</div>';
      }

      picked.innerHTML = html;
      pickedCount.textContent = String(list.length);
    }

    function updateTotals() {
      var total = opsSum();
      opsTotal.textContent = formatSigned(total);
      afterTotal.textContent = format(state.base + total);
    }

    function updateAll() {
      renderPicked();
      updateTotals();
    }

    function setCount(id, value, rowEl) {
      if (!itemMap[id]) return;

      var val = Math.max(0, parseInt(value, 10) || 0);

      if (val > 0) {
        state.counts[id] = val;
      } else {
        delete state.counts[id];
      }

      if (rowEl) {
        rowEl.classList.toggle('is-used', val > 0);

        var sum = rowEl.querySelector('.cdb2__rowsum b');
        var input = rowEl.querySelector('.cdb2__qtyinput');

        if (sum) sum.textContent = format(val * itemMap[id].value);
        if (input && String(input.value) !== String(val)) input.value = val;
      }

      updateAll();
    }

    function addManual(sign) {
      var text = trim(manualText.value) || 'Ручная операция';
      var value = toNumber(manualValue.value);

      if (!value) return;

      state.manual.push({
        mid: 'm_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
        manual: true,
        side: sign > 0 ? 'earn' : 'spend',
        group: 'Ручная операция',
        text: text,
        qty: 1,
        single: value,
        sum: sign * value
      });

      manualText.value = '';
      manualValue.value = '';
      updateAll();
    }

    function clearOps() {
      state.counts = {};
      state.manual = [];
      renderPanel();
      updateAll();
    }

    function removePickedItem(id) {
      if (!id) return;

      if (id.indexOf('m_') === 0) {
        var next = [];
        for (var i = 0; i < state.manual.length; i++) {
          if (state.manual[i].mid !== id) next.push(state.manual[i]);
        }
        state.manual = next;
      } else {
        delete state.counts[id];
      }

      renderPanel();
      updateAll();
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();

      try {
        document.execCommand('copy');
      } catch (e) {}

      document.body.removeChild(ta);
    }

    function copyReport() {
      var list = selectedItems();
      var earn = [];
      var spend = [];
      var manual = [];

      for (var i = 0; i < list.length; i++) {
        var line = list[i];
        var rowText =
          (line.sum >= 0 ? '+ ' : '- ') +
          format(Math.abs(line.single || Math.abs(line.sum))) + currency +
          ' — ' + line.text +
          (line.qty ? ' × ' + line.qty : '') +
          ' = ' + format(Math.abs(line.sum)) + currency;

        if (line.manual) {
          manual.push(rowText);
        } else if (line.side === 'earn') {
          earn.push(rowText);
        } else {
          spend.push(rowText);
        }
      }

      var text = [];
      text.push('Баланс сейчас: ' + format(state.base) + currency);
      text.push('');

      if (earn.length) {
        text.push('НАЧИСЛЕНИЯ:');
        text = text.concat(earn);
        text.push('');
      }

      if (spend.length) {
        text.push('ТРАТЫ:');
        text = text.concat(spend);
        text.push('');
      }

      if (manual.length) {
        text.push('РУЧНЫЕ ОПЕРАЦИИ:');
        text = text.concat(manual);
        text.push('');
      }

      text.push('Итог операций: ' + formatSigned(opsSum()) + currency);
      text.push('После операций: ' + format(state.base + opsSum()) + currency);

      var finalText = text.join('\n');

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(finalText).catch(function () {
          fallbackCopy(finalText);
        });
      } else {
        fallbackCopy(finalText);
      }
    }

    root.addEventListener('click', function (e) {
      var mainTab = e.target.closest('.cdb2__tab');
      if (mainTab) {
        state.main = mainTab.getAttribute('data-main') || 'earn';
        ensureValidSub(state.main);
        renderTabs();
        renderPanel();
        return;
      }

      var subTab = e.target.closest('.cdb2__subtab');
      if (subTab) {
        state.sub[state.main] = subTab.getAttribute('data-sub') || getFirstSectionId(state.main);
        renderTabs();
        renderPanel();
        return;
      }

      var removeBtn = e.target.closest('.cdb2__pickedremove');
      if (removeBtn) {
        removePickedItem(removeBtn.getAttribute('data-remove'));
        return;
      }

      var act = e.target.getAttribute('data-act');

      if (act === 'addManualPlus') {
        addManual(1);
        return;
      }

      if (act === 'addManualMinus') {
        addManual(-1);
        return;
      }

      if (act === 'clear') {
        clearOps();
        return;
      }

      if (act === 'copy') {
        copyReport();
        return;
      }

      var stepBtn = e.target.closest('.cdb2__step');
      if (stepBtn) {
        var stepRow = stepBtn.closest('.cdb2__row');
        if (!stepRow) return;

        var stepId = stepRow.getAttribute('data-id');
        setCount(stepId, rowCount(stepId) + Number(stepBtn.getAttribute('data-step')), stepRow);
        return;
      }

      var rowMain = e.target.closest('.cdb2__rowmain');
      if (rowMain) {
        if (e.target.closest('a')) return;

        var row = rowMain.closest('.cdb2__row');
        if (!row) return;

        var id = row.getAttribute('data-id');
        setCount(id, rowCount(id) + 1, row);
      }
    });

    root.addEventListener('input', function (e) {
      if (e.target.classList.contains('cdb2__qtyinput')) {
        var row = e.target.closest('.cdb2__row');
        if (!row) return;

        setCount(row.getAttribute('data-id'), e.target.value, row);
        return;
      }

      if (e.target === baseInput) {
        state.base = toNumber(baseInput.value);
        updateTotals();
      }
    });

    function manualEnterHandler(e) {
      if (e.key === 'Enter') {
        addManual(1);
      }
    }

    manualText.addEventListener('keydown', manualEnterHandler);
    manualValue.addEventListener('keydown', manualEnterHandler);

    renderTabs();
    renderPanel();
    updateAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBank);
  } else {
    initBank();
  }
})();
