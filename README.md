# 🎵 Sonora

Player de música web, **mobile-first**, tema escuro com acento vermelho — estilo Spotify.
Acesse pelo link, ouça, busque e favorite. **Sem anúncios.**

## Como funciona (resumo)

- **Catálogo**: [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTunesSearchAPI/) — pública, grátis, sem chave, com músicas do mundo todo e CORS aberto.
- **Áudio**: *previews oficiais de 30s* (AAC/m4a) servidos pela Apple — é conteúdo licenciado distribuído gratuitamente pela própria API, então **não há necessidade (nem base legal) de contornar anúncios** de terceiros.
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
