FROM python:3.12-slim
WORKDIR /app
COPY backend/yt-proxy/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/yt-proxy/server.py /app/server.py
COPY frontend/ /app/frontend/
ENV FRONTEND_DIR=/app/frontend
EXPOSE 5000
CMD ["python", "server.py"]
