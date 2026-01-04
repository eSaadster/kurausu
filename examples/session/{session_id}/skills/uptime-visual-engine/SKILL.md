---
name: uptime-visual-engine
description: Uptime's visual content system for landing pages, blogs, social media, and app UI. Creates bold, systematic visuals using four distinct styles - Fleet Geometric, Industrial Editorial, Data Dashboard, and Pipeline Blueprint. USE WHEN user needs any visual for Uptime - 'create illustration', 'hero image', 'feature graphic', 'metric card', 'blog header', 'social image', 'process diagram', 'comparison chart'.
---

# Uptime Visual Engine

Creates bold, distinctive visuals that match Uptime's brand: **systematic, data-driven, industrial-modern, unapologetically direct**.

**Four Visual Styles:**
1. **Fleet Geometric** — Clean, systematic, grid-based illustrations
2. **Industrial Editorial** — Photography + bold graphic overlays
3. **Data Dashboard** — Metrics-focused, Metronic-inspired data viz
4. **Pipeline Blueprint** — Technical, process-oriented schematics

**Eleven Workflows:**

🎯 **Orchestrate** — Master workflow that chains content → style → visual (START HERE)

1. **Hero Compositions** — Landing page hero visuals
2. **Feature Illustrations** — Benefit/feature graphics
3. **Metric Cards** — Statistics and data visualizations
4. **Pipeline Diagrams** — Process flows and "how it works"
5. **Comparison Charts** — Before/after, X vs Y visuals
6. **Blog Headers** — Editorial illustrations for content
7. **Social Cards** — Platform-optimized social graphics
8. **Testimonial Cards** — Customer quote visuals
9. **Dashboard Previews** — App screenshot compositions
10. **Driver Portraits** — Industry-authentic driver imagery

---

## The Uptime Visual Philosophy

### Core Principles

**1. Systematic, Not Decorative**
Every visual should communicate something. No filler graphics.

**2. Bold Lime Accent**
`#7CFC00` is the signature. Use it intentionally for emphasis, not everywhere.

**3. Data is Visual**
Numbers aren't just text — they're the hero of the composition.

**4. Industrial Authenticity**
We're a trucking industry product. Visuals should feel real, not stock-photo polished.

**5. Contrast Creates Clarity**
Dark blue `#002233` and Lime `#7CFC00` — high contrast, high impact.

---

## Uptime Color System

### Primary Palette

| Color | Hex | Role | Usage |
|-------|-----|------|-------|
| **Lime Green** | `#7CFC00` | Accent/CTA | Highlights, CTAs, key data, underlines |
| **Dark Blue** | `#002233` | Primary | Text, backgrounds, containers |
| **White** | `#FFFFFF` | Base | Backgrounds, cards, text on dark |
| **Black** | `#000000` | Headlines | Strong headlines, emphasis |

### Secondary Palette

| Color | Hex | Role | Usage |
|-------|-----|------|-------|
| **Light Green** | `#F6FFED` | Soft accent | Section backgrounds, subtle tinting |
| **Hero Tint** | `rgba(124, 252, 0, 0.08)` | Ambient | Hero section backgrounds |
| **Dark Green** | `#05473E` | Text accent | Secondary text, captions |
| **Blue Accent** | `#0A95FF` | Interactive | Links, hover states |

### Dashboard/Data Colors (Metronic-inspired)

| Color | Hex | State | Usage |
|-------|-----|-------|-------|
| **Success** | `#50CD89` | Positive | Growth, completion, good metrics |
| **Warning** | `#FFC700` | Caution | Pending, attention needed |
| **Error** | `#F1416C` | Negative | Problems, declines, alerts |
| **Info** | `#009EF7` | Neutral | Informational, links |
| **Purple** | `#7239EA` | Special | Premium, unique |

### Color Hierarchy Rules

1. **Lime Green is for emphasis** — Use sparingly for maximum impact
2. **Dark Blue is the anchor** — Primary text, structural elements
3. **White creates breathing room** — Generous negative space
4. **Data colors are semantic** — Green = good, Red = bad, Yellow = attention

---

## Typography in Visuals

### Font Family
**Inter** — All visual typography uses Inter for consistency with the app

### Type Scale for Images

