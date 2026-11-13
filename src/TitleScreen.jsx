import { Link } from 'react-router-dom';

export default function TitleScreen() {
  return <div className="title-container">
    <h1>Wikipedia記事当てクイズ</h1>
    <nav className="title-menu" aria-label="メインメニュー">
      <Link to="/select-mode" className="menu-button primary">ゲーム開始</Link>
      <Link to="/how-to-play" className="menu-button">遊び方</Link>
      <Link to="/index" className="menu-button">インデックス</Link>
      <Link to="/settings" className="menu-button">設定</Link>
    </nav>
  </div>;
}
