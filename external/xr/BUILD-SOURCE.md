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

The following minimal change was applied to
`reality/app/xr/js/src/tracking-controller.ts` before rebuilding
`//reality/app/xr/js:xr-tracking`:

```diff
 interface TrackingControllerConfig {
+  disableWorldTracking?: boolean
 }

 const configure = (args: TrackingControllerConfig) => {
+  if (args.disableWorldTracking !== undefined) {
+    disableWorldTracking_ = !!args.disableWorldTracking
+  }
 }
```

## SHA-256

```text
a01f85d6e5ae5eb38b20cddd6abf945e7563ab2541597e1395fb5e59a2f9edff  xr.js
7eb3aa6b544319b74259ceb72a18566825001379774533ad89af72e38cb24b21  xr-tracking.js
4c8bf13771807ac55c963fc08421f611e6e1ab37d5410dc0bbf049f94bea0797  resources/powered-by.svg
0a320756838ccfc28f5652e81e9d20dec1a23428c1841d9d378af5f44c7b5cde  LICENSE
```
