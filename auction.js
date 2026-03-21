(function(){
  var statusEl = document.getElementById('aucmini-status');
  var timeEl = document.getElementById('aucmini-time');

  if(!statusEl || !timeEl) return;

  function pad(n){
    return (n < 10 ? '0' : '') + n;
  }

  function updateAuction(){
    var now = new Date();

    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    var msk = new Date(utc + 3 * 60 * 60 * 1000);

    var h = msk.getHours();
    var m = msk.getMinutes();
    var s = msk.getSeconds();

    timeEl.textContent = 'мск: ' + pad(h) + ':' + pad(m) + ':' + pad(s);

    if(h >= 10 && h < 20){
      statusEl.textContent = 'аукцион открыт';
      statusEl.className = 'aucmini__status open';
    } else {
      statusEl.textContent = 'аукцион закрыт, ставки не принимаются';
      statusEl.className = 'aucmini__status closed';
    }
  }

  updateAuction();
  setInterval(updateAuction, 1000);
})();
