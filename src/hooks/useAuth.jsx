import { useState, useEffect, useContext, createContext } from 'react';
import { getUserProfile, resetProfile } from '../lib/storage';

const AuthContext = createContext(null);

// Без Firebase — "пользователь" хранится локально
const LOCAL_USER = { uid: 'local' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = инициализируется
  const [profile, setProfile] = useState(null); // null = загружается

  useEffect(() => {
    // Имитируем асинхронную инициализацию (как раньше было у Firebase)
    const t = setTimeout(() => {
      setUser(LOCAL_USER);
      setProfile(getUserProfile()); // {} для новых, {...данные} для вернувшихся
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const refreshProfile = () => {
    setProfile(getUserProfile());
  };

  const resetSession = () => {
    resetProfile();
    setProfile({});
  };

  return (
    <AuthContext.Provider value={{ user, profile, refreshProfile, resetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
