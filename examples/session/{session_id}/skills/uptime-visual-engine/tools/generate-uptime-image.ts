#!/usr/bin/env npx tsx
/**
 * Uptime Visual Engine - Image Generation CLI
 *
 * Generates on-brand images using the Uptime Visual System.
 *
 * Usage:
 *   npx tsx tools/generate-uptime-image.ts --style fleet-geometric --prompt "..." --output ./output.png
 *
 * Options:
 *   --style       Visual style to use (fleet-geometric, industrial-editorial, data-dashboard, pipeline-blueprint)
 *   --prompt      The image generation prompt
 *   --size        Output dimensions (e.g., 1920x1080, 1200x628)
 *   --output      Output file path
 *   --workflow    Optional: Workflow name to apply pre-built prompt templates
 *   --template    Optional: Template name within workflow
 *   --vars        Optional: JSON string of template variables
 *   --dry-run     Preview the prompt without generating
 *   --help        Show help
 *
 * Examples:
 *   # Generate a hero composition
 *   npx tsx tools/generate-uptime-image.ts \
 *     --style industrial-editorial \
 *     --prompt "Driver portrait with truck in background" \
 *     --size 1920x1080 \
 *     --output ./hero.png
 *
 *   # Generate a metric card
 *   npx tsx tools/generate-uptime-image.ts \
 *     --style data-dashboard \
 *     --workflow metric-cards \
 *     --template big-number \
 *     --vars '{"number": "14", "unit": "days", "description": "to first driver"}' \
 *     --size 1200x1200 \
 *     --output ./metric.png
 */

import { parseArgs } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";

// =============================================================================
// UPTIME BRAND CONSTANTS
// =============================================================================

const UPTIME_COLORS = {
  // Primary palette
  lime: "#7CFC00",
  darkBlue: "#002233",
  white: "#FFFFFF",
  lightGreen: "#F6FFED",

  // Extended palette
  warmWhite: "#FFFDF5",
  softGray: "#F5F8FA",

  // Metronic-inspired status colors
  success: "#50CD89",
  info: "#009EF7",
  warning: "#FFC700",
  danger: "#F1416C",

  // Opacity variants
  darkBlue80: "rgba(0, 34, 51, 0.80)",
  darkBlue70: "rgba(0, 34, 51, 0.70)",
  darkBlue50: "rgba(0, 34, 51, 0.50)",
  darkBlue15: "rgba(0, 34, 51, 0.15)",
  darkBlue10: "rgba(0, 34, 51, 0.10)",
  lime15: "rgba(124, 252, 0, 0.15)",
};

const UPTIME_TYPOGRAPHY = {
  fontFamily: "Inter",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  sizes: {
    hero: "72-120px",
    h1: "48-64px",
    h2: "32-40px",
    h3: "24-28px",
    body: "16-18px",
    small: "14px",
    caption: "12px",
  },
};

// =============================================================================
// VISUAL STYLES
// =============================================================================

interface VisualStyle {
  name: string;
  description: string;
  systemPrompt: string;
  defaultBackground: string;
}

