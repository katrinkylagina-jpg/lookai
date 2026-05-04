import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { saveUserProfile } from '../lib/storage';
import { STYLE_VECTORS } from '../lib/stylist';

// ─── Тест на вектор стиля (5 вопросов) ────────────────────────────────────

const QUESTIONS = [
  {
    id: 'q1',
    question: 'Где бы ты хотела провести идеальный вечер?',
    emoji: '🌙',
    options: [
      { label: 'Яркая вечеринка в клубе', emoji: '🎉', vectors: { Драматический: 2, Уличный: 1 } },
      { label: 'Ужин в ресторане при свечах', emoji: '🕯️', vectors: { Классический: 2, 'Сложная романтика': 1 } },
      { label: 'Уютное кафе с книгой', emoji: '📚', vectors: { Натуральный: 2, 'Романтичный наивный': 1 } },
      { label: 'Рок-концерт или арт-лофт', emoji: '🎸', vectors: { Гранж: 2, Драматический: 1 } },
    ],
  },
  {
    id: 'q2',
    question: 'Какая вещь из гардероба тебе ближе всего?',
    emoji: '👗',
    options: [
      { label: 'Структурированный пиджак', emoji: '👔', vectors: { Классический: 2, Драматический: 1 } },
      { label: 'Воздушное кружевное платье', emoji: '🌸', vectors: { 'Романтичный наивный': 2, 'Сложная романтика': 1 } },
      { label: 'Оверсайз-худи с кроссовками', emoji: '🧢', vectors: { Уличный: 2, 'Спортивный шик': 1 } },
      { label: 'Льняные брюки и натуральные ткани', emoji: '🌿', vectors: { Натуральный: 2, Классический: 1 } },
    ],
  },
  {
    id: 'q3',
    question: 'Какой принт тебе откликается?',
    emoji: '🎨',
    options: [
      { label: 'Геометрия, абстракция, крупные мотивы', emoji: '◼️', vectors: { Драматический: 2, Классический: 1 } },
      { label: 'Мелкий цветочек или горошек', emoji: '🌼', vectors: { 'Романтичный наивный': 2 } },
      { label: 'Клетка, полоска, минимализм', emoji: '🏁', vectors: { Классический: 2, Натуральный: 1 } },
      { label: 'Никакого принта — монохром', emoji: '⬛', vectors: { Гранж: 1, Уличный: 2, Драматический: 1 } },
    ],
  },
  {
    id: 'q4',
    question: 'Какой материал тебе нравится больше всего?',
    emoji: '🪡',
    options: [
      { label: 'Кожа, лак, металлик', emoji: '✨', vectors: { Драматический: 2, Гранж: 1 } },
      { label: 'Шёлк, шифон, кружево', emoji: '🌬️', vectors: { 'Романтичный наивный': 1, 'Сложная романтика': 2 } },
      { label: 'Лён, хлопок, трикотаж', emoji: '🧵', vectors: { Натуральный: 2, Классический: 1 } },
      { label: 'Трикотаж, неопрен, технические ткани', emoji: '🏃', vectors: { 'Спортивный шик': 2, Уличный: 1 } },
    ],
  },
  {
    id: 'q5',
    question: 'Какой образ тебя вдохновляет?',
    emoji: '💫',
    options: [
      { label: 'Дерзко и эпатажно — все смотрят', emoji: '🔥', vectors: { Драматический: 2, Уличный: 1 } },
      { label: 'Элегантно, без лишних деталей', emoji: '👑', vectors: { Классический: 2, 'Сложная романтика': 1 } },
      { label: 'Нежно и женственно', emoji: '🌷', vectors: { 'Романтичный наивный': 2, 'Сложная романтика': 1 } },
      { label: 'Небрежно, как будто не старалась', emoji: '☕', vectors: { Натуральный: 2, Уличный: 1 } },
    ],
  },
];

