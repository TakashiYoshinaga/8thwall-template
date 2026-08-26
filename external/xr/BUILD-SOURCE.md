# Build Source

- Source: https://github.com/8thwall/8thwall
- Commit: `462ea2f73accb9ecd1bb629d9877300438ba718f`
- License: MIT (`LICENSE`)
- Bazel: `7.2.1`
- Configuration: `wasmreleasesimd`
- Built: `2026-06-10`

```bash
python3 -m pip install -r requirements.txt
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

`xr.js` and `xr-tracking.js` were extracted from
`bazel-bin/reality/app/xr/js/bundle.zip`. Only the Image Tracking runtime files
used by this demo are included. This directory does not contain the Distributed
Engine Binary package.

## Local Patch

The fixed upstream commit declares and checks `disableWorldTracking_`, but its
public `XrController.configure()` implementation does not apply the
`disableWorldTracking` option. Without this option, camera sessions on desktop
are rejected and Image Tracking cannot run without SLAM.

The change is kept as an applicable patch file:

    patches/0001-honor-disableWorldTracking-in-configure.patch

Apply it from the root of an 8thwall checkout before building:

```bash
git apply /path/to/external/xr/patches/0001-honor-disableWorldTracking-in-configure.patch
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

It touches `reality/app/xr/js/src/tracking-controller.ts` only, adding the
option to `TrackingControllerConfig` and the corresponding assignment at the
top of `configure()`.

### Upstream status

Still unfixed on `main` as of `f6bb5c2487a157339200a2310d19f034d8bd84ba`
(2026-08-23). `tracking-controller.ts` is byte-identical between that commit
and the build commit above:

```text
afeb9c060615f6f9b39a6390c0fdb09f820409fa19016d2fdc3e1bfc6d6acd03  reality/app/xr/js/src/tracking-controller.ts
```

The patch therefore applies cleanly to either commit. Re-check this before
moving to a newer upstream commit; if `configure()` gains the assignment
upstream, the patch and this section can be dropped.

## SHA-256

```text
a01f85d6e5ae5eb38b20cddd6abf945e7563ab2541597e1395fb5e59a2f9edff  xr.js
7eb3aa6b544319b74259ceb72a18566825001379774533ad89af72e38cb24b21  xr-tracking.js
4c8bf13771807ac55c963fc08421f611e6e1ab37d5410dc0bbf049f94bea0797  resources/powered-by.svg
0a320756838ccfc28f5652e81e9d20dec1a23428c1841d9d378af5f44c7b5cde  LICENSE
```
