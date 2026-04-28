/*---------------------------------------------------------------------------------------------
 *  WebSocket-based CopilotClient for browser environments
 *  Custom client that connects to the Copilot CLI via WebSocket proxy
 *--------------------------------------------------------------------------------------------*/

import { createMessageConnection, MessageConnection } from "vscode-jsonrpc/browser";
import { WebSocketMessageReader, WebSocketMessageWriter } from "./websocket-transport";
import type {
    SessionConfig,
    SessionEvent,
    SessionEventHandler,
    MessageOptions,
    Tool,
    ToolHandler,
    ToolInvocation,
} from "@github/copilot-sdk";

interface ToolCallRequestPayload {
    sessionId: string;
    toolCallId: string;
    toolName: string;
    arguments: unknown;
}

interface ToolCallResponsePayload {
    result: unknown;
}

export interface PermissionRequest {
    kind: "shell" | "write" | "read" | "mcp";
    toolCallId?: string;
    intention?: string;
    // shell
    fullCommandText?: string;
    commands?: ReadonlyArray<{ identifier: string }>;
    // write
    fileName?: string;
    diff?: string;
    // read
    path?: string;
    // mcp
    serverName?: string;
    toolName?: string;
    args?: unknown;
}

export type PermissionResult =
    | { kind: "approve-once" }
    | { kind: "approve-for-session"; approval?: any }
    | { kind: "approve-for-location"; approval?: any }
    | { kind: "reject"; feedback?: string }
    | { kind: "user-not-available" };

export type PermissionHandler = (request: PermissionRequest) => Promise<PermissionResult>;

export interface ModelInfo {
    id: string;
    name: string;
    capabilities?: {
        supports?: {
            vision?: boolean;
            reasoningEffort?: boolean;
        };
    };
}

interface PermissionRequestPayload {
    sessionId: string;
    permissionRequest: PermissionRequest;
}

export interface CreateSessionOptions extends Partial<SessionConfig> {
    requestPermission?: boolean;
    workingDirectory?: string;
    availableTools?: string[];
}

/**
 * Browser-compatible CopilotSession
 */
export class BrowserCopilotSession {
    private eventHandlers: Set<SessionEventHandler> = new Set();
    private toolHandlers: Map<string, ToolHandler> = new Map();
    private permissionHandler: PermissionHandler | null = null;

    constructor(
        public readonly sessionId: string,
        private connection: MessageConnection,
    ) {}

    async send(options: MessageOptions): Promise<string> {
        const response = await this.connection.sendRequest("session.send", {
            sessionId: this.sessionId,
            prompt: options.prompt,
            attachments: options.attachments,
            mode: options.mode,
        });
        return (response as { messageId: string }).messageId;
    }

    /**
     * Send a prompt and iterate over response events.
     */
    async *query(options: MessageOptions): AsyncGenerator<SessionEvent, void, undefined> {
        const queue: SessionEvent[] = [];
        let resolve: (() => void) | null = null;
        let done = false;
        let sendError: Error | null = null;

        const unsubscribe = this.on((event) => {
            queue.push(event);
            resolve?.();
            if (event.type === "session.idle" || event.type === "session.error") {
                done = true;
            }
        });

        this.send(options).catch((e) => { 
            sendError = e instanceof Error ? e : new Error(String(e));
            done = true; 
            resolve?.();
        });

        try {
            while (!done || queue.length > 0) {
                if (queue.length > 0) {
                    yield queue.shift()!;
                } else {
                    await new Promise<void>((r) => { resolve = r; });
                    resolve = null;
                }
            }
            if (sendError) {
                throw sendError;
            }
        } finally {
            unsubscribe();
        }
    }

    on(handler: SessionEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => { this.eventHandlers.delete(handler); };
    }

