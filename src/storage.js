export function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* The current game remains usable when storage is unavailable. */ }
}

export function readHistory() {
  const saved = readStored('wikiGameHistory', []);
  return Array.isArray(saved) ? saved.filter(item => typeof item?.title === 'string' && typeof item?.extract === 'string') : [];
}

export function saveArticle(article) {
  writeStored('wikiGameHistory', [article, ...readHistory().filter(item => item.title !== article.title)].slice(0, 30));
}
