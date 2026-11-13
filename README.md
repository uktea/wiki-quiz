# Wikipedia記事当てクイズ

Wikipediaの記事の冒頭からタイトルを当てるクイズ。React + Vite で動作します。

## 開発

Node.js 20.19 以上の 20 系、または 22.12 以上を使用してください。

```sh
npm ci
npm run dev
```

表示された URL の `/wiki-quiz/` を開きます。

```sh
npm test
npm run lint
npm run build
npm run preview
```

## 構成

- `src/gameConfig.js`: モードの既定値と設定項目
- `src/gameEngine.js`: 得点、ヒント、時間、問題遷移を扱う純粋な reducer
- `src/useQuiz.js`: 記事取得、タイマー、後片付け
- `src/QuizGame.jsx`: ４モードで共有する画面
- `src/utils.js`: Wikipedia API、伏せ字、回答の正規化
- `src/storage.js`: 共通設定と最大30件の記事履歴の保存

デザインの基準は [DESIGN.md](DESIGN.md) を参照してください。

## ゲーム

ノーマル、タイムアタック、サバイバル、練習に対応します。逆問題モードでは画像のある記事だけを出題します。モードの設定は開始前に変更できます。ゲーム画面の URL を直接開くと、そのモードの既定値を使用します。

サバイバルの残り時間は問題を切り替えても維持します。記事の読み込み中はタイマーを止め、取得できない場合は再試行できます。タイムアタックではライフが尽きると５秒間のペナルティ後に次の問題へ進みます。ノーマルと練習は回答後に手動で次へ進めます。

設定と記事履歴はブラウザの localStorage に保存します。保存できない環境でもゲーム自体は動作します。記事取得には日本語版 Wikipedia、メニューアイコンには Google Material Symbols への接続が必要です。

## 公開

`vite.config.js` の `base` は `/wiki-quiz/` です。ルーターもこの値を使用します。

`npm run deploy` でビルドして GitHub Pages の配信用ブランチへ公開します。BrowserRouter を使用するため、ホスト側にフォールバックがない場合、ゲーム画面などの URL の直接読み込みは 404 になります。GitHub Pages ではトップページから移動してください。