const VISUAL_STYLES: Record<string, VisualStyle> = {
  "fleet-geometric": {
    name: "Fleet Geometric",
    description:
      "Clean, systematic grid-based designs with bold shapes and organized patterns",
    systemPrompt: `
Uptime Fleet Geometric Style:

AESTHETIC:
- Clean, systematic, grid-based designs
- Bold geometric shapes (circles, rectangles, lines)
- Organized, intentional compositions
- Modern enterprise SaaS quality
- Flat design, no gradients or 3D effects

COLORS:
- Primary: Dark Blue ${UPTIME_COLORS.darkBlue}
- Accent: Lime Green ${UPTIME_COLORS.lime} (used sparingly)
- Background: White ${UPTIME_COLORS.white} or Light Green ${UPTIME_COLORS.lightGreen}

STYLE RULES:
- Bold outlines (2-3px stroke weight)
- Consistent stroke weight throughout
- Rounded corners where appropriate
- Generous whitespace and breathing room
- Clear visual hierarchy
- No photography, pure illustration

TYPOGRAPHY (if text included):
- Font: Inter (or similar clean sans-serif)
- Headlines: Black (900) weight
- Body: Medium (500) weight
    `.trim(),
    defaultBackground: UPTIME_COLORS.white,
  },

  "industrial-editorial": {
    name: "Industrial Editorial",
    description:
      "Photography-forward with bold editorial overlays and trucking industry context",
    systemPrompt: `
Uptime Industrial Editorial Style:

AESTHETIC:
- Photography-forward editorial look
- Bold graphic overlays on photography
- High contrast, dramatic lighting
- Trucking industry authenticity
- Magazine-quality compositions

PHOTOGRAPHY:
- Professional quality, editorial feel
- Natural lighting (golden hour preferred)
- Real trucking environments (yards, highways, cabs)
- Authentic working professionals
- Not stock-photo generic

OVERLAYS & TREATMENTS:
- Lime Green ${UPTIME_COLORS.lime} accent bars and shapes
- Bold typography overlays
- Geometric frame elements
- Dark Blue ${UPTIME_COLORS.darkBlue} text and graphics

COLOR TREATMENT:
- Rich, saturated colors
- Warm skin tones preserved
- Deep blacks, clean whites
- Lime accents for brand recognition

TYPOGRAPHY (if text included):
- Font: Inter Black for headlines
- High contrast against imagery
- Bold, confident positioning
    `.trim(),
    defaultBackground: UPTIME_COLORS.darkBlue,
  },

  "data-dashboard": {
    name: "Data Dashboard",
    description:
      "Metronic-inspired data visualization with enterprise SaaS polish",
    systemPrompt: `
Uptime Data Dashboard Style:

AESTHETIC:
- Clean, Metronic-inspired design
- Enterprise SaaS data visualization
- Numbers as heroes
- Professional, trustworthy feel
- Card-based layouts

ELEMENTS:
- Large, prominent numbers
- Progress bars and charts
- Clean card containers
- Subtle shadows for depth
- Lime accents for emphasis

COLORS:
- Text: Dark Blue ${UPTIME_COLORS.darkBlue}
- Accent: Lime Green ${UPTIME_COLORS.lime}
- Backgrounds: White ${UPTIME_COLORS.white} or Light Green ${UPTIME_COLORS.lightGreen}
- Success: ${UPTIME_COLORS.success}
- Info: ${UPTIME_COLORS.info}

CARDS:
- White background
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)
- Generous padding (32-48px)

TYPOGRAPHY:
- Numbers: Inter Black 72-120px
- Labels: Inter Medium 16-24px
- Body: Inter Regular 14-16px
    `.trim(),
    defaultBackground: UPTIME_COLORS.white,
  },

  "pipeline-blueprint": {
    name: "Pipeline Blueprint",
    description:
      "Technical schematic diagrams that visualize processes and systems",
    systemPrompt: `
Uptime Pipeline Blueprint Style:

AESTHETIC:
- Technical, schematic diagrams
- Process flow visualization
- Connected nodes and pathways
- Blueprint/engineering feel
- Systematic and trustworthy

ELEMENTS:
- Connected nodes (circles/rounded rectangles)
- Flow arrows and lines
- Stage indicators
- Grid or subtle blueprint background
- Lime highlights on key elements

STRUCTURE:
- Clear flow direction (left-to-right or top-to-bottom)
- Consistent node sizing
- Equal spacing between elements
- One highlighted/featured element per diagram

COLORS:
- Lines/Nodes: Dark Blue ${UPTIME_COLORS.darkBlue}
- Highlights: Lime Green ${UPTIME_COLORS.lime}
- Background: Light Green ${UPTIME_COLORS.lightGreen} or White
- Grid lines: Dark Blue at 5% opacity

NODE STYLE:
- Rounded rectangles (100x80px typical)
- White fill, Dark Blue border (2px)
- Highlighted: Lime Green border (3px)
- Icon inside (32-40px)
- Label below

CONNECTORS:
- 2px Dark Blue lines
- Arrow heads (chevron or triangle)
- Clean, direct paths
    `.trim(),
    defaultBackground: UPTIME_COLORS.lightGreen,
  },
};

