// Tools for pi-agent - filesystem, bash, search, web search
// These tools give the agent capabilities similar to the pi CLI

import { execSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool, TextContent, ImageContent } from "@mariozechner/pi-ai";

// AgentToolResult is not exported from main module, so we define it here
interface AgentToolResult<T> {
  content: (TextContent | ImageContent)[];
  details: T;
}

// Import from scratchpad module (which owns the base path to avoid circular deps)
import { getSessionDir, WHATSAPP_BASE_PATH } from "./pi-agent-scratchpad.js";
export { WHATSAPP_BASE_PATH };

/**
 * Session context - passed to tool factory to avoid global state race conditions.
 * Each agent gets its own context captured in closures.
 */
export interface SessionContext {
  sessionName: string;
  sessionCwd: string;
}

/**
 * Create session context for a given session name.
 * If the session has a sharedContext config, uses the shared session's scratchpad.
 * Ensures the scratchpad directory exists.
 *
 * @param sessionName - The session name (e.g., "@123456789")
 * @param cwdOverride - Optional override for the working directory (used by grips)
 */
export function createSessionContext(sessionName: string, cwdOverride?: string): SessionContext {
  // If cwdOverride is provided, use it directly (for grips with custom cwd)
  if (cwdOverride) {
    // Expand ~ to home directory
    const expandedCwd = cwdOverride.startsWith("~")
      ? path.join(os.homedir(), cwdOverride.slice(1))
      : cwdOverride;
    // Ensure directory exists
    try {
      fsSync.mkdirSync(expandedCwd, { recursive: true });
    } catch {
      // ignore
    }
    return { sessionName, sessionCwd: expandedCwd };
  }

  const sessionDir = getSessionDir(sessionName);
  const sessionCwd = path.join(sessionDir, "scratchpad");
  // Ensure scratchpad exists
  try {
    fsSync.mkdirSync(sessionCwd, { recursive: true });
  } catch {
    // ignore
  }
  return { sessionName, sessionCwd };
}

/**
 * Create a sandboxPath function bound to a specific session context.
 * This avoids the global state race condition.
 */
function createSandboxPath(ctx: SessionContext) {
  return (inputPath: string, options: { allowSkills?: boolean; allowSystemWide?: boolean } = {}): string => {
    const resolved = path.isAbsolute(inputPath)
      ? path.resolve(inputPath)
      : path.resolve(path.join(ctx.sessionCwd, inputPath));

    // System-wide access for read operations - allow any path
    if (options.allowSystemWide) {
      return resolved;
    }

    // Allow access to scratchpad
    if (resolved.startsWith(ctx.sessionCwd + path.sep) || resolved === ctx.sessionCwd) {
      return resolved;
    }

    // Allow read-only access to skills directories
    if (options.allowSkills) {
      const globalSkillsDir = path.join(WHATSAPP_BASE_PATH, "skills");
      // Session skills are in ~/klaus/whatsapp/{session}/skills/
      const sessionDir = path.dirname(ctx.sessionCwd); // parent of scratchpad
      const sessionSkillsDir = path.join(sessionDir, "skills");

      if (resolved.startsWith(globalSkillsDir + path.sep) || resolved === globalSkillsDir ||
          resolved.startsWith(sessionSkillsDir + path.sep) || resolved === sessionSkillsDir) {
        return resolved;
      }
    }

    throw new Error(`Access denied: path outside sandbox (${resolved})`);
  };
}

// Ensure base path exists
try {
  fsSync.mkdirSync(WHATSAPP_BASE_PATH, { recursive: true });
} catch {
  // ignore
}

// ============================================================================
// Read File Tool
// ============================================================================

const readFileSchema = Type.Object({
  path: Type.String({ description: "Path to the file to read (relative to your scratchpad)" }),
  maxLines: Type.Optional(Type.Number({ description: "Maximum number of lines to read (default: 500)" })),
});