| Level | Size (at 1920px) | Weight | Usage |
|-------|------------------|--------|-------|
| **Display** | 72-120px | 900 (Black) | Hero headlines, big numbers |
| **Headline** | 48-64px | 800 | Section headers, metric values |
| **Title** | 32-40px | 700 | Card titles, subheads |
| **Body** | 18-24px | 500-600 | Descriptions, labels |
| **Caption** | 14-16px | 500 | Annotations, fine print |

### Typography Rules for Visuals

1. **Headlines are BLACK weight (900)** — Bold and unapologetic
2. **Numbers are bigger than words** — Data is the hero
3. **Short lines, tight leading** — Punchy, not paragraph-y
4. **Lime underlines for emphasis** — Signature Uptime accent

---

## Spacing & Layout System

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 8px | Tight grouping, icon gaps |
| `sm` | 16px | Related element spacing |
| `md` | 24px | Section internal padding |
| `lg` | 32px | Between distinct elements |
| `xl` | 48px | Section padding |
| `2xl` | 64px | Major section breaks |
| `3xl` | 96px | Hero section margins |

### Grid System

**12-column grid** with 24px gutters
- Hero layouts: Often 5-7 / 5-7 split
- Feature cards: 3 or 4 column grid
- Metric cards: 4 column grid

### Aspect Ratios

| Context | Ratio | Pixels (2x) |
|---------|-------|-------------|
| **Hero** | 16:9 | 1920 x 1080 |
| **Blog Header** | 2:1 | 1600 x 800 |
| **Social Square** | 1:1 | 1200 x 1200 |
| **LinkedIn** | 1.91:1 | 1200 x 628 |
| **Twitter** | 2:1 | 1200 x 600 |
| **Feature Card** | 4:3 | 800 x 600 |
| **Metric Card** | 1:1 | 600 x 600 |
| **Vertical Story** | 9:16 | 1080 x 1920 |

---

## Border Radius System

| Context | Radius | Usage |
|---------|--------|-------|
| **Pill** | `100px` | CTAs, tags, pills |
| **Large** | `24px` | Cards, containers |
| **Medium** | `12px` | Buttons, small cards |
| **Small** | `8px` | Inputs, chips |
| **None** | `0px` | Blueprint style elements |

---

## Shadow System

### Subtle Shadows (Cards, containers)
```css
shadow-sm: 0 2px 6px rgba(0, 34, 51, 0.08)
shadow-md: 0 4px 12px rgba(0, 34, 51, 0.12)
shadow-lg: 0 8px 24px rgba(0, 34, 51, 0.16)
```

### Elevation Shadows (Floating elements)
```css
shadow-xl: 0 12px 32px rgba(0, 34, 51, 0.20)
shadow-2xl: 0 20px 48px rgba(0, 34, 51, 0.24)
```

### Glow Shadows (CTAs, emphasis)
```css
glow-lime: 0 4px 20px rgba(124, 252, 0, 0.4)
glow-lime-strong: 0 8px 32px rgba(124, 252, 0, 0.5)
```

---

## 🎨 THE FOUR VISUAL STYLES

### Style 1: Fleet Geometric

**The "systems thinking" aesthetic — clean, modular, systematic.**

**Characteristics:**
- Clean geometric shapes (circles, rectangles, lines)
- Grid-based compositions
- Iconographic elements (simplified trucks, dashboards, charts)
- Lime green accent elements on dark blue or white
- Strong sense of order and structure
- Flat design, no gradients
- Bold outlines (2-4px strokes)

**Use for:**
- Feature illustrations
- Process diagrams
- Dashboard mockups
- Abstract concept visualization
- Icon-heavy compositions

**Color usage:**
- Primary: Dark Blue `#002233` or White `#FFFFFF` backgrounds
- Accent: Lime `#7CFC00` for highlights, key elements
- Supporting: Light green tint for depth

**Example prompt keywords:**
```
"Fleet Geometric style, clean geometric shapes, grid-based composition,
dark blue and lime green, flat design, bold 3px outlines, systematic layout,
modular elements, white background, Inter font"
```

---

### Style 2: Industrial Editorial

**Photography meets bold graphics — real industry, modern treatment.**

**Characteristics:**
- Real photography of trucks, drivers, fleets
- Bold typographic overlays
- Graphic elements layered over photos
- High contrast treatments
- Lime accent bars, underlines, highlights
- Editorial magazine aesthetic
- Cropped compositions, intentional framing

**Use for:**
- Hero sections
- Testimonial cards
- Case study visuals
- About/team sections
- Authentic industry content

