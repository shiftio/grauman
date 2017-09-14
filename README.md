# Grauman Asset Viewer

Framework-agnostic HTML5 Media Player, Image Viewer, and Document Viewer for playing/displaying M4A, MP4, Encrypted M3U8, PDF, JPEG, GIF, PNG, and BMP files.

# Support

Supported and tested in following browsers, except for the known gaps listed below:
- IE 11+, Safari 10, Chrome, Firefox, Android, and iOS 10.

Current gaps in browser support:
- HLS: IE 11 does not work at all due to HLS.js not supporting it.
- VR: Experimental module that is currently broken. Expect nothing from it.
- iOS does not support Fullscreen. Since Grauman wraps native web components with it's own UI, Grauman is incapible of entering and exiting fullscreen on all iOS devices.

# Build

Requires npm 3 to install and build.

- `npm install`
- `npm run build`

The build artifact is located in the dist/ directory. By default, `npm run build` emits a production artifact. To emit a dev artifact that is not minified and does not go through a linting pass, use `npm run build-dev`.

# Test Pages

For local development
Serve test pages statically from project root:
- `npm run build`
- `python -m SimpleHTTPServer 9000`
- Navigate to `http://localhost:9000/test/index.html`

# Github Pages
To build and publish your current git index to gh-pages, run the included `gh-pages.sh` script in the project root (NOTE: THIS WILL DELETE `origin`'s ENTIRE `gh-pages` BRANCH AND REPLACE IT WITH A NEW BUILD):
- `./gh-pages "New build to gh-pages"`

# Docs

Build the docs with `npm run docs`. The docs are also built as part of the `npm run build` command.
The built docs are located in `dist/docs`
