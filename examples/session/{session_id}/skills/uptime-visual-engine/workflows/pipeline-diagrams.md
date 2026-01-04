# Pipeline Diagrams Workflow

**Creates technical process visualizations that make "how it works" instantly clear.**

---

## Purpose

Uptime's core promise is turning chaotic hiring into a systematic pipeline. This workflow creates visuals that show the system — clear flows, connected steps, and logical progressions.

**Use for:**
- How it works sections
- Process explanations
- Integration diagrams
- Onboarding flows
- Feature walkthroughs
- Step-by-step guides
- Technical documentation

---

## Recommended Style

**Primary: Pipeline Blueprint**
Technical, schematic aesthetic that feels systematic and trustworthy.

---

## Pipeline Types

### Type 1: Linear Flow
Simple left-to-right or top-to-bottom progression.
```
[Step 1] ─────→ [Step 2] ─────→ [Step 3] ─────→ [Step 4]
   │               │               │               │
 Setup          Process          Match           Hired
```

### Type 2: Funnel Flow
Narrowing progression showing filtering/refinement.
```
     ╔══════════════════════════╗
     ║     Applicant Pool       ║
     ╚════════════╤═════════════╝
            ╔═════╧═════╗
            ║ Screening  ║
            ╚═════╤═════╝
               ╔══╧══╗
               ║Match║
               ╚══╤══╝
                 ●
               Hired
```

### Type 3: Hub & Spoke
Central system with connected inputs/outputs.
```
         [Source 1]
              │
[Source 2]────●────[Output 1]
              │
         [Source 3]

      ● = Uptime (central hub)
```

### Type 4: Parallel Tracks
Multiple simultaneous processes.
```
Track A: [A1] ──→ [A2] ──→ [A3] ──┐
                                   ├──→ [Result]
Track B: [B1] ──→ [B2] ──→ [B3] ──┘
```

### Type 5: Decision Tree
Branching based on conditions.
```
        [Start]
           │
      ┌────┴────┐
      ▼         ▼
   [Yes]      [No]
      │         │
      ▼         ▼
  [Path A]  [Path B]
```

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Map the Process

**Define the flow:**
```
PROCESS NAME: [e.g., "Driver Hiring Pipeline"]
NUMBER OF STEPS: [3-6 steps optimal]
FLOW DIRECTION: [Left to right / Top to bottom]
KEY INSIGHT: [What makes this flow special/different]

STEPS:
1. [Step name] - [Brief description]
2. [Step name] - [Brief description]
3. [Step name] - [Brief description]
...

HIGHLIGHT POINT: [Which step/transition to emphasize]
```

**Example:**
```
PROCESS NAME: The Uptime Hiring Pipeline
NUMBER OF STEPS: 4
FLOW DIRECTION: Left to right
KEY INSIGHT: From application to hired in 14 days

STEPS:
1. Applications Flow In - Multi-channel sourcing
2. AI Screening - Automatic qualification
3. Smart Matching - Driver + fleet fit scoring
4. Hire & Onboard - Guided completion

HIGHLIGHT POINT: Step 3 (Smart Matching) - the AI differentiator
```

---

### Step 2: Choose Diagram Type

| Process Type | Diagram Type | Best For |
|--------------|--------------|----------|
| Sequential steps | Linear Flow | How it works, onboarding |
| Filtering/qualifying | Funnel Flow | Lead → hire conversion |
| Central platform | Hub & Spoke | Integration diagrams |
| Multiple workstreams | Parallel Tracks | Complex processes |
| Conditional logic | Decision Tree | Rule explanations |

---

### Step 3: Design Node Style

**Node specifications:**

```
SHAPE: Rounded rectangle (24px radius) or Circle (for simple steps)
SIZE: 80-120px width for rectangles, 60-80px diameter for circles
BACKGROUND: White #FFFFFF
BORDER: 2px Dark Blue #002233
ACTIVE/HIGHLIGHTED: Lime Green #7CFC00 border or fill

ICON INSIDE:
- Size: 32-40px
- Style: Geometric, outline
- Color: Dark Blue #002233 or Lime (if highlighted)

LABEL BELOW:
- Font: Inter Medium (500)
- Size: 14-16px
- Color: Dark Blue #002233
```

**Connector specifications:**

