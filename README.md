# Meridian

A local, diagram-first Mermaid viewer powered by [Pele](https://pele.run). Light theme by default, with a persistent dark-theme toggle.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 (or the port Vite prints).

## Use

- Paste Mermaid syntax, including a fenced `mermaid` code block. The first valid diagram automatically opens in the viewer after a short pause.
- Click **Edit source** to open the editor alongside the diagram. Changes update live without closing the editor.
- Click **View diagram**, or press **⌘/Ctrl + Enter**, to toggle the editor.
- Invalid source shows an error while preserving the last valid diagram.
- Use **Light / Dark** in the canvas corner to switch themes.
- Diagrams render inline at their natural size, shrinking to fit narrow pages. Tall diagrams scroll with the page, with no clipped canvas or separate preview window. Use browser zoom to enlarge the page.
- **Export SVG** downloads the last valid diagram with the current theme embedded.
- **New diagram** clears the current draft after confirmation.

Every page load starts fresh. Diagram source stays in memory only and is never saved to local storage. Previously stored drafts are removed on load. Only your theme preference is remembered. There is no server-side storage, analytics, account, or remote font. Diagram images and links are disabled to avoid diagram-triggered network requests and navigation. This is a Mermaid diagram viewer, not a general Markdown document renderer.

## GitHub Pages

The included `.github/workflows/pages.yml` builds and deploys on pushes to `main`.
In your GitHub repository, select **Settings → Pages → Source → GitHub Actions**.
The Vite relative asset base supports project URLs such as `/mermaid-viewer/`.

The public site processes diagrams locally in each visitor's browser. Diagram source
is not persisted or uploaded to GitHub, and every page load starts empty.

## Checks

```sh
npm run build
npx playwright install chromium  # first time only
npm test
```

The main Pele entry point includes every supported diagram type. Vite may warn about the bundle size; this deliberately trades code splitting for all-types support without runtime fetching.
