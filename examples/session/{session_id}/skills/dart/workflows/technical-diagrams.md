# Technical Diagram Workflow

**Technical diagrams using the Klaus color scheme, 3-style system, and Japanese minimalism + Neobrutalism aesthetic.**

Creates **TECHNICAL ARCHITECTURE DIAGRAMS** — using Japanese Precision or Textural Neobrutalism style with boxes, arrows, labels, and annotations using Quattrocento Sans (clean sans) and Sorts Mill Goudy (elegant serif) typeface influences.

---

## Purpose

Technical diagrams explain systems, architectures, processes, and flows. Unlike editorial illustrations (which use abstract metaphors), technical diagrams show **actual structure and relationships**.

**Use this workflow for:**
- System architecture diagrams
- Process flows and pipelines
- Component relationships
- Technical explainers
- Infrastructure maps
- Data flows

---

## Visual Aesthetic: 4-Style System for Technical Diagrams

**Recommended styles:** Lithography (primary) or Ligne Claire

### Style Selection

**Lithography (Recommended for technical content):**
- Fine cross-hatching creates texture and depth
- Old-world, authoritative aesthetic
- Dense linework suggests precision and gravitas
- Archival quality — looks like a classic technical manual

**Ligne Claire (For clarity-focused diagrams):**
- Strong, uniform black outlines
- Flat, vivid colors within shapes
- Clean, architectural precision
- Clear, approachable quality

### Core Characteristics
1. **Style-appropriate linework** — Cross-hatching (Lithography) or uniform outlines (Ligne Claire)
2. **Professional quality** — Looks like high-quality technical illustration
3. **Variable line weight** — Thicker for structure, thinner for annotations
4. **Text is encouraged** — Labels, annotations, component names (unlike editorial)
5. **Typography style** — Concourse geometric sans for labels, Advocate all-caps for titles
6. **Color for meaning** — Strategic use of color to highlight key elements
7. **Clean composition** — Elements well-organized with clear hierarchy

### What This Looks Like
- Boxes with textured edges (Lithography) or clean outlines (Ligne Claire)
- Clear directional arrows
- Clean labels in Concourse style (geometric sans-serif)
- Diagram title in Advocate style (all-caps, bold)
- Annotations and notes
- Strategic color highlights on important elements

---

## Typography System: 3-Tier Functional Hierarchy

**THREE typography tiers based on FUNCTION (WHAT/HOW/WHY):**

### **TIER 1: DIAGRAM TITLE (Advocate Block Display)**
**Function:** WHAT — The big idea, main title

- **Font:** Advocate All-Caps Extra Bold
- **Size:** Massive - 3-4x larger than body text (10-15% of diagram vertical space)
- **Usage:** Single diagram title at top
- **Style:** All-caps, hand-lettered, assertive, commands attention
- **Color:** Black #000000 (or Crab Red #D04040 for extreme emphasis)
- **Example:** "MICROSERVICES ARCHITECTURE" or "DATA PIPELINE FLOW"

**Visual characteristics:**
- Chunky, bold letterforms
- Mid-century sports team aesthetic
- Immediately establishes what this diagram shows

---

### **TIER 2: COMPONENT LABELS (Concourse Sans Regular)**
**Function:** HOW — Structure, components, mechanics

- **Font:** Concourse Geometric Sans-Serif
- **Size:** Medium - standard readable size
- **Usage:** Box labels, node names, structural elements (80% of text uses this)
- **Style:** Mixed case or sentence case, clean, modern, balanced
- **Color:** Black #000000 (or Maastricht Blue for emphasis)
- **Example:** "API Gateway", "User Authentication", "Database Layer"

**Visual characteristics:**
- Clean geometric sans-serif (inspired by 1930s Metro)
- Perfectly readable at diagram scale
- Professional, technical, no-nonsense
- Hand-drawn interpretation with slight wobble

---

### **TIER 3: ANNOTATIONS & INSIGHTS (Advocate Condensed Italic)**
**Function:** WHY — Commentary, insights, Daniel's voice

- **Font:** Advocate style but condensed/narrower AND italicized
- **Size:** Smaller - 60-70% of Tier 2 size
- **Usage:** Annotations, side notes, explanatory commentary, arrow labels
- **Style:** Italicized to indicate "voice", condensed to save space
- **Color:** Crab Red #D04040 or Gold Leaf #D4AF37 (to distinguish from labels)
- **Example:** "*this is the bottleneck*" or "*where things break*"

**Visual characteristics:**
- Italicized hand-lettered style
- Feels like Daniel's handwritten notes on the diagram
- Adds personality and insight beyond structure
- Strategic placement near relevant components

---

