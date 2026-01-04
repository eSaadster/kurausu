/**
 * Backup and restore service
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { BackupInfo } from "../types.js";

const BACKUP_DIR_NAME = ".backups";
const MAX_BACKUPS = 20;

/**
 * Create a timestamped backup of a file
 */
export async function createBackup(filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  const backupDir = path.join(dir, BACKUP_DIR_NAME);

  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const backupFilename = `${filename}.${timestamp}`;
  const backupPath = path.join(backupDir, backupFilename);

  await fs.copyFile(filePath, backupPath);

  // Cleanup old backups
  await cleanupOldBackups(backupDir, filename);

  return backupPath;
}

/**
 * List available backups for a file
 */
export async function listBackups(filePath: string): Promise<BackupInfo[]> {
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  const backupDir = path.join(dir, BACKUP_DIR_NAME);

  try {
    const entries = await fs.readdir(backupDir, { withFileTypes: true });
    const backups: BackupInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.startsWith(`${filename}.`)) continue;

      const backupPath = path.join(backupDir, entry.name);
      const stats = await fs.stat(backupPath);

      // Extract timestamp from filename
      const timestampPart = entry.name.slice(filename.length + 1);

      backups.push({
        filename: entry.name,
        timestamp: timestampPart,
        size: stats.size,
      });
    }

    // Sort by timestamp descending (newest first)
    backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return backups;
  } catch {
    return [];
  }
}

/**
 * Restore a file from a backup
 */
export async function restoreBackup(
  filePath: string,
  timestamp: string,
): Promise<boolean> {
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  const backupDir = path.join(dir, BACKUP_DIR_NAME);
  const backupPath = path.join(backupDir, `${filename}.${timestamp}`);

  try {
    // First create a backup of current state
    await createBackup(filePath);

    // Then restore from the specified backup
    await fs.copyFile(backupPath, filePath);

    return true;
  } catch {
    return false;
  }
}

/**
 * Delete old backups beyond MAX_BACKUPS
 */
async function cleanupOldBackups(
  backupDir: string,
  originalFilename: string,
): Promise<void> {
  try {
    const entries = await fs.readdir(backupDir, { withFileTypes: true });
    const backups = entries
      .filter((e) => e.isFile() && e.name.startsWith(`${originalFilename}.`))
      .map((e) => e.name)
      .sort()
      .reverse();

    // Delete backups beyond the limit
    for (const backup of backups.slice(MAX_BACKUPS)) {
      await fs.rm(path.join(backupDir, backup)).catch(() => {});
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Get the backup directory path for a file
 */
export function getBackupDir(filePath: string): string {
  return path.join(path.dirname(filePath), BACKUP_DIR_NAME);
}