function createReadFileTool(ctx: SessionContext): AgentTool<typeof readFileSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "read_file",
    label: "Read File",
    description: "Read the contents of a file. Supports relative paths (from scratchpad) or absolute paths (anywhere on the system).",
    parameters: readFileSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const filePath = sandboxPath(params.path, { allowSystemWide: true }); // System-wide read access
        console.log(`[read_file] Reading: ${filePath}`);
        const content = await fs.readFile(filePath, "utf8");
        const lines = content.split("\n");
        const maxLines = params.maxLines ?? 500;
        const truncated = lines.length > maxLines;
        const result = truncated ? lines.slice(0, maxLines).join("\n") : content;

        return {
          content: [{
            type: "text",
            text: truncated
              ? `${result}\n\n... [truncated, showing ${maxLines} of ${lines.length} lines]`
              : result,
          }],
          details: undefined,
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error reading file: ${err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Write File Tool
// ============================================================================

const writeFileSchema = Type.Object({
  path: Type.String({ description: "Path where to write the file (relative to your scratchpad)" }),
  content: Type.String({ description: "Content to write to the file" }),
});

function createWriteFileTool(ctx: SessionContext): AgentTool<typeof writeFileSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "write_file",
    label: "Write File",
    description: "Write content to a file in your scratchpad. Creates the file if it doesn't exist, overwrites if it does.",
    parameters: writeFileSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const filePath = sandboxPath(params.path);
        console.log(`[write_file] Writing ${params.content.length} bytes to: ${filePath}`);

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, params.content, "utf8");

        return {
          content: [{ type: "text", text: `Successfully wrote ${params.content.length} bytes to ${filePath}` }],
          details: undefined,
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error writing file: ${err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// List Directory Tool
// ============================================================================

const listDirSchema = Type.Object({
  path: Type.Optional(Type.String({ description: "Directory path to list (default: scratchpad)" })),
  recursive: Type.Optional(Type.Boolean({ description: "List recursively (default: false)" })),
});

function createListDirTool(ctx: SessionContext): AgentTool<typeof listDirSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "list_directory",
    label: "List Directory",
    description: "List files and directories. Supports relative paths (from scratchpad) or absolute paths (anywhere on the system).",
    parameters: listDirSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const dirPath = params.path ? sandboxPath(params.path, { allowSystemWide: true }) : ctx.sessionCwd; // System-wide read access

        const entries: string[] = [];

        async function listDir(dir: string, prefix = "") {
          const items = await fs.readdir(dir, { withFileTypes: true });
          for (const item of items) {
            const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
            if (item.isDirectory()) {
              entries.push(`${relativePath}/`);
              if (params.recursive) {
                await listDir(path.join(dir, item.name), relativePath);
              }
            } else {
              entries.push(relativePath);
            }
          }
        }

        await listDir(dirPath);

        return {
          content: [{ type: "text", text: entries.length > 0 ? entries.join("\n") : "(empty directory)" }],
          details: undefined,
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error listing directory: ${err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Bash Tool
// ============================================================================

const bashSchema = Type.Object({
  command: Type.String({ description: "The bash command to execute" }),
  cwd: Type.Optional(Type.String({ description: "Working directory (default: scratchpad)" })),
  timeout: Type.Optional(Type.Number({ description: "Timeout in milliseconds (default: 30000)" })),
});

/**
 * Build bwrap command for sandboxed execution.
 * Only mounts system libs + scratchpad. No access to /home outside scratchpad.
 */
function buildBwrapCommand(command: string, cwd: string): string {
  // Build bwrap args - strict sandbox, only scratchpad writable
  const args = [
    "bwrap",
    // Read-only system mounts (needed for basic commands)
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/bin", "/bin",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/lib64", "/lib64",
    // Read-write scratchpad only
    "--bind", cwd, cwd,
    // Temp directory
    "--tmpfs", "/tmp",
    // Proc for some tools
    "--proc", "/proc",
    "--dev", "/dev",
    // Set working directory
    "--chdir", cwd,
    // Terminate with parent
    "--die-with-parent",
  ];

  // Add command at the end
  args.push("/bin/bash", "-c", command);

  // Escape args for shell
  return args.map(arg => `'${arg.replace(/'/g, "'\\''")}'`).join(" ");
}

/**
 * Check if a command involves skill execution.
 * Skills get full filesystem access to run their tools.
 */
function isSkillCommand(command: string): boolean {
  const skillPatterns = [
    /\/skills\//,                          // explicit skill path
    /skills\/[a-z0-9_-]+\//i,              // skill subdirectory
    /pptx|xlsx|pdf|d3js|auto-animate|image-gen/i,  // known skill names
    /node\s+\S*\.js/,                      // running node scripts (likely skill)
    /python\s+\S*\.py/,                    // running python scripts (likely skill)
    /npm\s+install/i,                      // npm install for skills
    /pip\s+install/i,                      // pip install for skills
    /npx\s+/,                              // npx commands
    /html2pptx|pptxgenjs|markitdown/i,     // known skill tools
    /tts\.sh|supertonic/i,                 // TTS voice generation
    /whisper|transcribe/i,                 // STT transcription
    /curl.*api\.agentmail\.to/i,           // AgentMail API calls
  ];
  return skillPatterns.some(pattern => pattern.test(command));
}

function createBashTool(ctx: SessionContext): AgentTool<typeof bashSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "bash",
    label: "Execute Bash",
    description: "Execute a bash command in your scratchpad directory. Commands run in an isolated sandbox (skills have full access).",
    parameters: bashSchema,
    execute: async (_toolCallId, params, signal): Promise<AgentToolResult<undefined>> => {
      const startTime = Date.now();
      try {
        const cwd = params.cwd ? sandboxPath(params.cwd) : ctx.sessionCwd;
        const timeout = params.timeout ?? 30000;

        // Skills get full access, other commands run in sandbox
        const useSkillMode = isSkillCommand(params.command);
        const finalCommand = useSkillMode
          ? params.command
          : buildBwrapCommand(params.command, cwd);

        console.log(`[bash] Executing ${useSkillMode ? '(skill mode)' : 'in sandbox'}: ${params.command.slice(0, 100)}${params.command.length > 100 ? '...' : ''}`);

        // Execute command
        const result = execSync(finalCommand, {
          cwd,
          timeout,
          encoding: "utf8",
          maxBuffer: 1024 * 1024 * 10, // 10MB
          shell: "/bin/bash",
        });

        const duration = Date.now() - startTime;
        console.log(`[bash] Success (${duration}ms): ${result.slice(0, 100).replace(/\n/g, ' ')}${result.length > 100 ? '...' : ''}`);

        return {
          content: [{ type: "text", text: result || "(no output)" }],
          details: undefined,
        };
      } catch (err: any) {
        // execSync throws on non-zero exit
        const output = err.stdout || err.stderr || err.message || String(err);
        const duration = Date.now() - startTime;
        console.log(`[bash] Failed (${duration}ms): ${output.slice(0, 100).replace(/\n/g, ' ')}${output.length > 100 ? '...' : ''}`);
        return {
          content: [{ type: "text", text: `Command failed:\n${output}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Search/Grep Tool
// ============================================================================

const searchSchema = Type.Object({
  pattern: Type.String({ description: "Regex pattern to search for" }),
  path: Type.Optional(Type.String({ description: "File or directory to search in (default: scratchpad)" })),
  filePattern: Type.Optional(Type.String({ description: "Glob pattern to filter files (e.g., '*.ts')" })),
  maxResults: Type.Optional(Type.Number({ description: "Maximum number of results (default: 50)" })),
});

function createSearchTool(ctx: SessionContext): AgentTool<typeof searchSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "search",
    label: "Search Files",
    description: "Search for a pattern in files within your scratchpad using grep.",
    parameters: searchSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const searchPath = params.path ? sandboxPath(params.path) : ctx.sessionCwd;
        const maxResults = params.maxResults ?? 50;

        // Build grep command
        let cmd = `grep -rn --color=never`;
        if (params.filePattern) {
          cmd += ` --include="${params.filePattern}"`;
        }
        cmd += ` -E "${params.pattern.replace(/"/g, '\\"')}" "${searchPath}" | head -${maxResults}`;

        const result = execSync(cmd, {
          encoding: "utf8",
          maxBuffer: 1024 * 1024,
          shell: "/bin/bash",
          timeout: 30000,
        });

        return {
          content: [{ type: "text", text: result || "No matches found" }],
          details: undefined,
        };
      } catch (err: any) {
        // grep returns exit code 1 when no matches found
        if (err.status === 1 && !err.stderr) {
          return {
            content: [{ type: "text", text: "No matches found" }],
            details: undefined,
          };
        }
        return {
          content: [{ type: "text", text: `Search error: ${err.message || err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Web Search Tool (using Brave Search)
// ============================================================================

const webSearchSchema = Type.Object({
  query: Type.String({ description: "Search query" }),
  maxResults: Type.Optional(Type.Number({ description: "Maximum number of results (default: 5)" })),
  content: Type.Optional(Type.Boolean({ description: "Fetch page content as markdown (default: false)" })),
});

interface BraveSearchResult {
  title: string;
  link: string;
  snippet: string;
  content?: string;
}

async function fetchBraveResults(query: string, numResults: number): Promise<BraveSearchResult[]> {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Parse results using regex (avoiding jsdom dependency)
  const results: BraveSearchResult[] = [];

  // Match snippet divs with data-type="web"
  const snippetRegex = /<div[^>]*class="snippet[^"]*"[^>]*data-type="web"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let snippetMatch;

  while ((snippetMatch = snippetRegex.exec(html)) !== null && results.length < numResults) {
    const snippetHtml = snippetMatch[1];

    // Extract link and title
    const linkMatch = snippetHtml.match(/<a[^>]*class="[^"]*svelte-[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;

    const link = linkMatch[1];
    if (!link || link.includes("brave.com")) continue;

    // Extract title text from inside the link
    const titleMatch = linkMatch[2].match(/<span[^>]*class="title[^"]*"[^>]*>([^<]*)<\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : linkMatch[2].replace(/<[^>]+>/g, "").trim();

    // Extract snippet/description
    const descMatch = snippetHtml.match(/<p[^>]*class="snippet-description[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    let snippet = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    // Remove date prefix like "Jan 1, 2024 - "
    snippet = snippet.replace(/^[A-Z][a-z]+ \d+, \d{4} -\s*/, "");

    if (title && link) {
      results.push({ title, link, snippet });
    }
  }

  // Fallback: try alternative selector pattern if no results
  if (results.length === 0) {
    const altRegex = /<a[^>]*href="(https?:\/\/(?!brave\.com)[^"]+)"[^>]*>[\s\S]*?<span[^>]*class="title[^"]*"[^>]*>([^<]+)<\/span>/g;
    let altMatch;
    while ((altMatch = altRegex.exec(html)) !== null && results.length < numResults) {
      results.push({
        title: altMatch[2].trim(),
        link: altMatch[1],
        snippet: "",
      });
    }
  }

  return results;
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return `(HTTP ${response.status})`;
    }

    let html = await response.text();

    // Simple HTML to text/markdown conversion
    // Remove script and style
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
    html = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
    html = html.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
    html = html.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
    html = html.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

    // Try to extract main content
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<div[^>]*role="main"[^>]*>([\s\S]*?)<\/div>/i);

    const content = mainMatch ? mainMatch[1] : html;

    // Convert to text
    let text = content
      .replace(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi, "\n\n## $1\n\n")
      .replace(/<p[^>]*>/gi, "\n\n")
      .replace(/<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/ +/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length > 5000) {
      text = text.substring(0, 5000) + "...";
    }

    return text.length > 100 ? text : "(Could not extract content)";
  } catch (e: any) {
    return `(Error: ${e.message})`;
  }
}

export const webSearchTool: AgentTool<typeof webSearchSchema, undefined> = {
  name: "web_search",
  label: "Web Search",
  description: "Search the web using Brave Search. Returns titles, URLs, and snippets. Optionally fetch page content.",
  parameters: webSearchSchema,
  execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
    try {
      const maxResults = params.maxResults ?? 5;
      const fetchContent = params.content ?? false;

      console.log(`[web_search] Searching Brave for: ${params.query}`);
      const results = await fetchBraveResults(params.query, maxResults);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "No search results found" }],
          details: undefined,
        };
      }

      // Optionally fetch content for each result
      if (fetchContent) {
        for (const result of results) {
          result.content = await fetchPageContent(result.link);
        }
      }

      // Format output
      const output = results.map((r, i) => {
        let text = `--- Result ${i + 1} ---\nTitle: ${r.title}\nLink: ${r.link}`;
        if (r.snippet) text += `\nSnippet: ${r.snippet}`;
        if (r.content) text += `\nContent:\n${r.content}`;
        return text;
      }).join("\n\n");

      return {
        content: [{ type: "text", text: output }],
        details: undefined,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Web search error: ${err}` }],
        details: undefined,
      };
    }
  },
};

// ============================================================================
// Web Fetch Tool
// ============================================================================

const webFetchSchema = Type.Object({
  url: Type.String({ description: "URL to fetch" }),
  maxLength: Type.Optional(Type.Number({ description: "Maximum response length in chars (default: 10000)" })),
});

export const webFetchTool: AgentTool<typeof webFetchSchema, undefined> = {
  name: "web_fetch",
  label: "Fetch URL",
  description: "Fetch content from a URL. Returns the text content (HTML tags stripped for HTML pages).",
  parameters: webFetchSchema,
  execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
    try {
      const maxLength = params.maxLength ?? 10000;

      const response = await fetch(params.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Pi-Agent/1.0)",
        },
      });

      if (!response.ok) {
        return {
          content: [{ type: "text", text: `HTTP error: ${response.status} ${response.statusText}` }],
          details: undefined,
        };
      }

      let text = await response.text();

      // Strip HTML tags if it looks like HTML
      if (text.includes("<html") || text.includes("<!DOCTYPE")) {
        // Simple HTML to text conversion
        text = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, " ")
          .trim();
      }

      if (text.length > maxLength) {
        text = text.slice(0, maxLength) + `\n\n... [truncated, ${text.length} chars total]`;
      }

      return {
        content: [{ type: "text", text }],
        details: undefined,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Fetch error: ${err}` }],
        details: undefined,
      };
    }
  },
};

// ============================================================================
// Get Current Time Tool
// ============================================================================

const getCurrentTimeSchema = Type.Object({
  timezone: Type.Optional(Type.String({ description: "Timezone (default: local)" })),
});

export const getCurrentTimeTool: AgentTool<typeof getCurrentTimeSchema, undefined> = {
  name: "get_current_time",
  label: "Get Time",
  description: "Get the current date and time",
  parameters: getCurrentTimeSchema,
  execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };

    if (params.timezone) {
      options.timeZone = params.timezone;
    }

    return {
      content: [{ type: "text", text: now.toLocaleString("en-US", options) }],
      details: undefined,
    };
  },
};

// ============================================================================
// Generate Image Tool (Text-to-Image via Gemini)
// ============================================================================

const generateImageSchema = Type.Object({
  prompt: Type.String({ description: "Description of the image to generate" }),
  filename: Type.Optional(Type.String({ description: "Output filename (default: auto-generated)" })),
});

function createGenerateImageTool(ctx: SessionContext): AgentTool<typeof generateImageSchema, undefined> {
  return {
    name: "generate_image",
    label: "Generate Image",
    description: "Generate an image from a text description using Gemini. Returns the file path - use with MEDIA: token to send. Takes 15-30 seconds.",
    parameters: generateImageSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return {
            content: [{ type: "text", text: "Error: GEMINI_API_KEY environment variable not set" }],
            details: undefined,
          };
        }

        const outputDir = path.join(ctx.sessionCwd, "generated-images");
        await fs.mkdir(outputDir, { recursive: true });

        const timestamp = Date.now();
        const safePrompt = params.prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const filename = params.filename || `${safePrompt}_${timestamp}.png`;
        const outputPath = path.join(outputDir, filename);

        const requestBody = {
          contents: [{
            parts: [{ text: params.prompt }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        };
        console.log(`[generate_image] Calling Gemini API with prompt: ${params.prompt.slice(0, 50)}...`);

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
          {
            method: "POST",
            headers: {
              "x-goog-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(60000), // 60 second timeout
          }
        );

        console.log(`[generate_image] Response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`[generate_image] API error: ${errorText.slice(0, 500)}`);
          return {
            content: [{ type: "text", text: `API error ${response.status}: ${errorText}` }],
            details: undefined,
          };
        }

        const data = await response.json() as any;
        console.log(`[generate_image] Got response, candidates: ${data?.candidates?.length || 0}`);

        // Extract base64 image data from response
        const parts = data?.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) {
          console.log(`[generate_image] No parts in response`);
          return {
            content: [{ type: "text", text: "No image generated in response" }],
            details: undefined,
          };
        }

        const imagePart = parts.find((p: any) => p.inlineData?.data);
        if (!imagePart) {
          const textPart = parts.find((p: any) => p.text);
          console.log(`[generate_image] No image part, text: ${textPart?.text?.slice(0, 100)}`);
          return {
            content: [{ type: "text", text: textPart?.text || "No image data in response" }],
            details: undefined,
          };
        }

        const base64Data = imagePart.inlineData.data;
        const imageBuffer = Buffer.from(base64Data, "base64");
        await fs.writeFile(outputPath, imageBuffer);
        console.log(`[generate_image] Image saved to: ${outputPath} (${imageBuffer.length} bytes)`);

        return {
          content: [{ type: "text", text: `Image generated successfully!\nPath: ${outputPath}\n\nUse MEDIA:${outputPath} to send this image.` }],
          details: undefined,
        };
      } catch (err: any) {
        console.log(`[generate_image] Error: ${err.message || err}`);
        if (err.name === "TimeoutError") {
          return {
            content: [{ type: "text", text: "Image generation timed out (60s limit). Try a simpler prompt." }],
            details: undefined,
          };
        }
        return {
          content: [{ type: "text", text: `Error generating image: ${err.message || err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Edit Image Tool (Image + Text to Image via Gemini)
// ============================================================================

const editImageSchema = Type.Object({
  imagePath: Type.String({ description: "Path to the source image to edit" }),
  prompt: Type.String({ description: "Description of edits to make to the image" }),
  filename: Type.Optional(Type.String({ description: "Output filename (default: auto-generated)" })),
});

function createEditImageTool(ctx: SessionContext): AgentTool<typeof editImageSchema, undefined> {
  const sandboxPath = createSandboxPath(ctx);
  return {
    name: "edit_image",
    label: "Edit Image",
    description: "Edit an existing image based on a text prompt using Gemini. Returns the file path - use with MEDIA: token to send. Takes 15-30 seconds.",
    parameters: editImageSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return {
            content: [{ type: "text", text: "Error: GEMINI_API_KEY environment variable not set" }],
            details: undefined,
          };
        }

        // Read source image (sandboxed)
        const imagePath = sandboxPath(params.imagePath);
        let imageBuffer: Buffer;
        try {
          imageBuffer = await fs.readFile(imagePath);
        } catch {
          return {
            content: [{ type: "text", text: `Error: Could not read source image at ${imagePath}` }],
            details: undefined,
          };
        }

        const base64Image = imageBuffer.toString("base64");

        // Detect mime type from extension
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png"
          : ext === ".webp" ? "image/webp"
          : ext === ".gif" ? "image/gif"
          : "image/jpeg";

        const outputDir = path.join(ctx.sessionCwd, "generated-images");
        await fs.mkdir(outputDir, { recursive: true });

        const timestamp = Date.now();
        const safePrompt = params.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const filename = params.filename || `edited_${safePrompt}_${timestamp}.png`;
        const outputPath = path.join(outputDir, filename);

        const requestBody = {
          contents: [{
            parts: [
              { text: params.prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        };
        console.log(`[edit_image] Calling Gemini API with prompt: ${params.prompt.slice(0, 50)}...`);

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
          {
            method: "POST",
            headers: {
              "x-goog-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(60000), // 60 second timeout
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          return {
            content: [{ type: "text", text: `API error ${response.status}: ${errorText}` }],
            details: undefined,
          };
        }

        const data = await response.json() as any;

        // Extract base64 image data from response
        const parts = data?.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) {
          return {
            content: [{ type: "text", text: "No image generated in response" }],
            details: undefined,
          };
        }

        const imagePart = parts.find((p: any) => p.inlineData?.data);
        if (!imagePart) {
          const textPart = parts.find((p: any) => p.text);
          return {
            content: [{ type: "text", text: textPart?.text || "No image data in response" }],
            details: undefined,
          };
        }

        const resultBase64 = imagePart.inlineData.data;
        const resultBuffer = Buffer.from(resultBase64, "base64");
        await fs.writeFile(outputPath, resultBuffer);

        return {
          content: [{ type: "text", text: `Image edited successfully!\nPath: ${outputPath}\n\nUse MEDIA:${outputPath} to send this image.` }],
          details: undefined,
        };
      } catch (err: any) {
        if (err.name === "TimeoutError") {
          return {
            content: [{ type: "text", text: "Image editing timed out (60s limit). Try a simpler prompt." }],
            details: undefined,
          };
        }
        return {
          content: [{ type: "text", text: `Error editing image: ${err.message || err}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// MCP Tool (via mcporter for SSE/streaming support)
// ============================================================================

const mcpSchema = Type.Object({
  action: Type.Union([
    Type.Literal("list-servers"),
    Type.Literal("list-tools"),
    Type.Literal("call"),
  ], { description: "Action: list-servers, list-tools, or call" }),
  server: Type.Optional(Type.String({ description: "Server name (required for list-tools and call)" })),
  tool: Type.Optional(Type.String({ description: "Tool name (required for call)" })),
  args: Type.Optional(Type.Record(Type.String(), Type.Any(), { description: "Tool arguments as key-value pairs" })),
});

// Lazy import mcporter - per-config runtimes (cached by config path)
const mcporterRuntimes: Map<string, any> = new Map();

/**
 * Get the mcporter config path for a session.
 * Checks session-specific first, then global WhatsApp config, then app config.
 */
function getMcporterConfigPath(sessionName: string): string {
  // 1. Session-specific config: ~/klaus/whatsapp/@user/mcporter.json
  const sessionConfig = path.join(WHATSAPP_BASE_PATH, sessionName, "mcporter.json");
  if (fsSync.existsSync(sessionConfig)) {
    return sessionConfig;
  }

  // 2. Global WhatsApp config: ~/klaus/whatsapp/mcporter.json
  const globalWhatsappConfig = path.join(WHATSAPP_BASE_PATH, "mcporter.json");
  if (fsSync.existsSync(globalWhatsappConfig)) {
    return globalWhatsappConfig;
  }

  // 3. App config (fallback): config/mcporter.json
  return path.join(process.cwd(), "config", "mcporter.json");
}

async function getMcporterRuntime(sessionName: string, configPathOverride?: string) {
  const configPath = configPathOverride || getMcporterConfigPath(sessionName);
  const cacheKey = configPath; // Cache by config path, not session

  if (!mcporterRuntimes.has(cacheKey)) {
    try {
      const { createRuntime } = await import("mcporter");
      const runtime = await createRuntime({ configPath });
      mcporterRuntimes.set(cacheKey, runtime);
      console.log(`[mcp] mcporter runtime initialized for config: ${configPath}`);
    } catch (err: any) {
      throw new Error(`Failed to initialize mcporter (config: ${configPath}): ${err.message}`);
    }
  }
  return mcporterRuntimes.get(cacheKey);
}

function createMcpTool(ctx: SessionContext, mcpConfigPath?: string): AgentTool<typeof mcpSchema, undefined> {
  return {
    name: "mcp",
    label: "MCP Tools",
    description: "Access MCP servers. Actions: list-servers, list-tools <server>, call <server> <tool> [args]. IMPORTANT: Always use the exact server name specified in your instructions.",
    parameters: mcpSchema,
    execute: async (_toolCallId, params): Promise<AgentToolResult<undefined>> => {
      try {
        const runtime = await getMcporterRuntime(ctx.sessionName, mcpConfigPath);

        if (params.action === "list-servers") {
          console.log("[mcp] Listing servers");
          const servers = runtime.listServers();
          if (!servers || servers.length === 0) {
            return {
              content: [{ type: "text", text: "No MCP servers configured. Add servers to config/mcporter.json" }],
              details: undefined,
            };
          }
          return {
            content: [{ type: "text", text: `Available MCP servers:\n${servers.join("\n")}` }],
            details: undefined,
          };
        }

        if (params.action === "list-tools") {
          if (!params.server) {
            return {
              content: [{ type: "text", text: "Error: server parameter required for list-tools" }],
              details: undefined,
            };
          }
          console.log(`[mcp] Listing tools for server: ${params.server}`);
          const tools = await runtime.listTools(params.server);
          if (!tools || tools.length === 0) {
            return {
              content: [{ type: "text", text: `No tools found for server "${params.server}"` }],
              details: undefined,
            };
          }
          const toolList = tools.map((t: any) => {
            const desc = t.description ? `: ${t.description.slice(0, 80)}...` : "";
            return `- ${t.name}${desc}`;
          }).join("\n");
          return {
            content: [{ type: "text", text: `Tools for ${params.server} (${tools.length} total):\n${toolList}` }],
            details: undefined,
          };
        }

        if (params.action === "call") {
          if (!params.server || !params.tool) {
            return {
              content: [{ type: "text", text: "Error: server and tool parameters required for call" }],
              details: undefined,
            };
          }
          const toolArgs = params.args ?? {};
          console.log(`[mcp] Calling ${params.server}.${params.tool}`);
          console.log(`[mcp] Args:`, JSON.stringify(toolArgs));
          // mcporter expects { args: {...} } not just {...}
          const result = await runtime.callTool(params.server, params.tool, { args: toolArgs });

          // Extract text from result
          let text: string;
          if (typeof result.text === "function") {
            text = result.text();
          } else if (result.content) {
            text = result.content.map((c: any) => c.text || JSON.stringify(c)).join("\n");
          } else {
            text = JSON.stringify(result, null, 2);
          }

          return {
            content: [{ type: "text", text }],
            details: undefined,
          };
        }

        return {
          content: [{ type: "text", text: `Unknown action: ${params.action}` }],
          details: undefined,
        };
      } catch (err: any) {
        console.error(`[mcp] Error:`, err);
        const errorDetail = err.message || String(err);
        return {
          content: [{ type: "text", text: `MCP error: ${errorDetail}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Grip Tools - long-running tmux sessions
// ============================================================================

import {
  getGripManager,
  listActiveGrips,
  listAllActiveGrips,
  discoverTemplatesWithSession,
  expandPath,
  createPollFunction,
} from "./grips/index.js";
import { loadConfig, type GripsConfig } from "../config/config.js";

// Helper to get grips config paths
function getGripsConfig(): GripsConfig & { templatesPath: string; activePath: string; archivePath: string } {
  const cfg = loadConfig();
  const gripsConfig = cfg.grips ?? {};
  return {
    ...gripsConfig,
    templatesPath: gripsConfig.templatesPath ?? "~/klaus/grips/templates",
    activePath: gripsConfig.activePath ?? "~/klaus/grips/active",
    archivePath: gripsConfig.archivePath ?? "~/klaus/grips/archive",
  };
}

const startGripSchema = Type.Object({
  task: Type.String({ description: "What the grip should accomplish (e.g., 'build until it compiles', 'run tests and fix failures')" }),
  template: Type.Optional(Type.String({ description: "Template ID to use (run grip_list to see available templates)" })),
  initial_command: Type.Optional(Type.String({ description: "Initial shell command to run in tmux" })),
  cwd: Type.Optional(Type.String({ description: "Working directory for the grip (defaults to session scratchpad)" })),
});

function createStartGripTool(ctx: SessionContext): AgentTool<typeof startGripSchema, { gripId: string }> {
  return {
    name: "start_grip",
    label: "Start Grip",
    description: "Start a long-running grip task in tmux. Use this for tasks that need continuous monitoring and may require multiple attempts (builds, tests, deployments). The grip will keep running and notify progress.",
    parameters: startGripSchema,
    execute: async (_toolCallId, params) => {
      const gripsConfig = getGripsConfig();
      const { templatesPath, activePath, archivePath } = gripsConfig;

      try {
        const manager = getGripManager({
          templatesPath,
          activePath,
          archivePath,
          pollIntervalSeconds: gripsConfig.pollIntervalSeconds ?? 10,
          maxConcurrent: gripsConfig.maxConcurrent ?? 3,
          sendNotification: async (_, msg) => {
            console.log(`[grip] ${msg}`);
          },
        });

        manager.setPollFunction(createPollFunction());

        const grip = await manager.startGrip({
          templateId: params.template,
          userPrompt: params.task,
          session: ctx.sessionName,
          cwd: params.cwd || ctx.sessionCwd,
          initialCommand: params.initial_command,
        });

        return {
          content: [{
            type: "text",
            text: `Grip started: ${grip.id}\nTemplate: ${grip.templateId}\nWorking directory: ${grip.cwd}\n\nThe grip will monitor progress and take action as needed. I'll receive updates as it runs.`,
          }],
          details: { gripId: grip.id },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to start grip: ${err.message}` }],
          details: { gripId: "" },
        };
      }
    },
  };
}

const gripStatusSchema = Type.Object({});

function createGripStatusTool(): AgentTool<typeof gripStatusSchema, { count: number }> {
  return {
    name: "grip_status",
    label: "Grip Status",
    description: "List all active grips and their status.",
    parameters: gripStatusSchema,
    execute: async (_toolCallId, _params) => {
      try {
        // List grips across all sessions
        const grips = await listAllActiveGrips();

        if (grips.length === 0) {
          return {
            content: [{ type: "text", text: "No active grips." }],
            details: { count: 0 },
          };
        }

        const lines = grips.map((grip) => {
          const age = Math.round((Date.now() - new Date(grip.started).getTime()) / 1000 / 60);
          return `• ${grip.id} (${age}m old, ${grip.attempts} attempts)\n  Task: ${grip.userPrompt || "(no description)"}\n  Session: ${grip.session}`;
        });

        return {
          content: [{ type: "text", text: `Active grips (${grips.length}):\n\n${lines.join("\n\n")}` }],
          details: { count: grips.length },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to get grip status: ${err.message}` }],
          details: { count: 0 },
        };
      }
    },
  };
}

const releaseGripSchema = Type.Object({
  grip_id: Type.String({ description: "ID of the grip to release (or partial ID prefix)" }),
});

function createReleaseGripTool(): AgentTool<typeof releaseGripSchema, { released: boolean }> {
  return {
    name: "release_grip",
    label: "Release Grip",
    description: "Stop and release an active grip.",
    parameters: releaseGripSchema,
    execute: async (_toolCallId, params) => {
      const gripsConfig = getGripsConfig();
      const { templatesPath, activePath } = gripsConfig;

      try {
        // Find grip by ID or prefix across all sessions
        const grips = await listAllActiveGrips();
        const grip = grips.find((g) => g.id === params.grip_id || g.id.startsWith(params.grip_id));

        if (!grip) {
          return {
            content: [{ type: "text", text: `Grip not found: ${params.grip_id}` }],
            details: { released: false },
          };
        }

        const manager = getGripManager({
          templatesPath,
          activePath,
          archivePath: gripsConfig.archivePath,
          pollIntervalSeconds: gripsConfig.pollIntervalSeconds ?? 10,
          maxConcurrent: gripsConfig.maxConcurrent ?? 3,
          sendNotification: async () => {},
        });

        const released = await manager.releaseGrip(grip.id);

        return {
          content: [{ type: "text", text: released ? `Released grip: ${grip.id}` : `Failed to release grip: ${grip.id}` }],
          details: { released },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to release grip: ${err.message}` }],
          details: { released: false },
        };
      }
    },
  };
}

const gripListTemplatesSchema = Type.Object({});

function createGripListTemplatesTool(ctx: SessionContext): AgentTool<typeof gripListTemplatesSchema, { count: number }> {
  return {
    name: "grip_list_templates",
    label: "List Grip Templates",
    description: "List available grip templates (includes session-specific templates if any).",
    parameters: gripListTemplatesSchema,
    execute: async (_toolCallId, _params) => {
      const gripsConfig = getGripsConfig();
      const templatesPath = gripsConfig.templatesPath;

      try {
        // Use session-aware discovery to include per-session templates
        const result = await discoverTemplatesWithSession(templatesPath, ctx.sessionName);

        if (result.templates.length === 0) {
          return {
            content: [{ type: "text", text: "No grip templates found. Grips can still be started without templates." }],
            details: { count: 0 },
          };
        }

        const lines = result.templates.map((t) =>
          `• ${t.id}: poll ${t.config.poll_interval || "10s"}, timeout ${t.config.timeout || "30m"}, max retries ${t.config.max_retries || 10}`
        );

        return {
          content: [{ type: "text", text: `Available grip templates:\n\n${lines.join("\n")}` }],
          details: { count: result.templates.length },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to list templates: ${err.message}` }],
          details: { count: 0 },
        };
      }
    },
  };
}

