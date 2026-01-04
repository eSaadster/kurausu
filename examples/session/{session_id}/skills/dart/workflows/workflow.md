# Klaus Art Image Generation Workflow

**Single consolidated workflow for creating editorial illustrations using the Klaus 3-style system.**

Creates **ONE ABSTRACT VISUAL METAPHOR** using one of three Klaus styles: Sumi-e Ink, Japanese Precision, or Textural Neobrutalism.

---

## 🚨 MANDATORY STEPS — EXECUTE IN ORDER

**CRITICAL: ALL 6 STEPS ARE MANDATORY. Execute them IN ORDER. Do NOT skip steps. Do NOT improvise your own process.**

**VIOLATION:** If you skip Step 1 (CSE) and derive concepts yourself, you are violating this workflow.

```
INPUT CONTENT
     ↓
[1] CSE: Run /cse command to extract core thesis ← MANDATORY, DO NOT SKIP
     ↓
[2] CONCEPT: Derive visual metaphor from FULL narrative arc ← MANDATORY
     ↓
[3] STYLE: Select from 3 Klaus styles based on content mood
     ↓
[4] PROMPT: Construct with style-specific template
     ↓
[5] GENERATE: Execute CLI tool
     ↓
[6] VALIDATE: Style consistent? Crab Red visible? Concept clear?
```

---

## Step 1: Run 24-Item Story Explanation — MANDATORY

**Use the story-explanation skill to extract the FULL narrative arc.**

Invoke the story-explanation skill directly and request **24-item length**:

```
Use story-explanation skill with 24-item length for [URL or content]
```

This produces a 24-item numbered story explanation that captures the complete narrative journey: setup, tension, transformation, resolution.

**Why 24 items (not 8):**
- Captures the FULL story arc, not just the conclusion
- Shows transformation/process/journey
- Provides rich texture for visual metaphor derivation
- Editorial illustration should show STORY, not just endpoint

**Output:** 24-item story explanation with the complete narrative arc.

---

## Step 2: Derive Visual Concept from FULL NARRATIVE ARC — MANDATORY

**From the 24-item story explanation, use ALL items to construct a composition that captures the journey.**

**DO NOT derive concepts without running 24-item story explanation first. The concept MUST come from the FULL narrative arc (all 24 items).**

### The Key Question

Look at your 24-item story explanation and ask: **What single composition captures the TRANSFORMATION/JOURNEY/PROCESS?**

**Not just the endpoint - show the ARC:**
- What changes from beginning to end?
- What's the core tension or transformation?
- Can you show MOVEMENT or PROGRESSION?
- What visual metaphor captures the FULL story?

### Physical Conceptual Metaphors Showing JOURNEY

**CRITICAL REQUIREMENT: Concepts MUST use PHYSICAL RECOGNIZABLE objects and actions.**

The concept should be describable in ONE sentence with 2-3 PHYSICAL elements that show TRANSFORMATION:

✅ **GOOD (Physical/Recognizable):**
- "Crab claw emerging from ink mist" (physical: claw, mist; action: emerging) — Sumi-e
- "Clean geometric boxes connected by precise lines" (physical: boxes, lines; action: connecting) — Japanese Precision
- "Dense cross-hatched layers revealing hidden form" (physical: layers, form; action: revealing) — Neobrutalism
- "Brush stroke cutting through chaos to reveal clarity" (physical: stroke, chaos; action: cutting) — Sumi-e

❌ **BAD (Abstract/Geometric):**
- "A timeline: dense circles → sparse → dense again" (abstract shapes, no recognizable objects)
- "Flowing geometric transformation from chaos to order" (conceptual diagram, not physical scene)
- "Abstract shapes representing data flow" (requires explanation, not instantly readable)

### How to Derive Concept from 24 Items

