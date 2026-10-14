/* ===== Sonora — app (busca, categorias, lista) ===== */

const $ = s => document.querySelector(s);

function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let state = { songs: [], label: 'Em alta' };

function setStatus(html){
  $('#list').innerHTML = `<div class="status">${html}</div>`;
}

function renderList(songs, label){
  state.songs = songs; state.label = label;
  $('#listTitle').textContent = label;
  if(!songs.length){ setStatus('Nada encontrado 😕<br>Tente outro termo.'); return; }
  $('#list').innerHTML = songs.map((t,i) => `
    <button class="row" data-i="${i}" data-id="${t.id}">
      <img src="${t.art}" loading="lazy" alt="">
      <span class="row-meta"><strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span>
      <span class="row-time">${t.time}</span>
    </button>`).join('');
  $('#list').querySelectorAll('.row').forEach(r =>
    r.addEventListener('click', () => Player.load(state.songs, +r.dataset.i)));
  markPlaying(Player.current()?.id);
}

function renderChips(active){
  const recents = JSON.parse(localStorage.getItem('sonora:recents') || '[]');
  const names = recents.length ? ['Recentes', ...GENRES] : GENRES;
  $('#chips').innerHTML = names.map(n =>
    `<button class="chip ${n===active?'active':''}" data-chip="${esc(n)}">${esc(n)}</button>`).join('');
  $('#chips').querySelectorAll('.chip').forEach(c =>
    c.addEventListener('click', () => go(c.dataset.chip)));
}

async function go(label){
  renderChips(label);
  setStatus('<div class="spinner"></div>Carregando…');
  try{
    if(label === 'Em alta'){
      renderList(await trendingSongs(), 'Em alta');
    }else if(label === 'Recentes'){
      const r = JSON.parse(localStorage.getItem('sonora:recents') || '[]');
      renderList(r, 'Recentes');
    }else{
      renderList(await searchSongs(label, 50), label);
    }
  }catch(e){
    setStatus('Falha ao carregar 😬<br>Verifique a conexão e recarregue.');
  }
}

let deb;
document.getElementById('search').addEventListener('input', e => {
  clearTimeout(deb);
  const q = e.target.value.trim();
  deb = setTimeout(() => {
    if(q.length >= 2) doSearch(q);
    else go('Em alta');
  }, 450);
});

async function doSearch(q){
  renderChips('');
  setStatus('<div class="spinner"></div>Buscando…');
  try{ renderList(await searchSongs(q, 50), `Resultados: “${q}”`); }
  catch(e){ setStatus('Falha na busca 😬'); }
}

/* alternador de fonte (YT pessoal / Audius / Apple) */
function initSourceToggle(){
  const el = document.getElementById('srcToggle');
  const sync = () => el.querySelectorAll('button').forEach(b =>
    b.classList.toggle('on', b.dataset.src === getSource()));
  sync();
  el.querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => {
      if(b.dataset.src === getSource()) return;
      if(b.dataset.src === 'yt' && !location.origin.includes('github.io') && !location.origin.includes('localhost:8090')){
        // servido pelo próprio backend (link único): já configurado, sem prompt
        localStorage.setItem('sonora:ytbase', location.origin);
      }else if(b.dataset.src === 'yt'){
        const base = prompt(
          'URL do backend YT:\n' +
          '• PC local: http://localhost:5000\n' +
          '• Railway/Render/VPS: https://seu-servico.up.railway.app',
          ytBase());
        if(base === null) return;
        if(base.trim()) localStorage.setItem('sonora:ytbase', base.trim());
      }
      setSource(b.dataset.src);
      sync();
      go(state.label === 'Em alta' || !state.label ? 'Em alta' : state.label);
    }));
}

/* start */
initSourceToggle();
initPlayerUI();
go('Em alta');

/* service worker (PWA) */
if('serviceWorker' in navigator){
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