// ============================================================================
// Memory Query Tool
// ============================================================================

const memoryQuerySchema = Type.Object({
  action: Type.Union([
    Type.Literal("search"),      // Search entities by name/alias
    Type.Literal("get"),         // Get specific entity details
    Type.Literal("history"),     // Get entity property history (temporal)
    Type.Literal("related"),     // Get related entities
    Type.Literal("knowledge"),   // Query decisions/facts/tasks
  ], { description: "The query action to perform" }),
  query: Type.Optional(Type.String({ description: "Search query for 'search' action" })),
  entityId: Type.Optional(Type.String({ description: "Entity ID for 'get', 'history', 'related' actions" })),
  type: Type.Optional(Type.String({ description: "Knowledge type for 'knowledge' action: decisions, facts, tasks" })),
  asOfTime: Type.Optional(Type.Number({ description: "Unix timestamp for temporal queries (default: now)" })),
});

type MemoryQueryParams = Static<typeof memoryQuerySchema>;

function createMemoryQueryTool(ctx: SessionContext): AgentTool<typeof memoryQuerySchema, undefined> {
  return {
    name: "memory_query",
    label: "Query Memory",
    description: `Query your memory about people, projects, decisions, facts, and tasks.
Actions:
- search: Find entities by name/alias (requires query param)
- get: Get entity details (requires entityId param)
- history: Get property history for an entity (requires entityId param)
- related: Get entities related to another (requires entityId param)
- knowledge: Query decisions/facts/tasks (requires type param: decisions, facts, or tasks)
Supports temporal queries with asOfTime parameter.`,
    parameters: memoryQuerySchema,
    execute: async (_toolCallId, params: MemoryQueryParams) => {
      // Check if entity memory is enabled
      if (process.env.USE_ENTITY_MEMORY !== "true") {
        return {
          content: [{ type: "text", text: "Entity memory is not enabled. Set USE_ENTITY_MEMORY=true to use this tool." }],
          details: undefined,
        };
      }

      try {
        const {
          findEntitiesByAlias,
          loadEntity,
          getPropertyHistory,
          getRelatedEntities,
          getValidKnowledge,
          queryEntityAtTime,
        } = await import("./memory/index.js");

        const now = params.asOfTime ?? Date.now();

        switch (params.action) {
          case "search": {
            if (!params.query) {
              return {
                content: [{ type: "text", text: "Error: 'query' parameter required for search action" }],
                details: undefined,
              };
            }
            const entities = await findEntitiesByAlias(ctx.sessionName, params.query);
            if (entities.length === 0) {
              return {
                content: [{ type: "text", text: `No entities found matching "${params.query}"` }],
                details: undefined,
              };
            }
            const lines = entities.map((e) => {
              const props = e.properties.slice(0, 3).map((p) => `${p.key}: ${p.value}`).join(", ");
              return `• ${e.name} (${e.type}, id: ${e.id})${props ? ` - ${props}` : ""}`;
            });
            return {
              content: [{ type: "text", text: `Found ${entities.length} entities:\n\n${lines.join("\n")}` }],
              details: undefined,
            };
          }

          case "get": {
            if (!params.entityId) {
              return {
                content: [{ type: "text", text: "Error: 'entityId' parameter required for get action" }],
                details: undefined,
              };
            }
            const entity = params.asOfTime
              ? await queryEntityAtTime(ctx.sessionName, params.entityId, now)
              : await loadEntity(ctx.sessionName, params.entityId);
            if (!entity) {
              return {
                content: [{ type: "text", text: `Entity "${params.entityId}" not found` }],
                details: undefined,
              };
            }
            const propsText = entity.properties.length > 0
              ? entity.properties.map((p) => `  - ${p.key}: ${p.value} (confidence: ${p.confidence})`).join("\n")
              : "  (none)";
            const relsText = entity.relationships.length > 0
              ? entity.relationships.map((r) => `  - ${r.type} → ${r.targetEntityId}`).join("\n")
              : "  (none)";
            return {
              content: [{
                type: "text",
                text: `Entity: ${entity.name} (${entity.type})\nID: ${entity.id}\nAliases: ${entity.aliases.join(", ") || "(none)"}\nFirst seen: ${new Date(entity.firstSeen).toISOString()}\nLast mentioned: ${new Date(entity.lastMentioned).toISOString()}\nMention count: ${entity.mentionCount}\n\nProperties:\n${propsText}\n\nRelationships:\n${relsText}`,
              }],
              details: undefined,
            };
          }

          case "history": {
            if (!params.entityId) {
              return {
                content: [{ type: "text", text: "Error: 'entityId' parameter required for history action" }],
                details: undefined,
              };
            }
            const history = await getPropertyHistory(ctx.sessionName, params.entityId);
            if (history.length === 0) {
              return {
                content: [{ type: "text", text: `No property history found for entity "${params.entityId}"` }],
                details: undefined,
              };
            }
            const lines = history.map((p) => {
              const validStr = p.validUntil
                ? `${new Date(p.validFrom).toISOString()} - ${new Date(p.validUntil).toISOString()}`
                : `${new Date(p.validFrom).toISOString()} - present`;
              return `• ${p.key}: ${p.value} (${validStr})`;
            });
            return {
              content: [{ type: "text", text: `Property history for ${params.entityId}:\n\n${lines.join("\n")}` }],
              details: undefined,
            };
          }

          case "related": {
            if (!params.entityId) {
              return {
                content: [{ type: "text", text: "Error: 'entityId' parameter required for related action" }],
                details: undefined,
              };
            }
            const related = await getRelatedEntities(ctx.sessionName, params.entityId);
            if (related.length === 0) {
              return {
                content: [{ type: "text", text: `No related entities found for "${params.entityId}"` }],
                details: undefined,
              };
            }
            const lines = related.map((r) => `• ${r.entity.name} (${r.relationship.type})`);
            return {
              content: [{ type: "text", text: `Entities related to ${params.entityId}:\n\n${lines.join("\n")}` }],
              details: undefined,
            };
          }

          case "knowledge": {
            const type = (params.type || "facts") as "decisions" | "facts" | "tasks";
            if (!["decisions", "facts", "tasks"].includes(type)) {
              return {
                content: [{ type: "text", text: "Error: 'type' must be one of: decisions, facts, tasks" }],
                details: undefined,
              };
            }
            const items = await getValidKnowledge(ctx.sessionName, type, now);
            if (items.length === 0) {
              return {
                content: [{ type: "text", text: `No ${type} found` }],
                details: undefined,
              };
            }
            const lines = items.map((item) => `• ${item.content}`);
            return {
              content: [{ type: "text", text: `${type.charAt(0).toUpperCase() + type.slice(1)} (${items.length}):\n\n${lines.join("\n")}` }],
              details: undefined,
            };
          }

          default:
            return {
              content: [{ type: "text", text: `Unknown action: ${params.action}` }],
              details: undefined,
            };
        }
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Memory query failed: ${err.message}` }],
          details: undefined,
        };
      }
    },
  };
}

// ============================================================================
// Click Tools - scheduled task management
// ============================================================================

const createClickSchema = Type.Object({
  id: Type.String({ description: "Unique ID for the click (lowercase, alphanumeric, dashes only)" }),
  name: Type.String({ description: "Human-readable name for the click" }),
  instructions: Type.String({ description: "Instructions for what the click should do" }),
  intervalMinutes: Type.Number({ description: "How often to run (in minutes, max 1440)" }),
  alertCriteria: Type.Optional(Type.String({ description: "When to alert (if not set, agent decides)" })),
  enabled: Type.Optional(Type.Boolean({ description: "Whether the click is enabled (default: true)" })),
});

function createClickTool(ctx: SessionContext): AgentTool<typeof createClickSchema, { clickId: string }> {
  return {
    name: "create_click",
    label: "Create Click",
    description: "Create a new scheduled click (recurring task). Clicks run on an interval and can send alerts. Example: monitor inbox every 30 minutes.",
    parameters: createClickSchema,
    execute: async (_toolCallId, params) => {
      try {
        // Validate ID format
        if (!/^[a-z0-9-]+$/.test(params.id)) {
          return {
            content: [{ type: "text", text: "Error: Click ID must be lowercase alphanumeric with dashes only" }],
            details: { clickId: "" },
          };
        }

        // Validate interval
        if (params.intervalMinutes < 1 || params.intervalMinutes > 1440) {
          return {
            content: [{ type: "text", text: "Error: Interval must be between 1 and 1440 minutes" }],
            details: { clickId: "" },
          };
        }

        const clicksPath = path.join(WHATSAPP_BASE_PATH, ctx.sessionName, "clicks.json");

        // Load existing clicks or create new file
        let clicksFile: { clicks: any[]; alertTarget?: string } = { clicks: [] };
        try {
          const content = await fs.readFile(clicksPath, "utf8");
          clicksFile = JSON.parse(content);
        } catch {
          // File doesn't exist, start fresh
        }

        // Check for duplicate ID
        if (clicksFile.clicks.some((c: any) => c.id === params.id)) {
          return {
            content: [{ type: "text", text: `Error: Click with ID "${params.id}" already exists` }],
            details: { clickId: "" },
          };
        }

        // Add new click
        const newClick = {
          id: params.id,
          name: params.name,
          instructions: params.instructions,
          intervalMinutes: params.intervalMinutes,
          alertCriteria: params.alertCriteria,
          enabled: params.enabled ?? true,
        };
        clicksFile.clicks.push(newClick);

        // Write back
        await fs.writeFile(clicksPath, JSON.stringify(clicksFile, null, 2));

        console.log(`[create_click] Created click "${params.id}" for session ${ctx.sessionName}`);

        return {
          content: [{
            type: "text",
            text: `Click created: ${params.id}\nName: ${params.name}\nInterval: every ${params.intervalMinutes} minutes\n\nNote: Restart warelay or wait for next scheduler cycle to activate.`,
          }],
          details: { clickId: params.id },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to create click: ${err.message}` }],
          details: { clickId: "" },
        };
      }
    },
  };
}

