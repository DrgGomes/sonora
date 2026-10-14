# 🚀 Sonora Servidor 24/7 — configurar UMA vez, família usa o link

Objetivo: você configura um servidor na nuvem uma única vez. Depois, **o link
que você compartilhar já abre o app pronto** — esposa, irmão, qualquer um:
abrir, buscar, tocar. Sem código, sem link gerado, sem login.

> ⚠️ Uso pessoal/familiar. O proxy de YouTube viola os ToS do YouTube e pode
> parar de funcionar se eles mudarem algo (atualize com `pip install -U yt-dlp`).

## Como funciona

```
Celular da esposa ─┐
Celular seu ───────┼──▶  SEU SERVIDOR (Railway, grátis p/ testar)
Seu irmão ─────────┘          ├── app Sonora (página)
                              └── yt-dlp → YouTube (áudio, sem anúncio)
                                  + provedor de tokens POT (passa do bot-check)
```

O app detecta sozinho quando é servido pelo backend (mesma origem) e configura
a fonte YT automaticamente — **ninguém precisa digitar nada**.

## Opção A — Oracle Cloud Always Free (R$ 0, pra sempre, 24/7)

Servidor gratuito vitalício da Oracle — ideal pro caso "configura 1x e esquece".

1. oracle.com/cloud → **Start for free** (pede cartão só pra verificar; não cobra o Always Free).
2. Console → Compute → **Create instance**:
   - Shape: **VM.Standard.A1.Flex** (Ampere, ARM) com **2 OCPU / 12 GB** (limite free atual, jun/2026)
   - Sistema: **Ubuntu 24.04**
   - Sem ARM disponível na sua região? Use a **VM.Standard.E2.1.Micro** (AMD, também free).
3. Marque nas opções de rede: "Assign public IPv4" e baixe a chave SSH.
4. Após criar: VNIC → IPv4 → **ingress rules** → libere TCP 5000 (source `0.0.0.0/0`).
5. Conecte e suba tudo:
```bash
ssh ubuntu@SEU-IP
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu  # depois releia a sessão
git clone https://github.com/DrgGomes/sonora && cd sonora
docker compose up -d
```
6. **Link da família: `http://SEU-IP:5000`** — abre o app com YT já configurado.

> Se o YouTube pedir verificação no IP do Oracle: o compose já roda o provedor
> POT (bgutil). Persistindo, use cookies de conta descartável (guia abaixo).

## Opção B — Railway (~US$5/mês, 1 clique)

1. Acesse **railway.com** → sign in com GitHub → **New Project** → **Deploy from GitHub repo** → escolha `DrgGomes/sonora`.
2. O Railway lê o `railway.json` e sobe tudo sozinho (app + yt-proxy).
3. Em **Settings → Networking → Generate Domain**: cria o link tipo `https://sonora.up.railway.app`.
4. **Pronto.** Esse link é o app completo. Manda pra esposa/irmão — abre e usa.

> Trial do Railway dá uso suficiente pra testar; depois é ~US$ 5/mês (ou use a Opção B).

## Opção C — VPS barato (Hetzner/Contabo/DigitalOcean, ~US$ 4-6/mês, 24/7 garantido)

1. Cria o VPS com Ubuntu 24.04 e Docker instalado.
2. Na máquina:
```bash
git clone https://github.com/DrgGomes/sonora && cd sonora
docker compose up -d
```
3. App no ar em `http://IP-DO-VPS:5000` — esse é o link da família.
4. (Opcional, HTTPS): aponte um domínio seu com Cloudflare na frente, ou use Caddy.

> VPS tem IP limpo + estável = menos chance do bot-check do YouTube atrapalhar.
> O `docker-compose.yml` já sobe o provedor de tokens POT junto.

## Opção D — PC em casa + Cloudflare Tunnel (grátis, PC ligado)

```bash
git clone https://github.com/DrgGomes/sonora && cd sonora
pip install -r backend/yt-proxy/requirements.txt
python backend/yt-proxy/server.py          # terminal 1
cloudflared tunnel --url http://localhost:5000   # terminal 2
```
O link `trycloudflare.com` gerado é o app completo — manda pra família.
(Muda a cada reinício do túnel; pra link fixo, conta grátis no Cloudflare + domínio.)

## Se o YouTube pedir verificação no servidor

- O `docker-compose.yml` já inclui o **provedor POT** (bgutil) — resolve a maioria.
- Caso persista: crie uma conta Google nova (descartável), faça login no
  navegador do servidor/VPS, exporte os cookies (`cookies.txt`) e passe ao
  container via variável `YTDLP_COOKIES=/app/cookies.txt` (volume mapeado).
  Configurado 1x, esquece.

## Atualizações

`git pull && docker compose up -d --build` (VPS) — ou push no repo (Railway redeploya sozinho).