1. **Read ALL 24 items** — Understand the complete narrative arc
2. **Identify the transformation** — What changes? What's the journey?
3. **Find a PHYSICAL metaphor that shows PROCESS** — Use recognizable objects/actions, NOT abstract shapes
4. **Apply "Instant Picture Test"** — Can you close your eyes and picture this like a photograph?
5. **Reduce to 2-3 PHYSICAL elements** — Brush strokes, hands, crab claws, etc. (NOT circles, rectangles, flowing lines)
6. **Ensure it's immediately readable** — No explanation needed, viewer instantly gets it

**Key insight:** Use the RICHNESS of all 24 items to inform a composition that shows JOURNEY through PHYSICAL OBJECTS AND ACTIONS, not abstract geometric representations.

**MANDATORY VALIDATION before proceeding:**
- [ ] Uses recognizable physical objects (brush strokes, hands, crab elements, etc.) ✅
- [ ] Shows clear action (emerging, cutting, connecting, revealing) ✅
- [ ] Passes "Instant Picture Test" - can picture it like a photograph ✅
- [ ] Does NOT use abstract shapes (circles, flowing lines, geometric forms) ❌
- [ ] Does NOT require explanation ("this represents...") ❌

**Output:** ONE sentence describing 2-3 PHYSICAL elements with CLEAR ACTION that capture the narrative ARC.

---

## Step 3: Select Klaus Style and Apply Aesthetic

**Choose the optimal Klaus style for your content, then apply style-specific aesthetic rules.**

### Klaus Design Philosophy

**Japanese minimalism + Neobrutalism** — zen negative space, expressive brush work, bold borders, premium warmth

### The 3 Klaus Styles — Select ONE

| Style | Best For | Key Characteristics |
|-------|----------|---------------------|
| **Sumi-e Ink** | Abstract concepts, emotional themes, zen metaphors, philosophical content | Expressive brush strokes, extensive ma (間) negative space, ink wash gradients, organic flowing lines |
| **Japanese Precision** | Technical diagrams, clear explanations, structured content, tutorials | Clean uniform outlines, flat colors, no gradients, woodblock print influence (ukiyo-e) |
| **Textural Neobrutalism** | Premium feel, archival content, gravitas, authority, dense information | Fine cross-hatching, bold 3px borders, high contrast, old-world meets modern brutalism |

### Style Selection Questions

Ask yourself:
1. **What's the emotional tone?** (Zen/philosophical → Sumi-e, Clear/instructional → Japanese Precision, Authoritative → Neobrutalism)
2. **How complex is the information?** (Dense → Neobrutalism, Clear/simple → Japanese Precision, Abstract → Sumi-e)
3. **Is there zen/minimalist quality?** (Yes → Sumi-e)
4. **Does it need gravitas/premium feel?** (Yes → Neobrutalism)

### Color System (All Klaus Styles)

**Background:** Klaus Off-White #F0EAD6 (washi paper feel) or WHITE #FFFFFF for transparency removal

**Primary Palette (Required):**
| Color | Hex | Usage |
|-------|-----|-------|
| Black | #000000 | Primary linework, brush strokes |
| Crab Red | #D04040 | Brand accent - REQUIRED and VISIBLE (hanko seal style) |
| Gold Leaf | #D4AF37 | Premium secondary accent |
| Seal Red | #A62C2C | Tertiary depth accent |

**Secondary Palette (Style-specific):**
| Color | Hex | Style |
|-------|-----|-------|
| Ink Gray | #4A4A4A | Sumi-e (ink wash mid-tones) |
| Light Ink | #8A8A8A | Sumi-e (pale washes) |
| Deep Black | #1A1A1A | All styles (rich emphasis) |

### Map Your Concept

```
CONCEPT: [Your concept from Step 2]
STYLE: [Sumi-e Ink | Japanese Precision | Textural Neobrutalism]
BACKGROUND: Klaus Off-White (#F0EAD6)
ELEMENTS: [2-4 elements with intentional spacing]
LINEWORK: [Brush strokes | Clean outlines | Cross-hatching]
```

