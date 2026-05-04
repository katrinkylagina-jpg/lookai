import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { COLOR_TYPE_DATA, BODY_TYPE_RULES, FACE_SHAPE_RULES, STYLE_VECTORS } from '../lib/stylist';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, resetSession } = useAuth();

  const ap = profile?.analysisProfile;
  const colorData = ap ? COLOR_TYPE_DATA[ap.colorType] : null;
  const bodyData  = ap ? BODY_TYPE_RULES[ap.bodyType]  : null;
  const faceData  = ap ? FACE_SHAPE_RULES[ap.faceShape] : null;
  const vectorData = profile?.styleVector ? STYLE_VECTORS[profile.styleVector] : null;

  return (
    <div className="min-h-screen px-6 py-10 pb-24">
      <div className="max-w-md mx-auto">

        {/* Шапка */}
        <div className="flex items-center gap-4 mb-8">
          <button className="text-muted hover:text-cream transition" onClick={() => navigate('/dashboard')}>
            ←
          </button>
          <h2 className="font-playfair text-2xl font-bold text-cream">Мой профиль</h2>
        </div>

        {/* Телефон */}
        <div className="card mb-4">
          <p className="text-muted text-xs mb-1">Аккаунт</p>
          <p className="text-cream font-medium">{user?.phoneNumber || '—'}</p>
          <p className="text-muted text-xs mt-1">Рост: {profile?.height ? `${profile.height} см` : '—'}</p>
        </div>

        {/* Вектор стиля */}
        {vectorData && (
          <div className="card mb-4 border-gold/20">
            <p className="text-muted text-xs mb-1">Вектор стиля</p>
            <p className="text-gold font-semibold text-lg">{profile.styleVector}</p>
            <p className="text-muted text-sm mt-1">{vectorData.description}</p>
          </div>
        )}

        {ap && (
          <>
            {/* Цветотип */}
            <div className="card mb-4">
              <p className="text-muted text-xs mb-2">🎨 Цветотип</p>
              <p className="text-cream font-bold text-xl">{ap.colorType}</p>
              <p className="text-gold text-sm mb-2">{ap.colorTypeDetail}</p>
              <p className="text-muted text-sm leading-relaxed mb-3">{ap.colorTypeReason}</p>

              {colorData?.principles && (
                <div className="bg-surface2 rounded-xl p-3 mb-3">
                  <p className="text-muted text-xs mb-2">Принципы твоего цветотипа:</p>
                  {colorData.principles.map((p, i) => (
                    <p key={i} className="text-cream/80 text-sm mb-1">• {p}</p>
                  ))}
                </div>
              )}

              <p className="text-muted text-xs mb-2">Твоя палитра:</p>
              <div className="flex gap-2 flex-wrap">
                {ap.palette?.map((hex, i) => (
                  <div key={i} className="text-center">
                    <div className="w-9 h-9 rounded-full border-2 border-surface shadow" style={{ backgroundColor: hex }} />
                    <p className="text-muted text-[9px] mt-0.5">{ap.paletteNames?.[i]}</p>
                  </div>
                ))}
              </div>

              {ap.avoidColorNames?.length > 0 && (
                <div className="mt-3">
                  <p className="text-muted text-xs mb-1">Избегай:</p>
                  <p className="text-red-400/80 text-sm">{ap.avoidColorNames.join(', ')}</p>
                </div>
              )}

              <p className="text-muted text-xs mt-2">Металлы: <span className="text-cream/70">{colorData?.metals}</span></p>
            </div>

            {/* Тип фигуры */}
            <div className="card mb-4">
              <p className="text-muted text-xs mb-2">👗 Тип фигуры</p>
              <p className="text-cream font-bold text-xl">{bodyData?.nameRu || ap.bodyType}</p>
              <p className="text-gold text-sm mb-2">{bodyData?.goal}</p>
              <p className="text-muted text-sm mb-2">{ap.bodyFeatures}</p>

              {bodyData?.advice && (
                <div className="mb-2">
                  <p className="text-muted text-xs mb-1">Что тебе идёт:</p>
                  {bodyData.advice.map((a, i) => (
                    <p key={i} className="text-cream/80 text-sm mb-0.5">✓ {a}</p>
                  ))}
                </div>
              )}
              {bodyData?.avoid && (
                <div>
                  <p className="text-muted text-xs mb-1">Избегай:</p>
                  {bodyData.avoid.map((a, i) => (
                    <p key={i} className="text-red-400/70 text-sm mb-0.5">✗ {a}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Лицо */}
            <div className="card mb-4">
              <p className="text-muted text-xs mb-2">🪞 Форма лица</p>
              <p className="text-cream font-bold text-xl capitalize">{ap.faceShape}</p>
              <p className="text-gold text-sm mb-2">Черты: {ap.faceLines}</p>
              <p className="text-muted text-sm mb-3">{ap.faceFeatures}</p>

              {faceData && (
                <div className="bg-surface2 rounded-xl p-3 text-sm">
                  <p className="text-cream/80 mb-1"><span className="text-muted text-xs">Вырезы: </span>{faceData.necklines}</p>
                  {faceData.avoid && <p className="text-red-400/70 mb-1"><span className="text-muted text-xs">Избегай: </span>{faceData.avoid}</p>}
                  <p className="text-cream/80"><span className="text-muted text-xs">Украшения: </span>{faceData.accessories}</p>
                </div>
              )}
            </div>

            {/* Контрастность и резюме */}
            <div className="card mb-6">
              <p className="text-muted text-xs mb-2">⚡ Общий анализ</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-surface2 rounded-xl p-3">
                  <p className="text-muted text-xs">Контрастность</p>
                  <p className="text-cream font-medium">{ap.contrast}</p>
                </div>
                <div className="bg-surface2 rounded-xl p-3">
                  <p className="text-muted text-xs">Подтон кожи</p>
                  <p className="text-cream font-medium">{ap.skinTone}</p>
                </div>
              </div>
              {ap.summary && (
                <p className="text-muted text-sm leading-relaxed italic">"{ ap.summary}"</p>
              )}
            </div>
          </>
        )}

        {/* Переснять */}
        <button
          className="btn-ghost w-full mb-3"
          onClick={() => navigate('/photos')}
        >
          📸 Обновить фотографии (переанализировать)
        </button>

        <button className="w-full text-muted text-sm py-3 hover:text-cream transition" onClick={resetSession}>
          Начать заново (сбросить профиль)
        </button>
      </div>
    </div>
  );
}
