import http from 'node:http';
import { detectFromImageBuffer } from './server/detect-pipeline.mjs';

const port = Number(process.env.PORT || 8787);

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!boundaryMatch) return null;
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const parts = buffer.toString('binary').split(`--${boundary}`);
  const fields = {};
  let file = null;

  for (const part of parts) {
    if (!part || part === '--\r\n' || part === '--') continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd < 0) continue;
    const headers = part.slice(0, headerEnd);
    let body = part.slice(headerEnd + 4);
    if (body.endsWith('\r\n')) body = body.slice(0, -2);

    const nameMatch = /name="([^"]+)"/i.exec(headers);
    const filenameMatch = /filename="([^"]+)"/i.exec(headers);
    const name = nameMatch?.[1];
    if (!name) continue;

    if (filenameMatch) {
      file = {
        buffer: Buffer.from(body, 'binary'),
        filename: filenameMatch[1],
        mimeType: /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() || 'image/jpeg',
      };
    } else {
      fields[name] = Buffer.from(body, 'binary').toString('utf8').trim();
    }
  }

  return { fields, file };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, {
      ok: true,
      vision: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/detect-skins') {
    try {
      const body = await readBody(req);
      const ctype = req.headers['content-type'] || '';
      const gameId =
        url.searchParams.get('game') === 'mlbb' ? 'mlbb' : url.searchParams.get('game') === 'rov' ? 'rov' : 'rov';

      let imageBuffer = null;
      let mimeType = 'image/jpeg';
      let resolvedGame = gameId;

      if (ctype.includes('multipart/form-data')) {
        const parsed = parseMultipart(body, ctype);
        if (parsed?.file?.buffer?.length) {
          imageBuffer = parsed.file.buffer;
          mimeType = parsed.file.mimeType;
        }
        if (parsed?.fields?.gameId === 'mlbb' || parsed?.fields?.gameId === 'rov') {
          resolvedGame = parsed.fields.gameId;
        }
      } else if (body.length > 0) {
        imageBuffer = body;
        mimeType = ctype || 'image/jpeg';
      }

      if (!imageBuffer?.length) {
        json(res, 400, { error: 'Missing image', candidates: [] });
        return;
      }

      const result = await detectFromImageBuffer(imageBuffer, resolvedGame, mimeType);
      json(res, 200, result);
    } catch (err) {
      console.error('[detect-skins]', err);
      json(res, 500, {
        error: 'Detect failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        candidates: [],
      });
    }
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`API server http://localhost:${port}`);
  console.log('  POST /api/detect-skins');
  console.log('  GET  /api/health');
  if (process.env.OPENAI_API_KEY?.trim()) {
    console.log('  Vision: OpenAI enabled');
  } else {
    console.log('  Vision: set OPENAI_API_KEY for GPT-4o vision (optional)');
  }
});