const listClicksSchema = Type.Object({});

function createListClicksTool(ctx: SessionContext): AgentTool<typeof listClicksSchema, { count: number }> {
  return {
    name: "list_clicks",
    label: "List Clicks",
    description: "List all scheduled clicks for this session.",
    parameters: listClicksSchema,
    execute: async (_toolCallId, _params) => {
      try {
        const clicksPath = path.join(WHATSAPP_BASE_PATH, ctx.sessionName, "clicks.json");

        let clicksFile: { clicks: any[] };
        try {
          const content = await fs.readFile(clicksPath, "utf8");
          clicksFile = JSON.parse(content);
        } catch {
          return {
            content: [{ type: "text", text: "No clicks configured for this session." }],
            details: { count: 0 },
          };
        }

        if (!clicksFile.clicks || clicksFile.clicks.length === 0) {
          return {
            content: [{ type: "text", text: "No clicks configured for this session." }],
            details: { count: 0 },
          };
        }

        const lines = clicksFile.clicks.map((c: any) => {
          const status = c.enabled === false ? " [DISABLED]" : "";
          return `• ${c.id}${status}: ${c.name} (every ${c.intervalMinutes}m)\n  ${c.instructions.slice(0, 80)}${c.instructions.length > 80 ? "..." : ""}`;
        });

        return {
          content: [{ type: "text", text: `Clicks (${clicksFile.clicks.length}):\n\n${lines.join("\n\n")}` }],
          details: { count: clicksFile.clicks.length },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to list clicks: ${err.message}` }],
          details: { count: 0 },
        };
      }
    },
  };
}

const deleteClickSchema = Type.Object({
  id: Type.String({ description: "ID of the click to delete" }),
});

function createDeleteClickTool(ctx: SessionContext): AgentTool<typeof deleteClickSchema, { deleted: boolean }> {
  return {
    name: "delete_click",
    label: "Delete Click",
    description: "Delete a scheduled click by ID.",
    parameters: deleteClickSchema,
    execute: async (_toolCallId, params) => {
      try {
        const clicksPath = path.join(WHATSAPP_BASE_PATH, ctx.sessionName, "clicks.json");

        let clicksFile: { clicks: any[] };
        try {
          const content = await fs.readFile(clicksPath, "utf8");
          clicksFile = JSON.parse(content);
        } catch {
          return {
            content: [{ type: "text", text: "No clicks.json found for this session." }],
            details: { deleted: false },
          };
        }

        const initialCount = clicksFile.clicks.length;
        clicksFile.clicks = clicksFile.clicks.filter((c: any) => c.id !== params.id);

        if (clicksFile.clicks.length === initialCount) {
          return {
            content: [{ type: "text", text: `Click "${params.id}" not found.` }],
            details: { deleted: false },
          };
        }

        // Write back
        await fs.writeFile(clicksPath, JSON.stringify(clicksFile, null, 2));

        console.log(`[delete_click] Deleted click "${params.id}" for session ${ctx.sessionName}`);

        return {
          content: [{ type: "text", text: `Click "${params.id}" deleted. Changes take effect on next scheduler cycle.` }],
          details: { deleted: true },
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to delete click: ${err.message}` }],
          details: { deleted: false },
        };
      }
    },
  };
}

