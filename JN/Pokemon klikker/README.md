# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Renegade Platinum — Number Generator (new)

Added a small demo component `NumberGenerator` that:

- Generates a number 1–6 with an animated roll instead of instantly picking.
- Randomly chooses one of the 18 Pokémon types and highlights the number with that type's color (data in `src/data/typeColors.json`).
- Uses a Platinum-inspired palette and small CSS glow animation.

Enhancements:
- The widget background now animates and pulses when a type is selected — the animation uses the selected type's color and the emoji icon (no external assets required).
- Type icons are shown inside the type pill; the background pulse provides an engaging Platinum look.
 - The entire page background now animates/pulses when a type is selected — this makes the screen-share visually obvious during Discord VC and highlights the chosen type across the page.

Usage: start the dev server and click the **Generate** button on the home page.
Note: This project now includes a standalone version of the Number Generator that does NOT require npm or Vite.

To run the standalone app (no npm required):

1. Place the project folder in a web server root (for example, MAMP's htdocs) or start any static file server that serves the folder.
2. Open the configured URL in your browser. The counter widget will initialize automatically using `number-generator.js` and `number-generator.css`.

If you prefer to use the Vite / React dev environment (optional), you can still run `npm install` and `npm run dev`.
