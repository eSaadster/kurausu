# Hero Compositions Workflow

**Creates landing page hero visuals that stop the scroll and communicate value instantly.**

---

## Purpose

Hero visuals are the first impression. They need to communicate "this is different" before the headline even registers. This workflow creates hero compositions that feel systematic, bold, and premium.

**Use for:**
- Landing page hero sections
- Campaign key visuals
- Above-the-fold imagery
- Major page headers
- Ad creative hero images

---

## Recommended Styles

**Primary: Industrial Editorial**
Best for: Homepage, driver-facing pages, testimonial-heavy pages

**Secondary: Fleet Geometric**
Best for: Product pages, feature pages, technical audiences

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Define Hero Context

**Gather requirements:**

```
PAGE PURPOSE: [Homepage / Driver landing / Feature page / Campaign]
PRIMARY MESSAGE: [The headline this visual supports]
TARGET AUDIENCE: [Fleet managers / Drivers / Executives]
EMOTIONAL GOAL: [Trust / Excitement / Urgency / Relief]
CTA: [What action should they take?]
```

**Hero composition types:**

| Type | Description | Best For |
|------|-------------|----------|
| **Split Composition** | Image on one side, text area on other | Homepage, complex messaging |
| **Full Bleed** | Image fills entire hero, text overlaid | Emotional impact, driver pages |
| **Dashboard Showcase** | Product screenshot as hero | Product pages, demos |
| **Abstract Geometric** | Conceptual illustration | Technical pages, features |

---

### Step 2: Select Visual Approach

#### Option A: Industrial Editorial (Photography-Based)

**Subject options:**
- Professional truck driver (confident pose, not cheesy)
- Fleet of trucks (organized, operational, not parking lot)
- Driver in cab (authentic, working moment)
- Dispatch/operations setting (modern, tech-enabled)

**Treatment:**
- Dark gradient overlay for text legibility
- Lime accent elements (bars, shapes, underlines)
- Bold typography integration
- Cropped composition (intentional, not full frame)

**Prompt structure:**
```
Professional trucking industry photograph in Uptime Industrial Editorial style.

SUBJECT: [Describe subject - driver, trucks, operations]
SETTING: [Location context]
MOOD: [Confident, professional, modern, authentic]
COMPOSITION: [Rule of thirds, subject placement, negative space for text]

TREATMENT:
- Dark gradient overlay on [left/right/bottom]: rgba(0, 34, 51, 0.7)
- Lime Green #7CFC00 accent element: [Horizontal bar at bottom / Vertical accent / Shape frame]
- Text area reserved: [Left side / Right side / Bottom third]

QUALITY: Professional editorial photography, authentic not staged,
modern trucking industry aesthetic, high contrast.
```

#### Option B: Fleet Geometric (Illustration-Based)

**Concept options:**
- Abstract representation of "pipeline" or "system"
- Geometric truck/fleet iconography
- Dashboard/data visualization elements
- Network/connection visualization

**Treatment:**
- Clean geometric shapes
- Grid-based composition
- Bold lime accents on dark blue or white
- Systematic, modular feel

**Prompt structure:**
```
Abstract illustration in Uptime Fleet Geometric style.

CONCEPT: [Pipeline visualization / System diagram / Abstract fleet]
COMPOSITION: [Asymmetric with text space / Centered / Floating elements]

ELEMENTS:
- [Describe geometric elements - lines, circles, rectangles, icons]
- Grid-based alignment
- Modular, systematic arrangement

BACKGROUND: [Dark Blue #002233 / White #FFFFFF / Light Green #F6FFED]

COLORS:
- Primary structure: [Dark Blue / White] depending on background
- Accent elements: Lime Green #7CFC00 (10-15% of composition)
- Depth elements: [Light Green #F6FFED / opacity variations]

STYLE: Clean geometric, flat design, bold 3px outlines where applicable,
systematic and ordered, generous negative space for text overlay.
```

---

### Step 3: Design Text Integration

**Typography specifications:**

```
HEADLINE ZONE:
- Position: [Top-left / Center / Left-aligned]
- Max width: 50-60% of hero width
- Clear contrast against background

SUBHEADLINE ZONE:
- Below headline
- Slightly narrower max-width
- Reduced visual weight

CTA ZONE:
- Below subheadline
- Space for 1-2 buttons
- Accessible click target area
```

**Text treatment on photos (Industrial Editorial):**
```css
/* Dark overlay for text legibility */
background: linear-gradient(
  to right,
  rgba(0, 34, 51, 0.85) 0%,
  rgba(0, 34, 51, 0.6) 50%,
  transparent 100%
);

/* Or bottom gradient */
background: linear-gradient(
  to top,
  rgba(0, 34, 51, 0.9) 0%,
  rgba(0, 34, 51, 0.5) 40%,
  transparent 100%
);
```

---

### Step 4: Add Signature Elements

**Uptime hero signatures:**

1. **Lime Accent Bar**
   - Horizontal bar (4-8px height) at bottom or top
   - Full width or partial
   - Creates visual anchor

