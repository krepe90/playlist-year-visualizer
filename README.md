# Playlist Year Visualizer

Spotify 플레이리스트의 트랙들을 발매 연도별로 시각화하는 웹 애플리케이션입니다.

## 기술 스택

- Next.js 16
- React 19
- Better Auth (Spotify OAuth)
- Recharts (차트 시각화)
- Tailwind CSS
- shadcn/ui

## 시작하기

```bash
npm install
npm run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000)에서 확인할 수 있습니다.

## 환경 변수

`.env.local` 파일에 다음 변수들을 설정하세요:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

BETTER_AUTH_URL=http://127.0.0.1:3000
BETTER_AUTH_SECRET=your_secret

# Production URL
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000

# betterauth 데이터베이스 설정
TURSO_DATABASE_URL=file:./sqlite.db
TURSO_AUTH_TOKEN=
```
