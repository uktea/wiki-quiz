export default function ArticleHistory({ articles, onSelect }) {
  return <ul className="results-list">
    {articles.length ? articles.map((article, index) =>
      <li key={article.title + index}><button onClick={() => onSelect(article)}>{article.title}</button></li>)
      : <li>履歴はありません。</li>}
  </ul>;
}
