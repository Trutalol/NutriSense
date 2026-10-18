# NutriSense frontend and server

See the repository-root `README.md` for features, setup and how the score works.

Quick start (from this folder, Node.js 22+):

```powershell
npm.cmd install
npm.cmd start                              # dashboard at the printed Local URL
npm.cmd run replay -- --interval 0.1       # second terminal: load residents and care logs
npm.cmd test
```

`DATABASE_URL` is read from the repository-root `.env`. Only `index.html`, `app.js`, `style.css` and `logo.png` are served to the browser.
