# sudo

A small, single-screen Sudoku game with a quiet interface and no decorative bureaucracy.

**Play:** https://sudo-puzzle.dmitrii-schtschukin.chatgpt.site

Built with React, TypeScript and Vite.

## Features

- three difficulty levels
- a fresh visual variant for every new game
- timer
- notes mode
- undo and erase
- wrong-number feedback
- local game persistence
- login-and-password accounts stored in the current browser (no email)
- offline-capable PWA
- iPhone safe-area support

The current account layer is intentionally local: a login, password hash and game progress stay in that browser. Cross-device accounts will be added with the self-hosted Supabase backend.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm install
npm run build
npm run preview
```

The public build is deployed with ChatGPT Sites.

(c) Dmitrii Shchukin 2026
