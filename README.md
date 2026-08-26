# WebAR Image Tracking

A minimal Image Tracking sample that runs on nothing but the MIT-licensed 8th Wall
Engine. It renders a Three.js cube on top of a detected planar target.

日本語版は [README.ja.md](README.ja.md) にあります。

## About this repository

8th Wall released its engine under the MIT License in 2026, but some features,
SLAM among them, remain proprietary and are shipped separately as a binary. This
repository is a build that **avoids that non-MIT half entirely and gets Image
Tracking working from MIT sources alone**.

- No Distributed Engine Binary, no `@8thwall/engine-binary`
- The engine is not pulled from a CDN. Only the copy vendored in `external/xr/` is used
- So the engine itself has zero external service dependencies (Three.js does come
  from a CDN, so place it locally too if you need to run fully offline)

### What works and what does not

| Feature | Status |
|---|---|
| Image Target tracking | Works |
| World Tracking / SLAM | Unavailable. Removed from the MIT sources; needs the non-MIT binary |
| Face Effects / Sky Effects / recording | The code is in the engine, but the artifacts are not bundled (see below) |
| VPS / Hand Tracking | Not even in the non-MIT binary |

Because there is no SLAM, `js/app.js` must pass
`configure({disableWorldTracking: true})`.

Face, Sky and Media Recorder can be enabled by copying the 9 missing files out of
the same build's `bundle.zip` (`xr-face.js`, the `.tflite` models, the workers, and
so on). No extra licensing obligations come with them.

## Quick start

1. Serve the project root with any static HTTP server.

   ```bash
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000` on your computer.

3. Once you grant camera access, print `image-targets/marker.png` or show it on
   another screen and point the camera at it. A cube appears on top of it when the
   target is recognized.

### Trying it on a phone, and publishing

The camera API requires a Secure Context. `localhost` is exempt and works over
plain HTTP, but opening the page on a real phone needs HTTPS. There is no build
step, so anywhere that can serve the repository as-is will work.

- **GitHub Pages** — publish this repository directly. Pick the branch and the
  root directory under Settings > Pages
- **Netlify** — no build command; set the publish directory to the repository root
  (`.`). Dragging and dropping the directory works too
- **Your own server** — serve it statically with a certificate
- **Quick device checks** — expose your local server over HTTPS with a tunnel such
  as ngrok

WebAssembly is inlined into the engine's JavaScript, so no `.wasm` MIME type
configuration is needed. No special server setup at all.

Note that serving `external/xr/` counts as redistribution. See
[License notices when distributing](#license-notices-when-distributing) below.

## Target images

**The bundled image works as-is for testing.** The trained data
(`image-targets/my-target.json` and its images) is included, so there is nothing to
generate. Print `image-targets/marker.png` or display it on a monitor or tablet and
point the camera at it.

### Using your own image

To track a different image, generate trained data with the Image Target CLI. Node.js
is required (it uses `sharp` internally, so the first run fetches a native module).
Run it from the project root.

```bash
npx @8thwall/image-target-cli@latest
```

That single command is all there is. It takes no flags or arguments; once it starts
it asks the following, in order.

| Prompt | What to enter |
|---|---|
| `Enter the path to the image file:` | Path to the source image |
| `Select the image type:` | `flat` (default) / `cylinder` / `cone` |
| `Use default crop? [Y/n]` | `Y` centers the crop automatically |
| (if `n`) orientation, top, left, width | Orientation is landscape or portrait. Height is derived from a 4:3 ratio |
| `Enter the output folder:` | Output directory. `image-targets` for this repository |
| `Enter a name for the image target:` | Prefix for the output files. The bundled sample uses `my-target` |

It writes a JSON file plus the original, cropped, thumbnail (263x350) and luminance
(480x640) images.

If files with the same name already exist it stops with
`File already exists, overwrite is disabled`. Set the environment variable to
overwrite them.

```bash
OVERWRITE_FILES=true npx @8thwall/image-target-cli@latest
```

`TARGET_JSON` in `js/app.js` points at `image-targets/my-target.json`, so change it
if you generated your data under a different name. Serve the JSON and the images
together, keeping their relative paths intact.

## How the engine was built

The artifacts in `external/xr/` were built from the MIT-licensed sources below.

| | |
|---|---|
| Source | <https://github.com/8thwall/8thwall> |
| Commit | `462ea2f73accb9ecd1bb629d9877300438ba718f` |
| Bazel | `7.2.1` |
| Config | `wasmreleasesimd` |
| Target | `//reality/app/xr/js:bundle` |

### Rebuilding

```bash
git clone https://github.com/8thwall/8thwall.git
cd 8thwall
git checkout 462ea2f73accb9ecd1bb629d9877300438ba718f
git apply /path/to/8thwall-template/external/xr/patches/0001-honor-disableWorldTracking-in-configure.patch
python3 -m pip install -r requirements.txt
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

Take only `xr.js` and `xr-tracking.js` out of
`bazel-bin/reality/app/xr/js/bundle.zip` and place them in `external/xr/` along with
`resources/powered-by.svg` and `LICENSE` from the sources.

### The patch we apply

Upstream's `XrController.configure()` never reads the `disableWorldTracking`
argument, so `configure({disableWorldTracking: true})` is silently ignored. On an
engine without SLAM that option is the only configuration that can work, so we apply
a minimal patch adding the single missing assignment and rebuild.

The patch lives in `external/xr/patches/` in a form `git apply` accepts. The bug is
still unfixed on upstream `main` (`f6bb5c24`, as of 2026-08-23), and
`tracking-controller.ts` is byte-identical to the pinned commit, so the patch applies
to either one.

Build provenance and artifact hashes are recorded in `external/xr/BUILD-SOURCE.md`.

### A note on chunk names

`data-preload-chunks="slam"` in `index.html` is a chunk name kept for compatibility.
What actually loads is the local `xr-tracking.js`, which is the Image Tracking
implementation.

## License notices when distributing

When you serve `external/xr/`, always ship these two files alongside it. The bundles
carry no copyright banner of their own, so these files are the only notice.

- `external/xr/LICENSE` — the 8th Wall Engine itself (MIT)
- `external/xr/THIRD-PARTY-NOTICES` — the 9 third-party components compiled into the
  bundles

One of those components, 51Degrees Renderer, is MPL-2.0. It is unmodified, so the
only obligation is to state where the source can be obtained, and
`THIRD-PARTY-NOTICES` already does that.

The MIT License does not grant trademark rights, so if you display the "8th Wall"
name or logo, check the guidelines at <https://8thwall.org/docs/open-source>.

## Stack

- 8th Wall Engine (MIT build, vendored in `external/xr/`)
- Three.js r128 (CDN)
- Vanilla JavaScript