// ============================================================================
// Export tools factory
// ============================================================================

/**
 * Options for creating tools with custom configuration.
 */
export interface CreateToolsOptions {
  /** Override the working directory (default: session scratchpad) */
  cwd?: string;
  /** Custom MCP config path (for grips with their own mcporter.json) */
  mcpConfigPath?: string;
}

/**
 * Create all tools for a session with proper sandbox isolation.
 * Each session gets its own tool instances with sessionCwd captured in closures.
 * This prevents race conditions when multiple sessions run concurrently.
 *
 * @param sessionName - The session name (e.g., "@123456789")
 * @param options - Optional configuration (cwd override for grips, custom MCP config)
 */
export function createTools(sessionName: string, options?: CreateToolsOptions): AgentTool<any>[] {
  const ctx = createSessionContext(sessionName, options?.cwd);
  return [
    createReadFileTool(ctx),
    createWriteFileTool(ctx),
    createListDirTool(ctx),
    createBashTool(ctx),
    createSearchTool(ctx),
    // These tools don't need session context (no sandbox paths)
    webSearchTool,
    webFetchTool,
    getCurrentTimeTool,
    // These tools need session context
    createGenerateImageTool(ctx),
    createEditImageTool(ctx),
    createMcpTool(ctx, options?.mcpConfigPath),
    // Grip tools
    createStartGripTool(ctx),
    createGripStatusTool(),
    createReleaseGripTool(),
    createGripListTemplatesTool(ctx),
    // Click tools (scheduled tasks)
    createClickTool(ctx),
    createListClicksTool(ctx),
    createDeleteClickTool(ctx),
    // Memory query tool (entity memory system)
    createMemoryQueryTool(ctx),
  ];
}

/**
 * @deprecated Use createTools(sessionName) instead.
 * This function exists for backward compatibility but returns tools without proper session isolation.
 */
export function getTools(options?: { cwd?: string }): AgentTool<any>[] {
  console.warn("[pi-agent-tools] WARNING: getTools() is deprecated, use createTools(sessionName) for proper session isolation");
  // Fallback to a default session - this is unsafe for concurrent use
  return createTools("@unknown");
}