**Color usage:**
- Photography provides base
- Dark overlay: `rgba(0, 34, 51, 0.7)` for text legibility
- Lime accents: Bars, underlines, graphic elements
- White typography on dark overlays

**Example prompt keywords:**
```
"Industrial Editorial style, professional truck driver portrait,
bold Inter typography overlay, lime green accent bar, dark blue gradient overlay,
editorial magazine aesthetic, high contrast, real photography base"
```

---

### Style 3: Data Dashboard

**Metrics as visual content — Metronic-inspired data visualization.**

**Characteristics:**
- Clean data visualization (charts, graphs, metrics)
- Dashboard-style compositions
- Large, bold numbers
- Supporting context in smaller text
- Icon + number combinations
- Status indicators (green/yellow/red)
- Card-based layouts
- Subtle shadows for depth

**Use for:**
- Metric cards
- Statistics callouts
- ROI visualizations
- Comparison charts
- Results sections
- Social proof numbers

**Color usage:**
- White `#FFFFFF` card backgrounds
- Dark Blue `#002233` for primary text
- Lime `#7CFC00` for positive metrics, highlights
- Semantic colors for status (Success, Warning, Error)

**Example prompt keywords:**
```
"Data Dashboard style, clean metric card, large bold number 60%,
white card background, subtle shadow, lime green accent,
Inter font, Metronic-inspired, enterprise SaaS aesthetic"
```

---

### Style 4: Pipeline Blueprint

**Technical, process-oriented — the "how it works" visualizer.**

**Characteristics:**
- Blueprint/schematic aesthetic
- Flow diagrams with connected nodes
- Step-by-step progressions
- Technical notation style
- Grid backgrounds (subtle)
- Connector lines and arrows
- Numbered steps
- Iconographic nodes

**Use for:**
- How it works sections
- Process explanations
- Integration diagrams
- Workflow visualizations
- Technical documentation
- Onboarding flows

**Color usage:**
- Light tinted background: `#F6FFED` or subtle grid pattern
- Dark Blue `#002233` for lines, text, nodes
- Lime `#7CFC00` for active states, progress, highlights
- White for node backgrounds

**Example prompt keywords:**
```
"Pipeline Blueprint style, technical flow diagram, connected nodes,
step-by-step progression, subtle grid background, dark blue connectors,
lime green highlight on current step, Inter font, schematic aesthetic"
```

---

## 🔀 ROUTING: Which Workflow to Use?

### 🎯 **Orchestrate** → `workflows/orchestrate.md` (START HERE)
**When to use:**
- You need BOTH content AND visual created together
- You're not sure which style or workflow to use
- You want the full content-to-visual pipeline

**Pattern:**
```
1. Analyze request → Determine content + visual needs
2. Invoke content workflow → Generate narrative/copy first
3. Select visual style → Based on content type
4. Execute visual workflow → With embedded content
```

This mirrors the original blended-art orchestration pattern.

---

### **Hero Compositions** → `workflows/hero-compositions.md`
**When to use:**
- Landing page hero sections
- Above-the-fold visuals
- Major page headers
- Campaign key visuals

**Recommended style:** Industrial Editorial or Fleet Geometric

---

### **Feature Illustrations** → `workflows/feature-illustrations.md`
**When to use:**
- Feature cards
- Benefit sections
- Product tour graphics
- Capability explanations

**Recommended style:** Fleet Geometric

---

### **Metric Cards** → `workflows/metric-cards.md`
**When to use:**
- Statistics callouts
- ROI displays
- Social proof numbers
- Data highlights

**Recommended style:** Data Dashboard

---

### **Pipeline Diagrams** → `workflows/pipeline-diagrams.md`
**When to use:**
- How it works sections
- Process explanations
- Integration flows
- Step-by-step guides

**Recommended style:** Pipeline Blueprint

---

### **Comparison Charts** → `workflows/comparison-charts.md`
**When to use:**
- Before/after visuals
- X vs Y comparisons
- Competitor differentiation
- Old way vs new way

**Recommended style:** Data Dashboard or Fleet Geometric

---

### **Blog Headers** → `workflows/blog-headers.md`
**When to use:**
- Blog post featured images
- Content thumbnails
- Newsletter headers
- Article social previews

**Recommended style:** Fleet Geometric or Industrial Editorial

---

### **Social Cards** → `workflows/social-cards.md`
**When to use:**
- LinkedIn posts
- Twitter/X images
- Social ads
- Shareable quotes

