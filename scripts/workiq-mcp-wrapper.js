#!/usr/bin/env node
/**
 * WorkIQ MCP Wrapper
 * 
 * A custom MCP server that wraps `workiq ask` CLI command.
 * This bypasses the broken `workiq mcp` mode which can't authenticate
 * when spawned as a child process (msalruntime broker issue).
 * 
 * Instead, we implement the MCP protocol ourselves and shell out to
 * `workiq ask -q <query>` for each tool call, which uses interactive/cached auth.
 */
const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Find the workiq binary
function findWorkiqBinary() {
  const platform = process.platform === 'darwin' ? 'osx' : process.platform;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const binaryName = `${platform}-${arch}/workiq`;
  const npxCache = path.join(os.homedir(), '.npm', '_npx');
  
  if (fs.existsSync(npxCache)) {
    const dirs = fs.readdirSync(npxCache);
    for (const dir of dirs) {
      const candidate = path.join(npxCache, dir, 'node_modules', '@microsoft', 'workiq', 'bin', binaryName);
      if (fs.existsSync(candidate)) {
        try {
          const version = execSync(`"${candidate}" --version 2>/dev/null`, { encoding: 'utf8' }).trim();
          if (version.startsWith('0.4.')) {
            return candidate;
          }
        } catch (e) {}
      }
    }
  }
  // Fallback: try npx
  return null;
}

const WORKIQ_BINARY = findWorkiqBinary();

function sendResponse(response) {
  const json = JSON.stringify(response);
  process.stdout.write(json + '\n');
}

function handleMessage(msg) {
  if (msg.method === 'initialize') {
    sendResponse({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'WorkIQ',
          version: '1.0.0',
          description: 'M365 Copilot CLI MCP Server for asking questions about emails, meetings, files, and other M365 data.'
        }
      }
    });
  } else if (msg.method === 'notifications/initialized') {
    // No response needed
  } else if (msg.method === 'tools/list') {
    sendResponse({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        tools: [{
          name: 'ask_work_iq',
          description: 'Ask questions about your Microsoft 365 data including emails, calendar events, meetings, files, and people. Use natural language queries.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The natural language question to ask about your M365 data'
              }
            },
            required: ['query']
          }
        }]
      }
    });
  } else if (msg.method === 'tools/call') {
    const toolName = msg.params?.name;
    const query = msg.params?.arguments?.query;

    if (toolName !== 'ask_work_iq' || !query) {
      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        result: { content: [{ type: 'text', text: 'Invalid tool call' }], isError: true }
      });
      return;
    }

    try {
      const cmd = WORKIQ_BINARY 
        ? `"${WORKIQ_BINARY}" ask -q "${query.replace(/"/g, '\\"')}"`
        : `npx -y @microsoft/workiq@0.4.0 ask -q "${query.replace(/"/g, '\\"')}"`;
      
      const result = execSync(cmd, { 
        encoding: 'utf8', 
        timeout: 60000,
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        result: { content: [{ type: 'text', text: result.trim() }] }
      });
    } catch (e) {
      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        result: { 
          content: [{ type: 'text', text: `Error: ${e.message || 'Failed to query WorkIQ'}` }], 
          isError: true 
        }
      });
    }
  } else if (msg.id) {
    // Unknown method with id - send empty result
    sendResponse({ jsonrpc: '2.0', id: msg.id, result: {} });
  }
}

// Read JSON-RPC messages from stdin (newline-delimited)
const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    handleMessage(msg);
  } catch (e) {
    process.stderr.write(`[workiq-wrapper] Parse error: ${e.message}\n`);
  }
});

process.stderr.write('[workiq-wrapper] Started\n');
