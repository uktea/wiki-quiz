import { Link } from 'react-router-dom';

function HowToPlay() {
  return (
    <div className="page-container">
      <h1>遊び方</h1>
      <div className="text-content">
        <h2>ゲームの目的</h2>
        <p>ランダムに表示されるWikipediaの記事の冒頭を読んで、その記事のタイトルを当てるゲームです。</p>
        
        <h2>ノーマルモードのルール</h2>
        <ul>
          <li>1ゲーム5問です。</li>
          <li>1問あたりの持ち点は100点です。不正解で20点引かれます。</li>
          <li>ヒントを使うと点数が引かれます。「ヒント」は表示文字数を増やし、「伏せ字削減」は伏せ字の単語を1つ表示します。</li>
          <li>「リロール」すると、持ち点を消費して問題をやり直せます。リロールするたびにコストは上がります。</li>
          <li>正解すると、その時点での持ち点に加えて、残り時間や各種ボーナスが総合スコアに加算されます。</li>
        </ul>

        <h2>スコア計算</h2>
        <ul>
          <li><b>タイムボーナス:</b> (残り時間 ÷ 3) の切り捨て</li>
          <li><b>ノーヒントボーナス:</b> +20点</li>
          <li><b>ノーリロールボーナス:</b> +10点</li>
          <li><b>連続正解ボーナス:</b> (連続正解数 × 5) 点</li>
        </ul>
      </div>
      <Link to="/" className="back-link">戻る</Link>
    </div>
  );
}

export default HowToPlay;
