# Sonora YT-Pessoal — backend de streaming (USO PESSOAL)

Proxy mínimo que usa [yt-dlp](https://github.com/yt-dlp/yt-dlp) para buscar e
transmitir áudio do YouTube para o app Sonora. **Somente para uso pessoal do
dono do repositório** — não distribua o serviço publicamente; isso viola os
Termos de Serviço do YouTube. Pode parar de funcionar quando o YouTube mudar
algo (atualize com `pip install -U yt-dlp`).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/search?q=<termo>` | Busca no YouTube (15 resultados) |
| GET | `/stream?id=<videoId>` | Áudio do vídeo (mp4/webm), suporta Range (seek) |
| GET | `/health` | Health check |

## Rodar no PC (teste rápido)

```bash
pip install -r requirements.txt
python server.py        # porta 5000
```

No app: fonte **▶ YT** → informe `http://localhost:5000`
(funciona no Chrome desktop: páginas HTTPS podem chamar localhost).

## Rodar em qualquer lugar (celular) — Render grátis

1. render.com → New → Web Service → conecte este repositório
2. Root directory: `backend/yt-proxy`
3. Build: `pip install -r requirements.txt` · Start: `python server.py`
4. No app: fonte **▶ YT** → informe a URL do serviço (ex.: `https://sonora-yt.onrender.com`)

> Free tier do Render "dorme" ~15 min sem uso (primeira música demora ~40s).
> YouTube às vezes pede verificação em IPs de nuvem — no seu PC funciona melhor.
