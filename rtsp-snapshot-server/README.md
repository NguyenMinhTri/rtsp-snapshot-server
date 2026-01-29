# RTSP Snapshot Server

Camera snapshot server để thay thế Vercel video streaming.

## Features
- Chụp snapshot từ RTSP mỗi 10s
- Cache và share 1 ảnh cho nhiều clients
- Trả về thông tin countdown qua headers

## Deploy lên Render.com

### 1. Tạo Repository trên GitHub
```bash
cd rtsp-snapshot-server
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rtsp-snapshot-server.git
git push -u origin main
```

### 2. Deploy trên Render.com
1. Đăng ký tài khoản tại https://render.com (không cần thẻ)
2. Chọn "New" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - **Name**: `rtsp-snapshot`
   - **Region**: Singapore (gần VN nhất)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variable: `PORT=3001`
6. Click "Create Web Service"

### 3. Cài FFmpeg trên Render
Tạo file `render.yaml` trong repo:
```yaml
services:
  - type: web
    name: rtsp-snapshot
    env: node
    buildCommand: apt-get update && apt-get install -y ffmpeg && npm install
    startCommand: npm start
```

## API Endpoints

### GET /snapshot?url=RTSP_URL
Trả về ảnh JPEG với headers:
- `X-Snapshot-Age`: Tuổi của ảnh (ms)
- `X-Next-Refresh`: Thời gian đến ảnh tiếp theo (ms)

### GET /info?url=RTSP_URL
Trả về JSON:
```json
{
  "cached": true,
  "age": 3000,
  "nextRefresh": 7000,
  "interval": 10000
}
```

### GET /health
Health check cho Render.com

## Local Development
```bash
npm install
npm start
# Server chạy tại http://localhost:3001
```
