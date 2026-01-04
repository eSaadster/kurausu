# Orchestrate Workflow

**Master orchestration that chains content creation → style selection → visual generation.**

---

## Purpose

This is the **primary entry point** for creating complete Uptime visuals. It mirrors the original blended-art pattern: analyze the need, generate the narrative/content first, select the appropriate visual style, then produce the final visual with embedded content.

**Use this workflow when:**
- You need both content AND visual created together
- You're not sure which style to use
- You want the full content-to-visual pipeline

---

## The Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. ANALYZE REQUEST                                             │
│     ↓                                                           │
│  2. SELECT CONTENT WORKFLOW → Generate narrative/copy           │
│     ↓                                                           │
│  3. SELECT VISUAL STYLE → Based on content type                 │
│     ↓                                                           │
│  4. SELECT VISUAL WORKFLOW → Based on output format             │
│     ↓                                                           │
│  5. GENERATE VISUAL → With embedded content                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 MANDATORY ORCHESTRATION STEPS

### Step 1: Analyze the Request

**Classify the request:**

```
REQUEST TYPE:
□ Hero/Landing Page Visual
□ Feature Explanation
□ Data/Metric Display
□ Process/Flow Diagram
□ Comparison Visual
□ Blog/Content Header
□ Social Media Graphic
□ Testimonial/Quote
□ Product Screenshot
□ Driver/Human Story

CONTENT NEEDS:
□ Headline/Value Prop needed
□ Data claim needed
□ Feature narrative needed
□ Full copy block needed
□ Quote/testimonial text
□ CTA text needed
□ Content already provided

OUTPUT FORMAT:
□ Static image
□ Multiple sizes (social set)
□ Series/carousel
□ Single graphic
```

---

### Step 2: Route to Content Workflow

**Based on content needs, invoke the appropriate content workflow FIRST:**

| Content Need | Content Workflow | Output |
|--------------|------------------|--------|
| Headline/value prop | `../uptime-content-engine/workflows/problem-solution.md` | Headline + subhead + proof |
| Statistic/metric | `../uptime-content-engine/workflows/data-claims.md` | Number + context + implication |
| Feature description | `../uptime-content-engine/workflows/feature-narratives.md` | Benefit headline + description |
| Blog header copy | `../uptime-content-engine/workflows/blog-content.md` | Title + hook |
| Social copy | `../uptime-content-engine/workflows/social-snippets.md` | Platform-optimized text |
| Email content | `../uptime-content-engine/workflows/email-copy.md` | Subject + body |
| Button/CTA text | `../uptime-content-engine/workflows/cta-arsenal.md` | Primary + secondary CTAs |

**Execute content workflow and capture output before proceeding.**

---

### Step 3: Select Visual Style

**Based on request type and content, select the appropriate visual style:**

```
DECISION MATRIX:

┌──────────────────────────┬─────────────────────────┐
│ Request Type             │ Recommended Style       │
├──────────────────────────┼─────────────────────────┤
│ Hero with photography    │ Industrial Editorial    │
│ Hero abstract/concept    │ Fleet Geometric         │
│ Feature illustration     │ Fleet Geometric         │
│ Metric/statistic         │ Data Dashboard          │
│ Process/flow             │ Pipeline Blueprint      │
│ Before/after             │ Data Dashboard          │
│ Blog header (technical)  │ Fleet Geometric         │
│ Blog header (story)      │ Industrial Editorial    │
│ Social data card         │ Data Dashboard          │
│ Social quote             │ Fleet Geometric         │
│ Testimonial              │ Industrial Editorial    │
│ Dashboard preview        │ Data Dashboard (UI)     │
│ Driver portrait          │ Industrial Editorial    │
└──────────────────────────┴─────────────────────────┘
```

**Style characteristics reminder:**

| Style | Best For | Feel |
|-------|----------|------|
| **Fleet Geometric** | Abstract concepts, features, icons | Systematic, clean, modern |
| **Industrial Editorial** | Photography, human stories, authenticity | Editorial, bold, real |
| **Data Dashboard** | Numbers, metrics, comparisons | Metronic, enterprise, data-driven |
| **Pipeline Blueprint** | Processes, flows, technical diagrams | Schematic, trustworthy |

---

### Step 4: Select Visual Workflow

**Based on output format needed:**

| Output Type | Visual Workflow |
|-------------|-----------------|
| Landing page hero | `workflows/hero-compositions.md` |
| Feature card | `workflows/feature-illustrations.md` |
| Metric display | `workflows/metric-cards.md` |
| Process diagram | `workflows/pipeline-diagrams.md` |
| Before/after | `workflows/comparison-charts.md` |
| Blog image | `workflows/blog-headers.md` |
| Social graphic | `workflows/social-cards.md` |
| Customer quote | `workflows/testimonial-cards.md` |
| App screenshot | `workflows/dashboard-previews.md` |
| Driver image | `workflows/driver-portraits.md` |

---

### Step 5: Execute Visual Generation

**Combine content output + visual workflow:**

1. Take the content generated in Step 2
2. Apply the style selected in Step 3
3. Follow the visual workflow from Step 4
4. Integrate content into visual prompt

**Final prompt structure:**
```
[VISUAL WORKFLOW TEMPLATE]
+
[STYLE SYSTEM PROMPT]
+
[CONTENT FROM CONTENT WORKFLOW]
=
[FINAL GENERATION PROMPT]
```

