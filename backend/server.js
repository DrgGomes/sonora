// Sonora — backend de referência (proxy opcional das APIs de catálogo)
// npm install express && npm start
const express = require('express');
const app = express();

const ITUNES = 'https://itunes.apple.com/search';
const LOOKUP = 'https://itunes.apple.com/lookup';
const CHARTS = 'https://rss.marketingtools.apple.com/api/v2/br/music/most-played/50/songs.json';

const toTrack = t => ({
  id: t.trackId,
  title: t.trackName,
  artist: t.artistName,
  album: t.collectionName || '',
  art: (t.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
  preview: t.previewUrl,
  time: t.trackTimeMillis
    ? `${Math.floor(t.trackTimeMillis / 60000)}:${String(Math.round(t.trackTimeMillis / 1000) % 60).padStart(2, '0')}`
    : null
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().slice(0, 120);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    if (!q) return res.status(400).json({ error: 'q obrigatório' });
    const url = `${ITUNES}?term=${encodeURIComponent(q)}&entity=song&limit=${limit}&country=BR`;
    const r = await fetch(url);
    const data = await r.json();
    res.json((data.results || []).filter(t => t.previewUrl).map(toTrack));
  } catch (e) {
    res.status(502).json({ error: 'upstream' });
  }
});

app.get('/api/trending', async (_req, res) => {
  try {
    const r = await fetch(CHARTS);
    const data = await r.json();
    const chart = (data.feed?.results || []).map(t => toTrack({
      trackId: t.id,
      trackName: t.name,
      artistName: t.artistName,
      collectionName: t.albumName,
      artworkUrl100: t.artwork?.url || t.artworkUrl100 || ''
    }));
    if (!chart.length) return res.json([]);
    const ids = chart.map(t => t.id).join(',');
    const lk = await fetch(`${LOOKUP}?id=${ids}&country=BR`);
    const ldata = await lk.json();
    const previews = new Map(
      (ldata.results || []).filter(t => t.previewUrl).map(t => [t.trackId, t])
    );
    res.json(chart
      .map(t => ({ ...t, preview: previews.get(t.id)?.previewUrl || null }))
      .filter(t => t.preview));
  } catch (e) {
    res.status(502).json({ error: 'upstream' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sonora backend na porta ${PORT}`));