### **Typography Hierarchy Visual Map**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         MICROSERVICES ARCHITECTURE              │  ← TIER 1: Advocate Block
│              (Title)                            │     (Massive, all-caps, bold)
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌──────────────┐      ┌──────────────┐      │
│   │ API Gateway  │  →   │  Auth Service│      │  ← TIER 2: Concourse Sans
│   └──────────────┘      └──────────────┘      │     (Medium, clean, labels)
│         ↓                                      │
│    *rate limiting                              │  ← TIER 3: Advocate Italic
│     happens here*                              │     (Small, personality, insight)
│         ↓                                      │
│   ┌──────────────┐                            │
│   │   Database   │                            │  ← TIER 2: Component label
│   └──────────────┘                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### **When to Use Each Tier**

| Element Type | Typography Tier | Rationale |
|--------------|----------------|-----------|
| Diagram title | Tier 1 (Advocate Block) | Establishes context immediately |
| Box/node labels | Tier 2 (Concourse Sans) | Clear functional identification |
| Connection labels | Tier 2 (Concourse Sans) | What flows between components |
| Explanatory notes | Tier 3 (Advocate Italic) | Why this matters, Daniel's insights |
| Warning callouts | Tier 3 (Advocate Italic + Lawn Green) | "*bottleneck*" or "*security issue*" |
| Process steps | Tier 2 (Concourse Sans) | "Step 1:", "Step 2:" |
| Section headers | Tier 1 (Advocate Block, smaller) | "INPUT LAYER", "PROCESSING" |

---

### **Color Coding by Tier**

**Tier 1 (Titles):**
- Default: Black #000000 for authority
- Emphasis: Crab Red #D04040 when title itself is the key insight

**Tier 2 (Labels):**
- Default: Black #000000 for readability
- Emphasis: Black #000000 for primary components

**Tier 3 (Annotations):**
- Default: Crab Red #D04040 for Daniel's voice/insights
- Alternative: Gold Leaf #D4AF37 for technical annotations
- Creates visual distinction from structural labels

---

## Color System for Technical Diagrams

**Same palette, different usage:**

### Structure (Primary)
```
Black #000000 — Main boxes, containers, primary structure
```

### Emphasis & Highlighting
```
Crab Red #D04040 — Key components, important nodes, highlights
Gold Leaf #D4AF37 — Data flows, connections, secondary emphasis
```

### Annotations
```
Black #000000 — Labels, notes, text annotations
```

### Background
```
White #FFFFFF or Klaus Off-White #F0EAD6 — For clarity and readability
```

### Color Strategy
- **Maastricht Blue linework** for all structural elements (boxes, containers)
- **Lawn Green** to highlight 1-3 most important components
- **Tea Green** for data flow arrows or connection emphasis
- **Charcoal** for all text/labels
- Sparingly used — not every element needs color

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Extract Technical Structure

**For blog posts or articles:**
1. Read the content
2. Identify the technical system being explained
3. Extract key components, relationships, and flows
4. List them explicitly

**For direct requests ("draw a diagram of X"):**
1. Clarify the system with the user if needed
2. List components and relationships
3. Confirm structure before proceeding

**Output:**
```
COMPONENTS:
- [Component 1 name and role]
- [Component 2 name and role]
- [Component 3 name and role]

RELATIONSHIPS:
- [How components connect]
- [Data flows or dependencies]
- [Key interactions]

EMPHASIS:
- [1-3 most important elements to highlight in Crab Red]
```

---

### Step 2: Design Diagram Structure

**Layout the diagram logically:**

1. **Determine layout type:**
   - Horizontal flow (left to right)
   - Vertical flow (top to bottom)
   - Centered architecture (hub and spoke)
   - Layered architecture (stack diagram)

2. **Arrange components:**
   - What boxes/nodes are needed
   - How they're positioned relative to each other
   - What arrows/connections show

3. **Plan color usage:**
   - Which 1-3 components get Crab Red highlight
   - Which connections get Gold Leaf emphasis
   - Everything else stays black/charcoal

**Output:**
```
LAYOUT: [Horizontal flow / Vertical flow / Centered / Layered]

DIAGRAM STRUCTURE:
[Describe the arrangement in words, like:
"Top: User box. Middle: Three service boxes (API, Database, Cache) with API in Crab Red. 
Bottom: Storage layer. Arrows showing request flow in Gold Leaf from User → API → Database."]

COLOR HIGHLIGHTS:
- Lawn Green: [Component name]
- Tea Green: [Connection/flow description]
```

---

### Step 3: Construct Prompt with UltraThink

**Use extended thinking to create the technical diagram prompt.**

### Prompt Template

