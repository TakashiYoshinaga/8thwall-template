# WebAR Image Tracking

MIT ライセンス版 8th Wall Engine だけで動く、最小構成の Image Tracking サンプルです。
検出した平面ターゲットの上に Three.js のキューブを表示します。

The English version is available at [README.md](README.md).

## このリポジトリについて

8th Wall は 2026 年にエンジン本体を MIT ライセンスで公開しましたが、SLAM などの一部機能は
プロプライエタリなバイナリとして別配布されています。このリポジトリは**その非 MIT 部分を
一切使わず、MIT ソースをビルドした成果物のみで Image Tracking を成立させた構成**です。

- Distributed Engine Binary（`@8thwall/engine-binary`）を使いません
- CDN からエンジンを読み込みません。`external/xr/` に同梱したものだけを使います
- エンジンに関しては外部サービスへの依存がゼロです（ただし Three.js は CDN から読み込んで
  いるため、完全にオフラインで動かすには Three.js もローカルに配置してください）

### できること・できないこと

| 機能 | 状態 |
|---|---|
| Image Target（マーカー）トラッキング | 動作します |
| World Tracking / SLAM | 使えません。MIT ソースから削除済みで、非 MIT バイナリが必要です |
| Face Effects / Sky Effects / 録画 | エンジン内にコードはありますが成果物を同梱していません（下記参照） |
| VPS / Hand Tracking | 非 MIT バイナリにも含まれません |

SLAM が無いため、`js/app.js` では `configure({disableWorldTracking: true})` が必須です。

Face・Sky・Media Recorder は、同じビルドの `bundle.zip` から不足ファイル 9 件をコピーすれば
有効化できます（`xr-face.js`、`.tflite` モデル、各ワーカー等）。ライセンス上の追加制約は
ありません。

## クイックスタート

1. 静的 HTTP サーバーでプロジェクトルートを配信します。

   ```bash
   python3 -m http.server 8000
   ```

2. PC では `http://localhost:8000` を開きます。

3. カメラを許可したら、`image-targets/marker.png` を印刷するか別の画面に表示して、
   カメラを向けてください。認識するとキューブが重なって表示されます。

### スマートフォンで試す・公開する

カメラ API は Secure Context を要求します。`localhost` は例外として HTTP でも動きますが、
スマートフォンの実機で開くには HTTPS が必要です。ビルド工程を持たない静的サイトなので、
リポジトリをそのまま配信できる場所であればどこでも動きます。

- **GitHub Pages** — このリポジトリをそのまま公開できます。Settings > Pages でブランチと
  ルートディレクトリを指定するだけです
- **Netlify** — ビルドコマンドは不要で、publish directory をリポジトリルート（`.`）に
  設定します。ディレクトリをドラッグ＆ドロップするだけでも配信できます
- **自前のサーバー** — 証明書を用意して静的配信すれば動きます
- **一時的な実機確認** — ローカルサーバーを ngrok などのトンネル経由で HTTPS 公開する方法
  も使えます

WebAssembly はエンジンの JS 内にインライン化されているため、`.wasm` の MIME タイプ設定は
不要です。特別なサーバー設定は要りません。

いずれの方法でも、`external/xr/` を配信した時点で再配布に該当します。後述の
「配布時のライセンス表示」を満たしてください。

## ターゲット画像

**動作確認にはリポジトリ同梱の画像がそのまま使えます。** 学習済みデータ
（`image-targets/my-target.json` と関連画像）を含めてあるので、生成作業は不要です。
`image-targets/marker.png` を印刷するか、PC やタブレットの画面に表示してカメラを向けて
ください。

### 自分の画像に差し替える

別の画像をターゲットにする場合は、Image Target CLI で学習済みデータを生成します。Node.js
が必要です（内部で `sharp` を使うため、初回はネイティブモジュールの取得が走ります）。
プロジェクトルートで実行してください。

```bash
npx @8thwall/image-target-cli@latest
```

実行するコマンドはこれだけです。オプションや引数は無く、起動後に対話形式で次の順に聞かれ
ます。

| プロンプト | 入力内容 |
|---|---|
| `Enter the path to the image file:` | 元画像のパス |
| `Select the image type:` | `flat`（既定）/ `cylinder` / `cone` |
| `Use default crop? [Y/n]` | `Y` で中央を自動クロップ |
| （`n` の場合）向き・top・left・width | 向きは landscape / portrait。height は 4:3 比から自動計算されます |
| `Enter the output folder:` | 出力先。このリポジトリなら `image-targets` |
| `Enter a name for the image target:` | 出力ファイル名の接頭辞。同梱サンプルは `my-target` |

生成されるのは JSON、原画像、クロップ画像、サムネイル（263x350）、輝度画像（480x640）です。

同名のファイルが既にあると `File already exists, overwrite is disabled` で停止します。
上書きする場合は環境変数を付けて実行してください。

```bash
OVERWRITE_FILES=true npx @8thwall/image-target-cli@latest
```

生成後、`js/app.js` の `TARGET_JSON` は `image-targets/my-target.json` を指しているので、
別の名前で生成した場合はここを変更してください。JSON と画像ファイルは、相対パスを保った
まま一緒に配信します。

## エンジンのビルド元

`external/xr/` の成果物は、次の MIT ライセンス版ソースからビルドしたものです。

| 項目 | 値 |
|---|---|
| Source | <https://github.com/8thwall/8thwall> |
| Commit | `6b497e89cd68fe0ef564695a9bc38bd573d26de9` |
| Bazel | `7.2.1` |
| Config | `wasmreleasesimd` |
| Target | `//reality/app/xr/js:bundle` |

### 再ビルドの手順

```bash
git clone https://github.com/8thwall/8thwall.git
cd 8thwall
git checkout 6b497e89cd68fe0ef564695a9bc38bd573d26de9
python3 -m pip install -r requirements.txt
npx --yes @bazel/bazelisk build --config=wasmreleasesimd //reality/app/xr/js:bundle
```

`bazel-bin/reality/app/xr/js/bundle.zip` から `xr.js` と `xr-tracking.js` だけを取り出し、
ソースの `resources/powered-by.svg`、`LICENSE` とともに `external/xr/` へ配置します。

### パッチは当てていません

このリポジトリの成果物に独自の改変はありません。以前は上流の
`XrController.configure()` が `disableWorldTracking` を受け取らず、SLAM の無いこの
エンジンでは唯一成立する設定が使えなかったため、パッチを当てていました。この修正は
[#263](https://github.com/8thwall/8thwall/pull/263) で上流に取り込まれたので、現在は
固定コミットをそのままビルドしたものです。

ビルド来歴と成果物のハッシュは `external/xr/BUILD-SOURCE.md` に記録しています。

### 補足

`index.html` の `data-preload-chunks="slam"` は互換のために残っているチャンク名で、実際に
読み込まれるのはローカルの `xr-tracking.js`（Image Tracking 実装）です。

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

- 8th Wall Engine（MIT 版、`external/xr/` に同梱）
- Three.js r128（CDN）
- バニラ JavaScript
