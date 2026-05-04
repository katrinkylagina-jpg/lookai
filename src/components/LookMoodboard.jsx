// ─── Визуальный мудборд образа ─────────────────────────────────────────────
// Показывает фото пользователя + палитру + состав образа

export default function LookMoodboard({ outfit, profile }) {
  const bodyPhoto = profile?.photoThumbs?.bodyPhoto;
  const facePhoto = profile?.photoThumbs?.facePhoto;
  const ap = profile?.analysisProfile;

  const userPhoto = bodyPhoto || facePhoto;

  return (
    <div className="card mb-6 overflow-hidden p-0">
      {/* Заголовок */}
      <div className="px-4 pt-4 pb-3 border-b border-bordercolor">
        <h3 className="text-cream font-semibold text-sm">Как это выглядит</h3>
        <p className="text-muted text-xs">Твой образ визуально</p>
      </div>

      <div className="flex gap-0">
        {/* Левая колонка — фото пользователя */}
        <div className="w-2/5 relative bg-surface2">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Ты"
              className="w-full h-full object-cover object-top"
              style={{ minHeight: 280, maxHeight: 400 }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center text-center p-4"
              style={{ minHeight: 280 }}
            >
              <div className="text-5xl mb-3">{getSilhouette(ap?.bodyType)}</div>
              <p className="text-muted text-xs">{ap?.bodyType || 'Фигура'}</p>
            </div>
          )}

          {/* Бэдж цветотипа поверх фото */}
          {ap?.colorType && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1 text-center">
              <p className="text-gold text-xs font-semibold truncate">{ap.colorType}</p>
            </div>
          )}
        </div>

        {/* Правая колонка — палитра + вещи */}
        <div className="flex-1 p-3 flex flex-col gap-3">
          {/* Название образа */}
          <div>
            <p className="text-gold text-xs font-medium">{outfit.outfitVibe}</p>
            <p className="text-cream font-playfair font-bold text-base leading-tight">
              {outfit.outfitName}
            </p>
          </div>

          {/* Цветовые пятна образа */}
          {outfit.colorPalette?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {outfit.colorPalette.map((hex, i) => (
                <div
                  key={i}
                  className="rounded-full border border-white/10"
                  style={{ backgroundColor: hex, width: 22, height: 22 }}
                  title={hex}
                />
              ))}
            </div>
          )}

          {/* Список вещей */}
          <div className="flex flex-col gap-1.5 flex-1">
            {outfit.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {/* Цветной кружок вещи */}
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-white/10"
                  style={{
                    backgroundColor: item.colorsHex?.[0] || '#333',
                  }}
                />
                <span className="text-xs">
                  <span className="mr-1">{item.emoji}</span>
                  <span className="text-cream/80">{item.name}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Бюджет */}
          {outfit.totalBudgetMin && (
            <div className="mt-auto pt-2 border-t border-border">
              <p className="text-muted text-xs">
                Итого:{' '}
                <span className="text-gold font-semibold">
                  {outfit.totalBudgetMin.toLocaleString('ru')}–
                  {outfit.totalBudgetMax.toLocaleString('ru')} ₽
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Описание в подвале — почему сочетание работает */}
      {ap && (
        <div className="px-4 py-3 border-t border-border bg-gold/5">
          <p className="text-muted text-xs leading-relaxed">
            <span className="text-gold">✦ </span>
            Образ подобран под{' '}
            <span className="text-cream">цветотип {ap.colorType}</span>,{' '}
            <span className="text-cream">{BODY_TYPE_LABEL[ap.bodyType] || ap.bodyType}</span>{' '}
            и {ap.contrast} контрастность внешности.
            {profile?.styleVector && (
              <> Вектор стиля — <span className="text-cream">{profile.styleVector}</span>.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function getSilhouette(bodyType) {
  const map = {
    песочные_часы: '⌛',
    груша: '🍐',
    яблоко: '🍎',
    прямоугольник: '🟥',
    перевёрнутый_треугольник: '🔺',
  };
  return map[bodyType] || '🧍';
}

const BODY_TYPE_LABEL = {
  песочные_часы: 'фигуру «Песочные часы»',
  груша: 'фигуру «Груша»',
  яблоко: 'фигуру «Яблоко»',
  прямоугольник: 'прямоугольную фигуру',
  перевёрнутый_треугольник: 'фигуру «Перевёрнутый треугольник»',
};
