import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateOutfit } from '../lib/gemini';
import { saveLook } from '../lib/storage';
import { OCCASIONS, STYLE_OPTIONS } from '../lib/stylist';

const STEPS = ['occasion', 'style', 'budget', 'generating'];

const BUDGET_PRESETS = [
  { label: 'Эконом', range: [2000, 8000], desc: 'до 8 000 ₽' },
  { label: 'Средний', range: [8000, 20000], desc: '8–20 000 ₽' },
  { label: 'Комфорт', range: [20000, 40000], desc: '20–40 000 ₽' },
  { label: 'Люкс', range: [40000, 100000], desc: 'от 40 000 ₽' },
];

const ANALYSIS_STEPS = [
  { icon: '🎨', text: 'Читаю твой цветотип...' },
  { icon: '👗', text: 'Анализирую тип фигуры...' },
  { icon: '🪞', text: 'Учитываю форму лица...' },
  { icon: '✨', text: 'Подбираю идеальные вещи...' },
  { icon: '🛍️', text: 'Формирую ссылки в магазины...' },
];

export default function CreateLook() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState('occasion');
  const [occasion, setOccasion] = useState('');
  const [stylePreference, setStylePreference] = useState('');
  const [budgetPreset, setBudgetPreset] = useState(null);
  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(25000);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState('');

  const analysisProfile = profile?.analysisProfile;
  const styleVector = profile?.styleVector || 'Классический';
  const gender = profile?.gender || 'female';

  const runGeneration = async () => {
    if (!user || !analysisProfile) return;
    setStep('generating');
    setError('');

    // Анимируем шаги анализа
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }

    try {
      const outfit = await generateOutfit({
        profile: analysisProfile,
        gender,
        styleVector,
        stylePreference: stylePreference || 'ai_choice',
        occasion,
        budgetMin,
        budgetMax,
      });

      // Сохраняем в историю
      const lookId = await saveLook(user.uid, {
        outfit,
        params: { occasion, stylePreference, budgetMin, budgetMax },
      });

      navigate(`/results/${lookId}`, { state: { outfit, lookId } });
    } catch (e) {
      setError('Ошибка генерации. Попробуй ещё раз.');
      setStep('budget');
    }
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
    else navigate('/dashboard');
  };

  // ─── Шаг: повод ──────────────────────────────────────────────────────────

  if (step === 'occasion') {
    return (
      <StepWrapper title="Куда идём?" step={1} total={3} onBack={back}>
        <div className="grid grid-cols-2 gap-3">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              className={`occasion-tile ${occasion === o.id ? 'selected' : ''}`}
              onClick={() => {
                setOccasion(o.id);
                setStep('style');
              }}
            >
              <span className="text-3xl">{o.emoji}</span>
              <span className="text-cream font-medium text-sm">{o.label}</span>
              <span className="text-muted text-xs">{o.desc}</span>
            </button>
          ))}
        </div>
      </StepWrapper>
    );
  }

  // ─── Шаг: стиль ──────────────────────────────────────────────────────────

  if (step === 'style') {
    return (
      <StepWrapper title="Какой стиль сегодня?" step={2} total={3} onBack={back}>
        <div className="grid grid-cols-2 gap-3">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              className={`occasion-tile ${stylePreference === s.id ? 'selected' : ''}`}
              onClick={() => {
                setStylePreference(s.id);
                setStep('budget');
              }}
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-cream font-medium text-sm">{s.label}</span>
              <span className="text-muted text-xs">{s.desc}</span>
            </button>
          ))}
        </div>
      </StepWrapper>
    );
  }

  // ─── Шаг: бюджет ─────────────────────────────────────────────────────────

  if (step === 'budget') {
    return (
      <StepWrapper title="Бюджет на образ" step={3} total={3} onBack={back}>
        {/* Пресеты */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {BUDGET_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`budget-preset ${budgetPreset === p.label ? 'selected' : ''}`}
              onClick={() => {
                setBudgetPreset(p.label);
                setBudgetMin(p.range[0]);
                setBudgetMax(p.range[1]);
              }}
            >
              <span className="text-cream font-semibold">{p.label}</span>
              <span className="text-muted text-sm">{p.desc}</span>
            </button>
          ))}
        </div>

        {/* Ручной ввод */}
        <div className="card mb-6">
          <p className="text-muted text-sm mb-3">Или укажи точный диапазон (₽)</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-muted text-xs mb-1 block">От</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => {
                  setBudgetMin(Number(e.target.value));
                  setBudgetPreset(null);
                }}
                className="input-field w-full"
                min={500}
                step={500}
              />
            </div>
            <div className="flex-1">
              <label className="text-muted text-xs mb-1 block">До</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => {
                  setBudgetMax(Number(e.target.value));
                  setBudgetPreset(null);
                }}
                className="input-field w-full"
                min={1000}
                step={500}
              />
            </div>
          </div>
        </div>

        {/* Показываем выбранные параметры */}
        <div className="bg-gold/10 rounded-xl p-4 mb-6 border border-gold/20">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted text-xs">Повод</p>
              <p className="text-cream font-medium">
                {OCCASIONS.find((o) => o.id === occasion)?.label}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Стиль</p>
              <p className="text-cream font-medium">
                {STYLE_OPTIONS.find((s) => s.id === stylePreference)?.label || '✨ AI'}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs">Бюджет</p>
              <p className="text-cream font-medium">
                {(budgetMin / 1000).toFixed(0)}–{(budgetMax / 1000).toFixed(0)}к ₽
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button className="btn-primary w-full py-5 text-lg" onClick={runGeneration}>
          ✨ Создать образ →
        </button>
      </StepWrapper>
    );
  }

  // ─── Шаг: генерация ──────────────────────────────────────────────────────

  if (step === 'generating') {
    const current = ANALYSIS_STEPS[analysisStep];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="analysis-spinner mb-8" />

          <div className="mb-6">
            <div className="text-4xl mb-3">{current?.icon}</div>
            <p className="text-gold text-lg animate-pulse">{current?.text}</p>
          </div>

          <div className="flex gap-2 justify-center mt-6">
            {ANALYSIS_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i <= analysisStep ? 'bg-gold scale-125' : 'bg-surface'
                }`}
              />
            ))}
          </div>

          <p className="text-muted text-sm mt-6">
            Твой персональный стилист работает...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function StepWrapper({ children, title, step, total, onBack }) {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto">
        {/* Шапка */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-muted hover:text-cream transition"
          >
            ←
          </button>
          <div className="flex-1">
            <p className="text-muted text-xs mb-1">
              Шаг {step} из {total}
            </p>
            <h2 className="font-playfair text-2xl font-bold text-cream">{title}</h2>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i < step ? 'bg-gold' : 'bg-surface'
              }`}
            />
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
