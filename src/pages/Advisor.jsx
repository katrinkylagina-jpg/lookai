import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { analyzeStoreItem } from '../lib/gemini';
import { virtualTryOn } from '../lib/tryon';
import { getStoreLinks } from '../lib/stylist';

async function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

export default function Advisor() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const fileRef = useRef(null);

  const [tab, setTab] = useState('advice'); // 'advice' | 'tryon'
  const [photo, setPhoto] = useState(null);
  const [context, setContext] = useState('');

  // Стилист-анализ
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Виртуальная примерка
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonStatus, setTryonStatus] = useState('');
  const [tryonResult, setTryonResult] = useState(null);
  const [tryonError, setTryonError] = useState('');

  const bodyPhoto = profile?.photoThumbs?.bodyPhoto;
  const hasBodyPhoto = !!bodyPhoto;

  const handleFile = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    setPhoto(compressed);
    setResult(null);
    setTryonResult(null);
    setError('');
    setTryonError('');
  };

  // ─── Совет стилиста ──────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!photo || !profile?.analysisProfile || !user) return;
    setLoading(true);
    setError('');
    try {
      const res = await analyzeStoreItem({
        profile: profile.analysisProfile,
        itemPhoto: photo,
        userContext: context.trim(),
      });
      setResult(res);
    } catch {
      setError('Ошибка анализа. Убедись что фото чёткое и попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Виртуальная примерка ────────────────────────────────────────────────

  const handleTryOn = async () => {
    if (!photo || !bodyPhoto) return;
    setTryonLoading(true);
    setTryonResult(null);
    setTryonError('');
    try {
      const result = await virtualTryOn(bodyPhoto, photo, setTryonStatus);
      setTryonResult(result);
    } catch (e) {
      setTryonError(e.message || 'Ошибка виртуальной примерки.');
    } finally {
      setTryonLoading(false);
      setTryonStatus('');
    }
  };

  const verdictColor = {
    подходит: 'text-green-400 border-green-500/30 bg-green-950/30',
    не_подходит: 'text-red-400 border-red-500/30 bg-red-950/30',
    частично: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/30',
  };
  const verdictLabel = {
    подходит: '✓ Подходит',
    не_подходит: '✗ Не подходит',
    частично: '~ Частично',
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto">

        {/* Шапка */}
        <div className="flex items-center gap-4 mb-6">
          <button className="text-muted hover:text-cream transition" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <h2 className="font-playfair text-2xl font-bold text-cream">Совет по вещи</h2>
            <p className="text-muted text-sm">Примерила что-то в магазине?</p>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'advice' ? 'bg-gold text-black' : 'text-muted hover:text-cream'}`}
            onClick={() => setTab('advice')}
          >
            🪞 Совет стилиста
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === 'tryon' ? 'bg-gold text-black' : 'text-muted hover:text-cream'}`}
            onClick={() => setTab('tryon')}
          >
            🪄 Примерить на себя
          </button>
        </div>

        {/* Загрузка фото вещи */}
        <div
          className="upload-zone mb-4 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {photo ? (
            <div className="relative w-full">
              <img src={photo} alt="Вещь" className="w-full max-h-72 object-contain rounded-xl" />
              <button
                className="absolute top-2 right-2 bg-surface/90 rounded-full w-8 h-8 flex items-center justify-center text-muted hover:text-cream"
                onClick={(e) => { e.stopPropagation(); setPhoto(null); setResult(null); setTryonResult(null); }}
              >✕</button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📸</div>
              <p className="text-cream font-medium mb-1">
                {tab === 'tryon' ? 'Загрузи фото вещи (отдельно)' : 'Загрузи фото из примерочной'}
              </p>
              <p className="text-muted text-sm">
                {tab === 'tryon' ? 'Лучше работает с фото на белом фоне' : 'Или фото самой вещи'}
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* ═══ ТАБ: СОВЕТ СТИЛИСТА ═══════════════════════════════════════════ */}
        {tab === 'advice' && (
          <>
            <div className="mb-6">
              <label className="text-muted text-sm mb-2 block">
                Опиши вещь или задай вопрос (необязательно)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Например: это синяя юбка А-силуэта. Подойдёт к белому пиджаку?"
                className="input-field w-full h-20 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!result && (
              <button
                className={`btn-primary w-full ${!photo ? 'opacity-50' : ''}`}
                onClick={handleAnalyze}
                disabled={!photo || loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="loader-sm" /> Стилист анализирует...</span>
                ) : '🪞 Получить совет стилиста'}
              </button>
            )}

            {result && <AdviceResult result={result} verdictColor={verdictColor} verdictLabel={verdictLabel} />}

            {result && (
              <button className="btn-ghost w-full mt-4" onClick={() => { setPhoto(null); setResult(null); setContext(''); }}>
                Проверить другую вещь
              </button>
            )}
          </>
        )}

        {/* ═══ ТАБ: ВИРТУАЛЬНАЯ ПРИМЕРКА ════════════════════════════════════ */}
        {tab === 'tryon' && (
          <>
            {/* Фото пользователя */}
            <div className="card mb-4">
              <p className="text-muted text-xs mb-2">Твоё фото (из профиля)</p>
              {hasBodyPhoto ? (
                <div className="flex items-center gap-3">
                  <img src={bodyPhoto} alt="Ты" className="w-16 h-20 object-cover object-top rounded-lg" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">✓ Фото есть</p>
                    <p className="text-muted text-xs mt-0.5">Будет использовано для примерки</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-lg bg-surface2 flex items-center justify-center text-2xl">🧍</div>
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Нет фото профиля</p>
                    <button className="text-gold text-xs underline mt-1" onClick={() => navigate('/photos')}>
                      Загрузить фото →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Инфо о технологии */}
            <div className="bg-surface2 rounded-xl p-3 mb-4 border border-gold/10">
              <p className="text-gold text-xs font-medium mb-1">🪄 Как это работает</p>
              <p className="text-muted text-xs leading-relaxed">
                Используется модель <span className="text-cream">IDM-VTON</span> (HuggingFace).
                Загружается твоё фото + фото вещи, модель генерирует как вещь выглядит на тебе.
                Работает лучше всего с вещами на нейтральном фоне.
              </p>
              <p className="text-muted text-xs mt-1">⏱ Ожидание: 30–120 сек · Бесплатно</p>
            </div>

            {tryonError && (
              <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{tryonError}</p>
                <p className="text-muted text-xs mt-1">
                  HuggingFace Spaces иногда бывают недоступны. Попробуй через несколько минут.
                </p>
              </div>
            )}

            {!tryonResult && (
              <button
                className={`btn-primary w-full ${(!photo || !hasBodyPhoto || tryonLoading) ? 'opacity-50' : ''}`}
                onClick={handleTryOn}
                disabled={!photo || !hasBodyPhoto || tryonLoading}
              >
                {tryonLoading ? (
                  <span className="flex flex-col items-center gap-1 py-1">
                    <span className="flex items-center gap-2">
                      <span className="loader-sm" /> {tryonStatus || 'Запускаю примерку...'}
                    </span>
                    <span className="text-xs opacity-70">Это займёт 30–120 секунд</span>
                  </span>
                ) : '🪄 Примерить виртуально'}
              </button>
            )}

            {/* Результат примерки */}
            {tryonResult && (
              <div className="mt-4">
                <div className="card p-0 overflow-hidden">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-green-400 font-semibold text-sm">✓ Готово!</p>
                    <p className="text-muted text-xs">Вот как эта вещь выглядит на тебе</p>
                  </div>

                  {/* Сравнение: до и после */}
                  <div className="flex">
                    <div className="flex-1 relative">
                      <img src={bodyPhoto} alt="До" className="w-full h-64 object-cover object-top" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1">
                        <p className="text-white text-xs">До</p>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <img src={tryonResult} alt="После" className="w-full h-64 object-cover object-top" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1">
                        <p className="text-gold text-xs font-medium">После ✨</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-muted text-xs text-center mt-3">
                  AI-примерка может быть неточной. Используй как ориентир, не как финальный результат.
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    className="btn-ghost flex-1 text-sm"
                    onClick={() => { setTryonResult(null); setPhoto(null); }}
                  >Попробовать другую вещь</button>
                  <button
                    className="btn-ghost flex-1 text-sm"
                    onClick={() => setTab('advice')}
                  >Получить совет →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Блок результата совета ────────────────────────────────────────────────

function AdviceResult({ result, verdictColor, verdictLabel }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className={`p-4 rounded-2xl border ${verdictColor[result.verdict] || verdictColor.частично}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl font-bold">{result.verdictScore}%</span>
          <span className="font-semibold">{verdictLabel[result.verdict] || result.verdict}</span>
        </div>
        <p className="text-sm leading-relaxed opacity-90">{result.explanation}</p>
      </div>

      {result.pros?.length > 0 && (
        <div className="card border-green-500/20">
          <h3 className="text-green-400 font-semibold mb-2">✓ Плюсы</h3>
          {result.pros.map((p, i) => <p key={i} className="text-muted text-sm mb-1">• {p}</p>)}
        </div>
      )}

      {result.cons?.length > 0 && (
        <div className="card border-red-500/20">
          <h3 className="text-red-400 font-semibold mb-2">✗ Минусы</h3>
          {result.cons.map((c, i) => <p key={i} className="text-muted text-sm mb-1">• {c}</p>)}
        </div>
      )}

      {result.alternativeIfBad && result.verdict === 'не_подходит' && (
        <div className="card border-gold/20">
          <h3 className="text-gold font-semibold mb-2">💡 Лучше искать</h3>
          <p className="text-muted text-sm">{result.alternativeIfBad}</p>
        </div>
      )}

      {result.pairWith?.length > 0 && (
        <div className="card">
          <h3 className="text-cream font-semibold mb-3">👗 Что подобрать</h3>
          <div className="flex flex-col gap-3">
            {result.pairWith.map((pair, i) => (
              <div key={i} className="bg-surface/50 rounded-xl p-3">
                <p className="text-muted text-xs mb-1">{pair.category}</p>
                <p className="text-cream text-sm font-medium mb-1">{pair.suggestion}</p>
                {pair.why && <p className="text-muted text-xs mb-2">{pair.why}</p>}
                {pair.searchQuery && (
                  <div className="flex gap-2 flex-wrap">
                    {getStoreLinks(pair.searchQuery).slice(0, 3).map((store) => (
                      <a key={store.name} href={store.url} target="_blank" rel="noopener noreferrer"
                        className="store-btn" style={{ '--store-color': store.color }}>
                        <span className="font-bold text-xs">{store.shortName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.howToWear && (
        <div className="card">
          <h3 className="text-cream font-semibold mb-2">✦ Как носить</h3>
          <p className="text-muted text-sm leading-relaxed">{result.howToWear}</p>
        </div>
      )}

      {result.stylistComment && (
        <div className="bg-gold/5 rounded-2xl p-4 border border-gold/20">
          <p className="text-gold text-xs font-medium mb-1">Стилист:</p>
          <p className="text-cream/80 text-sm italic leading-relaxed">"{result.stylistComment}"</p>
        </div>
      )}
    </div>
  );
}