**Output:** Your concept with selected Klaus style and color mapping.

---

## Step 3.5: MANDATORY VALIDATION CHECKPOINT

**STOP. Before constructing the prompt, validate your concept:**

Run through this checklist. If ANY check fails, go back to Step 2 and redesign the concept.

✅ **Physical Object Check:**
- [ ] My concept uses recognizable physical objects (brush strokes, hands, crab elements, mountains, etc.)
- [ ] I am NOT using abstract shapes (circles, rectangles, geometric forms, flowing lines)

✅ **Instant Picture Test:**
- [ ] I can close my eyes and picture this scene like a photograph
- [ ] Someone else could draw this from my one-sentence description without further explanation

✅ **Action Check:**
- [ ] My concept shows a clear physical action (emerging, cutting, connecting, revealing, reaching)
- [ ] The action is visible and dynamic

✅ **Readability Check:**
- [ ] The metaphor is immediately readable without explanation
- [ ] I don't need to say "this represents..." to explain what it means

**If all checks pass:** Proceed to Step 4
**If any check fails:** Return to Step 2 and find a PHYSICAL metaphor

---

## Step 4: Construct the Prompt Using Klaus Style Template

**Select the appropriate template based on your chosen Klaus style.**

### Sumi-e Ink Template (Japanese Ink Painting)
```
Editorial illustration in SUMI-E Japanese ink painting style.

BACKGROUND: Warm off-white (#F0EAD6) — washi paper texture feel.

STYLE: Expressive black ink brush strokes with varying thickness.
Hajime (beginning) strokes thick and loaded with ink.
Owari (ending) strokes taper to fine points.
Extensive MA (間) - intentional negative space.
Zen minimalism: suggest rather than detail.
Ink wash gradients from deep black to subtle gray where appropriate.
Organic, flowing linework (NOT geometric).

COLORS:
- Black (#000000) for all brush strokes and linework
- Crab Red (#D04040) as HANKO SEAL ACCENT (like artist's stamp) - MUST BE VISIBLE
- Gold Leaf (#D4AF37) for subtle premium touches
- Warm off-white (#F0EAD6) background

COMPOSITION: High negative space, zen balance, asymmetric
[Describe concept with expressive brush stroke elements]

NO text anywhere (except hanko seal accent if applicable).
```

### Japanese Precision Template (Ligne Claire meets Ukiyo-e)
```
Editorial illustration in JAPANESE PRECISION style (Ligne Claire meets Ukiyo-e).

BACKGROUND: Warm off-white (#F0EAD6) — clean, crisp.

STYLE: Clean, uniform black outlines. Flat colors within outlines.
NO gradients. Architectural precision with Japanese aesthetic.
High negative space (zen-like emptiness). Woodblock print influence.
Bold, graphic composition.

COLORS:
- Black (#000000) for all outlines (uniform weight)
- Crab Red (#D04040) as flat fill accent - MUST BE VISIBLE
- Gold Leaf (#D4AF37) as secondary flat fill
- Warm off-white (#F0EAD6) background

COMPOSITION: Clean, architectural, balanced with zen emptiness
[Describe concept with clear, defined shapes]

NO gradients. NO soft edges. Clean flat colors only.
NO text anywhere.
```

### Textural Neobrutalism Template
```
Editorial illustration in TEXTURAL NEOBRUTALISM style.

BACKGROUND: Warm off-white (#F0EAD6) — archival, premium feel.

STYLE: Fine cross-hatching creates tone and texture. Dense black linework.
Strong 3px borders on major elements (neobrutalist).
High contrast black on warm cream. Old-world engraving meets modern brutalism.
Highly textural, almost tactile quality.

COLORS:
- Black (#000000) for all cross-hatching and linework
- Crab Red (#D04040) as accent - MUST BE VISIBLE
- Gold Leaf (#D4AF37) for warm premium tones
- Seal Red (#A62C2C) for depth

COMPOSITION: Detailed, textural, bold borders, high contrast
[Describe concept with fine detail emphasis]

NO text anywhere.
```