```
LINE:
- Weight: 2-3px
- Color: Dark Blue #002233
- Style: Solid (primary) or Dashed (secondary)

ARROW:
- Size: 8-12px
- Style: Filled triangle or simple chevron
- Color: Same as line

ANIMATION INDICATOR (for active flow):
- Lime Green #7CFC00 pulse or glow
- Animated dots along line (if motion supported)
```

---

### Step 4: Add Context Layers

**Layer 1: Steps/Nodes**
The main process elements.

**Layer 2: Connections**
Lines and arrows showing flow.

**Layer 3: Labels**
Step names and brief descriptions.

**Layer 4: Annotations**
Time indicators, data points, callouts.

**Layer 5: Background**
Subtle grid, light tint, or blueprint texture.

---

### Step 5: Construct Prompt

**Linear Pipeline Prompt:**
```
Process diagram in Uptime Pipeline Blueprint style.

BACKGROUND:
- Color: Light Green #F6FFED
- Subtle grid: 40px squares, 1px lines at Dark Blue 5% opacity

FLOW STRUCTURE:
- [4] steps, flowing left to right
- Horizontal layout with equal spacing

NODES:
Step 1: "[Name]"
- Icon: [Describe icon]
- Status: [Normal / Starting point]

Step 2: "[Name]"
- Icon: [Describe icon]
- Status: [Normal]

Step 3: "[Name]"
- Icon: [Describe icon]
- Status: [HIGHLIGHTED - Lime Green border]

Step 4: "[Name]"
- Icon: [Describe icon]
- Status: [Normal / End point]

NODE STYLE:
- Shape: Rounded rectangle, 100px x 80px
- Background: White #FFFFFF
- Border: 2px Dark Blue #002233
- Highlighted border: 3px Lime Green #7CFC00
- Icons: 36px, geometric outline style

CONNECTORS:
- Lines: 2px Dark Blue #002233
- Arrows: Chevron style, pointing right
- Equal spacing between nodes

LABELS:
- Step names below each node
- Font: Inter Medium 14px
- Color: Dark Blue #002233

ANNOTATIONS:
- Time indicator above flow: "14 days total"
- Badge on highlighted step: "AI-Powered"
- Font: Inter Bold 12px, Lime background

COMPOSITION:
- Centered in frame
- Generous padding (80px minimum)
- Clean, technical, but approachable

Style: Technical schematic, enterprise SaaS quality,
systematic and trustworthy aesthetic.
```

---

### Step 6: Add Data Callouts

**Time indicators:**
```
Above/below flow line:
"Day 1" → "Day 3" → "Day 9" → "Day 14"

Or time spans between steps:
[Step 1] ──2 days──→ [Step 2] ──6 days──→ [Step 3]
```

**Metric callouts:**
```
Floating badges near relevant steps:
- "3x more applicants" near sourcing step
- "85% match rate" near matching step
- "90% retention" near hire step
```

**Comparison indicators:**
```
Small "vs" callouts:
- "9 days vs 84 industry avg"
- Arrow showing improvement
```

---

### Step 7: Generate

```bash
npx tsx tools/generate-uptime-image.ts \
  --style pipeline-blueprint \
  --prompt "[YOUR PROMPT]" \
  --size 1920x1080 \
  --output /path/to/pipeline.png
```

**Recommended dimensions:**
- Wide (16:9): 1920 x 1080 — Full section diagrams
- Standard (3:2): 1200 x 800 — Blog/content diagrams
- Square (1:1): 1200 x 1200 — Social/compact diagrams

---

### Step 8: Validate

**Checklist:**

- [ ] **Clear flow?** Can trace the process in 5 seconds
- [ ] **Logical order?** Steps make sense in sequence
- [ ] **Proper emphasis?** Key step/feature highlighted
- [ ] **Not overcrowded?** Max 6 steps visible at once
- [ ] **On-brand?** Lime accent, dark blue structure, light background
- [ ] **Professional?** Technical but not intimidating
- [ ] **Readable?** Labels clear at display size
- [ ] **Tells the story?** Communicates the "so what"

---

## Example Implementations