// =============================================================================
// WORKFLOW TEMPLATES
// =============================================================================

interface PromptTemplate {
  name: string;
  description: string;
  style: string;
  template: string;
  variables: string[];
  defaultSize: string;
}

const WORKFLOW_TEMPLATES: Record<string, Record<string, PromptTemplate>> = {
  "metric-cards": {
    "big-number": {
      name: "Big Number Card",
      description: "Single dominant statistic with context",
      style: "data-dashboard",
      template: `
Metric card in Uptime Data Dashboard style.

CARD:
- Background: White ${UPTIME_COLORS.white}
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)
- Padding: 48px

PRIMARY NUMBER:
- Value: "{{number}}"
- Font: Inter Black (900)
- Size: 96px
- Color: Dark Blue ${UPTIME_COLORS.darkBlue}

UNIT/CONTEXT:
- Text: "{{unit}}"
- Font: Inter Bold (700)
- Size: 28px
- Position: Immediately after or below number

DESCRIPTION:
- Text: "{{description}}"
- Font: Inter Medium (500)
- Size: 18px
- Color: Dark Blue at 70% opacity
- Position: Below number block

ACCENT:
- Lime Green ${UPTIME_COLORS.lime} underline below number (8px height, 60% number width)

COMPOSITION: Centered, generous whitespace, clean hierarchy.
Number is hero. Everything else supports it.
      `.trim(),
      variables: ["number", "unit", "description"],
      defaultSize: "1200x1200",
    },

    comparison: {
      name: "Comparison Card",
      description: "Before/after or X vs Y metric",
      style: "data-dashboard",
      template: `
Comparison metric card in Uptime Data Dashboard style.

CARD:
- Background: White ${UPTIME_COLORS.white}
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)

LEFT VALUE (Before/Industry):
- Number: "{{oldValue}}"
- Label: "{{oldLabel}}"
- Color: Dark Blue ${UPTIME_COLORS.darkBlue} at 50% opacity
- Style: Muted, secondary

ARROW/TRANSITION:
- Direction indicator between values
- Dark Blue ${UPTIME_COLORS.darkBlue}

RIGHT VALUE (After/Uptime):
- Number: "{{newValue}}"
- Label: "{{newLabel}}"
- Color: Dark Blue ${UPTIME_COLORS.darkBlue}
- Accent: Lime Green ${UPTIME_COLORS.lime} underline

COMPARISON BAR:
- Full width progress bar
- Background: Dark Blue at 10%
- Fill: Lime Green ${UPTIME_COLORS.lime}

SUMMARY:
- Text: "{{summary}}"
- Font: Inter Bold
- Color: Dark Blue ${UPTIME_COLORS.darkBlue}

Emphasis on the improvement. Old value faded, new value prominent.
      `.trim(),
      variables: ["oldValue", "oldLabel", "newValue", "newLabel", "summary"],
      defaultSize: "1200x600",
    },
  },

  "hero-compositions": {
    editorial: {
      name: "Editorial Hero",
      description: "Photography-forward hero with editorial treatment",
      style: "industrial-editorial",
      template: `
Hero section visual in Uptime Industrial Editorial style.

DIMENSIONS: {{size}}

PHOTOGRAPHY:
- Subject: {{subject}}
- Setting: {{setting}}
- Treatment: High contrast, editorial quality
- Mood: Professional, authentic, confident

OVERLAY ELEMENTS:
- Lime Green ${UPTIME_COLORS.lime} accent bar (position: {{accentPosition}})
- Optional geometric frame element

BRAND INTEGRATION:
- Uptime brand presence through color and treatment
- Not logo-heavy

COMPOSITION:
- Rule of thirds
- Subject positioned for text overlay space
- Professional, magazine-quality feel
      `.trim(),
      variables: ["size", "subject", "setting", "accentPosition"],
      defaultSize: "1920x1080",
    },

    geometric: {
      name: "Geometric Hero",
      description: "Abstract geometric hero composition",
      style: "fleet-geometric",
      template: `
Hero section visual in Uptime Fleet Geometric style.

DIMENSIONS: {{size}}

CONCEPT: {{concept}}

BACKGROUND: {{background}}

MAIN ELEMENTS:
{{elements}}

STYLE:
- Clean geometric shapes
- Bold outlines (2-3px stroke)
- Flat colors, no gradients
- Systematic, organized arrangement

COLORS:
- Primary structure: Dark Blue ${UPTIME_COLORS.darkBlue}
- Accent elements: Lime Green ${UPTIME_COLORS.lime} (sparingly)
- Background: {{background}}

COMPOSITION:
- Clear focal point
- Breathing room and negative space
- Professional, enterprise-quality
      `.trim(),
      variables: ["size", "concept", "background", "elements"],
      defaultSize: "1920x1080",
    },
  },

  "social-cards": {
    "data-callout": {
      name: "Data Callout (Social)",
      description: "Single striking statistic for social media",
      style: "data-dashboard",
      template: `
Social media card in Uptime Data Dashboard style.

DIMENSIONS: {{size}}
BACKGROUND: Dark Blue ${UPTIME_COLORS.darkBlue}

PRIMARY ELEMENT:
- Number: "{{number}}"
- Font: Inter Black 96px
- Color: White ${UPTIME_COLORS.white}
- Unit: "{{unit}}" in Inter Bold 36px

SUPPORTING TEXT:
- "{{description}}"
- Font: Inter Medium 24px
- Color: White at 70%

ACCENT:
- Lime Green ${UPTIME_COLORS.lime} underline below number
- 8px height, 50% number width

LOGO:
- Uptime logo, bottom-right corner
- White version, 40px height

Clean, bold, stops the scroll.
      `.trim(),
      variables: ["size", "number", "unit", "description"],
      defaultSize: "1200x628",
    },

    quote: {
      name: "Quote Card (Social)",
      description: "Shareable statement or insight",
      style: "data-dashboard",
      template: `
Social media quote card in Uptime style.

DIMENSIONS: {{size}}
BACKGROUND: White ${UPTIME_COLORS.white}

QUOTE:
- Text: "{{quote}}"
- Font: Inter Bold 48px
- Color: Dark Blue ${UPTIME_COLORS.darkBlue}
- Quotation marks: Large, Lime Green ${UPTIME_COLORS.lime}

ATTRIBUTION (optional):
- {{attribution}}
- Line below quote

ACCENT:
- Lime vertical bar on left side (4px width)

LOGO:
- Uptime logo, bottom-right
- Dark Blue version

High contrast, shareable quote format.
      `.trim(),
      variables: ["size", "quote", "attribution"],
      defaultSize: "1200x628",
    },
  },

  "pipeline-diagrams": {
    linear: {
      name: "Linear Pipeline",
      description: "4-step left-to-right process flow",
      style: "pipeline-blueprint",
      template: `
Process diagram in Uptime Pipeline Blueprint style.

DIMENSIONS: {{size}}

BACKGROUND:
- Color: Light Green ${UPTIME_COLORS.lightGreen}
- Subtle grid: 40px squares, 1px lines at Dark Blue 5% opacity

FLOW: 4 steps, left to right

NODES:
{{nodes}}

NODE STYLE:
- Shape: Rounded rectangle, 100px x 80px
- Background: White ${UPTIME_COLORS.white}
- Border: 2px Dark Blue ${UPTIME_COLORS.darkBlue}
- Highlighted border: 3px Lime Green ${UPTIME_COLORS.lime}
- Icons: 36px, geometric outline style

CONNECTORS:
- Lines: 2px Dark Blue ${UPTIME_COLORS.darkBlue}
- Arrows: Chevron style, pointing right
- Equal spacing between nodes

LABELS:
- Step names below each node
- Font: Inter Medium 14px
- Color: Dark Blue ${UPTIME_COLORS.darkBlue}

TITLE: {{title}}

Clean, technical, trustworthy pipeline visualization.
      `.trim(),
      variables: ["size", "nodes", "title"],
      defaultSize: "1920x1080",
    },
  },
};