**IMPORTANT:** Always use `--remove-bg` flag to create transparency.

### Prompt Quality Check

Before generating, verify:
- [ ] ONE composition, not multiple panels
- [ ] Style-appropriate element count (2-4 with intentional spacing)
- [ ] Klaus style template correctly applied
- [ ] Crab Red (#D04040) explicitly required as VISIBLE hanko accent
- [ ] Style-specific color instructions included
- [ ] SPECIFIC to this content (couldn't be about something else)

**Output:** A complete Klaus style-specific prompt ready for generation.

---

## Step 5: Execute the Generation

### Default Model: nano-banana-pro

```bash
npx tsx ~/.claude/skills/dart/tools/generate-ulart-image.ts \
  --model nano-banana-pro \
  --prompt "[YOUR PROMPT]" \
  --size 2K \
  --aspect-ratio 1:1 \
  --output /path/to/output.png
```

### Alternative Models

| Model | Command | When to Use |
|-------|---------|-------------|
| **flux** | `--model flux --size 1:1` | Maximum quality |
| **gpt-image-1** | `--model gpt-image-1 --size 1024x1024` | Different interpretation |

### Immediately Open

```bash
open /path/to/output.png
```

---

## Step 6: Validation (MANDATORY - DO NOT SKIP)

**🚨 CRITICAL: This step is MANDATORY. You MUST validate the image and regenerate if validation fails. DO NOT declare completion without passing validation.**

### Validation Procedure

1. **Open the generated image** for visual inspection:
```bash
open /path/to/generated-image.png
```

2. **Check ALL criteria below** - If ANY fail, you MUST regenerate

3. **Do NOT proceed** to next steps until validation passes

### Must Have (ALL REQUIRED — All Klaus Styles)
- [ ] **Style consistency** — Chosen Klaus style is maintained throughout (no mixing)
- [ ] **Black linework present** — Primary structural linework uses black (#000000)
- [ ] **Abstract metaphor** — Conceptual, not literal representation
- [ ] **Square aspect ratio** — 1:1 format (NOT 16:9 rectangle)
- [ ] **🦀 CRAB RED VISIBLE (CRITICAL)** — Brand color MUST be visible and noticeable
  - Use as HANKO SEAL ACCENT (Japanese artist's stamp style)
  - NOT microscopic hints - should be immediately apparent
  - If you need to zoom in to see color, it's TOO SUBTLE
  - Color should be visible at normal viewing distance

### Style-Specific Validation

**Sumi-e Ink:**
- [ ] Expressive brush strokes with varying thickness visible
- [ ] Extensive negative space (ma 間) — 50-70% of composition
- [ ] Ink wash gradients where appropriate (deep black → subtle gray)
- [ ] Organic, flowing linework (NOT geometric)
- [ ] Crab Red as hanko seal accent

**Japanese Precision:**
- [ ] Uniform outline weight throughout
- [ ] Flat, solid colors within shapes
- [ ] NO gradients anywhere
- [ ] Clean, finished quality with woodblock influence
- [ ] High negative space (zen emptiness)

**Textural Neobrutalism:**
- [ ] Cross-hatching creates tonal variation
- [ ] Fine linework detail visible
- [ ] Bold 3px borders on major elements
- [ ] Premium/archival feel
- [ ] High contrast black on warm cream

### Must NOT Have (ALL FORBIDDEN — All Klaus Styles)
- [ ] Generic digital illustration aesthetic
- [ ] "AI slop" look (too perfect, too shiny)
- [ ] Style mixing (elements from different styles)
- [ ] Photorealistic elements
- [ ] Missing brand colors (no Crab Red visible)
- [ ] Gradients in Japanese Precision or Neobrutalism styles (only Sumi-e ink washes allowed)
- [ ] Cluttered compositions that violate ma (間) principle (except Neobrutalism allows more density)

### If Validation Fails - REGENERATION REQUIRED

**DO NOT SKIP THIS STEP. If validation fails, you MUST regenerate.**

Common failures and fixes:

| Problem | Fix |
|---------|-----|
| **Not enough Crab Red** | Strengthen: "Crab Red #D04040 must be VISIBLE as HANKO SEAL ACCENT - at least 5-10% of composition" |
| Style inconsistent | Emphasize style name more strongly, add more style-specific keywords |
| Looks like generic AI | Add specific style references: "sumi-e Japanese ink painting" or "woodblock ukiyo-e" |
| Too smooth/digital | For Neobrutalism: add "cross-hatching texture"; For Sumi-e: add "expressive brush strokes" |
| Wrong linework | Specify: "uniform weight outlines" (Japanese Precision) or "variable brush strokes" (Sumi-e) |
| Not enough negative space | Add "extensive MA (間) - intentional empty space" for Sumi-e and Japanese Precision |

**Regeneration Process:**
1. Identify which validation criteria failed
2. Update prompt with specific fixes from table above
3. Regenerate using same command with adjusted prompt
4. Open new image and re-validate
5. Repeat until ALL validation criteria pass
6. Only then proceed to completion

**CRITICAL: You are NOT done until validation passes. Declaring completion without validation is a failure.**

---

## Quick Reference

### The Key Insight

**24-ITEM STORY → NARRATIVE ARC → KLAUS STYLE SELECTION → VISUAL METAPHOR → GENERATE**

1. Run 24-item story explanation to get FULL narrative arc
2. Use ALL 24 items to understand transformation/journey/process
3. Select Klaus style based on content mood (Sumi-e Ink / Japanese Precision / Textural Neobrutalism)
4. Find ONE visual metaphor with PHYSICAL elements that shows the ARC
5. Generate using Klaus style-specific template

Bad: "Detailed illustration of a complex scene with multiple characters"
Good: "Crab claw emerging from ink mist" (shows emergence) — Sumi-e Ink
Good: "Clean connected boxes revealing structure" (shows clarity) — Japanese Precision
Good: "Dense cross-hatched layers with bold borders" (shows depth) — Textural Neobrutalism

### Klaus Style Quick Guide

| Style | Linework | Colors | Negative Space |
|-------|----------|--------|----------------|
| **Sumi-e Ink** | Expressive brush strokes, varying thickness | Black + ink washes, Crab Red hanko | High (50-70%) |
| **Japanese Precision** | Uniform weight, clean | Black outlines, flat Crab Red/Gold fills | High (40-60%) |
| **Textural Neobrutalism** | Fine cross-hatching, 3px borders | Black + Gold Leaf warmth, Crab Red accent | Moderate (25-40%) |

### Models

| Model | Command | Best For |
|-------|---------|----------|
| **nano-banana-pro** (DEFAULT) | `--model nano-banana-pro --size 2K --aspect-ratio 1:1` | High quality, good adherence |
| **flux** | `--model flux --size 1:1` | Maximum quality, slower |
| **gpt-image-1** | `--model gpt-image-1 --size 1024x1024` | Alternative interpretation |

### Final Checklist (All Klaus Styles)

Before submitting any image:
- ✅ Klaus style is consistent throughout (no mixing)
- ✅ Black linework anchors the composition
- ✅ Abstract conceptual metaphor (physical elements showing transformation)
- ✅ Square 1:1 aspect ratio
- ✅ Style-appropriate composition density and negative space
- ✅ **CRAB RED VISIBLE** — Brand color must be noticeable as hanko seal accent (not microscopic)
- ✅ No generic AI/stock photo aesthetic

---

**The workflow: CSE → Concept → Klaus Style Selection → Style Template → Generate → VALIDATE (MANDATORY) → Regenerate if needed → Complete**
