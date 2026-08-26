# Build Source

- Source: https://github.com/8thwall/8thwall
- Commit: `6b497e89cd68fe0ef564695a9bc38bd573d26de9`
- License: MIT (`LICENSE`)
- Bazel: `7.2.1`
- Configuration: `wasmreleasesimd`
- Built: `2026-08-27`

```bash
python3 -m pip install -r requirements.txt
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

`xr.js` and `xr-tracking.js` were extracted from
`bazel-bin/reality/app/xr/js/bundle.zip`. Only the Image Tracking runtime files
used by this demo are included. This directory does not contain the Distributed
Engine Binary package.

## SHA-256

```text
a61a9fcf88d8495668929a3b2577bfde9e8763fbfd97ac34825587e2b6b813c7  xr.js
7eb3aa6b544319b74259ceb72a18566825001379774533ad89af72e38cb24b21  xr-tracking.js
4c8bf13771807ac55c963fc08421f611e6e1ab37d5410dc0bbf049f94bea0797  resources/powered-by.svg
0a320756838ccfc28f5652e81e9d20dec1a23428c1841d9d378af5f44c7b5cde  LICENSE
```