    _dispatchEvent(event: SessionEvent, connection: MessageConnection | null): void {
        // Handle v3 event-based tool calls
        if (event.type === "external_tool.requested" && connection) {
            const { requestId, toolName, toolCallId, arguments: args } = (event as any).data;
            const handler = this.getToolHandler(toolName);
            if (handler) {
                void this._executeToolAndRespond(connection, requestId, toolName, toolCallId, args, handler);
            } else {
                console.log('[external_tool.requested] no handler for', toolName);
                void connection.sendRequest("session.tools.handlePendingToolCall", {
                    sessionId: this.sessionId,
                    requestId,
                    result: {
                        textResultForLlm: `Tool '${toolName}' not supported`,
                        resultType: "failure",
                        error: `tool '${toolName}' not supported`,
                        toolTelemetry: {},
                    },
                });
            }
            return; // Don't dispatch to UI event handlers
        }

        // Handle v3 event-based permission requests
        if (event.type === "permission.requested" && connection) {
            const { requestId, permissionRequest } = (event as any).data;
            void this._executePermissionAndRespond(connection, requestId, permissionRequest);
            return; // Don't dispatch to UI event handlers
        }

        for (const handler of this.eventHandlers) {
            try { handler(event); } catch { /* ignore */ }
        }
    }

    /** Execute a tool handler and send the result back via RPC (v3 protocol). */
    private async _executeToolAndRespond(
        connection: MessageConnection,
        requestId: string,
        toolName: string,
        toolCallId: string,
        args: unknown,
        handler: ToolHandler,
    ): Promise<void> {
        try {
            const invocation: ToolInvocation = {
                sessionId: this.sessionId,
                toolCallId,
                toolName,
                arguments: args,
            };
            const rawResult = await handler(args, invocation);
            console.log('[external_tool.requested] result for', toolName);
            const result = typeof rawResult === "string" ? rawResult : rawResult;
            await connection.sendRequest("session.tools.handlePendingToolCall", {
                sessionId: this.sessionId,
                requestId,
                result,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log('[external_tool.requested] error for', toolName, message);
            await connection.sendRequest("session.tools.handlePendingToolCall", {
                sessionId: this.sessionId,
                requestId,
                result: {
                    textResultForLlm: message,
                    resultType: "failure",
                    error: message,
                    toolTelemetry: {},
                },
            });
        }
    }

    /** Execute a permission handler and send the result back via RPC (v3 protocol). */
    private async _executePermissionAndRespond(
        connection: MessageConnection,
        requestId: string,
        permissionRequest: PermissionRequest,
    ): Promise<void> {
        try {
            const result = await this._handlePermissionRequest(permissionRequest);
            console.log('[permission.requested] approved, requestId=', requestId);
            await connection.sendRequest("session.permissions.handlePendingPermissionRequest", {
                sessionId: this.sessionId,
                requestId,
                result,
            });
        } catch {
            await connection.sendRequest("session.permissions.handlePendingPermissionRequest", {
                sessionId: this.sessionId,
                requestId,
                result: { kind: "reject" },
            });
        }
    }

    registerTools(tools?: Tool[]): void {
        this.toolHandlers.clear();
        if (tools) {
            for (const tool of tools) {
                this.toolHandlers.set(tool.name, tool.handler);
            }
        }
    }

    registerPermissionHandler(handler: PermissionHandler): void {
        this.permissionHandler = handler;
    }

    getToolHandler(name: string): ToolHandler | undefined {
        return this.toolHandlers.get(name);
    }

    async _handlePermissionRequest(request: PermissionRequest): Promise<PermissionResult> {
        if (this.permissionHandler) {
            return this.permissionHandler(request);
        }
        return { kind: "reject" };
    }

    async getMessages(): Promise<SessionEvent[]> {
        const response = await this.connection.sendRequest("session.getMessages", {
            sessionId: this.sessionId,
        });
        return (response as { events: SessionEvent[] }).events;
    }

    async destroy(): Promise<void> {
        await this.connection.sendRequest("session.destroy", {
            sessionId: this.sessionId,
        });
        this.eventHandlers.clear();
        this.toolHandlers.clear();
    }
}

/**
 * Browser-compatible CopilotClient connected via WebSocket
 */
export class WebSocketCopilotClient {
    private connection: MessageConnection | null = null;
    private wsSocket: WebSocket | null = null;
    private sessions: Map<string, BrowserCopilotSession> = new Map();

    constructor(private url: string) {}

    async start(): Promise<void> {
        if (this.connection) return;

        await new Promise<void>((resolve, reject) => {
            this.wsSocket = new WebSocket(this.url);

            this.wsSocket.addEventListener("open", () => {
                const reader = new WebSocketMessageReader(this.wsSocket!);
                const writer = new WebSocketMessageWriter(this.wsSocket!);
                this.connection = createMessageConnection(reader, writer);
                this.attachConnectionHandlers();
                this.connection.listen();
                resolve();
            });

            this.wsSocket.addEventListener("error", () => {
                reject(new Error(`Failed to connect to ${this.url}`));
            });
        });
    }

    async createSession(config: CreateSessionOptions = {}): Promise<BrowserCopilotSession> {
        if (!this.connection) {
            throw new Error("Client not connected. Call start() first.");
        }

        const toolDefs = config.tools?.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            }));