### The Uptime Hiring Pipeline (4 Steps)
```
PROMPT:
Process diagram in Uptime Pipeline Blueprint style.

Background: Light Green #F6FFED with subtle 40px grid.

Title: "The Uptime Pipeline" - Inter Bold 32px, Dark Blue, top-left

Flow: 4 steps, left to right, horizontal layout

Step 1: "Source"
- Icon: Multiple arrows pointing inward (aggregation)
- Status: Normal (white bg, dark blue border)
- Sublabel: "Multi-channel applications"

Step 2: "Screen"
- Icon: Filter/funnel shape
- Status: Normal
- Sublabel: "AI qualification"

Step 3: "Match"
- Icon: Puzzle pieces connecting
- Status: HIGHLIGHTED (Lime Green border, subtle lime bg tint)
- Badge above: "AI-Powered" in Lime pill
- Sublabel: "Smart driver-fleet fit"

Step 4: "Hire"
- Icon: Checkmark in circle
- Status: End point (filled dark blue circle indicator)
- Sublabel: "Onboard & retain"

Connectors: 2px Dark Blue lines with arrow heads

Time indicator: Floating above entire flow
"14 days from first application to hired driver"
Inter Medium 14px, Dark Blue

Composition: Centered, 80px padding, clean professional look.
```

### Integration Hub Diagram
```
PROMPT:
Hub and spoke diagram in Uptime Pipeline Blueprint style.

Background: Light Green #F6FFED

Center Hub: "Uptime"
- Shape: Large circle, 120px diameter
- Fill: Lime Green #7CFC00
- Text: "Uptime" in Inter Bold 18px, Dark Blue

Input Spokes (left side):
- "Job Boards" - rectangle node
- "Your Website" - rectangle node
- "Referrals" - rectangle node
Connected by lines flowing INTO hub

Output Spokes (right side):
- "Your ATS" - rectangle node
- "Onboarding" - rectangle node
- "Payroll" - rectangle node
Connected by lines flowing FROM hub

Node Style:
- Rounded rectangles, 80px x 50px
- White background, 2px Dark Blue border
- Inter Medium 12px labels

Connector Style:
- 2px Dark Blue lines
- Arrow heads showing flow direction
- Slight curve for visual appeal

Title: "One system. All your sources. All your tools."
Inter Bold 24px, Dark Blue, bottom center

Clean, systematic, shows Uptime as the central hub.
```

### Onboarding Steps (Vertical)
```
PROMPT:
Vertical step diagram in Uptime Pipeline Blueprint style.

Background: White #FFFFFF

Flow: 5 steps, top to bottom

Step 1: "Sign Up" - Circle node, number "1"
  └─ "Create your Uptime account (2 min)"

Step 2: "Connect" - Circle node, number "2"
  └─ "Link your job boards & ATS (30 min)"

Step 3: "Configure" - Circle node, number "3" [HIGHLIGHTED]
  └─ "Set your driver requirements"

Step 4: "Launch" - Circle node, number "4"
  └─ "Go live with AI matching"

Step 5: "Hire" - Circle node, number "5"
  └─ "Get your first driver (14 days)"

Node Style:
- Circles, 50px diameter
- White fill, 2px Dark Blue border
- Number inside: Inter Bold 18px
- Highlighted: Lime Green border

Vertical connectors:
- 2px Dark Blue lines
- 24px length between nodes

Labels:
- Step name: Inter Bold 16px, Dark Blue
- Description: Inter Regular 14px, Dark Blue 70%
- Right-aligned from node

Time badge on right: "Install in 1 day"
Lime background pill

Professional onboarding flow aesthetic.
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Too many steps | Consolidate to 4-6 max; group sub-steps |
| No clear start/end | Add visual indicators for entry/exit points |
| Confusing flow | Arrows should clearly show direction |
| Everything highlighted | Only highlight 1 key differentiator |
| No context | Add time indicators, metrics, or labels |
| Too technical | Balance schematic with approachable design |
| Cluttered | Generous spacing, clean lines, minimal decoration |
| Generic icons | Use icons that relate to trucking/hiring context |

---

## Pipeline Templates

### The Classic 4-Step
```
[Source] → [Screen] → [Match] → [Hire]
```
Use for: Main "how it works" explanation

### The Before/After Pipeline
```
OLD WAY:                    UPTIME WAY:
[Post] → [Wait] → [Chase]   [Source] → [Match] → [Hire]
   84 days, chaos               14 days, automated
```
Use for: Comparison sections, why switch

### The Integration Map
```
     [Source 1]
          ↓
[Source 2] → [UPTIME] → [Output 1]
          ↓
     [Source 3]
```
Use for: Integration/ecosystem pages

### The Results Pipeline
```
[Input] → [Process] → [Output] → [Result]
  100      →  80%    →   3x    →  90%
applicants   match     faster   retention
```
Use for: Results/ROI sections

---

**Great pipeline diagrams make the system feel inevitable. "Of course it works this way."**