// =============================================================================
// CLI IMPLEMENTATION
// =============================================================================

function showHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      UPTIME VISUAL ENGINE - Image Generator                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

USAGE:
  npx tsx tools/generate-uptime-image.ts [options]

OPTIONS:
  --style       Visual style to use (required unless using --workflow)
                Available: fleet-geometric, industrial-editorial,
                          data-dashboard, pipeline-blueprint

  --prompt      Image generation prompt (required unless using --template)

  --size        Output dimensions (e.g., 1920x1080, 1200x628)
                Default varies by workflow/template

  --output      Output file path (required)

  --workflow    Workflow name to use pre-built templates
                Available: metric-cards, hero-compositions,
                          social-cards, pipeline-diagrams

  --template    Template name within workflow

  --vars        JSON string of template variables

  --dry-run     Preview the final prompt without generating

  --help        Show this help message

EXAMPLES:

  # Generate with custom prompt
  npx tsx tools/generate-uptime-image.ts \\
    --style data-dashboard \\
    --prompt "Metric card showing 14 days to first driver" \\
    --size 1200x1200 \\
    --output ./metric.png

  # Generate using workflow template
  npx tsx tools/generate-uptime-image.ts \\
    --workflow metric-cards \\
    --template big-number \\
    --vars '{"number": "14", "unit": "days", "description": "to first driver"}' \\
    --output ./metric.png

  # Dry run to preview prompt
  npx tsx tools/generate-uptime-image.ts \\
    --workflow social-cards \\
    --template data-callout \\
    --vars '{"number": "$1,200", "unit": "/day", "description": "cost per empty seat"}' \\
    --dry-run

