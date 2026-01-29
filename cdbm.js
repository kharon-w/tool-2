var cdbm = {
  items: [],
  nextId: 1,
  baseBalance: 0,
  root: null,
  currency: '$',
  baseEl: null,
  afterEl: null,
  totalEl: null,
  chipsEl: null,
  balIn: null,
  manualEl: null
};

function cdbm_init(){
  var root = document.getElementById('cdBankMini');
  if(!root) return;

  cdbm.root = root;
  cdbm.currency = root.getAttribute('data-currency') || '$';

  cdbm.baseEl  = document.getElementById('cdbmBase');
  cdbm.afterEl = document.getElementById('cdbmAfter');
  cdbm.totalEl = document.getElementById('cdbmTotal');
  cdbm.chipsEl = document.getElementById('cdbmChips');
  cdbm.balIn   = document.getElementById('cdbmBalanceIn');
  cdbm.manualEl= document.getElementById('cdbmManual');

  cdbm_setCurrencyEverywhere();
  cdbm_renderTotals();
  cdbm_renderChips();
}

function cdbm_setCurrencyEverywhere(){
  var root = cdbm.root;
  if(!root) return;
  var currency = cdbm.currency;

  var curEls = root.getElementsByTagName('i');
  for(var i=0;i<curEls.length;i++){
    if(String(curEls[i].textContent).trim() === '$') curEls[i].textContent = currency;
  }
}

function cdbm_escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){
    return ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m]);
  });
}

function cdbm_sumOps(){
  var s = 0;
  for(var i=0;i<cdbm.items.length;i++) s += cdbm.items[i].val;
  return s;
}

function cdbm_renderTotals(){
  if(!cdbm.baseEl) return;
  var s = cdbm_sumOps();
  cdbm.baseEl.textContent  = String(cdbm.baseBalance);
  cdbm.totalEl.textContent = String(s);
  cdbm.afterEl.textContent = String(cdbm.baseBalance + s);
}

function cdbm_renderChips(){
  if(!cdbm.chipsEl) return;

  var currency = cdbm.currency;
  cdbm.chipsEl.innerHTML = '';

  for(var i=0;i<cdbm.items.length;i++){
    var it = cdbm.items[i];

    var chip = document.createElement('span');
    chip.className = 'cdbm__chip';
    chip.setAttribute('data-chip-id', String(it.id));

    var sign = it.val < 0 ? '-' : '+';
    var pCls = it.val < 0 ? 'p p--spend' : 'p';

    chip.innerHTML =
      '<span class="'+pCls+'">'+sign+Math.abs(it.val)+currency+'</span>' +
      '<span class="lbl">'+cdbm_escapeHtml(it.label)+'</span>' +
      '<span class="x" title="Убрать" data-act="chipRemove">×</span>';

    cdbm.chipsEl.appendChild(chip);
  }
}

function cdbm_addOp(label, val, type){
  val = Number(val) || 0;
  if(!val) return;

  if(type === 'spend') val = -Math.abs(val);
  else val = Math.abs(val);

  cdbm.items.push({id: cdbm.nextId++, label: label, val: val});
  cdbm_renderTotals();
  cdbm_renderChips();
}

function cdbm_flashRow(row, isSpend){
  if(!row) return;
  row.classList.add(isSpend ? 'is-spend' : 'is-on');
  setTimeout(function(){
    row.classList.remove('is-on');
    row.classList.remove('is-spend');
  }, 220);
}

function cdbm_fallbackCopy(txt){
  var ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}

function cdbm_copyText(txt){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).catch(function(){ cdbm_fallbackCopy(txt); });
  }else{
    cdbm_fallbackCopy(txt);
  }
}

function cdbm_opsText(){
  var currency = cdbm.currency;
  var lines = [];
  for(var i=0;i<cdbm.items.length;i++){
    var it = cdbm.items[i];
    var sign = it.val < 0 ? '-' : '+';
    lines.push((i+1)+'. ' + it.label + ' — ' + sign + Math.abs(it.val) + currency);
  }
  return lines.join('\n');
}

