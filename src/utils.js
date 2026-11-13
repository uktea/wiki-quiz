export const normalizeText = (text = '') => text.normalize('NFKC').replace(/\s/g, '').toLowerCase();

export const isCorrectAnswer = (guess, title) => {
  const answer = normalizeText(guess);
  return Boolean(answer) && [title, title.replace(/\s*[（(][^()（）]*[)）]$/, '')]
    .some(candidate => normalizeText(candidate) === answer);
};

export function plainText(html) {
  return html.replace(/<\/(?:p|h[1-6])>/gi, '\n\n').replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  }).trim();
}

export function maskText(text, title) {
  const words = [];
  const mask = value => '●'.repeat([...value].length);
  let masked = text.replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, content) => {
    const word = plainText(content);
    if (word && !isCorrectAnswer(word, title) && !normalizeText(word).includes(normalizeText(title))) words.push(word);
    return mask(word);
  });
  masked = plainText(masked).replace(/（([^（）]*)）|\(([^()]*)\)/g, (_, full, half) => {
    const word = full ?? half;
    if (word && !isCorrectAnswer(word, title) && !normalizeText(word).includes(normalizeText(title))) words.push(word);
    return full !== undefined ? '（' + mask(word) + '）' : '(' + mask(word) + ')';
  });
  for (const candidate of new Set([title, title.replace(/\s*[（(][^()（）]*[)）]$/, '')])) {
    if (!candidate) continue;
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'gi'), mask);
  }
  return { maskedText: masked, unmaskableWords: [...new Set(words)] };
}

async function queryWikipedia(params, signal) {
  const query = new URLSearchParams({ action: 'query', format: 'json', origin: '*', ...params });
  const response = await fetch('https://ja.wikipedia.org/w/api.php?' + query, { signal });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const data = await response.json();
  if (data.error || !data.query) throw new Error('記事を取得できませんでした。');
  return data.query;
}

export async function fetchRandomArticle(settings, { signal, isReverse = false } = {}) {
  let best = null;
  let lastError;
  const attempts = Math.min(10, Math.max(1, settings.fetchAttempts || 3));
  const batchSize = Math.min(50, Math.max(1, settings.fetchBatchSize || 20));
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const random = await queryWikipedia({ list: 'random', rnnamespace: '0', rnlimit: String(batchSize) }, signal);
      const details = await queryWikipedia({
        prop: 'extracts|pageviews|pageimages|pageprops', exintro: '1', pithumbsize: '500',
        titles: random.random.map(page => page.title).join('|'),
      }, signal);
      for (const page of Object.values(details.pages ?? {})) {
        if (!page.extract || plainText(page.extract).length < 80 || page.pageprops?.disambiguation !== undefined) continue;
        const thumbnail = page.thumbnail?.source?.startsWith('https://upload.wikimedia.org/') ? page.thumbnail.source : null;
        if (isReverse && !thumbnail) continue;
        const pageviews = Object.values(page.pageviews ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
        if (!best || pageviews > best.pageviews) best = { title: page.title, extract: page.extract, pageviews, thumbnail };
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  if (!best) throw lastError ?? new Error('表示できる記事が見つかりませんでした。');
  return { article: best, ...maskText(best.extract, best.title) };
}
