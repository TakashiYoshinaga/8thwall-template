# WebAR Image Tracking

MIT ライセンスで公開された 8th Wall Engine を使う、最小構成の Image Tracking サンプルです。
検出した平面ターゲットの上に Three.js のキューブを表示します。

## 実行

静的 HTTP サーバーでプロジェクトルートを配信します。

```bash
python3 -m http.server 8000
```

PC では `http://localhost:8000` を開きます。スマートフォンでカメラを使う場合は HTTPS
で配信してください。

## ターゲット画像

Node.js を用意し、プロジェクトルートで Image Target CLI を実行します。

```bash
npx @8thwall/image-target-cli@latest
```

現在のサンプルは `image-targets/my-target.json` を読み込みます。別の名前で生成した場合は
`js/app.js` の `TARGET_JSON` を変更してください。JSON と CLI が生成する画像ファイルは、
相対パスを保ったまま一緒に配信します。

## MIT 版エンジン

このリポジトリは Distributed Engine Binary と `@8thwall/engine-binary` を使用しません。
`external/xr/` の成果物は、次の MIT ライセンス版ソースからビルドしたものです。

- Source: <https://github.com/8thwall/8thwall>
- Commit: `462ea2f73accb9ecd1bb629d9877300438ba718f`
- Bazel: `7.2.1`
- Config: `wasmreleasesimd`

公式の bundle ターゲットをビルドします。

```bash
git clone https://github.com/8thwall/8thwall.git
cd 8thwall
git checkout 462ea2f73accb9ecd1bb629d9877300438ba718f
python3 -m pip install -r requirements.txt
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

`bazel-bin/reality/app/xr/js/bundle.zip` から `xr.js` と `xr-tracking.js` だけを取り出し、
ソースの `resources/powered-by.svg`、`LICENSE` とともに `external/xr/` へ配置します。
Face・Sky・Media Recorder などの未使用成果物は同梱しません。

`data-preload-chunks="slam"` は互換チャンク名で、ローカルの `xr-tracking.js` を読み込む
ために必要です。

固定コミットでは `XrController.configure()` が `disableWorldTracking` を反映しないため、
Image Tracking 専用モードを有効にする最小パッチを適用して `xr-tracking.js` を再ビルド
しています。本来は呼び出し側の `configure({disableWorldTracking: true})` だけで完結する
設定ですが、このコミットでは設定を受け取る処理が欠落しています。

パッチは適用可能な形で
`external/xr/patches/0001-honor-disableWorldTracking-in-configure.patch`
に置いてあります。上流のクローンのルートで `git apply` してからビルドしてください。
この不具合は上流の main（`f6bb5c24`、2026-08-23 時点）でも未修正で、
`tracking-controller.ts` は固定コミットとバイト同一のため、どちらにも適用できます。
詳細は `external/xr/BUILD-SOURCE.md` を参照してください。

## 配布時のライセンス表示

`external/xr/` を配信する際は、次の 2 ファイルを必ず一緒に配置してください。バンドル
自体には著作権バナーが含まれないため、この 2 ファイルが唯一の告知手段になります。

- `external/xr/LICENSE` — 8th Wall Engine 本体（MIT）
- `external/xr/THIRD-PARTY-NOTICES` — バンドルに組み込まれたサードパーティ 9 件

サードパーティのうち 51Degrees Renderer は MPL-2.0 です。未改変のため、ソース入手先を
明示する以外の義務はなく、告知文は `THIRD-PARTY-NOTICES` に記載済みです。

「8th Wall」の名称やロゴを表示する場合は、MIT が商標権を含まないため
<https://8thwall.org/docs/open-source> のガイドラインを確認してください。

## 技術スタック

- 8th Wall Engine（MIT 版、リポジトリ内に同梱）
- Three.js r128（CDN）
- バニラ JavaScript
