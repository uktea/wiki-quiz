import { useEffect, useReducer } from 'react';
import { createGame, gameReducer } from './gameEngine';
import { fetchRandomArticle } from './utils';
import { saveArticle } from './storage';

export function useQuiz(mode, settings, globalSettings) {
  const [state, dispatch] = useReducer(gameReducer, null, () => createGame(mode, settings));
  const { requestId, status, article } = state;

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    fetchRandomArticle(globalSettings, { signal: controller.signal, isReverse: settings.isReverse })
      .then(data => {
        if (!controller.signal.aborted) dispatch({ type: 'loaded', data, requestId });
      })
      .catch(() => {
        if (!disposed) dispatch({ type: 'failed', requestId });
      })
      .finally(() => clearTimeout(timeout));
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [requestId, globalSettings, settings.isReverse]);

  useEffect(() => {
    if (article) saveArticle(article);
  }, [article]);

  const ticking = mode !== 'practice' && Boolean(article) && ['playing', 'answered', 'penalty'].includes(status)
    && (mode !== 'normal' || status === 'playing');
  useEffect(() => {
    if (!ticking) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const seconds = Math.floor((now - previous) / 1000);
      if (seconds > 0) {
        previous += seconds * 1000;
        dispatch({ type: 'tick', seconds });
      }
    }, 250);
    return () => clearInterval(timer);
  }, [ticking]);

  useEffect(() => {
    const automatic = ['timeattack', 'survival'].includes(mode) && ['answered', 'penalty'].includes(status);
    if (!automatic) return;
    const timer = setTimeout(() => dispatch({ type: 'next' }), status === 'penalty' ? 5000 : 1500);
    return () => clearTimeout(timer);
  }, [mode, status]);

  return [state, dispatch];
}
