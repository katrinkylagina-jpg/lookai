import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildProfilePrompt, buildOutfitPrompt, buildAdvisorPrompt } from './stylist';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.4,
  },
});

// ─── Хелпер: конвертация base64 data URL → Part ────────────────────────────

function dataUrlToPart(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)[1];
  return { inlineData: { mimeType, data } };
}

// ─── Хелпер: парсинг JSON из ответа ───────────────────────────────────────

function parseJSON(text) {
  try {
    // Иногда модель оборачивает JSON в ```json ... ```
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(clean);
  } catch {
    throw new Error('Gemini вернул невалидный JSON. Попробуй ещё раз.');
  }
}

// ─── 1. Анализ профиля по 4 фото ───────────────────────────────────────────

export async function analyzeProfile({ eyePhoto, hairSkinPhoto, facePhoto, bodyPhoto, height }) {
  const prompt = buildProfilePrompt(height);

  const parts = [
    { text: prompt },
    dataUrlToPart(eyePhoto),
    dataUrlToPart(hairSkinPhoto),
    dataUrlToPart(facePhoto),
    dataUrlToPart(bodyPhoto),
  ];

  const result = await model.generateContent(parts);
  return parseJSON(result.response.text());
}

// ─── 2. Генерация образа ───────────────────────────────────────────────────

export async function generateOutfit({
  profile,
  styleVector,
  stylePreference,
  occasion,
  budgetMin,
  budgetMax,
}) {
  const prompt = buildOutfitPrompt({
    profile,
    styleVector,
    stylePreference,
    occasion,
    budgetMin,
    budgetMax,
  });

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── 3. Совет по вещи из магазина ─────────────────────────────────────────

export async function analyzeStoreItem({ profile, itemPhoto, userContext }) {
  const prompt = buildAdvisorPrompt({ profile, userContext });

  const parts = [{ text: prompt }, dataUrlToPart(itemPhoto)];

  const result = await model.generateContent(parts);
  return parseJSON(result.response.text());
}
