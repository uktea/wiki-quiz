import { isCorrectAnswer } from './utils.js';

export function createGame(mode, settings) {
  return {
    mode, settings, status: 'loading', requestId: 0, article: null,
    maskedText: '', words: [], revealedWords: [], visibleChars: 200,
    guess: '', message: '', points: settings.baseScore, score: 0,
    question: 1, correct: 0, combo: 0, rerolls: 0, hintUsed: false,
    timeLeft: settings.maxTime, questionTime: settings.maxTime, elapsed: 0, history: [],
  };
}

function loadQuestion(state, reroll = false) {
  const questionTime = reroll && state.mode === 'normal' ? Math.max(20, state.questionTime - 20) : state.settings.maxTime;
  return {
    ...state, status: 'loading', requestId: state.requestId + 1, article: null,
    guess: '', message: '', words: [], revealedWords: [], visibleChars: 200, hintUsed: false,
    points: reroll ? state.points : state.settings.baseScore,
    rerolls: reroll ? state.rerolls : 0, questionTime,
    timeLeft: state.mode === 'normal' ? questionTime : state.timeLeft,
  };
}

function reveal(state, message) {
  return { ...state, status: 'answered', message };
}

function charge(state, cost) {
  const points = Math.max(0, state.points - cost);
  if (state.mode === 'practice') return state;
  if (points > 0) return { ...state, points };
  const message = `正解は「${state.article.title}」でした。`;
  if (state.mode === 'timeattack') return { ...state, points, combo: 0, status: 'penalty', message: `${message} 5秒間のペナルティ` };
  if (state.mode === 'survival') {
    const timeLeft = Math.max(0, state.timeLeft - Math.max(0, cost - state.points));
    return { ...state, points, combo: 0, timeLeft, status: timeLeft === 0 ? 'finished' : 'answered', message };
  }
  return reveal({ ...state, points, combo: 0 }, `基礎スコアが0になりました。${message}`);
}

export function gameReducer(state, action) {
  const { settings, mode } = state;
  switch (action.type) {
    case 'loaded':
      if (state.status !== 'loading' || action.requestId !== state.requestId) return state;
      return {
        ...state, ...action.data, words: action.data.unmaskableWords,
        status: 'playing', message: '', history: [...state.history, action.data.article],
      };
    case 'failed':
      return state.status === 'loading' && action.requestId === state.requestId
        ? { ...state, status: 'error', message: '記事の取得に失敗しました。' } : state;
    case 'retry':
      return state.status === 'error' ? { ...state, status: 'loading', requestId: state.requestId + 1, message: '' } : state;
    case 'guess':
      return { ...state, guess: action.value };
    case 'tick': {
      if (mode === 'practice' || !state.article || !['playing', 'answered', 'penalty'].includes(state.status)) return state;
      if (mode === 'normal') {
        if (state.status !== 'playing') return state;
        const timeLeft = state.timeLeft - action.seconds;
        const previousPenalties = Math.floor(Math.max(0, -state.timeLeft) / 30);
        const penalties = Math.floor(Math.max(0, -timeLeft) / 30) - previousPenalties;
        const next = { ...state, timeLeft };
        return penalties > 0 ? charge(next, 10 * penalties) : next;
      }
      if (mode === 'timeattack') return { ...state, elapsed: state.elapsed + action.seconds };
      const timeLeft = Math.max(0, state.timeLeft - action.seconds);
      return { ...state, timeLeft, status: timeLeft === 0 ? 'finished' : state.status };
    }
    case 'submit': {
      if (state.status !== 'playing' || !state.guess.trim()) return state;
      if (!isCorrectAnswer(state.guess, state.article.title)) {
        return charge({ ...state, combo: 0, message: '不正解…！' }, settings.incorrectCost);
      }
      const combo = state.combo + 1;
      const bonus = (state.hintUsed ? 0 : settings.noHintBonus) + (state.rerolls ? 0 : settings.noRerollBonus)
        + (combo > 1 ? combo * settings.comboBonusMultiplier : 0);
      const points = state.points + Math.max(0, Math.floor(state.timeLeft / 3)) + bonus;
      const correct = state.correct + 1;
      return {
        ...state, correct, combo, score: state.score + (mode === 'normal' ? points : 0),
        timeLeft: mode === 'survival' ? Math.min(settings.timeCap, state.timeLeft + points) : state.timeLeft,
        status: mode === 'timeattack' && correct >= settings.questionCount ? 'finished' : 'answered',
        message: mode === 'normal' ? `正解！ ${points}点獲得` : `正解！答えは「${state.article.title}」でした。`,
      };
    }
    case 'hint':
      if (state.status !== 'playing' || state.visibleChars >= state.maskedText.length || settings.isReverse) return state;
      return charge({ ...state, visibleChars: state.visibleChars + 150, hintUsed: true }, settings.hintCost);
    case 'unmask': {
      if (state.status !== 'playing' || !state.words.length || settings.isReverse) return state;
      const index = Math.min(state.words.length - 1, Math.floor(action.random * state.words.length));
      return charge({ ...state, hintUsed: true, revealedWords: [...state.revealedWords, state.words[index]], words: state.words.filter((_, i) => i !== index) }, settings.unmaskHintCost);
    }
    case 'reroll': {
      if (state.status !== 'playing') return state;
      const cost = settings.rerollCostBase * (state.rerolls + 1);
      if (mode !== 'practice' && state.points <= cost) return { ...state, message: 'スコアが足りません！' };
      return loadQuestion({ ...state, points: state.points - cost, rerolls: state.rerolls + 1 }, true);
    }
    case 'reveal':
      return state.status === 'playing' && mode === 'practice' ? reveal(state, `正解は「${state.article.title}」でした。`) : state;
    case 'next':
      if (!['answered', 'penalty'].includes(state.status)) return state;
      if (mode === 'normal' && state.question >= settings.questionCount) return { ...state, status: 'finished' };
      return loadQuestion({ ...state, question: state.question + 1 });
    case 'finish':
      return { ...state, status: 'finished' };
    default:
      return state;
  }
}
