import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { COLOR_TYPE_DATA, BODY_TYPE_RULES } from '../lib/stylist';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, resetSession } = useAuth();

  const analysisProfile = profile?.analysisProfile;
  const colorData = analysisProfile ? COLOR_TYPE_DATA[analysisProfile.colorType] : null;
  const bodyData  = analysisProfile ? BODY_TYPE_RULES[analysisProfile.bodyType]  : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро 👋' : hour < 18 ? 'Добрый день 👋' : 'Добрый вечер 👋';

  return (
    <div className="min-h-screen px-6 py-10 pb-24">
      <div className="max-w-md mx-auto">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted text-sm">{greeting}</p>
            <h2 className="font-playfair text-2xl font-bold text-cream">Твой AI-стилист</h2>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-surface border border-gold/20 flex items-center justify-center text-lg"
          >
            👤
          </button>
        </div>

        {/* Профиль внешности */}
        {analysisProfile && (
          <div className="card mb-6">
            <h3 className="text-cream font-semibold mb-4">Твой профиль внешности</h3>
            <div className="grid grid-cols-2 gap-3">
              <ProfileBadge icon="🎨" label="Цветотип"      value={analysisProfile.colorType}               sub={analysisProfile.colorTypeDetail} />
              <ProfileBadge icon="👗" label="Тип фигуры"    value={bodyData?.nameRu || analysisProfile.bodyType} sub={bodyData?.goal} />
              <ProfileBadge icon="🪞" label="Форма лица"    value={analysisProfile.faceShape}               sub={analysisProfile.faceLines} />
              <ProfileBadge icon="⚡" label="Контрастность" value={analysisProfile.contrast}                sub={analysisProfile.skinTone} />
            </div>

            {analysisProfile.palette?.length > 0 && (
              <div className="mt-4">
                <p className="text-muted text-xs mb-2">Твоя цветовая палитра</p>
                <div className="flex gap-2 flex-wrap">
                  {analysisProfile.palette.slice(0, 6).map((hex, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-surface shadow"
                      style={{ backgroundColor: hex }}
                      title={analysisProfile.paletteNames?.[i] || hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Главные кнопки */}
        <div className="flex flex-col gap-3 mb-6">
          <button className="btn-primary py-5 text-lg" onClick={() => navigate('/create')}>
            ✨ Создать образ
          </button>
          <button className="btn-secondary py-4" onClick={() => navigate('/advisor')}>
            🪞 Совет по вещи из магазина
          </button>
        </div>

        {/* Как это работает — только новым пользователям */}
        {!analysisProfile && (
          <div className="card border-gold/30">
            <h3 className="text-gold font-semibold mb-3">Как это работает</h3>
            <div className="flex flex-col gap-3">
              {[
                { n: 1, text: 'Загружаешь 4 фото своей внешности' },
                { n: 2, text: 'AI анализирует цветотип, фигуру и черты лица' },
                { n: 3, text: 'Получаешь персональный образ со ссылками в магазины' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gold/20 text-gold text-sm flex items-center justify-center font-bold shrink-0">
                    {s.n}
                  </div>
                  <span className="text-muted text-sm">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="w-full text-muted text-sm mt-8 hover:text-cream transition"
          onClick={resetSession}
        >
          Начать заново (сбросить профиль)
        </button>
      </div>
    </div>
  );
}

function ProfileBadge({ icon, label, value, sub }) {
  return (
    <div className="bg-surface/50 rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-muted text-xs">{label}</span>
      </div>
      <div className="text-cream font-semibold text-sm capitalize">{value}</div>
      {sub && <div className="text-muted text-xs mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
