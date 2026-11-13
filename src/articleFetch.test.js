import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchRandomArticle } from './utils.js';

const settings = { fetchBatchSize: 20, fetchAttempts: 3 };
const page = (title, views = 1, extra = {}) => ({
  title, extract: '<p><b>' + title + '</b>は日本の都市である。</p>'.repeat(20),
  pageviews: { a: views, b: null }, ...extra,
});
const response = pages => ({ ok: true, json: async () => ({ query: { pages } }) });

async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { await run(); } finally { globalThis.fetch = original; }
}

test('default sampling uses three combined requests and compares every batch', async () => {
  const calls = [];
  await withFetch(async url => {
    const params = new URL(url).searchParams;
    calls.push(params);
    assert.equal(params.get('generator'), 'random');
    assert.equal(params.get('grnnamespace'), '0');
    assert.equal(params.get('grnfilterredir'), 'nonredirects');
    assert.equal(params.get('grnlimit'), '20');
    assert.equal(params.get('exlimit'), '20');
    assert.equal(params.get('exintro'), '1');
    assert.ok(!params.has('list') && !params.has('titles'));
    return response({ 1: page('都市' + calls.length, calls.length * 100) });
  }, async () => {
    const result = await fetchRandomArticle(settings);
    assert.equal(calls.length, 3);
    assert.equal(result.article.title, '都市3');
    assert.ok(!result.maskedText.includes('都市3'));
  });
});

test('large batches respect the 20-extract limit without losing candidates', async () => {
  const counts = [];
  await withFetch(async url => {
    const params = new URL(url).searchParams;
    counts.push(Number(params.get('grnlimit')));
    assert.equal(params.get('exlimit'), params.get('grnlimit'));
    return response({ 1: page('都市' + counts.length, counts.length) });
  }, async () => {
    const result = await fetchRandomArticle({ fetchBatchSize: 50, fetchAttempts: 1 });
    assert.deepEqual(counts, [20, 20, 10]);
    assert.equal(result.article.title, '都市3');
  });
});

test('invalid articles are skipped even when their view counts are higher', async () => {
  await withFetch(async () => response({
    1: page('曖昧', 1000, { pageprops: { disambiguation: '' } }),
    2: page('短い', 2000, { extract: '<p>短い</p>' }),
    3: page('有効', 100),
  }), async () => {
    assert.equal((await fetchRandomArticle({ ...settings, fetchAttempts: 1 })).article.title, '有効');
  });
});

test('failed samples do not discard successful candidates', async () => {
  let calls = 0;
  await withFetch(async () => {
    calls++;
    if (calls === 2) return response({ 1: page('有効') });
    throw Error('offline');
  }, async () => {
    assert.equal((await fetchRandomArticle(settings)).article.title, '有効');
    assert.equal(calls, 3);
  });
});

test('all-empty samples fail after the configured number of attempts', async () => {
  let calls = 0;
  await withFetch(async () => { calls++; return response({}); }, async () => {
    await assert.rejects(fetchRandomArticle(settings), /表示できる記事/);
    assert.equal(calls, 3);
  });
});

test('cancellation stops sampling, including after a usable candidate was found', async () => {
  const controller = new AbortController();
  let calls = 0;
  await withFetch(async (url, options) => {
    assert.equal(options.signal, controller.signal);
    calls++;
    controller.abort();
    return response({ 1: page('都市') });
  }, async () => {
    await assert.rejects(fetchRandomArticle({ ...settings, fetchAttempts: 1 }, { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(calls, 1);
  });
});

test('already cancelled requests perform no network I/O', async () => {
  const controller = new AbortController();
  controller.abort();
  await withFetch(async () => { assert.fail('unexpected request'); }, async () => {
    await assert.rejects(fetchRandomArticle(settings, { signal: controller.signal }), { name: 'AbortError' });
  });
});
