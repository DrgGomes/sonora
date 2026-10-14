# Sonora — Backend (opcional, referência)

Proxy em Node/Express para as APIs de catálogo. **Não é necessário para o app
funcionar** (o frontend chama as APIs diretamente). Use quando quiser:

- cache/respostas estáveis (a API pública tem limite de ~20 req/min por IP);
- playlists e contas de usuário (fase 3 do roadmap).

## Endpoints planejados

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/search?q=<termo>&limit=50` | Busca de músicas (proxy iTunes) |
| GET | `/api/trending` | Chart "Em alta" (BR) |
| GET | `/health` | Health check |

## Rodar

```bash
npm install
npm start          # porta 3000
```

## Deploy sugerido

Render / Railway / Fly.io (plano gratuito). Depois, no `frontend/js/api.js`,
aponte `API` para `https://<seu-backend>/api` e `CHARTS` para `/api/trending`.
