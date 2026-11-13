import Dialog from './Dialog';
import { plainText } from './utils';

export default function ArticleModal({ article, onClose }) {
  const extract = plainText(article.extract);
  return <Dialog label={article.title} onClose={onClose}>
    <h2>{article.title}</h2>
    {article.thumbnail && <img className="article-thumbnail" src={article.thumbnail} alt={article.title} />}
    <p className="modal-extract">{extract.slice(0, 400)}{extract.length > 400 ? '…' : ''}</p>
    <div className="actions">
      <a href={'https://ja.wikipedia.org/wiki/' + encodeURIComponent(article.title)} target="_blank" rel="noopener noreferrer">Wikipediaで見る</a>
      <button onClick={onClose}>閉じる</button>
    </div>
  </Dialog>;
}
