# CustomCardMaker

A React + TypeScript + Material UI MVP for designing folded greeting cards on US Letter landscape paper.

## Run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://127.0.0.1:3001/`.

## Build

```bash
npm run build
```

## MVP Features

- Canva-like desktop editor layout with top app bar, left tool rail, center workspace, and right properties panel.
- Outside/Inside segmented editing views.
- US Letter landscape document model at 11 x 8.5 aspect ratio.
- Outside labels: Back Cover and Front Cover.
- Inside labels: Inside Left and Inside Right.
- Editor-only dashed fold guide and safe-print margins.
- Fabric.js object editing for selecting, moving, resizing, rotating, text, shapes, image uploads, freehand drawing, delete, undo, redo, and background color.
- Per-side serialized canvas state for future save/load/template workflows.
- Print/export flow renders clean 300 DPI PNGs at 3300 x 2550 for Outside and Inside, without editor overlays.
- Print guidance for landscape paper, duplex/manual duplex, and folding.
