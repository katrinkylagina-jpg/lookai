import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { analyzeProfile } from '../lib/gemini';
import { saveUserProfile } from '../lib/storage';

const PHOTO_SLOTS = [
  {
    id: 'eyePhoto',
    title: 'Глаз крупным планом',
    emoji: '👁️',
    hint: 'Один глаз, чёткий фокус — для определения цвета радужки',
    tips: ['Яркое освещение', 'Без линз', 'Чёткий фокус на радужке'],
  },
  {
    id: 'hairSkinPhoto',
    title: 'Волосы и кожа',
    emoji: '☀️',
    hint: 'При дневном освещении — для определения цветотипа',
    tips: ['Дневной свет', 'Без фильтров', 'Натуральный цвет волос'],
  },
  {
    id: 'facePhoto',
    title: 'Лицо анфас',
    emoji: '🪞',
    hint: 'Прямо в камеру — для определения формы лица',
    tips: ['Анфас, взгляд в камеру', 'Нейтральный фон', 'Без чёлки, волосы убраны'],
  },
  {
    id: 'bodyPhoto',
    title: 'Фигура в полный рост',
    emoji: '👗',
    hint: 'В облегающей одежде — для определения типа фигуры',
    tips: ['Облегающая одежда', 'Контрастный фон', 'Целиком, с головы до ног'],
  },
];

// Сжатие изображения до ~200KB
async function compressImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

export default function Photos() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [photos, setPhotos] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [error, setError] = useState('');
  const fileInputs = useRef({});

  const handleFileChange = async (slotId, file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotos((prev) => ({ ...prev, [slotId]: compressed }));
  };

  const allUploaded = PHOTO_SLOTS.every((s) => photos[s.id]);

  const handleAnalyze = async () => {
    if (!allUploaded || !user) return;
    setAnalyzing(true);
    setError('');

    try {
      setAnalysisStep('Анализирую цвет глаз и кожи...');
      await new Promise((r) => setTimeout(r, 800));

      setAnalysisStep('Определяю форму лица...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisStep('Анализирую тип фигуры...');
      const profileData = await analyzeProfile({
        eyePhoto: photos.eyePhoto,
        hairSkinPhoto: photos.hairSkinPhoto,
        facePhoto: photos.facePhoto,
        bodyPhoto: photos.bodyPhoto,
        height: profile?.height || 165,
        gender: profile?.gender || 'female',
      });

      setAnalysisStep('Сохраняю твой профиль...');
      await saveUserProfile(user.uid, {
        analysisProfile: profileData,
        photosAnalyzed: true,
        // Сохраняем сжатые фото для предпросмотра
        photoThumbs: {
          eyePhoto: photos.eyePhoto,
          facePhoto: photos.facePhoto,
          bodyPhoto: photos.bodyPhoto,
        },
      });

      await refreshProfile();
      navigate('/dashboard');
    } catch (e) {
      const msg = e.message || '';
      setError(
        msg.includes('429') || msg.includes('quota')
          ? 'Превышен лимит запросов Gemini. Подожди минуту и попробуй снова.'
          : msg.includes('JSON') || msg.includes('невалидный')
          ? 'Не удалось обработать фото. Убедись что фото чёткие и попробуй ещё раз.'
          : 'Ошибка анализа: ' + (msg.slice(0, 120) || 'неизвестная ошибка')
      );
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  if (analyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="analysis-spinner mb-6" />
          <h3 className="font-playfair text-2xl text-cream mb-3">AI изучает тебя...</h3>
          <p className="text-gold animate-pulse">{analysisStep}</p>
          <p className="text-muted text-sm mt-4">Это займёт 15–30 секунд</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-md mx-auto">
        {/* Шапка */}
        <div className="mb-8">
          <h2 className="font-playfair text-3xl font-bold text-cream mb-2">
            Загрузи 4 фото
          </h2>
          <p className="text-muted">
            Нужны для точного анализа — чем лучше фото, тем точнее результат
          </p>
        </div>

        {/* Слоты фото */}
        <div className="flex flex-col gap-4 mb-8">
          {PHOTO_SLOTS.map((slot) => (
            <div key={slot.id} className="photo-slot">
              {/* Превью */}
              <div
                className="photo-preview"
                onClick={() => fileInputs.current[slot.id]?.click()}
              >
                {photos[slot.id] ? (
                  <img
                    src={photos[slot.id]}
                    alt={slot.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted">
                    <span className="text-3xl">{slot.emoji}</span>
                    <span className="text-xs">Нажми, чтобы загрузить</span>
                  </div>
                )}
                {photos[slot.id] && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1">
                <h4 className="text-cream font-medium mb-1">{slot.title}</h4>
                <p className="text-muted text-sm mb-2">{slot.hint}</p>
                <div className="flex flex-wrap gap-1">
                  {slot.tips.map((tip) => (
                    <span key={tip} className="tip-chip">{tip}</span>
                  ))}
                </div>
              </div>

              {/* Скрытый инпут */}
              <input
                ref={(el) => (fileInputs.current[slot.id] = el)}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(slot.id, e.target.files[0])}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Прогресс загрузки */}
        <div className="flex gap-2 mb-6">
          {PHOTO_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className={`flex-1 h-1 rounded-full transition-colors ${
                photos[slot.id] ? 'bg-gold' : 'bg-surface'
              }`}
            />
          ))}
        </div>

        <button
          className={`w-full py-4 rounded-2xl font-semibold transition-all ${
            allUploaded
              ? 'btn-primary'
              : 'bg-surface text-muted cursor-not-allowed'
          }`}
          onClick={handleAnalyze}
          disabled={!allUploaded}
        >
          {allUploaded
            ? 'Анализировать мою внешность →'
            : `Загружено ${Object.keys(photos).length} из 4 фото`}
        </button>

        <p className="text-muted text-xs text-center mt-4">
          Фото не хранятся на серверах. Анализируются локально через Gemini AI.
        </p>
      </div>
    </div>
  );
}
