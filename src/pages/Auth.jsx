import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupRecaptcha, sendOTP, verifyOTP } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

const COUNTRY_CODES = [
  { code: '+7', flag: '🇷🇺', name: 'Россия' },
  { code: '+375', flag: '🇧🇾', name: 'Беларусь' },
  { code: '+380', flag: '🇺🇦', name: 'Украина' },
  { code: '+7', flag: '🇰🇿', name: 'Казахстан' },
  { code: '+994', flag: '🇦🇿', name: 'Азербайджан' },
  { code: '+995', flag: '🇬🇪', name: 'Грузия' },
  { code: '+998', flag: '🇺🇿', name: 'Узбекистан' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const recaptchaRef = useRef(null);

  const [step, setStep] = useState('phone'); // phone | otp
  const [countryCode, setCountryCode] = useState('+7');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Редирект если уже залогинен
  useEffect(() => {
    if (user && profile?.onboardingComplete && profile?.photosAnalyzed) {
      navigate('/dashboard');
    } else if (user && profile?.onboardingComplete) {
      navigate('/photos');
    } else if (user) {
      navigate('/onboarding');
    }
  }, [user, profile, navigate]);

  // Инициализация reCAPTCHA
  useEffect(() => {
    setupRecaptcha('recaptcha-container');
  }, []);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

  const handleSendOTP = async () => {
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Введи полный номер телефона');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOTP(fullPhone);
      setStep('otp');
      setCountdown(60);
    } catch (e) {
      setError('Ошибка отправки SMS. Проверь номер и попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Введи все 6 цифр кода');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOTP(code);
      // onAuthStateChanged в useAuth обновит user → useEffect редиректнет
    } catch {
      setError('Неверный код. Проверь SMS и попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(next);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Скрытый reCAPTCHA */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="w-full max-w-xs">
        {/* Назад */}
        <button
          className="text-muted hover:text-cream transition mb-8 flex items-center gap-2"
          onClick={() => (step === 'otp' ? setStep('phone') : navigate('/'))}
        >
          ← {step === 'otp' ? 'Изменить номер' : 'Назад'}
        </button>

        {/* Шаг: телефон */}
        {step === 'phone' && (
          <>
            <h2 className="font-playfair text-3xl font-bold text-cream mb-2">Войти</h2>
            <p className="text-muted mb-8">Введи номер телефона — пришлём код</p>

            {/* Выбор страны */}
            <div className="relative mb-3">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="input-field appearance-none pr-8 cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.name} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Номер */}
            <div className="flex gap-2 mb-6">
              <div className="input-field w-16 text-center font-mono shrink-0">
                {countryCode}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="900 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                className="input-field flex-1 font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              className="btn-primary w-full"
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? <span className="loader-sm" /> : 'Получить код →'}
            </button>

            <p className="text-muted text-xs text-center mt-6">
              Отправляя номер, ты соглашаешься с политикой конфиденциальности.
              Код приходит по SMS.
            </p>
          </>
        )}

        {/* Шаг: OTP */}
        {step === 'otp' && (
          <>
            <h2 className="font-playfair text-3xl font-bold text-cream mb-2">
              Введи код
            </h2>
            <p className="text-muted mb-2">
              Код отправлен на{' '}
              <span className="text-gold font-medium">{fullPhone}</span>
            </p>
            <p className="text-muted text-sm mb-8">Проверь SMS</p>

            {/* OTP инпуты */}
            <div className="flex gap-2 justify-between mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="otp-input"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              className="btn-primary w-full mb-4"
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? <span className="loader-sm" /> : 'Подтвердить →'}
            </button>

            {countdown > 0 ? (
              <p className="text-muted text-sm text-center">
                Отправить код повторно через {countdown} сек
              </p>
            ) : (
              <button
                className="btn-ghost w-full text-sm"
                onClick={() => {
                  setStep('phone');
                  setupRecaptcha('recaptcha-container');
                }}
              >
                Отправить код снова
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
