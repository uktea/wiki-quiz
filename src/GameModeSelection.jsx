import { Link } from 'react-router-dom';
import { gameModes } from './gameConfig';

export default function GameModeSelection() {
  return <section>
    <h1>モード選択</h1>
    <nav className="title-menu" aria-label="ゲームモード">
      {Object.entries(gameModes).map(([mode, { name }]) =>
        <Link key={mode} to={'/prepare/' + mode} className="menu-button">{name}</Link>)}
    </nav>
    <Link className="back-link" to="/">戻る</Link>
  </section>;
}