        const response = await this.connection.sendRequest("session.create", {
            model: config.model,
            sessionId: config.sessionId,
            systemMessage: config.systemMessage,
            requestPermission: config.requestPermission ?? false,
            workingDirectory: config.workingDirectory,
            streaming: true,
            availableTools: config.availableTools,
            tools: toolDefs,
            mcpServers: config.mcpServers,
            skillDirectories: config.skillDirectories,
            disabledSkills: config.disabledSkills,
        });

        const sessionId = (response as { sessionId: string }).sessionId;
        const session = new BrowserCopilotSession(sessionId, this.connection);
        session.registerTools(config.tools);
        this.sessions.set(sessionId, session);
        return session;
    }

    async listModels(): Promise<ModelInfo[]> {
        if (!this.connection) {
            throw new Error("Client not connected. Call start() first.");
        }
        const result = await this.connection.sendRequest("models.list", {});
        return (result as { models: ModelInfo[] }).models;
    }

    async stop(): Promise<void> {
        for (const session of this.sessions.values()) {
            try { await session.destroy(); } catch { /* ignore */ }
        }
        this.sessions.clear();

        if (this.connection) {
            this.connection.dispose();
            this.connection = null;
        }

        if (this.wsSocket) {
            this.wsSocket.close();
            this.wsSocket = null;
        }
    }

    private attachConnectionHandlers(): void {
        if (!this.connection) return;

        this.connection.onNotification("session.event", (notification: unknown) => {
            const n = notification as { sessionId?: string; event?: SessionEvent };
            if (n.sessionId && n.event) {
                this.sessions.get(n.sessionId)?._dispatchEvent(n.event, this.connection);
            }
        });

        this.connection.onRequest(
            "tool.call",
            async (params: ToolCallRequestPayload): Promise<ToolCallResponsePayload> => {
                console.log('[tool.call]', params.toolName, params.arguments);
                const session = this.sessions.get(params.sessionId);
                const handler = session?.getToolHandler(params.toolName);
                if (!handler) {
                    console.log('[tool.call] no handler for', params.toolName);
                    return {
                        result: {
                            textResultForLlm: `Tool '${params.toolName}' not supported`,
                            resultType: "failure",
                            error: `tool '${params.toolName}' not supported`,
                            toolTelemetry: {},
                        },
                    };
                }
                try {
                    const invocation: ToolInvocation = {
                        sessionId: params.sessionId,
                        toolCallId: params.toolCallId,
                        toolName: params.toolName,
                        arguments: params.arguments,
                    };
                    const result = await handler(params.arguments, invocation);
                    console.log('[tool.call] result', result);
                    return { result: typeof result === "string" ? result : result };
                } catch (error) {
                    console.log('[tool.call] error', error);
                    const message = error instanceof Error ? error.message : String(error);
                    return {
                        result: {
                            textResultForLlm: message,
                            resultType: "failure",
                            error: message,
                            toolTelemetry: {},
                        },
                    };
                }
            },
        );

        this.connection.onRequest(
            "permission.request",
            async (params: PermissionRequestPayload) => {
                const session = this.sessions.get(params.sessionId);
                if (!session) {
                    return { result: { kind: "reject" } };
                }
                try {
                    const result = await session._handlePermissionRequest(params.permissionRequest);
                    return { result };
                } catch {
                    return { result: { kind: "reject" } };
                }
            },
        );
    }
}

/**
 * Creates a CopilotClient connected via WebSocket.
 */
export async function createWebSocketClient(url: string): Promise<WebSocketCopilotClient> {
    const client = new WebSocketCopilotClient(url);
    await client.start();
    return client;
}
