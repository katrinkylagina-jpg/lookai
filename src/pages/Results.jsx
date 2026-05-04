import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getStoreLinks } from '../lib/stylist';
import LookMoodboard from '../components/LookMoodboard';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const outfit = location.state?.outfit;

  if (!outfit) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10 pb-24">
      <div className="max-w-md mx-auto">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <button
            className="text-muted hover:text-cream transition"
            onClick={() => navigate('/dashboard')}
          >
            ← Главная
          </button>
          <button
            className="btn-ghost text-sm px-4 py-2"
            onClick={() => navigate('/create')}
          >
            + Новый образ
          </button>
        </div>

        {/* Название образа */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="font-playfair text-3xl font-bold text-cream mb-2">
            {outfit.outfitName}
          </h2>
          <p className="text-gold italic font-medium mb-2">{outfit.outfitVibe}</p>
          <p className="text-muted text-sm leading-relaxed">{outfit.outfitDescription}</p>
        </div>

        {/* Визуальный мудборд */}
        <LookMoodboard outfit={outfit} profile={profile} />

        {/* Бюджет */}
        {outfit.totalBudgetMin && (
          <div className="flex justify-center mb-6">
            <div className="bg-gold/10 border border-gold/30 rounded-full px-5 py-2 text-sm">
              <span className="text-muted">Итого: </span>
              <span className="text-gold font-semibold">
                {outfit.totalBudgetMin.toLocaleString('ru')}–
                {outfit.totalBudgetMax.toLocaleString('ru')} ₽
              </span>
            </div>
          </div>
        )}

        {/* Цветовая палитра */}
        {outfit.colorPalette?.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-cream font-semibold mb-3">Палитра образа</h3>
            <div className="flex gap-3 flex-wrap">
              {outfit.colorPalette.map((hex, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-surface/50 shadow-lg mb-1"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-muted text-[10px]">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Вещи образа */}
        <h3 className="text-cream font-semibold mb-4">Состав образа</h3>
        <div className="flex flex-col gap-4 mb-8">
          {outfit.items?.map((item) => (
            <OutfitItem key={item.id} item={item} />
          ))}
        </div>

        {/* Советы стилиста */}
        {outfit.stylistTips?.length > 0 && (
          <div className="card mb-6 border-gold/20">
            <h3 className="text-gold font-semibold mb-3">💡 Советы стилиста</h3>
            <div className="flex flex-col gap-2">
              {outfit.stylistTips.map((tip, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gold/60 shrink-0 text-sm mt-0.5">✦</span>
                  <p className="text-muted text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Что избегать */}
        {outfit.whatToAvoid?.length > 0 && (
          <div className="card mb-6 border-red-500/20">
            <h3 className="text-cream font-semibold mb-3">🚫 Избегай</h3>
            <div className="flex flex-col gap-2">
              {outfit.whatToAvoid.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-red-400/60 shrink-0 text-sm mt-0.5">✗</span>
                  <p className="text-muted text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-col gap-3">
          <button className="btn-primary" onClick={() => navigate('/create')}>
            ✨ Создать ещё один образ
          </button>
          <button className="btn-ghost" onClick={() => navigate('/advisor')}>
            🪞 Совет по вещи из магазина
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Компонент вещи ────────────────────────────────────────────────────────

function OutfitItem({ item }) {
  const stores = getStoreLinks(item.searchQuery, item.searchQueryAlt);

  return (
    <div className="card">
      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-xl shrink-0">
          {item.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-muted text-xs uppercase tracking-wide">
              {item.category}
            </span>
            {(item.priceMin || item.priceMax) && (
              <span className="text-gold text-sm font-medium">
                {item.priceMin?.toLocaleString('ru')}–{item.priceMax?.toLocaleString('ru')} ₽
              </span>
            )}
          </div>
          <h4 className="text-cream font-semibold">{item.name}</h4>
        </div>
      </div>

      {/* Описание */}
      <p className="text-muted text-sm mb-3 leading-relaxed">{item.description}</p>

      {/* Почему подходит */}
      <div className="bg-gold/5 rounded-xl p-3 mb-3 border border-gold/10">
        <p className="text-xs text-gold mb-1 font-medium">✦ Почему тебе подходит</p>
        <p className="text-cream/80 text-sm leading-relaxed">{item.whySuitable}</p>
      </div>

      {/* Рекомендуемые цвета */}
      {item.colorsHex?.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-muted text-xs">Цвета:</span>
          <div className="flex gap-1">
            {item.colorsHex.map((hex, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-surface/50"
                style={{ backgroundColor: hex }}
                title={item.recommendedColors?.[i] || hex}
              />
            ))}
          </div>
          {item.recommendedColors?.length > 0 && (
            <span className="text-muted text-xs">
              {item.recommendedColors.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Что избегать (для вещи) */}
      {item.avoidColors?.length > 0 && (
        <p className="text-muted text-xs mb-3">
          <span className="text-red-400">Избегай: </span>
          {Array.isArray(item.avoidColors) ? item.avoidColors.join(', ') : item.avoidColors}
        </p>
      )}

      {/* Кнопки магазинов */}
      <div>
        <p className="text-muted text-xs mb-2">Найти в магазинах:</p>
        <div className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <a
              key={store.name}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="store-btn"
              style={{ '--store-color': store.color }}
            >
              <span className="font-bold text-xs">{store.shortName}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