AVAILABLE STYLES:

  fleet-geometric       Clean, systematic grid-based designs
  industrial-editorial  Photography-forward with editorial overlays
  data-dashboard        Metronic-inspired data visualization
  pipeline-blueprint    Technical schematic diagrams

BRAND COLORS:
  Lime Green:     ${UPTIME_COLORS.lime}
  Dark Blue:      ${UPTIME_COLORS.darkBlue}
  White:          ${UPTIME_COLORS.white}
  Light Green:    ${UPTIME_COLORS.lightGreen}
  `);
}

function listWorkflows(): void {
  console.log("\nAVAILABLE WORKFLOWS AND TEMPLATES:\n");

  for (const [workflowName, templates] of Object.entries(WORKFLOW_TEMPLATES)) {
    console.log(`📁 ${workflowName}`);
    for (const [templateName, template] of Object.entries(templates)) {
      console.log(`   └─ ${templateName}: ${template.description}`);
      console.log(`      Variables: ${template.variables.join(", ")}`);
      console.log(`      Default size: ${template.defaultSize}`);
    }
    console.log("");
  }
}

function parseSize(sizeStr: string): { width: number; height: number } {
  const match = sizeStr.match(/^(\d+)x(\d+)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}. Use format: 1920x1080`);
  }
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

