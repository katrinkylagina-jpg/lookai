// ═══════════════════════════════════════════════════════════════════════════
//  Виртуальная примерка через HuggingFace IDM-VTON (бесплатно, публичный Space)
//  Модель: https://huggingface.co/spaces/yisol/IDM-VTON
//  Ожидание: 30–120 секунд. Может быть очередь.
// ═══════════════════════════════════════════════════════════════════════════

const HF_SPACE = 'https://yisol-idm-vton.hf.space';

/**
 * Запускает виртуальную примерку.
 * @param {string} personImage   – base64 data URL фото человека (тело)
 * @param {string} garmentImage  – base64 data URL фото вещи
 * @param {function} onStatus    – коллбэк (message: string)
 * @returns {string}             – base64 data URL результата
 */
export async function virtualTryOn(personImage, garmentImage, onStatus = () => {}) {
  onStatus('Отправляю фото на сервер...');

  // Шаг 1: отправить задание в очередь
  const submitRes = await fetch(`${HF_SPACE}/call/tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        personImage,   // фото человека
        garmentImage,  // фото вещи
        null,          // маска (авто)
        true,          // auto-mask
        true,          // auto-crop
        30,            // шагов денойзинга (меньше = быстрее)
        42,            // seed
      ],
    }),
  });

  if (!submitRes.ok) {
    throw new Error(`HuggingFace вернул ${submitRes.status}. Space может быть недоступен.`);
  }

  const { event_id } = await submitRes.json();
  if (!event_id) throw new Error('Не получен event_id от HuggingFace');

  onStatus('В очереди... Ожидание до 2 минут.');

  // Шаг 2: подписаться на SSE-поток результата
  return new Promise((resolve, reject) => {
    const url = `${HF_SPACE}/call/tryon/${event_id}`;
    const es = new EventSource(url);
    let completed = false;

    const timeout = setTimeout(() => {
      if (!completed) {
        es.close();
        reject(new Error('Превышено время ожидания (2 мин). Попробуй ещё раз.'));
      }
    }, 120_000);

    es.addEventListener('error', () => {
      if (completed) return;
      es.close();
      clearTimeout(timeout);
      reject(new Error('Ошибка соединения с HuggingFace. Пространство может быть перегружено.'));
    });

    es.addEventListener('message', (e) => {
      try {
        const payload = JSON.parse(e.data);

        if (payload.msg === 'queue_full') {
          es.close();
          clearTimeout(timeout);
          reject(new Error('Очередь переполнена. Подожди немного и попробуй снова.'));
          return;
        }

        if (payload.msg === 'estimation') {
          const sec = Math.round(payload.rank_eta ?? 30);
          onStatus(`В очереди (~${sec} сек)...`);
          return;
        }

        if (payload.msg === 'process_starts') {
          onStatus('Генерирую примерку...');
          return;
        }

        if (payload.msg === 'process_generating') {
          onStatus('Обрабатываю результат...');
          return;
        }

        if (payload.msg === 'process_completed') {
          completed = true;
          es.close();
          clearTimeout(timeout);

          // Результат — первый элемент output
          // Gradio возвращает либо { path, url } либо base64 строку
          const output = payload.output?.data?.[0];
          if (!output) {
            reject(new Error('Модель не вернула результат'));
            return;
          }

          // Если это объект с url
          if (typeof output === 'object' && (output.url || output.path)) {
            const imgUrl = output.url || `${HF_SPACE}/file=${output.path}`;
            // Конвертируем URL в base64 для отображения
            fetchAsBase64(imgUrl).then(resolve).catch(reject);
            return;
          }

          // Если это уже base64
          if (typeof output === 'string') {
            resolve(output.startsWith('data:') ? output : `data:image/png;base64,${output}`);
            return;
          }

          reject(new Error('Неизвестный формат ответа'));
        }
      } catch {
        // Игнорируем служебные SSE-сообщения (heartbeat и т.д.)
      }
    });
  });
}

async function fetchAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
