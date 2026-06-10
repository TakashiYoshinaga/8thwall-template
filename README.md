# WebAR Image Tracking

8th Wall エンジン（オープンソース版）を使ったイメージトラッキング WebAR。

## セットアップ手順

### 1. ターゲット画像を処理する

Node.js が必要です。プロジェクトルートで以下を実行します。

```bash
npx @8thwall/image-target-cli@latest
```

対話形式の質問にこう答えます：

| 質問 | 入力値 |
|------|--------|
| 画像ファイルのパス | `./image-targets/marker.png` |
| トリミング | Enter（デフォルトで OK） |
| 出力フォルダ | `image-targets` |
| ターゲット名 | `my-target` |
| ジオメトリタイプ | `flat` |

成功すると `image-targets/` に以下のファイルが追加されます：

```
image-targets/
├── my-target.json             ← XR8 に渡すメタデータ
├── my-target_original.png     ← 元画像のコピー
├── my-target_cropped.png      ← クロップ済み
├── my-target_thumbnail.png    ← サムネイル
└── my-target_luminance.png    ← 輝度画像（特徴点抽出用）
```

これらのファイルはすべてリポジトリに含めてください。

### 2. ターゲット名を合わせる

`js/app.js` の先頭行を変更します。

```js
const TARGET_JSON = 'image-targets/my-target.json'  // ← CLI で指定した名前に合わせる
```

### 3. ローカルで確認（PC・Chrome）

VSCode の Live Server 拡張でルートを開きます。`http://localhost:5500` を Chrome で開くとカメラが使えます（localhost は HTTPS 不要）。

### 4. スマートフォンで確認

Netlify 等にデプロイします（HTTPS 必須）。

- ビルドコマンド: なし
- 公開ディレクトリ: `/`

## 技術スタック

- 8th Wall Engine Binary v1（CDN）
- Three.js r128（CDN）
- バニラ JavaScript（TypeScript なし・ビルドステップなし）
