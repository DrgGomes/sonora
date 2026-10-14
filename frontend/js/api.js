/* ===== Sonora — camada de API =====
   Fonte: iTunes Search API (pública, grátis, sem chave, CORS aberto).
   Retorna faixas mundiais com preview oficial de 30s (m4a/AAC) — sem anúncios.
   Se um dia quiser catálogo completo/playslists com login, o backend/ tem o
   caminho para um proxy próprio. */

const API = 'https://itunes.apple.com/search';
const LOOKUP = 'https://itunes.apple.com/lookup';
const CHARTS = 'https://rss.marketingtools.apple.com/api/v2/br/music/most-played/50/songs.json';

const GENRES = ['Em alta','Pop','Rock','Sertanejo','Funk','K-pop','Anime','Hip-hop','Eletrônica','MPB','Reggae','Gospel'];

function fmt(ms){ // ms -> m:ss
  if(!ms) return '—';
  const s = Math.round(ms/1000);
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
}

function normalize(t){
  return {
    id: t.trackId,
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName || '',
    art: (t.artworkUrl100 || '').replace('100x100bb','600x600bb'),
    preview: t.previewUrl,
    time: fmt(t.trackTimeMillis)
  };
}

async function searchSongs(term, limit = 50){
  const url = `${API}?term=${encodeURIComponent(term)}&entity=song&limit=${limit}&country=BR`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  return (data.results || []).filter(t => t.previewUrl).map(normalize);
}

/* Chart oficial (Apple Music BR) + preview resolvido em lote via lookup.
   Se falhar, cai para busca de hits. */
async function trendingSongs(){
  try{
    const res = await fetch(CHARTS);
    if(!res.ok) throw new Error();
    const data = await res.json();
    const chart = (data.feed?.results || []).map(t => normalize({
      trackId: t.id,
      trackName: t.name,
      artistName: t.artistName,
      collectionName: t.albumName,
      artworkUrl100: t.artwork?.url || t.artworkUrl100 || ''
    }));
    if(!chart.length) throw new Error();
    const ids = chart.map(t => t.id).join(',');
    const lk = await fetch(`${LOOKUP}?id=${ids}&country=BR`);
    const ldata = await lk.json();
    const previews = new Map(
      (ldata.results || []).filter(t => t.previewUrl).map(t => [t.trackId, t])
    );
    return chart
      .map(t => ({ ...t, preview: previews.get(t.id)?.previewUrl,
                   time: fmt(previews.get(t.id)?.trackTimeMillis) }))
      .filter(t => t.preview);
  }catch(e){
    return searchSongs('top hits', 50);
  }
}