```
Hand-drawn technical diagram in engineering notebook / drafting sketch style.

STYLE REFERENCE: Engineering sketch, technical blueprint draft, smart person's notebook drawing

BACKGROUND: [White #FFFFFF OR Klaus Off-White #F0EAD6] — clean, flat, no texture

AESTHETIC:
- Hand-drawn imperfect lines (slightly wobbly, human quality)
- Variable stroke weight (thicker for boxes/structure, thinner for details)
- Boxes and containers with slightly wavy edges (not perfect rectangles)
- Arrows with human imperfection (not perfectly straight)
- Grid-aware layout but hand-drawn (roughly aligned but organic)
- Blueprint/drafting quality — intentional but sketched

DIAGRAM LAYOUT: [Horizontal flow / Vertical stack / Hub-and-spoke / etc.]

COMPONENTS TO DRAW:
[List each box/node with labels, e.g.:]
- [Component 1 name] — Maastricht Blue outlined box, hand-lettered label
- [Component 2 name] — Lawn Green (#7CFC00) outlined box with Crab Red label (KEY COMPONENT)
- [Component 3 name] — Maastricht Blue outlined box

CONNECTIONS:
[Describe arrows and flows, e.g.:]
- Arrow from [A] to [B] — Tea Green (#D7FEB2) with hand-drawn quality
- Dotted line from [C] to [D] — Maastricht Blue, imperfect dots
- Bidirectional arrow between [E] and [F] — Maastricht Blue

TYPOGRAPHY SYSTEM (3-TIER FUNCTIONAL HIERARCHY):

TIER 1 - DIAGRAM TITLE (Advocate Block Display):
- "[DIAGRAM TITLE IN ALL-CAPS]" — Massive bold all-caps at top
- Font: Advocate style, extra bold, hand-lettered, assertive
- Size: 3-4x larger than body text (10-15% of diagram height)
- Color: Black #000000 (or Crab Red #D04040 for emphasis)
- Function: Establishes WHAT this diagram shows
- Example: "DATA PIPELINE ARCHITECTURE"

TIER 2 - COMPONENT LABELS (Concourse Sans Regular):
- "[Component Name]", "[Node Label]", "[Box Title]"
- Font: Concourse geometric sans-serif, clean, modern, balanced
- Size: Medium readable size (standard body text)
- Color: Black #000000 (or Maastricht Blue for primary components)
- Function: Identifies HOW the system works (structure, mechanics)
- Example: "API Gateway", "Authentication Service", "Database"

TIER 3 - ANNOTATIONS & INSIGHTS (Advocate Condensed Italic):
- "*this is the bottleneck*", "*where scaling breaks*"
- Font: Advocate style but condensed and italicized
- Size: 60-70% of Tier 2 (smaller, supportive)
- Color: Crab Red #D04040 (Daniel's voice) or Gold Leaf #D4AF37 (technical notes)
- Function: Explains WHY things matter (insights, commentary)
- Example: "*rate limiting happens here*", "*security vulnerability*"

All typography hand-lettered interpretation with slight imperfection

COLOR USAGE:
- Maastricht Blue (#002233) for all primary structure and most elements
- Lawn Green (#7CFC00) for [1-3 key components] — outlines and labels
- Tea Green (#D7FEB2) for [specific flows/connections]
- Charcoal (#2D2D2D) for all text and annotations

CRITICAL REQUIREMENTS:
- Hand-drawn sketch quality — NOT polished vector graphics
- Lines should wobble slightly (human imperfection)
- Text must be readable but hand-lettered style
- Typography: Advocate all-caps for title, Concourse geometric sans for labels (hand-drawn interpretation)
- Boxes not perfectly aligned (roughly grid-aware)
- No gradients, no shadows, flat colors only
- Blueprint/engineering notebook aesthetic
- Strategic color use (not everything colored, mostly black with Crab Red/Gold Leaf highlights)

```

---

### Step 4: Determine Aspect Ratio

**Choose based on diagram type:**

| Diagram Type | Aspect Ratio | Reasoning |
|--------------|--------------|-----------|
| Horizontal flow | 16:9 or 21:9 | Wide for left-to-right progression |
| Vertical flow | 9:16 or 1:1 | Tall or square for top-to-bottom |
| Centered architecture | 1:1 | Square for hub-and-spoke or centered |
| Layered stack | 16:9 or 1:1 | Wide or square for layer visualization |
| Complex system | 1:1 or 4:3 | Square or slight rectangle for balance |

**Default: 1:1 (square)** — Works for most technical diagrams

---

### Step 5: Execute Generation

```bash
npx tsx ~/.claude/skills/art/tools/generate-ulart-image.ts \
  --model nano-banana-pro \
  --prompt "[YOUR PROMPT]" \
  --size 2K \
  --aspect-ratio [1:1 or 16:9 or other] \
  --output /path/to/technical-diagram.png
```

