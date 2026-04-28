const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

// Resolve the @github/copilot bin entry point
const COPILOT_MODULE = path.resolve(__dirname, '../node_modules/@github/copilot/index.js');
const COPILOT_MODULE_URL = pathToFileURL(COPILOT_MODULE).href;

// Resolve the project root directory (parent of src/)
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Check if running in Electron
const isElectron = !!(process.versions && process.versions.electron);

/**
 * Spawn the Copilot CLI process.
 * 
 * When running under Electron with ELECTRON_RUN_AS_NODE, we need to use a special
 * approach: the Copilot CLI expects process.argv to NOT include a script path
 * (it treats argv[1] as a positional argument if it doesn't start with -).
 * 
 * So instead of: electron.exe copilot.js --server --stdio
 * We use: electron.exe -e "inline code that sets argv and imports copilot"
 */
function spawnCopilotProcess() {
  // Try native platform binary first (doesn't need Electron-as-Node)
  const nativeBin = path.resolve(__dirname, `../node_modules/@github/copilot-${process.platform}-${process.arch}/copilot`);
  const fs = require('fs');
  
  if (fs.existsSync(nativeBin)) {
    console.log(`[proxy] Using native CLI binary: ${nativeBin}`);
    return spawn(nativeBin, ['--headless', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: PROJECT_ROOT,
    });
  }

  // Fallback: JS entry via Electron-as-Node or system Node
  console.log(`[proxy] Using JS CLI entry: ${COPILOT_MODULE}`);
  if (isElectron) {
    const wrapperCode = `
      process.argv = [process.argv[0], '--headless', '--stdio'];
      import('${COPILOT_MODULE_URL}');
    `;
    
    return spawn(process.execPath, ['--input-type=module', '-e', wrapperCode], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      cwd: PROJECT_ROOT,
    });
  } else {
    return spawn(process.execPath, [COPILOT_MODULE, '--headless', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: PROJECT_ROOT,
    });
  }
}

function setupCopilotProxy(httpsServer) {
  const wss = new WebSocketServer({ noServer: true });

  const upgradeHandler = (request, socket, head) => {
    const url = new URL(request.url, `https://${request.headers.host}`);
    
    if (url.pathname === '/api/copilot') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let other WebSocket connections (e.g., Vite HMR) pass through
  };

  httpsServer.on('upgrade', upgradeHandler);

  // Store cleanup function on the server
  httpsServer.closeWebSockets = () => {
    wss.clients.forEach(client => client.terminate());
    wss.close();
  };

  wss.on('connection', (ws) => {
    const child = spawnCopilotProcess();

    child.on('error', () => {
      ws.close(1011, 'Child process error');
    });

    // Log CLI stderr for debugging
    child.stderr.on('data', (data) => {
      console.error('[copilot-cli stderr]', data.toString().trim());
    });

    child.on('exit', (code) => {
      console.log(`[copilot-cli] exited with code ${code}`);
      // Don't close WebSocket immediately - let pending sends complete.
      // The browser will detect the broken pipe when it tries to send.
    });

    // Buffer for incomplete LSP messages
    let buffer = Buffer.alloc(0);

    // Proxy child stdout -> WebSocket (buffer complete LSP messages)
    child.stdout.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      
      // Process complete messages from buffer
      let iterations = 0;
      while (iterations++ < 100) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) break;
        
        const header = buffer.slice(0, headerEnd).toString('utf8');
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
          buffer = buffer.slice(headerEnd + 4);
          continue;
        }
        
        const contentLength = parseInt(match[1], 10);
        const messageEnd = headerEnd + 4 + contentLength;
        
        if (buffer.length < messageEnd) break;
        
        const message = buffer.slice(0, messageEnd);
        buffer = buffer.slice(messageEnd);

        // Log CLI→browser messages for debugging
        try {
          const body = message.slice(headerEnd + 4).toString('utf8');
          const json = JSON.parse(body);
          if (json.method === 'session.event') {
            const ev = json.params?.event;
            if (ev) {
              const preview = ev.type === 'assistant.message_delta'
                ? (ev.data?.deltaContent || '').slice(0, 60)
                : ev.type === 'session.error'
                ? (ev.data?.message || JSON.stringify(ev.data)).slice(0, 100)
                : ev.type === 'session.mcp_server_status_changed'
                ? JSON.stringify(ev.data).slice(0, 200)
                : ev.type === 'session.mcp_servers_loaded'
                ? JSON.stringify(ev.data).slice(0, 200)
                : ev.type === 'tool.execution_start'
                ? JSON.stringify(ev.data).slice(0, 300)
                : ev.type === 'tool.execution_complete'
                ? JSON.stringify(ev.data).slice(0, 300)
                : '';
              console.log(`[proxy→ws] ${ev.type}${preview ? ' ' + preview : ''}`);
            }
          } else if (json.method === 'tool.call') {
            console.log(`[proxy→ws] tool.call id=${json.id}: ${json.params?.toolName}`);
          } else if (json.method === 'permission.request') {
            console.log(`[proxy→ws] permission.request id=${json.id}: ${json.params?.permissionRequest?.kind} ${json.params?.permissionRequest?.intention || ''}`);
          } else if (json.method) {
            console.log(`[proxy→ws] ${json.method} id=${json.id || 'n/a'}`);
          } else if (json.id !== undefined) {
            // Log responses (no method, has id)
            const preview = JSON.stringify(json.result || json.error).slice(0, 200);
            console.log(`[proxy→ws] response id=${json.id} ${preview}`);
          }
        } catch {}
        
        if (ws.readyState === ws.OPEN) {
          ws.send(message.toString('utf8'));
        }
      }
    });

    // Proxy WebSocket -> child stdin
    ws.on('message', (data) => {
      // Log browser→CLI messages for debugging
      try {
        const str = typeof data === 'string' ? data : data.toString('utf8');
        const headerEnd = str.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const body = str.slice(headerEnd + 4);
          const json = JSON.parse(body);
          if (json.id !== undefined && json.result !== undefined) {
            console.log(`[ws→proxy] response id=${json.id}`, JSON.stringify(json.result).slice(0, 120));
          } else if (json.method) {
            console.log(`[ws→proxy] ${json.method} id=${json.id || 'n/a'}`);
          }
        }
      } catch {}
      if (!child.killed) {
        child.stdin.write(data);
      }
    });

    ws.on('close', () => {
      if (!child.killed) {
        child.kill();
      }
    });

    ws.on('error', () => {
      if (!child.killed) {
        child.kill();
      }
    });
  });
}

module.exports = { setupCopilotProxy };
