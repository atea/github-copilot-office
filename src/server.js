const express = require('express');
const https = require('https');
const { createServer: createViteServer } = require('vite');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { setupCopilotProxy } = require('./copilotProxy');

async function createServer() {
  const app = express();
  
  // ========== Backend API Routes ==========
  const apiRouter = express.Router();
  apiRouter.use(express.json({ limit: '50mb' }));
  
  // Simple test endpoint
  apiRouter.get('/hello', (req, res) => {
    res.json({ message: 'Hello from backend!', timestamp: new Date().toISOString() });
  });

  // Upload image from base64 data URL
  apiRouter.post('/upload-image', async (req, res) => {
    try {
      const { dataUrl, name } = req.body;
      
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      // Extract base64 data
      const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }

      const extension = matches[1] === 'svg+xml' ? 'svg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'copilot-office-images');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const filename = name || `image-${Date.now()}.${extension}`;
      const filepath = path.join(tempDir, filename);

      // Write file
      fs.writeFileSync(filepath, buffer);

      res.json({ path: filepath, name: filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for web fetch (GET only, avoids CORS)
  apiRouter.get('/fetch', async (req, res) => {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    try {
      const https = require('https');
      const http = require('http');
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'WordAddinDemo/1.0 (https://github.com; contact@example.com)'
        }
      };
      
      client.get(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          res.type('text/plain').send(data);
        });
      }).on('error', (e) => {
        res.status(500).json({ error: e.message });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Remote logging endpoint — prints client-side errors to the server console
  apiRouter.post('/log', (req, res) => {
    const { level = 'error', tag = 'client', message, detail } = req.body || {};
    const prefix = `[${tag}]`;
    if (level === 'error') {
      console.error(prefix, message, detail || '');
    } else {
      console.log(prefix, message, detail || '');
    }
    res.sendStatus(204);
  });

  // Return all skill definitions (SKILL.md files) from the skills directory
  apiRouter.get('/skills', (req, res) => {
    try {
      const skillsDir = path.resolve(__dirname, '..', 'skills');
      if (!fs.existsSync(skillsDir)) {
        return res.json({ skills: [] });
      }
      const skills = [];
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            skills.push({
              name: entry.name,
              content: fs.readFileSync(skillFile, 'utf8'),
            });
          }
        }
      }
      res.json({ skills });
    } catch (e) {
      console.error('[skills] Error loading skills:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // List available models by reading from the Copilot SDK type declarations
  apiRouter.get('/models', (req, res) => {
    try {
      const sdkTypes = path.resolve(__dirname, '../node_modules/@github/copilot/sdk/index.d.ts');
      const content = fs.readFileSync(sdkTypes, 'utf8');
      const match = content.match(/SUPPORTED_MODELS:\s*readonly\s*\[([^\]]+)\]/);
      if (!match) {
        return res.status(500).json({ error: 'Could not parse SUPPORTED_MODELS from SDK' });
      }
      const models = match[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      res.json({ models });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Browse directories for the folder picker
  apiRouter.get('/browse', (req, res) => {
    try {
      const dir = req.query.path || os.homedir();
      const resolved = path.resolve(String(dir));
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
        return res.status(400).json({ error: 'Not a directory', path: resolved });
      }
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const dirs = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      const parent = path.dirname(resolved);
      res.json({ path: resolved, parent: parent !== resolved ? parent : null, dirs });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get server's cwd and home for initial folder picker location
  apiRouter.get('/env', (req, res) => {
    res.json({ cwd: process.cwd(), home: os.homedir() });
  });

  // Remote logging endpoint for browser-side diagnostics
  apiRouter.post('/log', (req, res) => {
    const { tag, message, detail } = req.body || {};
    console.log(`[browser:${tag}]`, message, detail !== undefined ? JSON.stringify(detail) : '');
    res.json({ ok: true });
  });

  app.use('/api', apiRouter);

  // ========== Vite Dev Server (Frontend) ==========
  
  // Create HTTPS server first
  const certPath = path.resolve(__dirname, '../certs/localhost.pem');
  const keyPath = path.resolve(__dirname, '../certs/localhost-key.pem');
  
  const httpsConfig = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  
  const PORT = 52390;
  const httpsServer = https.createServer(httpsConfig, app);

  // Setup WebSocket proxy for Copilot
  setupCopilotProxy(httpsServer);
  
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        server: httpsServer,
      },
    },
    appType: 'spa',
    configFile: path.resolve(__dirname, '../vite.config.js'),
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  httpsServer.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
    console.log(`API available at https://localhost:${PORT}/api`);
  });
}

createServer().catch(console.error);



