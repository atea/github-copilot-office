import type { PermissionRequest, PermissionResult } from "./websocket-client";

export interface PermissionRule {
  kind: string;
  pathPrefix: string;
}

const RULES_KEY = "copilot-permission-rules";
const ALLOW_ALL_KEY = "copilot-allow-all";

function normPath(p: string): string {
  return p.endsWith("/") ? p : p + "/";
}

function isUnder(filePath: string, prefix: string): boolean {
  const norm = normPath(prefix);
  return filePath === prefix || filePath.startsWith(norm);
}

export class PermissionService {
  private _allowAll = false;
  private _cwd: string | null = null;

  constructor() {
    const stored = localStorage.getItem(ALLOW_ALL_KEY);
    this._allowAll = stored === null ? true : stored === "true";
  }

  get allowAll(): boolean {
    return this._allowAll;
  }

  set allowAll(v: boolean) {
    this._allowAll = v;
    localStorage.setItem(ALLOW_ALL_KEY, v ? "true" : "false");
  }

  get cwd(): string | null {
    return this._cwd;
  }

  set cwd(v: string | null) {
    this._cwd = v;
  }

  getRules(): PermissionRule[] {
    try {
      return JSON.parse(localStorage.getItem(RULES_KEY) || "[]");
    } catch {
      return [];
    }
  }

  addRule(rule: PermissionRule): void {
    const rules = this.getRules();
    const norm = { kind: rule.kind, pathPrefix: normPath(rule.pathPrefix) };
    if (!rules.some((r) => r.kind === norm.kind && r.pathPrefix === norm.pathPrefix)) {
      rules.push(norm);
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    }
  }

  removeRule(index: number): void {
    const rules = this.getRules();
    rules.splice(index, 1);
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  }

  clearRules(): void {
    localStorage.removeItem(RULES_KEY);
  }

  /** Auto-evaluate a permission request. Returns a result or null if user must be prompted. */
  evaluate(request: PermissionRequest): PermissionResult | null {
    const cwd = this._cwd;

    // Allow-all mode: approve everything
    if (this._allowAll) {
      return { kind: "approve-once" };
    }

    // Auto-approve reads under cwd
    if (request.kind === "read" && cwd && request.path) {
      if (isUnder(request.path, cwd)) return { kind: "approve-once" };
    }

    // Check saved rules
    const rules = this.getRules();
    for (const rule of rules) {
      if (rule.kind !== request.kind) continue;
      const filePath = request.path || request.fileName || request.fullCommandText;
      if (filePath && isUnder(filePath, rule.pathPrefix)) {
        return { kind: "approve-once" };
      }
      // Shell rules with matching prefix
      if (request.kind === "shell" && rule.kind === "shell") {
        return { kind: "approve-once" };
      }
    }

    return null; // User must decide
  }
}