function calcStyleVector(answers) {
  const scores = {};
  for (const [, optionVectors] of Object.entries(answers)) {
    for (const [vec, pts] of Object.entries(optionVectors)) {
      scores[vec] = (scores[vec] || 0) + pts;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Классический';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState('gender'); // gender | welcome | test | height
  const [gender, setGender] = useState('female');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [height, setHeight] = useState(165);
  const [saving, setSaving] = useState(false);

  const handleAnswer = (questionId, option) => {
    const next = { ...answers, [questionId]: option.vectors };
    setAnswers(next);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setStep('height');
    }
  };

  const handleSkipTest = () => {
    setStep('height');
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const styleVector = Object.keys(answers).length > 0 ? calcStyleVector(answers) : null;
    await saveUserProfile(user.uid, {
      height,
      gender,
      styleVector,
      onboardingComplete: true,
    });
    await refreshProfile();
    navigate('/photos');
  };

  // ─── Пол ─────────────────────────────────────────────────────────────────

  if (step === 'gender') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs text-center">
          <div className="text-6xl mb-6">✦</div>
          <h2 className="font-playfair text-3xl font-bold text-cream mb-2">Добро пожаловать</h2>
          <p className="text-muted mb-10">Для кого подбираем образ?</p>
          <div className="flex gap-4">
            <button
              className={`flex-1 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                gender === 'female'
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-surface text-muted hover:border-gold/40'
              }`}
              onClick={() => setGender('female')}
            >
              <span className="text-4xl">👩</span>
              <span className="font-semibold text-cream">Девушка</span>
            </button>
            <button
              className={`flex-1 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                gender === 'male'
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-surface text-muted hover:border-gold/40'
              }`}
              onClick={() => setGender('male')}
            >
              <span className="text-4xl">👨</span>
              <span className="font-semibold text-cream">Парень</span>
            </button>
          </div>
          <button className="btn-primary w-full mt-8" onClick={() => setStep('welcome')}>
            Продолжить →
          </button>
        </div>
      </div>
    );
  }

  // ─── Welcome ────────────────────────────────────────────────────────────

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs text-center">
          <div className="text-6xl mb-6">🪞</div>
          <h2 className="font-playfair text-3xl font-bold text-cream mb-4">
            Познакомимся?
          </h2>
          <p className="text-muted mb-8 leading-relaxed">
            Ответь на 5 коротких вопросов — это поможет понять твой стиль. Займёт меньше минуты.
          </p>
          <button className="btn-primary w-full mb-3" onClick={() => setStep('test')}>
            Пройти тест →
          </button>
          <button className="btn-ghost w-full text-sm" onClick={handleSkipTest}>
            Пропустить, стилист решит сам
          </button>
        </div>
      </div>
    );
  }

  // ─── Тест ────────────────────────────────────────────────────────────────

  if (step === 'test') {
    const q = QUESTIONS[currentQ];
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

    return (
      <div className="min-h-screen flex flex-col px-6 py-10">
        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted mb-2">
            <span>Вопрос {currentQ + 1} из {QUESTIONS.length}</span>
            <button className="text-muted hover:text-cream" onClick={handleSkipTest}>
              Пропустить
            </button>
          </div>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Вопрос */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-4xl mb-4 text-center">{q.emoji}</div>
          <h3 className="font-playfair text-2xl font-bold text-cream mb-8 text-center">
            {q.question}
          </h3>

          <div className="flex flex-col gap-3">
            {q.options.map((opt) => (
              <button
                key={opt.label}
                className="test-option"
                onClick={() => handleAnswer(q.id, opt)}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-cream/90 text-left">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Рост ────────────────────────────────────────────────────────────────

  if (step === 'height') {
    const styleVector = Object.keys(answers).length > 0 ? calcStyleVector(answers) : null;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs">
          {styleVector && (
            <div className="bg-surface rounded-2xl p-4 mb-8 text-center border border-gold/20">
              <p className="text-muted text-sm mb-1">Твой вектор стиля</p>
              <p className="text-gold font-semibold text-lg">{styleVector}</p>
              <p className="text-muted text-xs mt-1">
                {STYLE_VECTORS[styleVector]?.description}
              </p>
            </div>
          )}

          <h2 className="font-playfair text-3xl font-bold text-cream mb-2 text-center">
            Твой рост
          </h2>
          <p className="text-muted text-center mb-8">
            Нужен для подбора масштаба принтов и аксессуаров
          </p>

          {/* Слайдер роста */}
          <div className="text-center mb-6">
            <div className="text-6xl font-playfair font-bold text-gold mb-1">
              {height}
            </div>
            <div className="text-muted text-sm">сантиметров</div>
          </div>

          <input
            type="range"
            min={145}
            max={195}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="range-input w-full mb-4"
          />

          <div className="flex justify-between text-xs text-muted mb-8">
            <span>145</span>
            <span className="text-muted/60">
              {height < 160 ? 'Петит 🌸' : height < 172 ? 'Средний рост' : 'Высокий рост ✨'}
            </span>
            <span>195</span>
          </div>

          <button
            className="btn-primary w-full"
            onClick={handleFinish}
            disabled={saving}
          >
            {saving ? <span className="loader-sm" /> : 'Далее — загружаем фото →'}
          </button>
        </div>
      </div>
    );
  }
}
