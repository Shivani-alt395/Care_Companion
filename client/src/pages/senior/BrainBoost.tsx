import React, { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trophy, RefreshCw, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useTranslations } from '../../i18n';

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

const PILL_EMOJIS = ['💊', '💉', '🩺', '🏥', '🩻', '🩹', '💙', '🌡️'];
const QUIZ_QUESTIONS = [
  { question: 'Which pill is usually white and round?', options: ['Metformin', 'Aspirin', 'Vitamin C', 'Paracetamol'], answer: 1 },
  { question: 'Which medicine is used for high blood pressure?', options: ['Metformin', 'Aspirin', 'Amlodipine', 'Vitamin D'], answer: 2 },
  { question: 'When should you take Pantoprazole?', options: ['After food', 'Before food (30 min)', 'With milk', 'At night'], answer: 1 },
  { question: 'What does "twice daily" mean?', options: ['Once a day', 'Every 12 hours', 'Every 6 hours', 'Three times a day'], answer: 1 },
  { question: 'Which medicine should you take with food?', options: ['Levothyroxine', 'Aspirin', 'Pantoprazole', 'Metformin'], answer: 3 },
];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createCards(): Card[] {
  const emojis = shuffleArray(PILL_EMOJIS).slice(0, 6);
  return shuffleArray([...emojis, ...emojis].map((emoji, id) => ({ id, emoji, flipped: false, matched: false })));
}

