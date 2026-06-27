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
    config.js
    app.js
.nojekyll
```

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
