import { useState } from 'react';
import { Link } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import ArticleHistory from './ArticleHistory';
import { readHistory } from './storage';

export default function Index() {
  const [history] = useState(readHistory);
  const [selected, setSelected] = useState(null);
  return <section>
    <h1>インデックス</h1>
    <p>過去に出題された記事の履歴です。（最大30件）</p>
    <ArticleHistory articles={history} onSelect={setSelected} />
    <Link className="back-link" to="/">戻る</Link>
    {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
  </section>;
}
