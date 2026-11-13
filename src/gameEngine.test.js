import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, gameReducer } from './gameEngine.js';
import { gameModes } from './gameConfig.js';
import { isCorrectAnswer, maskText, plainText, fetchRandomArticle } from './utils.js';
import { readHistory, readStored, saveArticle } from './storage.js';

const article = { title: '東京', extract: '<p><b>東京</b>（とうきょう）は日本の都市。</p>', pageviews: 100, thumbnail: null };
const data = { article, maskedText: '●●（●●●●●）は日本の都市。'.repeat(30), unmaskableWords: ['とうきょう'] };
const reduce = (state, type, rest = {}) => gameReducer(state, { type, ...rest });
function playing(mode = 'normal', settings = {}) {
  const initial = createGame(mode, { ...gameModes[mode].settings, ...settings });
  return reduce(initial, 'loaded', { data, requestId: 0 });
}

test('answer matching accepts width, spacing, case and trailing disambiguation', () => {
  assert.ok(isCorrectAnswer(' ａｂＣ １２３ ', 'ABC123'));
  assert.ok(isCorrectAnswer('東京', '東京 (都市)'));
  assert.ok(isCorrectAnswer('東京', '東京（都市）'));
  assert.ok(!isCorrectAnswer('', '東京'));
  assert.ok(!isCorrectAnswer('東京', '東京都'));
});

test('masking treats punctuation in titles literally', () => {
  for (const title of ['C++', 'A.B', '[東京]', '日本（国）', 'A$B', 'A\\B']) {
    const result = maskText(title + 'についての記事', title);
    assert.ok(!result.maskedText.includes(title), title);
  }
  const result = maskText('<p><b>東京</b>（とうきょう） &amp; <b>江戸</b></p>', '東京');
  assert.deepEqual(result.unmaskableWords, ['江戸', 'とうきょう']);
  assert.ok(!result.maskedText.includes('東京'));
  assert.ok(result.maskedText.includes('&'));
});

test('extract decoding keeps text safe for React and preserves paragraphs', () => {
  assert.equal(plainText('<p>A &amp; B</p><p>&#x6771;&#20140;</p>'), 'A & B\n\n東京');
});

test('normal mode awards finite bonuses and ends after the configured question count', () => {
  let state = playing('normal', { questionCount: 1 });
  state = reduce(reduce(state, 'guess', { value: '東京' }), 'submit');
  assert.equal(state.score, 150);
  assert.equal(state.status, 'answered');
  assert.equal(state.guess, '東京');
  assert.equal(reduce(state, 'submit').score, 150);
  assert.equal(reduce(state, 'next').status, 'finished');
});

test('wrong answers and hints can exhaust the question without negative points', () => {
  let state = playing('normal', { baseScore: 10 });
  state = reduce(reduce(state, 'guess', { value: '大阪' }), 'submit');
  assert.equal(state.points, 0);
  assert.equal(state.status, 'answered');
  state = reduce(playing('normal', { baseScore: 5 }), 'hint');
  assert.equal(state.status, 'answered');
});

test('normal overtime applies every elapsed 30 seconds, including delayed timer callbacks', () => {
  const state = reduce(playing(), 'tick', { seconds: 120 });
  assert.equal(state.timeLeft, -60);
  assert.equal(state.points, 80);
});

test('unmasking actually reveals a word and charges its cost', () => {
  const state = reduce(playing('timeattack'), 'unmask', { random: 0 });
  assert.deepEqual(state.revealedWords, ['とうきょう']);
  assert.equal(state.words.length, 0);
  assert.equal(state.points, 90);
  assert.ok(state.hintUsed);
});

test('rerolls preserve remaining points, increase cost and shorten normal question time', () => {
  const state = reduce(playing(), 'reroll');
  assert.equal(state.points, 90);
  assert.equal(state.rerolls, 1);
  assert.equal(state.timeLeft, 40);
  assert.equal(state.status, 'loading');
  assert.equal(reduce(playing('normal', { baseScore: 10 }), 'reroll').status, 'playing');
});

test('stale API results cannot replace a new request or a finished game', () => {
  const state = reduce(playing(), 'reroll');
  assert.equal(reduce(state, 'loaded', { data, requestId: 0 }), state);
  assert.equal(reduce(reduce(state, 'finish'), 'loaded', { data, requestId: 1 }).status, 'finished');
});