function cdbm_reportText(){
  var currency = cdbm.currency;
  var s = cdbm_sumOps();
  var out = [];
  out.push('Операции:');
  if(cdbm.items.length){
    out.push(cdbm_opsText());
    out.push('Итого операций: ' + (s < 0 ? '' : '+') + s + currency);
  }else{
    out.push('(нет)');
  }
  out.push('Базовый баланс: ' + cdbm.baseBalance + currency);
  out.push('Баланс после операций: ' + (cdbm.baseBalance + s) + currency);
  return out.join('\n');
}

function cdbm_handle(e){
  if(!cdbm.root) cdbm_init();
  if(!cdbm.root) return;

  var t = e.target;

  var chipRemove = cdbm_closestAttr(t, 'data-act');
  if(chipRemove && chipRemove.getAttribute('data-act') === 'chipRemove'){
    var chip = chipRemove.parentNode;
    var id = Number(chip.getAttribute('data-chip-id') || 0);
    cdbm.items = cdbm.items.filter(function(x){ return x.id !== id; });
    cdbm_renderTotals();
    cdbm_renderChips();
    return;
  }

  var copyBtn = cdbm_closest(t, 'cdbm__copy');
  if(copyBtn){
    var row = cdbm_closest(copyBtn, 'cdbm__row');
    if(!row) return;

    var labelEl = row.getElementsByClassName('t')[0];
    var label = labelEl ? String(labelEl.textContent).trim() : '';
    var v = Number(row.getAttribute('data-val') || 0);
    var type = row.getAttribute('data-type') || 'earn';
    cdbm_copyText(label + ' — ' + (type === 'spend' ? '-' : '+') + v + cdbm.currency);
    return;
  }

  var actEl = cdbm_closestAttr(t, 'data-act');
  if(actEl){
    var act = actEl.getAttribute('data-act');

    if(act === 'setBalance'){
      cdbm.baseBalance = Number((cdbm.balIn && cdbm.balIn.value) || 0);
      cdbm_renderTotals();
      return;
    }
    if(act === 'resetBalance'){
      cdbm.baseBalance = 0;
      if(cdbm.balIn) cdbm.balIn.value = '';
      cdbm_renderTotals();
      return;
    }
    if(act === 'clear'){
      cdbm.items = [];
      cdbm_renderTotals();
      cdbm_renderChips();
      return;
    }
    if(act === 'copyReport'){
      cdbm_copyText(cdbm_reportText());
      return;
    }
    if(act === 'addManualEarn'){
      var v1 = Number((cdbm.manualEl && cdbm.manualEl.value) || 0);
      if(v1){ cdbm_addOp('Вручную', v1, 'earn'); if(cdbm.manualEl) cdbm.manualEl.value=''; }
      return;
    }
    if(act === 'addManualSpend'){
      var v2 = Number((cdbm.manualEl && cdbm.manualEl.value) || 0);
      if(v2){ cdbm_addOp('Вручную', v2, 'spend'); if(cdbm.manualEl) cdbm.manualEl.value=''; }
      return;
    }
    return;
  }

  var row2 = cdbm_closest(t, 'cdbm__row');
  if(row2 && row2.getAttribute){
    var labelEl2 = row2.getElementsByClassName('t')[0];
    if(!labelEl2) return;

    var label2 = String(labelEl2.textContent).trim();
    var val2 = row2.getAttribute('data-val');
    var type2 = row2.getAttribute('data-type') || 'earn';

    cdbm_flashRow(row2, type2 === 'spend');
    cdbm_addOp(label2, val2, type2);
  }
}

function cdbm_closest(el, className){
  while(el && el !== document){
    if(el.classList && el.classList.contains(className)) return el;
    el = el.parentNode;
  }
  return null;
}
function cdbm_closestAttr(el, attr){
  while(el && el !== document){
    if(el.getAttribute && el.getAttribute(attr) != null) return el;
    el = el.parentNode;
  }
  return null;
}
