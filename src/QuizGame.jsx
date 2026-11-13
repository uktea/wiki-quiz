import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { gameModes } from './gameConfig';
import { useGameSettings } from './GameContext';
import { useQuiz } from './useQuiz';
import { calculateDifficulty } from './calculateDifficulty';
import { plainText } from './utils';
import ArticleModal from './ArticleModal';
import ArticleHistory from './ArticleHistory';
import Dialog from './Dialog';

export default function QuizGame() {
  const { mode } = useParams();
  const { modeSettings, globalSettings } = useGameSettings();
  const [session, setSession] = useState(0);
  if (!gameModes[mode]) return <Navigate to="/select-mode" replace />;
  const settings = modeSettings?.mode === mode ? modeSettings.settings : gameModes[mode].settings;
  return <Game key={mode + ':' + session} mode={mode} settings={settings} globalSettings={globalSettings}
    onRestart={() => setSession(value => value + 1)} />;
}

function Game({ mode, settings, globalSettings, onRestart }) {
  const [state, dispatch] = useQuiz(mode, settings, globalSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const { article, status } = state;
  const answered = ['answered', 'penalty', 'finished'].includes(status);
  const playing = status === 'playing';
  const cost = value => mode === 'practice' ? '' : ' (-' + value + '点)';
  const act = type => dispatch({ type });
  const finished = status === 'finished';

  return <section className="quiz">
    <header className="page-header">
      <h1>{gameModes[mode].name}モード</h1>
      {!finished && <button className="icon-button" aria-label="メニューを開く" onClick={() => setMenuOpen(true)}>
        <span className="material-symbols-outlined" aria-hidden="true">menu</span>
      </button>}
    </header>
    {finished ? <>
      <h2>{mode === 'timeattack' ? 'タイムアタック終了！' : mode === 'survival' ? 'ゲームオーバー！' : 'ゲーム終了！'}</h2>
      <p className="result-score">{mode === 'timeattack' ? 'クリアタイム: ' + Math.floor(state.elapsed / 60) + '分 ' + state.elapsed % 60 + '秒'
        : mode === 'normal' ? '最終スコア: ' + state.score + '点' : '最終スコア: ' + state.correct + '問正解'}</p>
      <h2>出題された記事一覧</h2>
      <ArticleHistory articles={state.history} onSelect={setSelected} />
      <div className="actions"><button className="primary" onClick={onRestart}>もう一度プレイする</button><Link to="/">ホームへ戻る</Link></div>
    </> : <>
      <div className="game-info">
        {mode === 'normal' && <span>スコア: {state.score}</span>}
        {mode !== 'practice' && <span className="timer">{mode === 'timeattack' ? '経過時間: ' + state.elapsed + '秒'
          : state.timeLeft >= 0 ? '残り時間: ' + state.timeLeft + '秒' : '次のペナルティまで: ' + (30 - Math.abs(state.timeLeft) % 30) + '秒'}</span>}
        {mode === 'normal' && <span>第 {state.question} / {settings.questionCount} 問</span>}
        {mode === 'timeattack' && <span>正解数: {state.correct} / {settings.questionCount}</span>}
        {mode === 'survival' && <span>正解数: {state.correct}</span>}
        {article && <span>難易度: {calculateDifficulty(article.pageviews).toFixed(1)}</span>}
      </div>
      {mode !== 'practice' && article && <p className="question-score">{mode === 'normal' ? 'この問題の得点' : 'ライフ'}: {state.points}
        {state.combo > 1 && <span> / {state.combo}連続正解中！</span>}</p>}
      <div className="question-area" aria-busy={status === 'loading'}>
        {status === 'loading' ? <p role="status">記事を探しています...</p>
          : status === 'error' ? <div><p role="alert">{state.message}</p><button onClick={() => act('retry')}>再試行</button></div>
          : article && <>
            {settings.isReverse && !answered
              ? <img className="article-thumbnail" src={article.thumbnail} alt="記事のサムネイル" />
              : <p className="article-text">{answered ? plainText(article.extract) : state.maskedText.slice(0, state.visibleChars)}
                {!answered && state.visibleChars < state.maskedText.length ? '…' : ''}</p>}
          </>}
      </div>
      {state.revealedWords.length > 0 && <p className="revealed-words-area">ヒント単語: {state.revealedWords.join(' / ')}</p>}
      <div className="actions question-actions">
        <button onClick={() => act('reroll')} disabled={!playing}>リロール{cost(settings.rerollCostBase * (state.rerolls + 1))}</button>
        {!settings.isReverse && <>
          <button onClick={() => dispatch({ type: 'unmask', random: Math.random() })} disabled={!playing || !state.words.length}>伏せ字削減{cost(settings.unmaskHintCost)}</button>
          <button onClick={() => act('hint')} disabled={!playing || state.visibleChars >= state.maskedText.length}>ヒント{cost(settings.hintCost)}</button>
        </>}
        {mode === 'practice' && <button onClick={() => act('reveal')} disabled={!playing}>答えを見る</button>}
      </div>
      <form className="guess-area" onSubmit={event => { event.preventDefault(); act('submit'); }}>
        <input aria-label="答え" placeholder="答えを入力" autoComplete="off" value={state.guess} readOnly={!playing}
          onChange={event => dispatch({ type: 'guess', value: event.target.value })}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
          }} />
        <button className="primary" type="submit" disabled={!playing || !state.guess.trim()}>回答</button>
      </form>
      <p className="result-message" role="status">{status !== 'error' && status !== 'loading' ? state.message : ''}</p>
      {answered && article && <div className="answer-area">
        {article.thumbnail && <img className="answer-thumbnail" src={article.thumbnail} alt={article.title} />}
        <div className="actions">
          {['normal', 'practice'].includes(mode) && <button className="primary" onClick={() => act('next')}>
            {mode === 'normal' && state.question >= settings.questionCount ? '結果を見る' : '次の問題へ'}
          </button>}
          <button onClick={() => setSelected(article)}>記事詳細</button>
        </div>
      </div>}
    </>}
    {menuOpen && <Dialog label="メニュー" onClose={() => setMenuOpen(false)}>
      <h2>メニュー</h2>
      <div className="title-menu">
        <button onClick={() => setMenuOpen(false)}>メニューを閉じる</button>
        <button onClick={onRestart}>最初からやり直す</button>
        <button onClick={() => { setMenuOpen(false); act('finish'); }}>あきらめる</button>
        <Link to="/index">インデックス</Link>
        <Link to="/">ホームへ戻る</Link>
      </div>
    </Dialog>}
    {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
  </section>;
}
