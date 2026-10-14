# Sonora YT-Pessoal — USO PESSOAL do dono do repo. Não redistribuir.
# yt-dlp busca/transmite áudio do YouTube. Viola ToS do YouTube; pode quebrar a qualquer mudança deles.
import subprocess, json, os
import requests as rq
from flask import Flask, request, Response, jsonify, send_from_directory

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.environ.get('FRONTEND_DIR') or os.path.join(BASE_DIR, 'frontend')
if not os.path.exists(os.path.join(FRONTEND_DIR, 'index.html')):
    # rodando do repo sem Docker: frontend fica em ../../frontend
    alt = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'frontend'))
    if os.path.exists(os.path.join(alt, 'index.html')):
        FRONTEND_DIR = alt
YTDLP = ['python3', '-m', 'yt_dlp']  # portável (funciona com pip --user)

# Provedor de tokens POT (bgutil) — ajuda a passar do bot-check em IPs de nuvem
POT_SERVER = os.environ.get('POT_SERVER')  # ex.: http://bgutil-provider:4416
# Cookies opcionais (recomendado: conta descartável do Google, configurado 1x)
COOKIES = os.environ.get('YTDLP_COOKIES')

def ytdlp_args():
    args = []
    if POT_SERVER:
        args += ['--extractor-args', f'youtubepot-bgutilhttp:base_url={POT_SERVER}']
    if COOKIES and os.path.exists(COOKIES):
        args += ['--cookies', COOKIES]
    return args

def cors(r):
    r.headers['Access-Control-Allow-Origin'] = '*'
    return r

# ---- frontend na mesma origem (link único pra família: http://servidor:5000/) ----
@app.get('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.get('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.get('/health')
def health():
    return cors(jsonify(ok=True))

@app.get('/api/search')
def search():
    q = (request.args.get('q') or '').strip()[:120]
    if not q:
        return cors(jsonify(error='q obrigatório')), 400
    try:
        out = subprocess.run(
            YTDLP + ytdlp_args() + ['-j', '--flat-playlist', '--no-warnings', f'ytsearch15:{q}'],
            capture_output=True, text=True, timeout=90)
        rows = []
        for line in out.stdout.strip().splitlines():
            try:
                t = json.loads(line)
                if t.get('_type') == 'playlist' or not t.get('id'):
                    continue
                rows.append({
                    'id': t.get('id'),
                    'title': t.get('title'),
                    'uploader': t.get('uploader') or t.get('channel') or 'YouTube',
                    'duration': t.get('duration') or 0,
                    'thumbnail': t.get('thumbnail') or ''
                })
            except Exception:
                pass
        if not rows and out.stderr:
            app.logger.warning('yt-dlp: %s', out.stderr[:300])
        return cors(jsonify(rows))
    except Exception as e:
        return cors(jsonify(error=str(e))), 502

@app.get('/stream')
def stream():
    vid = (request.args.get('id') or '').strip()
    if not vid:
        return cors(jsonify(error='id obrigatório')), 400
    try:
        out = subprocess.run(
            YTDLP + ytdlp_args() + ['-f', 'bestaudio', '-g', '--no-warnings',
                                    f'https://www.youtube.com/watch?v={vid}'],
            capture_output=True, text=True, timeout=90)
        lines = [l for l in out.stdout.strip().splitlines() if l.startswith('http')]
        if not lines:
            return cors(jsonify(error='sem stream: ' + (out.stderr or '')[:200])), 502
        url = lines[-1]
        headers = {'User-Agent': 'Mozilla/5.0'}
        rng = request.headers.get('Range')
        if rng:
            headers['Range'] = rng
        up = rq.get(url, headers=headers, stream=True, timeout=60)

        def gen():
            try:
                for chunk in up.iter_content(64 * 1024):
                    if chunk:
                        yield chunk
            finally:
                up.close()

        resp = Response(gen(), status=up.status_code)
        for h in ('Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'):
            if h in up.headers:
                resp.headers[h] = up.headers[h]
        if 'Content-Type' not in resp.headers:
            resp.headers['Content-Type'] = 'audio/webm'
        return cors(resp)
    except Exception as e:
        return cors(jsonify(error=str(e))), 502

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))