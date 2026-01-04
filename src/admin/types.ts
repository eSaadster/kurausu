/**
 * Admin console types
 */

export interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "error" | "unknown";
  lastCheck?: number;
  error?: string;
}

export interface McpServerStatus extends ServiceStatus {
  type: "mcp";
  baseUrl: string;
  toolCount?: number;
}

export interface ClickStatus {
  id: string;
  session: string;
  name: string;
  enabled: boolean;
  lastRun?: number;
  lastResult?: "OK" | "ALERT" | "ERROR";
  nextRun?: number;
  intervalMinutes: number;
}

export interface GripStatus {
  id: string;
  templateId: string;
  session: string;
  status: "active" | "completed" | "failed" | "timeout" | "waiting";
  started: string;
  attempts: number;
  tmuxSession: string;
}

export interface SessionInfo {
  name: string;
  type: "dm" | "group";
  path: string;
  hasEnv: boolean;
  hasSystem: boolean;
  hasMcporter: boolean;
  hasClicks: boolean;
}

export interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
  }>;
  data?: unknown;
}

export interface AdminConfig {
  port: number;
  host: string;
  readOnly: boolean;
}

export interface DashboardData {
  mcpCount: number;
  mcpOnline: number;
  clicksCount: number;
  clicksEnabled: number;
  gripsActive: number;
  gripsTotal: number;
  sessionsCount: number;
  recentActivity: Array<{
    type: "click" | "grip" | "mcp";
    message: string;
    time: number;
    status: "ok" | "alert" | "error";
  }>;
}
