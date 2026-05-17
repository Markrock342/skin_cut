import http from 'node:http';

const port = Number(process.env.PORT || 8787);

const heroPool = [
  { skinId: 'airi-venom-violet', name: 'Airi - Venom Violet', heroName: 'Airi', tier: 'epic', confidence: 0.96, imageUrl: '' },
  { skinId: 'violet-pulsefire', name: 'Violet - Pulsefire', heroName: 'Violet', tier: 'mythic', confidence: 0.91, imageUrl: '' },
  { skinId: 'nakroth-twilight', name: 'Nakroth - Twilight Fury', heroName: 'Nakroth', tier: 'ultimate', confidence: 0.84, imageUrl: '' },
  { skinId: 'alice-fallen', name: 'Alice - Fallen Rose', heroName: 'Alice', tier: 'elite', confidence: 0.79, imageUrl: '' },
];

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/detect-skins') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const hasImage = body.includes('Content-Disposition: form-data; name="image"');

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      candidates: hasImage ? heroPool : heroPool.slice(0, 2),
    }));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`mock detect server running on http://localhost:${port}`);
});
