import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Splash() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Как только анонимный вход завершился — редиректим
  useEffect(() => {
    if (user === undefined) return; // ещё загружается
    if (!user) return; // ошибка входа

    if (profile?.onboardingComplete && profile?.photosAnalyzed) {
      navigate('/dashboard');
    } else if (profile?.onboardingComplete) {
      navigate('/photos');
    } else if (profile !== null) {
      // profile загружен и он пустой (новый пользователь)
      navigate('/onboarding');
    }
    // profile === null означает ещё грузится из Firestore
  }, [user, profile, navigate]);

  // Пока идёт автоматический вход — показываем лоадер
  if (user === undefined || (user && profile === null)) {
    return (
      <div className="min-h-screen splash-bg flex flex-col items-center justify-center gap-6">
        <div className="logo-badge">
          <span className="text-gold text-3xl">✦</span>
        </div>
        <div className="text-center">
          <h1 className="font-playfair text-5xl font-bold text-cream">LOOKAI</h1>
          <p className="text-muted text-sm tracking-[0.3em] mt-1 uppercase">Personal Stylist</p>
        </div>
        <div className="loader mt-4" />
      </div>
    );
  }

  // Новый пользователь — profile загружен и пустой, но useEffect уже редиректнул
  // Этот экран на случай задержки
  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 splash-bg">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="logo-badge">
          <span className="text-gold text-3xl">✦</span>
        </div>
        <div>
          <h1 className="font-playfair text-5xl font-bold text-cream leading-tight">LOOKAI</h1>
          <p className="text-muted text-sm tracking-[0.3em] mt-1 uppercase">Personal Stylist</p>
        </div>
        <p className="text-cream/70 text-lg max-w-xs leading-relaxed">
          Персональные образы, созданные AI под твою внешность
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-xs">
          {[
            { icon: '🎨', text: 'Анализ цветотипа' },
            { icon: '👗', text: 'Подбор образа' },
            { icon: '🏪', text: 'Ссылки в магазины' },
            { icon: '🪞', text: 'Совет по примерке' },
          ].map((f) => (
            <div key={f.text} className="feature-chip">
              <span>{f.icon}</span>
              <span className="text-xs text-cream/80">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full max-w-xs">
        <button className="btn-primary w-full py-5 text-lg" onClick={() => navigate('/onboarding')}>
          Начать бесплатно →
        </button>
        <p className="text-center text-muted text-xs mt-4">
          Без регистрации · Бесплатно · AI-стилист
        </p>
      </div>
    </div>
  );
}