2. **Underline Accent**
   - Lime underline on key headline word
   - 8-12px height, extends slightly past text
   - Signature Uptime treatment

3. **Geometric Frame**
   - Subtle lime corner brackets or frame elements
   - Creates premium container feel

4. **Data Callout**
   - Floating metric card in corner
   - "14 days" or "$1,200/day" as visual element
   - Lime background or lime text accent

---

### Step 5: Specify Dimensions

**Standard hero dimensions:**

| Context | Ratio | Size (2x) |
|---------|-------|-----------|
| **Desktop Hero** | 16:9 | 3840 x 2160 |
| **Tablet Hero** | 4:3 | 2048 x 1536 |
| **Mobile Hero** | 9:16 | 1080 x 1920 |
| **Social Share** | 1.91:1 | 2400 x 1256 |

**Safe zones:**
- Text content: Inside center 60% horizontally
- Critical elements: Inside center 80%
- Bleed elements: Can extend to edges

---

### Step 6: Execute Generation

**For Industrial Editorial:**
```bash
# Generate with photography model or stock + treatment
npx tsx tools/generate-uptime-image.ts \
  --style industrial-editorial \
  --prompt "[YOUR PROMPT]" \
  --size 3840x2160 \
  --output /path/to/hero.png
```

**For Fleet Geometric:**
```bash
npx tsx tools/generate-uptime-image.ts \
  --style fleet-geometric \
  --prompt "[YOUR PROMPT]" \
  --size 3840x2160 \
  --output /path/to/hero.png
```

---

### Step 7: Validate

**Checklist:**

- [ ] **Clear text zone?** Sufficient contrast for headline overlay
- [ ] **On-brand colors?** Lime accent, dark blue, white only
- [ ] **Professional quality?** Would work on live Uptime site
- [ ] **Emotional impact?** Communicates confidence/trust/urgency
- [ ] **Systematic feel?** Ordered, not chaotic
- [ ] **Responsive-ready?** Works cropped for mobile
- [ ] **Fast to understand?** Message clear in 3 seconds

---

## Example Prompts

### Homepage Hero (Industrial Editorial)
```
Professional trucking industry photograph in Uptime Industrial Editorial style.

SUBJECT: Confident fleet manager standing in front of dispatch office,
modern technology visible in background (screens, dashboards).
Professional attire, authentic not corporate-staged.

COMPOSITION: Subject on right third, looking toward camera.
Left 60% reserved for text overlay.

TREATMENT:
- Dark gradient overlay on left: rgba(0, 34, 51, 0.8) fading to transparent
- Lime Green #7CFC00 horizontal accent bar at bottom (6px height, 40% width from left)
- Clean, high contrast

MOOD: Confident, professional, modern. "This person has their system figured out."

QUALITY: Editorial photography, authentic trucking industry, premium feel.
```

### Product Page Hero (Fleet Geometric)
```
Abstract illustration in Uptime Fleet Geometric style.

CONCEPT: Visual representation of a hiring "pipeline" -
flowing from left (applications) through processing (matching) to right (hired drivers).

ELEMENTS:
- Flowing line from left to right, Dark Blue #002233
- Geometric nodes along the line representing stages
- Simplified truck icons at the end (destination)
- Grid-aligned, systematic arrangement
- Floating data points: "14 days", "3x", "90%"

BACKGROUND: White #FFFFFF

COLORS:
- Primary lines/shapes: Dark Blue #002233
- Accent highlights: Lime Green #7CFC00 on active/current stage
- Secondary depth: Light Green #F6FFED subtle shapes

COMPOSITION: Asymmetric, main visual on right 60%,
text zone clear on left 40%.

STYLE: Clean, systematic, premium SaaS aesthetic. Not cluttered.
```

### Driver Landing Hero (Industrial Editorial)
```
Professional trucking photograph in Uptime Industrial Editorial style.

SUBJECT: Professional CDL driver in cab, modern truck interior visible.
Genuine expression - confident, content, professional.
Real working environment, not overly staged.

COMPOSITION: Driver positioned on left third.
Right side and bottom available for text overlay.

TREATMENT:
- Subtle dark vignette for text contrast
- Lime Green #7CFC00 accent frame in bottom-right corner
- Clean, authentic feel

MOOD: "This driver has found their place. You could too."
Aspirational but grounded, professional.

QUALITY: Documentary-style photography, authentic CDL driver,
modern trucking industry aesthetic.
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Stock photo feel | Request "authentic, not staged" — real industry aesthetic |
| No text zone | Explicitly reserve 40-60% for overlay content |
| Lime overload | Accent only — 10-15% max of composition |
| Busy background | Simplify — systematic, not chaotic |
| Poor contrast | Add gradient overlay for text legibility |
| Generic SaaS look | Add trucking industry elements — trucks, roads, drivers |
| Weak composition | Use rule of thirds, intentional subject placement |

---

**Great hero visuals make visitors think "this is different" before they even read the headline.**
