/* ===== Sonora — motor de reprodução ===== */

/* Audius: o <audio> não segue a cadeia de redirects do stream — baixamos via
   fetch (CORS ok) e tocamos via blob URL. Cache por faixa na sessão. */
const blobCache = new Map();
let loadToken = 0;

async function getStreamUrl(t){
  if(t.source !== 'audius') return t.preview;
  if(blobCache.has(t.id)) return blobCache.get(t.id);
  try{
    const res = await fetch(t.preview);
    if(!res.ok) throw new Error('stream ' + res.status);
    const url = URL.createObjectURL(await res.blob());
    blobCache.set(t.id, url);
    return url;
  }catch(e){
    return t.preview; // fallback: tenta URL direta (alguns navegadores seguem os redirects)
  }
}

const Player = {
  audio: new Audio(),
  queue: [],
  idx: -1,
  shuffle: false,

  current(){ return this.queue[this.idx] || null; },

  load(list, i){
    this.queue = list.slice();
    this.idx = i;
    this.play();
  },

  async play(){
    const t = this.current();
    if(!t) return;
    const myToken = ++loadToken;
    updatePlayerUI(t);
    pushRecent(t);
    const playBtn = document.getElementById('btn-play');
    playBtn.textContent = '…';
    try{
      const url = await getStreamUrl(t);
      if(myToken !== loadToken) return; // usuário trocou de faixa enquanto carregava
      this.audio.src = url;
      await this.audio.play();
    }catch(e){
      if(myToken === loadToken){
        playBtn.textContent = '▶';
        document.getElementById('artist').textContent = 'Falha ao carregar o áudio 😕';
      }
    }
  },

  toggle(){
    if(!this.current()) return;
    this.audio.paused ? this.audio.play().catch(()=>{}) : this.audio.pause();
  },

  next(){
    if(!this.queue.length) return;
    loadToken++;
    this.idx = this.shuffle
      ? Math.floor(Math.random() * this.queue.length)
      : (this.idx + 1) % this.queue.length;
    this.play();
  },

  prev(){
    if(!this.queue.length) return;
    loadToken++;
    if(this.audio.currentTime > 3){ this.audio.currentTime = 0; return; }
    this.idx = (this.idx - 1 + this.queue.length) % this.queue.length;
    this.play();
  },

  seek(pct){
    if(this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
  }
};

/* ---- UI do player ---- */
function updatePlayerUI(t){
  document.getElementById('art').src = t.art || 'assets/icon.svg';
  document.getElementById('title').textContent = t.title;
  document.getElementById('artist').textContent = t.artist;
  markPlaying(t.id);
  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist, album: t.album,
        artwork: [{ src: t.art, sizes: '600x600', type: 'image/jpeg' }]
      });
    }catch(e){}
  }
}

function markPlaying(id){
  document.querySelectorAll('.row').forEach(r =>
    r.classList.toggle('playing', String(id) === r.dataset.id));
}

/* ---- integração UI <-> áudio ---- */
function initPlayerUI(){
  const seek = document.getElementById('seek');
  const playBtn = document.getElementById('btn-play');

  Player.audio.addEventListener('timeupdate', () => {
    if(!Player.audio.duration) return;
    seek.value = Player.audio.currentTime;
    seek.max = Player.audio.duration;
    document.getElementById('t0').textContent = Player.audio.currentTime.toFixed(0) >= 0
      ? fmtSecs(Player.audio.currentTime) : '0:00';
    document.getElementById('t1').textContent = fmtSecs(Player.audio.duration);
  });

  function fmtSecs(s){
    s = Math.max(0, Math.floor(s));
    return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
  }

  seek.addEventListener('input', () => {
    if(Player.audio.duration) Player.audio.currentTime = +seek.value;
  });

  playBtn.addEventListener('click', () => Player.toggle());

  const setPlayIcon = () => playBtn.textContent = Player.audio.paused ? '▶' : '⏸';
  Player.audio.addEventListener('play', setPlayIcon);
  Player.audio.addEventListener('pause', setPlayIcon);
  Player.audio.addEventListener('ended', () => Player.next());

  document.getElementById('btn-next').addEventListener('click', () => Player.next());
  document.getElementById('btn-prev').addEventListener('click', () => Player.prev());
  document.getElementById('btn-shuffle').addEventListener('click', e => {
    Player.shuffle = !Player.shuffle;
    e.currentTarget.classList.toggle('on', Player.shuffle);
  });

  /* fila */
  const queueEl = document.getElementById('queue');
  document.getElementById('btn-queue').addEventListener('click', () => {
    queueEl.classList.toggle('hidden');
    if(!queueEl.classList.contains('hidden')) renderQueue();
  });

  /* favoritos (localStorage) */
  const favBtn = document.getElementById('btn-fav');
  favBtn.addEventListener('click', () => {
    const t = Player.current(); if(!t) return;
    const favs = getFavs();
    const i = favs.findIndex(f => f.id === t.id);
    if(i >= 0) favs.splice(i,1); else favs.unshift(t);
    localStorage.setItem('sonora:favs', JSON.stringify(favs.slice(0,100)));
    favBtn.textContent = i >= 0 ? '♡' : '♥';
  });

  if('mediaSession' in navigator){
    navigator.mediaSession.setActionHandler('play', () => Player.toggle());
    navigator.mediaSession.setActionHandler('pause', () => Player.toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => Player.next());
    navigator.mediaSession.setActionHandler('previoustrack', () => Player.prev());
  }
}

function renderQueue(){
  const el = document.getElementById('queue');
  el.innerHTML = '<h3>Fila de reprodução</h3>' + Player.queue.map((t,i) => `
    <button class="row ${i===Player.idx?'playing':''}" data-q="${i}">
      <img src="${t.art}" alt=""><span class="row-meta">
      <strong>${esc(t.title)}</strong><small>${esc(t.artist)}</small></span>
    </button>`).join('');
  el.querySelectorAll('.row').forEach(r =>
    r.addEventListener('click', () => {
      Player.idx = +r.dataset.q;
      Player.play();
    }));
}

function getFavs(){
  try{ return JSON.parse(localStorage.getItem('sonora:favs') || '[]'); }
  catch(e){ return []; }
}

function pushRecent(t){
  let r = [];
  try{ r = JSON.parse(localStorage.getItem('sonora:recents') || '[]'); }catch(e){}
  r = [t, ...r.filter(x => x.id !== t.id)].slice(0, 30);
  localStorage.setItem('sonora:recents', JSON.stringify(r));
}
