#!/usr/bin/env node
/**
 * Work IQ Docker Bridge
 *
 * MCP stdio server spawned by the Copilot CLI (running inside the Docker
 * container). For each `tools/call`, it forwards the query to the host
 * relay (`scripts/workiq-host-relay.js`) over HTTP, which executes the
 * Work IQ CLI natively where macOS Keychain / Windows WAM auth works.
 *
 * Configured via:
 *   WORKIQ_RELAY_URL — base URL of the host relay
 *                     (default: http://host.docker.internal:52391)
 */

const readline = require('readline');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const RELAY_URL = process.env.WORKIQ_RELAY_URL || 'http://host.docker.internal:52391';

function log(msg) {
    process.stderr.write(`[workiq-bridge] ${msg}\n`);
}

function send(response) {
    process.stdout.write(JSON.stringify(response) + '\n');
}

function postJson(urlString, body, callback) {
    const url = new URL(urlString);
    const lib = url.protocol === 'https:' ? https : http;
    const data = Buffer.from(JSON.stringify(body));

    const req = lib.request(
        {
            method: 'POST',
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
            timeout: 130000,
        },
        (res) => {
            let chunks = '';
            res.on('data', (c) => (chunks += c));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(chunks);
                    callback(null, res.statusCode, parsed);
                } catch (e) {
                    callback(new Error(`Invalid JSON from relay: ${chunks.slice(0, 200)}`));
                }
            });
        }
    );
    req.on('error', callback);
    req.on('timeout', () => req.destroy(new Error('Relay request timed out')));
    req.write(data);
    req.end();
}

function handle(msg) {
    log(`recv method=${msg.method} id=${msg.id}`);
    if (msg.method === 'initialize') {
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: {
                    name: 'WorkIQ (host-bridge)',
                    version: '1.0.0',
                    description: 'Bridges Work IQ MCP calls from Docker to host where M365 auth lives.',
                },
            },
        });
        return;
    }

    if (msg.method === 'notifications/initialized') return;

    if (msg.method === 'tools/list') {
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
                tools: [
                    {
                        name: 'ask_work_iq',
                        description:
                            'Ask questions about your Microsoft 365 data including emails, calendar events, meetings, files, Teams messages, and people. Use natural language queries.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'The natural language question to ask about your M365 data',
                                },
                            },
                            required: ['query'],
                        },
                    },
                ],
            },
        });
        return;
    }

    if (msg.method === 'tools/call') {
        const toolName = msg.params?.name;
        const query = msg.params?.arguments?.query;

        if (toolName !== 'ask_work_iq' || !query) {
            send({
                jsonrpc: '2.0',
                id: msg.id,
                result: { content: [{ type: 'text', text: 'Invalid tool call' }], isError: true },
            });
            return;
        }

        process.stderr.write(`[workiq-bridge] → relay: ${query.slice(0, 80)}\n`);

        postJson(`${RELAY_URL}/ask`, { query }, (err, status, body) => {
            if (err) {
                send({
                    jsonrpc: '2.0',
                    id: msg.id,
                    result: {
                        content: [{
                            type: 'text',
                            text: `Failed to reach Work IQ host relay at ${RELAY_URL}.\n` +
                                  `Make sure 'node scripts/workiq-host-relay.js' is running on the host.\n` +
                                  `Error: ${err.message}`,
                        }],
                        isError: true,
                    },
                });
                return;
            }
            if (status !== 200) {
                send({
                    jsonrpc: '2.0',
                    id: msg.id,
                    result: {
                        content: [{ type: 'text', text: `Work IQ error (${status}): ${body?.error || JSON.stringify(body)}` }],
                        isError: true,
                    },
                });
                return;
            }
            send({
                jsonrpc: '2.0',
                id: msg.id,
                result: { content: [{ type: 'text', text: body.result || '' }] },
            });
        });
        return;
    }

    if (msg.id) {
        send({ jsonrpc: '2.0', id: msg.id, result: {} });
    }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
    if (!line.trim()) return;
    try {
        handle(JSON.parse(line));
    } catch (e) {
        process.stderr.write(`[workiq-bridge] Parse error: ${e.message}\n`);
    }
});

process.stderr.write(`[workiq-bridge] Started, relay=${RELAY_URL}\n`);