### Model Recommendations

| Model | Best For | Command |
|-------|----------|---------|
| **nano-banana-pro** | Technical diagrams with text | `--model nano-banana-pro` (DEFAULT) |
| **flux** | Maximum quality, complex diagrams | `--model flux` |
| **gpt-image-1** | Simpler diagrams, different style | `--model gpt-image-1` |

**Note:** Unlike editorial illustrations, do NOT use `--remove-bg` — technical diagrams need visible background for clarity.

### Immediately Open

```bash
open /path/to/technical-diagram.png
```

---

### Step 6: Validation (MANDATORY)

**🚨 CRITICAL: Validate the diagram before declaring completion.**

Open the generated image and check ALL criteria:

#### Must Have (ALL REQUIRED)
- [ ] **Hand-drawn quality** — Lines wobble, boxes imperfect, human feel
- [ ] **Readable text** — Labels and annotations are legible
- [ ] **Clear structure** — Diagram shows intended relationships
- [ ] **Strategic color use** — Lawn Green on 1-3 key elements, Gold Leaf on flows (not everything colored)
- [ ] **Maastricht Blue as primary** — Most elements in black, color is accent
- [ ] **Flat background** — White or cream, no gradients
- [ ] **Blueprint aesthetic** — Looks like engineering sketch, not polished diagram
- [ ] **Technical clarity** — Actually explains the system (not just pretty)

#### Must NOT Have (ALL FORBIDDEN)
- [ ] Perfect straight lines or boxes
- [ ] Polished vector graphic look
- [ ] Gradients or shadows
- [ ] Glossy or 3D effects
- [ ] Illegible text
- [ ] Over-use of color (everything Crab Red/Gold Leaf)
- [ ] Too messy to understand

#### If Validation Fails — REGENERATE

| Problem | Fix |
|---------|-----|
| Lines too perfect | Emphasize "wobbly imperfect hand-drawn lines, human sketch quality" |
| Text unreadable | Add "clear hand-lettered labels, legible text" |
| Too polished/vector | Strengthen "engineering notebook sketch, NOT polished vector graphics" |
| Wrong colors | Restate color requirements with specific hex codes and usage |
| Too messy | Simplify diagram, fewer components, clearer layout |
| Too much color | "Strategic color use — MOST elements black, Crab Red only on [specific], Gold Leaf only on [specific]" |
| Looks like AI diagram | Reference "blueprint draft, technical sketch, hand-drawn engineering diagram" |

**Regeneration Process:**
1. Identify failure points
2. Update prompt with specific fixes
3. Regenerate with adjusted prompt
4. Revalidate
5. Repeat until all criteria pass

---

## Quick Reference

### Key Differences from Editorial Workflow

| Editorial Illustrations | Technical Diagrams |
|------------------------|-------------------|
| Abstract metaphors | Actual structure |
| No text | Text encouraged |
| Physical objects/actions | Boxes, arrows, flows |
| 24-item CSE required | Extract components/relationships |
| Square format default | Flexible aspect ratio |
| Background removal | Keep background |
| Narrative journey | System explanation |

### The Technical Diagram Formula

```
1. Extract components and relationships
2. Design diagram structure and layout
3. Plan strategic color usage (Crab Red for key, Gold Leaf for flow, black for structure)
4. Construct prompt with hand-drawn drafting aesthetic
5. Choose appropriate aspect ratio
6. Generate and validate
7. Regenerate if needed until validation passes
```

### Color Strategy

- **80% Maastricht Blue** — All primary structure
- **10% Lawn Green** — 1-3 most important components
- **5% Tea Green** — Key flows or connections
- **5% Charcoal** — Text and annotations

---

## Example Scenarios

### Example 1: MCP Architecture
**Components:** Client app, MCP server, LLM, Resources
**Layout:** Horizontal flow
**Color:** Lawn Green on MCP server (key component), Tea Green on connection arrows
**Aspect:** 16:9 (horizontal flow)

### Example 2: Data Pipeline
**Components:** Source, Transform, Load, Storage
**Layout:** Vertical flow with stages
**Color:** Lawn Green on Transform stage, Tea Green on data flow arrows
**Aspect:** 9:16 (vertical)

### Example 3: System Architecture
**Components:** User, API Gateway, Services, Database
**Layout:** Layered architecture
**Color:** Lawn Green on API Gateway, Tea Green on request flow
**Aspect:** 1:1 (square, balanced)

---

**The workflow: Extract Structure → Design Layout → Construct Prompt → Generate → VALIDATE → Complete**
