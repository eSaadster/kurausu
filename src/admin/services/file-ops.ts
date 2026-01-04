/**
 * File operations with JSON5 support
 */

import fs from "node:fs/promises";
import path from "node:path";
import JSON5 from "json5";

/**
 * Read a JSON5 file and parse it
 */
export async function readJSON5<T = unknown>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON5.parse(content) as T;
}

/**
 * Read a plain JSON file
 */
export async function readJSON<T = unknown>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Write data as formatted JSON
 */
export async function writeJSON(
  filePath: string,
  data: unknown,
  indent = 2,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, indent), "utf-8");
}

/**
 * Read a text file
 */
export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

/**
 * Write a text file
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Read a .env file and return as key-value object
 */
export async function readEnvFile(
  filePath: string,
): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const result: Record<string, string> = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Write a .env file from key-value object
 */
export async function writeEnvFile(
  filePath: string,
  data: Record<string, string>,
): Promise<void> {
  const lines = Object.entries(data)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuotes = /[\s#=]/.test(value);
      const quotedValue = needsQuotes ? `"${value}"` : value;
      return `${key}=${quotedValue}`;
    })
    .join("\n");

  await writeText(filePath, lines + "\n");
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats safely
 */
export async function getFileStats(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  mtime?: Date;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Expand ~ to home directory
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith("~/")) {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(home, filePath.slice(2));
  }
  return filePath;
}

/**
 * List directories in a path
 */
export async function listDirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * List files in a path matching a pattern
 */
export async function listFiles(
  dirPath: string,
  extension?: string,
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .filter((e) => !extension || e.name.endsWith(extension))
      .map((e) => e.name);
  } catch {
    return [];
  }
}