function buildPrompt(options: {
  style?: string;
  prompt?: string;
  workflow?: string;
  template?: string;
  vars?: Record<string, string>;
  size?: string;
}): { prompt: string; style: string; size: string } {
  // If using workflow template
  if (options.workflow && options.template) {
    const workflow = WORKFLOW_TEMPLATES[options.workflow];
    if (!workflow) {
      throw new Error(
        `Unknown workflow: ${options.workflow}. Available: ${Object.keys(WORKFLOW_TEMPLATES).join(", ")}`
      );
    }

    const template = workflow[options.template];
    if (!template) {
      throw new Error(
        `Unknown template: ${options.template} in workflow ${options.workflow}`
      );
    }

    const vars = options.vars || {};

    // Check for missing required variables
    const missing = template.variables.filter((v) => !vars[v]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required variables for template: ${missing.join(", ")}`
      );
    }

    // Add size to vars if provided
    vars.size = options.size || template.defaultSize;

    const prompt = applyTemplate(template.template, vars);
    const style = options.style || template.style;
    const size = vars.size;

    return { prompt, style, size };
  }

  // If using direct prompt
  if (options.style && options.prompt) {
    return {
      prompt: options.prompt,
      style: options.style,
      size: options.size || "1920x1080",
    };
  }

  throw new Error(
    "Must provide either --style and --prompt, or --workflow and --template"
  );
}

function generateFinalPrompt(style: string, userPrompt: string): string {
  const styleConfig = VISUAL_STYLES[style];
  if (!styleConfig) {
    throw new Error(
      `Unknown style: ${style}. Available: ${Object.keys(VISUAL_STYLES).join(", ")}`
    );
  }

  return `${styleConfig.systemPrompt}

---

SPECIFIC REQUEST:
${userPrompt}

---

Generate a high-quality image following the Uptime ${styleConfig.name} style guidelines above.
`;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      style: { type: "string", short: "s" },
      prompt: { type: "string", short: "p" },
      size: { type: "string" },
      output: { type: "string", short: "o" },
      workflow: { type: "string", short: "w" },
      template: { type: "string", short: "t" },
      vars: { type: "string", short: "v" },
      "dry-run": { type: "boolean" },
      "list-workflows": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  // Handle help
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  // Handle list workflows
  if (values["list-workflows"]) {
    listWorkflows();
    process.exit(0);
  }

  // Parse variables if provided
  let vars: Record<string, string> = {};
  if (values.vars) {
    try {
      vars = JSON.parse(values.vars);
    } catch (e) {
      console.error("Error parsing --vars JSON:", e);
      process.exit(1);
    }
  }

  try {
    // Build the prompt
    const { prompt, style, size } = buildPrompt({
      style: values.style,
      prompt: values.prompt,
      workflow: values.workflow,
      template: values.template,
      vars,
      size: values.size,
    });

    // Generate final prompt with style system prompt
    const finalPrompt = generateFinalPrompt(style, prompt);
    const dimensions = parseSize(size);

    // Dry run - just show the prompt
    if (values["dry-run"]) {
      console.log("\n" + "═".repeat(80));
      console.log("DRY RUN - Generated Prompt Preview");
      console.log("═".repeat(80) + "\n");
      console.log(`Style: ${style}`);
      console.log(`Size: ${size} (${dimensions.width}x${dimensions.height})`);
      console.log(`Output: ${values.output || "(not specified)"}`);
      console.log("\n" + "─".repeat(80) + "\n");
      console.log(finalPrompt);
      console.log("\n" + "═".repeat(80) + "\n");
      process.exit(0);
    }

    // Check for output path
    if (!values.output) {
      console.error("Error: --output path is required");
      process.exit(1);
    }

    // For actual generation, we would integrate with an image generation API
    // This is a placeholder that saves the prompt to a file
    console.log("\n" + "═".repeat(80));
    console.log("UPTIME IMAGE GENERATION");
    console.log("═".repeat(80) + "\n");
    console.log(`Style: ${style}`);
    console.log(`Size: ${size}`);
    console.log(`Output: ${values.output}`);
    console.log("\n" + "─".repeat(80) + "\n");

    // Save prompt to a .prompt.txt file alongside the output
    const promptPath = values.output.replace(/\.\w+$/, ".prompt.txt");
    fs.writeFileSync(promptPath, finalPrompt);
    console.log(`✓ Prompt saved to: ${promptPath}`);

    console.log("\n⚠️  Image generation requires API integration.");
    console.log("   The prompt has been saved for use with your preferred image generator.");
    console.log("\n   Recommended services:");
    console.log("   - Midjourney (via Discord or API)");
    console.log("   - DALL-E 3 (OpenAI API)");
    console.log("   - Stable Diffusion (local or API)");
    console.log("   - Ideogram (ideogram.ai)");
    console.log("\n" + "═".repeat(80) + "\n");

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
