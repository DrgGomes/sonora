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
    setPlayIcon('loading');
    /* 1ª tentativa: URL direta (stream progressivo, começa a tocar já) */
    try{
      this.audio.src = t.preview;
      await this.audio.play();
      prefetchNext();
      return;
    }catch(e){ /* segue para o blob */ }
    if(myToken !== loadToken) return;
    /* 2ª tentativa: fetch + blob (Audius; contorna cadeia de redirects) */
    try{
      const url = await getStreamUrl(t);
      if(myToken !== loadToken) return;
      this.audio.src = url;
      await this.audio.play();
      prefetchNext();
    }catch(e){
      if(myToken === loadToken){
        setPlayIcon('play');
        document.getElementById('artist').textContent = 'Falha ao carregar o áudio — tente outra faixa';
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

/* Pré-carrega a próxima faixa (Audius) em segundo plano: troca instantânea */
function prefetchNext(){
  const q = Player.queue, i = Player.idx;
  const nxt = Player.shuffle ? null : (q[i+1] || (q.length > 1 ? q[0] : null));
  if(nxt && nxt.source === 'audius' && !blobCache.has(nxt.id)){
    fetch(nxt.preview).then(r => r.ok ? r.blob() : null).then(b => {
      if(b) blobCache.set(nxt.id, URL.createObjectURL(b));
    }).catch(()=>{});
  }
}

/* ---- ícones SVG do player ---- */
const ICON = {
  play:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  load:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><path d="M12 3a9 9 0 1 0 9 9" stroke-linecap="round"/></svg>'
};

function setPlayIcon(state){
  document.getElementById('btn-play').innerHTML = ICON[state] || ICON.play;
}

/* ---- UI do player ---- */
function updatePlayerUI(t){
  document.getElementById('art').src = t.art || 'assets/icon.svg';
  document.getElementById('title').textContent = t.title;
  document.getElementById('artist').textContent = t.artist;
  markPlaying(t.id);
  document.getElementById('btn-fav').classList.toggle('faved',
    getFavs().some(f => f.id === t.id));
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

  const setIconFromState = () => setPlayIcon(Player.audio.paused ? 'play' : 'pause');
  Player.audio.addEventListener('play', setIconFromState);
  Player.audio.addEventListener('pause', setIconFromState);
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
    favBtn.classList.toggle('faved', i < 0);
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
