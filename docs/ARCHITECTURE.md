# Sonora — Arquitetura

## Visão geral

```
┌───────────────────────────  Navegador (mobile-first)  ───────────────────────────┐
│  frontend/ (estático)                                                           │
│  index.html · css/style.css · js/{api,player,app}.js · sw.js (PWA)              │
│      │ fetch HTTPS (CORS aberto)                                                │
│      ▼                                                                          │
│  APIs públicas de catálogo                                                      │
│  • itunes.apple.com/search        → busca mundial + preview 30s (m4a)           │
│  • rss.applemarketingtools.com    → chart "Em alta" (BR)                        │
│                                                                                  │
│  (opcional, fase 2)                                                             │
│      │ fetch /api/*                                                             │
│      ▼                                                                          │
│  backend/ (Node/Express) → proxy/cache das mesmas APIs, playlists e login       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Decisões

| # | Decisão | Motivo |
|---|---------|--------|
| 1 | **iTunes Search API como fonte de músicas** | Gratuita, sem chave, CORS `*`, cobre catálogo mundial e devolve `previewUrl` (30s AAC) pronto para `<audio>`. |
| 2 | **Preview oficial em vez de "pular anúncio de YouTube"** | O preview é distribuído publicamente pela própria Apple — tocar direto da fonte não exige contornar propaganda nem viola ToS. YouTube não expõe áudio direto; extrair seria quebra de termos e instável. |
| 3 | **Frontend estático puro** | Deploy grátis (GitHub Pages/Netlify/Vercel), carregamento rápido em 3G, sem build. |
| 4 | **PWA + service worker** | Instala na tela inicial como app; interface abre offline. |
| 5 | **Estado no localStorage** | Favoritos e recentes funcionam sem login/backend. |
| 6 | **Backend opcional em `backend/`** | Caminho de crescimento: cache, playlists na nuvem, contas. |

## Modelo de dados (cliente)

```ts
Track {
  id: number       // trackId iTunes
  title: string
  artist: string
  album: string
  art: string      // capa 600x600
  preview: string  // URL m4a 30s
  time: string     // duração completa formatada
}
```

Persistência local: `sonora:favs` (favoritos), `sonora:recents` (últimas tocadas, máx. 30).

## Roadmap

1. **v1 (atual)** — busca, charts, player, favoritos, PWA.
2. **v2** — playlists nomeadas, compartilhar música (deep link `?q=`).
3. **v3** — backend: playlists na nuvem + contas (login).
4. **v4** — letras de música (API de lyrics) e modo "descobrir" semanal.
