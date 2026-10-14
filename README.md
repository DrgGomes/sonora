# 🎵 Sonora

Player de música web, **mobile-first**, tema escuro com acento vermelho — estilo Spotify.
Acesse pelo link, ouça, busque e favorite. **Sem anúncios.**

## Como funciona (resumo)

- **Fonte principal — Audius** ([docs.audius.org](https://docs.audius.org/developers/api)): protocolo aberto de música, **faixas COMPLETAS** (não prévias), streaming direto, CORS aberto, grátis (500 mil req/mês no plano free). Catálogo de artistas independentes que publicam de livre vontade — 100% legal, sem anúncios.
- **Fonte alternativa — Apple/iTunes**: prévias oficiais de 30s do catálogo mundial (alternador na tela inicial).
- **Áudio no navegador**: o stream do Audius é baixado via `fetch` (CORS liberado) e reproduzido via blob URL — contorna a limitação de redirects do elemento `<audio>`, com fallback para URL direta.
- **Frontend**: HTML/CSS/JS puro — leve, rápido, funciona em qualquer hospedagem estática.
- **Backend**: opcional; proxy de referência em `backend/` para uso futuro (playlists próprias, login, cache).

## Estrutura

```
sonora/
├── frontend/        # app (deployável como site estático)
│   ├── index.html
│   ├── css/style.css
│   ├── js/          # api.js · player.js · app.js
│   ├── sw.js        # service worker (PWA)
│   ├── manifest.json
│   └── assets/
├── backend/         # proxy opcional (Node/Express) — ver README dentro
└── docs/            # arquitetura, decisões e roadmap
```

## Rodar local

```bash
cd frontend
python3 -m http.server 8080
# abra http://localhost:8080
```

## Publicar com link (GitHub Pages)

1. Settings → Pages → Source: `main` / pasta `frontend/` (ou via Actions).
2. O app fica disponível em `https://<usuario>.github.io/sonora/`.
3. Instalável no celular: "Adicionar à tela inicial" (PWA).

## Funcionalidades

- 🔍 Busca mundial (música ou artista)
- 📈 Em alta (chart Apple Music BR) + categorias (Pop, Rock, Sertanejo, K-pop, Anime…)
- ▶️ Player com capa, progresso, anterior/próxima, aleatório e fila
- ♡ Favoritos e 🕘 recentes salvos no aparelho (localStorage)
- 📱 PWA: instala na tela inicial e abre offline (interface)

## Branches

- `main` — produção
- `dev` — desenvolvimento

## Licença

MIT — código do app. Conteúdo musical pertence aos respectivos detentores, servido via iTunes/Apple.
