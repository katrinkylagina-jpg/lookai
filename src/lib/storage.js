// Локальное хранилище — полная замена Firebase/Firestore
// Данные живут в браузере пользователя, ничего не отправляется на сервер

const KEY_PROFILE = 'lookai_profile';
const KEY_LOOKS = 'lookai_looks';

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : {}; // {} = новый пользователь
  } catch {
    return {};
  }
}

// uid игнорируется — совместимый API с firebase-версией
export async function saveUserProfile(_uid, data) {
  const existing = getUserProfile();
  const updated = { ...existing, ...data };
  localStorage.setItem(KEY_PROFILE, JSON.stringify(updated));
}

export async function saveLook(_uid, lookData) {
  const id = Date.now().toString();
  const raw = localStorage.getItem(KEY_LOOKS);
  const looks = raw ? JSON.parse(raw) : {};
  looks[id] = { ...lookData, createdAt: new Date().toISOString() };
  localStorage.setItem(KEY_LOOKS, JSON.stringify(looks));
  return id;
}

export function resetProfile() {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_LOOKS);
}