**Recommended style:** Data Dashboard or Fleet Geometric

---

### **Testimonial Cards** → `workflows/testimonial-cards.md`
**When to use:**
- Customer quotes
- Review highlights
- Case study callouts
- Social proof sections

**Recommended style:** Industrial Editorial

---

### **Dashboard Previews** → `workflows/dashboard-previews.md`
**When to use:**
- App screenshots
- Feature demonstrations
- Product tours
- "See it in action" sections

**Recommended style:** Data Dashboard (actual UI)

---

### **Driver Portraits** → `workflows/driver-portraits.md`
**When to use:**
- Driver-facing pages
- Testimonials
- About sections
- Marketing that features drivers

**Recommended style:** Industrial Editorial

---

## Quick Decision Tree

```
What visual do you need?

├─ Need content + visual together? (DON'T KNOW WHERE TO START?)
│  └─> workflows/orchestrate.md (MASTER ORCHESTRATOR)
│
├─ Landing page hero?
│  └─> workflows/hero-compositions.md (Industrial Editorial)
│
├─ Feature or benefit?
│  └─> workflows/feature-illustrations.md (Fleet Geometric)
│
├─ Statistic or metric?
│  └─> workflows/metric-cards.md (Data Dashboard)
│
├─ Process or workflow?
│  └─> workflows/pipeline-diagrams.md (Pipeline Blueprint)
│
├─ Before/after or X vs Y?
│  └─> workflows/comparison-charts.md (Data Dashboard)
│
├─ Blog image?
│  └─> workflows/blog-headers.md (Fleet Geometric)
│
├─ Social media graphic?
│  └─> workflows/social-cards.md (Data Dashboard)
│
├─ Customer quote?
│  └─> workflows/testimonial-cards.md (Industrial Editorial)
│
├─ App screenshot?
│  └─> workflows/dashboard-previews.md (Actual UI)
│
└─ Driver image?
   └─> workflows/driver-portraits.md (Industrial Editorial)
```

---

## Prompt Templates by Style

### Fleet Geometric Template
```
Editorial illustration in Uptime Fleet Geometric style.

BACKGROUND: [White #FFFFFF / Dark Blue #002233 / Light Green #F6FFED]

STYLE: Clean geometric shapes, grid-based composition. Bold outlines (3px stroke).
Flat design, no gradients. Modular, systematic layout.

ELEMENTS:
- [Describe geometric/iconic elements - simplified trucks, dashboard grids, etc.]
- Grid-based arrangement
- Strong alignment and spacing

COLORS:
- Primary structure: [Dark Blue #002233 / White depending on background]
- Accent highlights: Lime Green #7CFC00 (used sparingly for emphasis)
- Supporting: [Light Green #F6FFED for depth if needed]

TYPOGRAPHY (if any):
- Font: Inter
- Headlines: Black weight (900), Dark Blue or White
- Lime underline accent on key words

COMPOSITION: [Describe layout - centered, asymmetric, grid-based]

NO text unless specified. Clean, systematic, professional.
```

### Industrial Editorial Template
```
Editorial composition in Uptime Industrial Editorial style.

BASE: Professional trucking industry photography
- [Describe photo subject: driver portrait, truck fleet, dispatch office]
- Authentic, not overly staged
- Strong composition, intentional cropping

OVERLAY TREATMENT:
- Dark gradient overlay: rgba(0, 34, 51, 0.6-0.8) for text areas
- Lime Green #7CFC00 accent elements (bars, underlines, shapes)
- Bold typography integration

TYPOGRAPHY:
- Font: Inter Black (900)
- Primary text: White #FFFFFF on dark overlay
- Accent text: Lime Green #7CFC00
- Editorial magazine aesthetic

GRAPHIC ELEMENTS:
- Lime accent bar (horizontal or vertical)
- Geometric frame or crop marks
- Quote marks if testimonial

COMPOSITION: [Describe - full bleed, split, overlapping text area]

High contrast, authentic, editorial quality.
```

### Data Dashboard Template
```
Metric visualization in Uptime Data Dashboard style.

BACKGROUND: White #FFFFFF card with subtle shadow
Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)
Border radius: 24px

PRIMARY ELEMENT:
- Large bold number: [THE NUMBER]
- Font: Inter Black (900), size: [72-120px]
- Color: Dark Blue #002233

CONTEXT:
- Supporting text: [What the number means]
- Font: Inter Medium (500), size: [18-24px]
- Color: Dark Blue #002233 at 60% opacity

ACCENT:
- Lime Green #7CFC00 element: [Icon, indicator, underline, progress bar]
- Status color if applicable: [Success #50CD89 / Warning #FFC700 / Error #F1416C]

ICON (if applicable):
- Simple, geometric icon related to metric
- Color: Dark Blue #002233 or Lime #7CFC00

COMPOSITION: Centered, generous padding, clean hierarchy

Metronic-inspired, enterprise SaaS quality.
```

