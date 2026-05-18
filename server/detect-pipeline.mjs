import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recognize } from 'tesseract.js';
import {
  dedupeCandidates,
  matchSkinsFromOcrText,
} from '../shared/skin-text-match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const catalogByGame = {
  rov: JSON.parse(
    fs.readFileSync(path.join(root, 'src/data/rov/catalog.fetched.json'), 'utf8'),
  ),
  mlbb: JSON.parse(
    fs.readFileSync(path.join(root, 'src/data/mlbb/catalog.fetched.json'), 'utf8'),
  ),
};

export function getCatalog(gameId) {
  return catalogByGame[gameId === 'mlbb' ? 'mlbb' : 'rov'];
}

export async function detectWithOcr(buffer, gameId) {
  const { data } = await recognize(buffer, 'eng', {
    tessedit_pageseg_mode: '3',
  });
  const candidates = matchSkinsFromOcrText(data.text, gameId, getCatalog(gameId)).map((c) => ({
    ...c,
    matchMethod: 'api',
  }));
  return dedupeCandidates(candidates);
}

export async function detectWithOpenAI(buffer, gameId, mimeType = 'image/jpeg') {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [];

  const base64 = buffer.toString('base64');
  const gameLabel = gameId === 'mlbb' ? 'Mobile Legends' : 'Arena of Valor (ROV)';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is a ${gameLabel} skin collection screenshot (grid of skin cards).
List each visible skin card as JSON only: {"candidates":[{"heroName":"...","name":"skin name","confidence":0.0-1.0}]}
Use English hero/skin names as shown in the game UI. One entry per card. No markdown.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI ${response.status}: ${err.slice(0, 200)}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  const parsed = parseVisionJson(content);
  const catalog = getCatalog(gameId);
  const { matchBestSkinFromText } = await import('../shared/skin-text-match.mjs');

  const candidates = [];
  for (const item of parsed) {
    const label = [item.heroName, item.name].filter(Boolean).join(' ');
    const matched =
      matchBestSkinFromText(label, gameId, catalog) ??
      matchBestSkinFromText(item.name ?? '', gameId, catalog);
    if (matched) {
      candidates.push({
        ...matched,
        confidence: Math.min(0.99, item.confidence ?? matched.confidence ?? 0.88),
        matchMethod: 'vision',
      });
    } else if (item.name) {
      candidates.push({
        skinId: `vision-${candidates.length}`,
        name: item.name,
        heroName: item.heroName,
        confidence: item.confidence ?? 0.5,
        matchMethod: 'vision',
        ocrSnippet: label,
      });
    }
  }

  return dedupeCandidates(candidates);
}

function parseVisionJson(content) {
  const trimmed = content.trim();
  try {
    const j = JSON.parse(trimmed);
    return Array.isArray(j.candidates) ? j.candidates : Array.isArray(j) ? j : [];
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) return [];
    try {
      const j = JSON.parse(m[0]);
      return Array.isArray(j.candidates) ? j.candidates : [];
    } catch {
      return [];
    }
  }
}

export async function detectFromImageBuffer(buffer, gameId, mimeType) {
  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const vision = await detectWithOpenAI(buffer, gameId, mimeType);
      if (vision.length > 0) {
        return { candidates: vision, source: 'vision' };
      }
    } catch (err) {
      console.warn('[detect] vision failed, fallback OCR:', err.message);
    }
  }

  const ocr = await detectWithOcr(buffer, gameId);
  return {
    candidates: ocr,
    source: ocr.length > 0 ? 'ocr' : 'none',
    message:
      ocr.length > 0
        ? 'อ่านจากรูปบนเซิร์ฟเวอร์ — ตรวจรายการก่อนกดเพิ่ม'
        : 'ไม่พบชื่อสกิน — ลองแคปกริดให้ชัดหรือตั้ง OPENAI_API_KEY',
  };
}