export default function BrainBoost() {
  const { t } = useTranslations();
  const [gameType, setGameType] = useState<'memory' | 'quiz'>('memory');

  // Memory match
  const [cards, setCards] = useState<Card[]>(createCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);

  // Quiz
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const { data: scores } = useQuery({
    queryKey: ['games', 'scores'],
    queryFn: () => api.get<{ bestByType: Record<string, number>; streakByType: Record<string, number> }>('/games/scores'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { gameType: string; score: number; streak: number }) =>
      api.post('/games/scores', data),
  });

  const handleCardFlip = useCallback((cardId: number) => {
    if (flipped.length === 2 || cards[cardId].matched || cards[cardId].flipped) return;

    const newCards = cards.map((c, i) => i === cardId ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, cardId];
    setCards(newCards);
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          const matched = newCards.map((c, i) => i === a || i === b ? { ...c, matched: true } : c);
          setCards(matched);
          setFlipped([]);
          const newScore = score + 100 - moves * 2;
          setScore(Math.max(0, newScore));
          if (matched.every(c => c.matched)) {
            setGameComplete(true);
            setStreak(s => s + 1);
            saveMutation.mutate({ gameType: 'memory-match', score: Math.max(0, newScore), streak: streak + 1 });
          }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(newCards.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 1000);
      }
    }
  }, [cards, flipped, moves, score, streak, saveMutation]);

  function resetMemory() {
    setCards(createCards());
    setFlipped([]);
    setMoves(0);
    setScore(0);
    setGameComplete(false);
  }

  function handleQuizAnswer(optIdx: number) {
    if (selected !== null) return;
    setSelected(optIdx);
    if (optIdx === QUIZ_QUESTIONS[qIdx].answer) {
      setQuizScore(s => s + 20);
    }
    setTimeout(() => {
      if (qIdx < QUIZ_QUESTIONS.length - 1) {
        setQIdx(q => q + 1);
        setSelected(null);
      } else {
        setQuizDone(true);
        saveMutation.mutate({ gameType: 'pill-quiz', score: quizScore + (optIdx === QUIZ_QUESTIONS[qIdx].answer ? 20 : 0), streak: 1 });
      }
    }, 1500);
  }

  function resetQuiz() {
    setQIdx(0); setSelected(null); setQuizScore(0); setQuizDone(false);
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🧠</span> {t.games.title}
        </h1>
        <p className="text-gray-500 text-sm">{t.games.keepSharp}</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-purple-50 text-center">
          <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-1" aria-hidden="true" />
          <p className="text-xs text-gray-400">{t.games.memoryBest}</p>
          <p className="text-xl font-bold text-purple-700">{scores?.bestByType?.['memory-match'] ?? 0}</p>
        </div>
        <div className="card bg-blue-50 text-center">
          <Star className="w-6 h-6 text-blue-600 mx-auto mb-1" aria-hidden="true" />
          <p className="text-xs text-gray-400">{t.games.quizBest}</p>
          <p className="text-xl font-bold text-blue-700">{scores?.bestByType?.['pill-quiz'] ?? 0}</p>
        </div>
      </div>

      {/* Game tabs */}
      <div className="flex gap-2">
        {(['memory', 'quiz'] as const).map(g => (
          <button
            key={g}
            onClick={() => setGameType(g)}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${gameType === g ? 'bg-teal-700 text-white' : 'bg-warm-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            {g === 'memory' ? `🃏 ${t.games.memoryMatch}` : `❓ ${t.games.pillQuiz}`}
          </button>
        ))}
      </div>

      {/* Memory Match */}
      {gameType === 'memory' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4 text-sm">
              <span className="font-medium text-gray-600">{t.games.moves}: <strong>{moves}</strong></span>
              <span className="font-medium text-gray-600">{t.games.score}: <strong className="text-teal-700">{score}</strong></span>
            </div>
            <button onClick={resetMemory} className="btn-ghost text-sm px-3" aria-label={t.games.newGame}>
              <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" /> {t.games.newGame}
            </button>
          </div>

          {gameComplete ? (
            <div className="card text-center py-8 bg-green-50">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">{t.games.youWon}</h2>
              <p className="text-green-600 mb-4">{t.games.score}: <strong>{score}</strong> {t.games.of} {moves} {t.games.moves.toLowerCase()}</p>
              <button onClick={resetMemory} className="btn-primary mx-auto">
                {t.games.playAgain}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleCardFlip(idx)}
                  className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${
                    card.flipped || card.matched
                      ? 'bg-teal-100 dark:bg-teal-900/50 border-2 border-teal-400'
                      : 'bg-teal-700 hover:bg-teal-600'
                  } ${card.matched ? 'opacity-50' : ''}`}
                  aria-label={card.flipped || card.matched ? card.emoji : t.games.hiddenCard}
                  disabled={card.matched}
                >
                  {card.flipped || card.matched ? card.emoji : '?'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pill Quiz */}
      {gameType === 'quiz' && (
        <div>
          {quizDone ? (
            <div className="card text-center py-8 bg-blue-50">
              <div className="text-5xl mb-3">🎓</div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">{t.games.quizComplete}</h2>
              <p className="text-blue-600 mb-4">{t.games.score}: <strong>{quizScore}</strong>/100</p>
              <button onClick={resetQuiz} className="btn-primary mx-auto">{t.games.tryAgain}</button>
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">{t.games.question} {qIdx + 1}/{QUIZ_QUESTIONS.length}</span>
                <span className="font-bold text-teal-700">{t.games.score}: {quizScore}</span>
              </div>
              <div className="h-1.5 bg-warm-200 rounded-full mb-4">
                <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${((qIdx) / QUIZ_QUESTIONS.length) * 100}%` }} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-4">{QUIZ_QUESTIONS[qIdx].question}</h3>
              <div className="space-y-2">
                {QUIZ_QUESTIONS[qIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${
                      selected === null
                        ? 'border-warm-200 dark:border-gray-600 hover:border-teal-400 bg-white dark:bg-gray-700 dark:text-gray-100'
                        : i === QUIZ_QUESTIONS[qIdx].answer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : selected === i
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-warm-200 dark:border-gray-600 bg-white dark:bg-gray-700 opacity-50'
                    }`}
                    aria-label={opt}
                    aria-pressed={selected === i}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