test('failed requests offer retry and retain the score and question', () => {
  let state = reduce(playing(), 'reroll');
  state = reduce(state, 'failed', { requestId: state.requestId });
  assert.equal(state.status, 'error');
  state = reduce(state, 'retry');
  assert.equal(state.status, 'loading');
  assert.equal(state.points, 90);
  assert.equal(state.question, 1);
});

test('survival rerolls and next questions never reset the shared clock', () => {
  let state = reduce(playing('survival'), 'tick', { seconds: 20 });
  state = reduce(state, 'reroll');
  assert.equal(state.timeLeft, 40);
  state = reduce(state, 'loaded', { data, requestId: state.requestId });
  state = reduce(reduce(state, 'guess', { value: '東京' }), 'submit');
  assert.equal(state.timeLeft, 80);
  assert.ok(Number.isFinite(state.timeLeft));
  state = reduce(state, 'tick', { seconds: 3 });
  assert.equal(reduce(state, 'next').timeLeft, 77);
});

test('survival expires at zero and exhausting life reveals the answer', () => {
  assert.equal(reduce(playing('survival'), 'tick', { seconds: 100 }).status, 'finished');
  let state = playing('survival', { baseScore: 10 });
  state = reduce(reduce(state, 'guess', { value: '大阪' }), 'submit');
  assert.equal(state.status, 'answered');
  assert.equal(state.timeLeft, 50);
});

test('timeattack penalties retain elapsed time and completion requires correct answers', () => {
  let state = playing('timeattack', { baseScore: 10, questionCount: 1 });
  state = reduce(reduce(state, 'guess', { value: '大阪' }), 'submit');
  assert.equal(state.status, 'penalty');
  state = reduce(state, 'tick', { seconds: 5 });
  state = reduce(state, 'next');
  assert.equal(state.elapsed, 5);
  assert.equal(state.correct, 0);
  state = reduce(state, 'loaded', { data, requestId: state.requestId });
  state = reduce(reduce(state, 'guess', { value: '東京' }), 'submit');
  assert.equal(state.status, 'finished');
});

test('practice has free hints, unlimited retries and explicit answer reveal', () => {
  let state = playing('practice');
  state = reduce(reduce(state, 'guess', { value: '大阪' }), 'submit');
  assert.equal(state.status, 'playing');
  state = reduce(state, 'unmask', { random: 0 });
  assert.equal(state.points, 0);
  assert.deepEqual(state.revealedWords, ['とうきょう']);
  assert.equal(reduce(state, 'tick', { seconds: 10 }).timeLeft, state.timeLeft);
  assert.equal(reduce(state, 'reveal').status, 'answered');
});

test('storage tolerates malformed, inaccessible and non-array saved data', () => {
  const original = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  try {
    values.set('wikiGameHistory', '{broken');
    assert.deepEqual(readHistory(), []);
    values.set('wikiGameHistory', '{}');
    assert.deepEqual(readHistory(), []);
    for (let i = 0; i < 35; i++) saveArticle({ ...article, title: String(i) });
    assert.equal(readHistory().length, 30);
    saveArticle({ ...article, title: '34' });
    assert.equal(readHistory().filter(item => item.title === '34').length, 1);
    globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
    assert.deepEqual(readStored('test', []), []);
    assert.doesNotThrow(() => saveArticle(article));
  } finally { globalThis.localStorage = original; }
});

test('API selects readable popular articles and reverse mode requires a Wikimedia image', async () => {
  const original = globalThis.fetch;
  const popular = { ...article, extract: article.extract.repeat(10), pageviews: { a: 100, b: null } };
  const pictured = { ...popular, title: '大阪', thumbnail: { source: 'https://upload.wikimedia.org/test.jpg' }, pageviews: { a: 50 } };
  globalThis.fetch = async url => ({ ok: true, json: async () => url.includes('list=random')
    ? { query: { random: [{ title: '東京' }, { title: '大阪' }] } }
    : { query: { pages: { 1: popular, 2: pictured } } } });
  try {
    const settings = { fetchAttempts: 1, fetchBatchSize: 2 };
    assert.equal((await fetchRandomArticle(settings)).article.title, '東京');
    assert.equal((await fetchRandomArticle(settings, { isReverse: true })).article.title, '大阪');
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(fetchRandomArticle(settings));
  } finally { globalThis.fetch = original; }
});