### Pipeline Blueprint Template
```
Process visualization in Uptime Pipeline Blueprint style.

BACKGROUND: Light Green #F6FFED with subtle grid pattern (optional)
Grid: 40px squares, 1px lines at 5% opacity

STRUCTURE:
- [Number] connected nodes/steps
- Flow direction: [Left to right / Top to bottom]
- Connector lines: 2px, Dark Blue #002233

NODES:
- Shape: [Circles / Rounded rectangles]
- Size: [60-80px]
- Background: White #FFFFFF
- Border: 2px Dark Blue #002233
- Icon inside: Simple, geometric

LABELS:
- Step numbers: Bold, Dark Blue
- Step names: Inter Medium, Dark Blue
- Descriptions: Inter Regular, smaller, 60% opacity

ACTIVE/HIGHLIGHT STATE:
- Current step: Lime Green #7CFC00 border or fill
- Completed steps: [Checkmark / filled indicator]

TYPOGRAPHY:
- Font: Inter
- Numbers: Bold (700)
- Labels: Medium (500)

COMPOSITION: Clean flow, equal spacing between nodes, clear hierarchy

Technical, schematic, but approachable.
```

---

## File Structure

```
uptime-visual-engine/
├── SKILL.md                           # This file (routing + style guide)
├── workflows/
│   ├── orchestrate.md                 # 🎯 MASTER ORCHESTRATOR (start here)
│   ├── hero-compositions.md           # Landing page heroes
│   ├── feature-illustrations.md       # Feature/benefit graphics
│   ├── metric-cards.md                # Statistics, data viz
│   ├── pipeline-diagrams.md           # Process flows
│   ├── comparison-charts.md           # Before/after, X vs Y
│   ├── blog-headers.md                # Blog featured images
│   ├── social-cards.md                # Social media graphics
│   ├── testimonial-cards.md           # Customer quotes
│   ├── dashboard-previews.md          # App screenshots
│   └── driver-portraits.md            # Driver imagery
├── tools/
│   └── generate-uptime-image.ts       # CLI generation tool
└── reference/
    ├── color-palette.md               # Full color reference
    ├── icon-library.md                # Approved icons
    └── example-gallery.md             # Reference implementations
```

---

## Integration with Uptime Content Engine

When creating visuals, pair with content from the Content Engine:

| Visual Workflow | Content Workflow |
|-----------------|------------------|
| Hero Compositions | `content-engine/workflows/problem-solution.md` |
| Feature Illustrations | `content-engine/workflows/feature-narratives.md` |
| Metric Cards | `content-engine/workflows/data-claims.md` |
| Social Cards | `content-engine/workflows/social-snippets.md` |
| Blog Headers | `content-engine/workflows/blog-content.md` |

---

## Validation Checklist

Every Uptime visual must pass:

- [ ] **On-brand colors?** Lime accent, dark blue, white — no off-palette colors
- [ ] **Proper typography?** Inter font family, correct weights
- [ ] **Appropriate style?** Matches the recommended style for content type
- [ ] **High contrast?** Text is readable, elements are distinct
- [ ] **Lime used sparingly?** Accent, not dominant
- [ ] **Professional quality?** Could appear on the live site
- [ ] **Systematic feel?** Ordered, not chaotic
- [ ] **Data is hero?** (If applicable) Numbers are prominent

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Lime green everywhere | Use lime for accent only — 10-15% of visual |
| Generic stock photo feel | Use Industrial Editorial style with authentic subjects |
| Gradient overuse | Keep it flat — Uptime aesthetic is clean, not glossy |
| Weak typography | Headlines should be BLACK weight (900) |
| No clear hierarchy | One primary element, supporting elements secondary |
| Busy compositions | Generous white space, Uptime is systematic not chaotic |
| Off-brand colors | Stick to the palette — no oranges, purples unless data semantics |

---

**This skill creates visuals that make Uptime look like the category-defining company it is — systematic, bold, and undeniably premium.**