---

## Orchestration Examples

### Example 1: Hero Section Visual

**Request:** "Create a hero visual for the homepage"

**Step 1 - Analyze:**
- Type: Hero/Landing Page Visual
- Content needs: Headline + value prop
- Output: Static hero image

**Step 2 - Content Workflow:**
→ Invoke `problem-solution.md`
→ Output:
```
Headline: "Your fleet runs on systems. Except hiring. That's the problem."
Subhead: "Uptime is the CDL Hiring OS you should have had all along."
Proof: "14-day driver delivery. Guaranteed."
```

**Step 3 - Style Selection:**
→ Hero with abstract concept = **Fleet Geometric**

**Step 4 - Visual Workflow:**
→ `hero-compositions.md` (Fleet Geometric variant)

**Step 5 - Generate:**
```
Hero composition in Uptime Fleet Geometric style.

DIMENSIONS: 1920 x 1080px

CONCEPT: Systematic hiring pipeline - geometric representation of
organized flow vs chaos

CONTENT TO INTEGRATE:
- Headline: "Your fleet runs on systems. Except hiring. That's the problem."
- Subhead: "Uptime is the CDL Hiring OS you should have had all along."
- Proof badge: "14-day delivery"

[Continue with hero-compositions.md template...]
```

---

### Example 2: Metric Card for Social

**Request:** "Create a LinkedIn graphic showing our speed metric"

**Step 1 - Analyze:**
- Type: Data/Metric Display + Social Media
- Content needs: Data claim
- Output: LinkedIn-sized graphic (1200x628)

**Step 2 - Content Workflow:**
→ Invoke `data-claims.md`
→ Output:
```
Number: 14
Unit: days
Context: to first driver
Implication: Not 84 days. Not months of waiting. 14 days.
```

**Step 3 - Style Selection:**
→ Metric for social = **Data Dashboard**

**Step 4 - Visual Workflow:**
→ `social-cards.md` (Data Callout variant)

**Step 5 - Generate:**
```
Social media card in Uptime Data Dashboard style.

DIMENSIONS: 1200 x 628px (LinkedIn)

METRIC CONTENT:
- Number: "14"
- Unit: "days"
- Description: "to first driver"
- Context: "Not 84. Not months. 14 days."

[Continue with social-cards.md template...]
```

---

### Example 3: Blog Header

**Request:** "Create a blog header for an article about hidden hiring costs"

**Step 1 - Analyze:**
- Type: Blog/Content Header
- Content needs: Blog title analysis, visual concept
- Output: Blog header (1600x800)

**Step 2 - Content Workflow:**
→ Invoke `blog-content.md` (just for title/concept analysis)
→ Output:
```
Title: "Why Your Cost-Per-Hire Metric Is Lying to You"
Core concept: Hidden costs, beneath the surface
Visual metaphor: Iceberg (visible vs hidden costs)
Tone: Provocative, challenging assumptions
```

**Step 3 - Style Selection:**
→ Technical/analytical blog = **Fleet Geometric**

**Step 4 - Visual Workflow:**
→ `blog-headers.md` (Conceptual Abstract variant)

**Step 5 - Generate:**
```
Blog header in Uptime Fleet Geometric style.

DIMENSIONS: 1600 x 800px (2:1)

CONCEPT: Iceberg metaphor - small visible portion (reported CPH)
above waterline, large hidden mass (true costs) below

VISUAL ELEMENTS:
- Geometric iceberg shape
- 20% above "waterline"
- 80% below with cost indicators
- Dark blue water, white/light ice
- Lime accent on the hidden portion (the truth)

[Continue with blog-headers.md template...]
```

---

## Quick Orchestration Reference

```
USER REQUEST
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ "I need a [TYPE] for [CONTEXT]"                             │
│                                                             │
│ TYPE determines:                                            │
│ ├─ Content workflow (what copy to generate)                 │
│ ├─ Visual style (which of the 4 styles)                     │
│ └─ Visual workflow (which template to use)                  │
│                                                             │
│ CONTEXT provides:                                           │
│ ├─ Specific inputs for content workflow                     │
│ ├─ Size/format requirements                                 │
│ └─ Any constraints or preferences                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
EXECUTE: Content → Style → Visual → Generate
```

---

## Chaining with CLI Tool

When using `generate-uptime-image.ts`, orchestration can be done in sequence:

```bash
# Step 1: Generate content (manual or via content engine)
# Output: headline, metrics, copy

# Step 2: Generate visual with content vars
npx tsx tools/generate-uptime-image.ts \
  --workflow metric-cards \
  --template big-number \
  --vars '{
    "number": "14",
    "unit": "days",
    "description": "to first driver"
  }' \
  --size 1200x1200 \
  --output ./metric.png
```

For full automation, extend the CLI to:
1. Accept content type parameter
2. Invoke content workflow
3. Pipe output to visual workflow

---

## Validation Checklist

After orchestration, verify:

- [ ] **Content created first?** Narrative/copy generated before visual
- [ ] **Style appropriate?** Matches content type and tone
- [ ] **Content integrated?** Copy appears correctly in visual
- [ ] **Brand consistent?** Both content and visual on-brand
- [ ] **Output format correct?** Right dimensions for use case
- [ ] **Workflows chained?** Proper handoff between steps

---

**This workflow ensures every Uptime visual has purpose-built content and the right visual treatment—just like the original blended-art orchestration pattern.**
