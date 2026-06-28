# Binary Tower Visualizer

A static, GitHub Pages-ready version of the Binary Tower audio visualizer. No build step is required.

## Project structure

```text
index.html
assets/
  css/
    main.css
    loop-editor.css
  js/
    config.js      Immutable defaults and viewport presets
    core.js        Shared state, DOM element handles, engine constants
    utils.js       Pure helpers (colors, time formatting, math)
    viewport.js    Viewport sizing, presets, canvas/resolution layout
    analysis.js    FFT, audio analysis, spectrogram history
    renderer.js    Terrain geometry, HUD, logo, draw loop
    playback.js    Audio graph, synchronized playback clock
    loop.js        Loop selection, waveform/minimap, BPM popup
    loader.js      Audio file loading and progress UI
    reset.js       Reset-to-defaults for each control section
    controls.js    Collapsible sections, value editors, color inputs
    export.js      PNG / video / JSON export
    app.js         Entry point: wires events and boots the app
.nojekyll
```

The JavaScript is split into focused ES modules that share a single `core.js`
(state and DOM handles) so each concern can be edited in isolation. `app.js`
imports the modules, binds all event listeners, and starts the render loop.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

The site will load from the GitHub Pages URL shown in the Pages settings.

## Local testing

Because the JavaScript uses ES modules, serve the folder over HTTP rather than opening `index.html` directly from the filesystem.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## External browser resources

The app loads the Cozette font and video-container libraries from jsDelivr. GitHub Pages therefore requires an internet connection when the app first loads or exports video.
