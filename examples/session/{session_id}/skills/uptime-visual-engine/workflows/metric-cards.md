# Metric Cards Workflow

**Creates compelling data visualizations that make statistics undeniable and shareable.**

---

## Purpose

Numbers are Uptime's most powerful weapon. This workflow transforms raw metrics into visual proof points that anchor claims and drive action.

**Use for:**
- Statistics callouts on landing pages
- Social proof sections
- ROI visualizations
- Comparison metrics
- Social media data cards
- Results sections
- Email graphic elements

---

## Recommended Style

**Primary: Data Dashboard**
Clean, Metronic-inspired data visualization with enterprise polish.

---

## Metric Card Types

### Type 1: Big Number Card
Single dominant statistic with context.
```
┌─────────────────────────────┐
│                             │
│      [ICON]                 │
│                             │
│      14                     │  ← Big number (72-120px)
│      days                   │  ← Unit/context (24px)
│                             │
│   to first driver           │  ← Description (16px)
│                             │
└─────────────────────────────┘
```

### Type 2: Comparison Card
Before/after or X vs Y metric.
```
┌─────────────────────────────┐
│                             │
│   84 days    →    14 days   │
│   Industry        Uptime    │
│                             │
│   ────────[LIME]────────    │  ← Progress/comparison bar
│                             │
│   70 days faster            │
│                             │
└─────────────────────────────┘
```

### Type 3: Percentage Card
Completion, reduction, or rate metric.
```
┌─────────────────────────────┐
│                             │
│         60%                 │
│                             │
│   ████████████░░░░░░░       │  ← Progress bar (lime fill)
│                             │
│   reduced hiring costs      │
│                             │
└─────────────────────────────┘
```

### Type 4: Money Card
Dollar-focused financial metric.
```
┌─────────────────────────────┐
│                             │
│      $1,200                 │
│      /day                   │
│                             │
│   cost per empty seat       │
│                             │
│   [$438,000/year]           │  ← Annual calculation
│                             │
└─────────────────────────────┘
```

### Type 5: Multi-Metric Card
2-3 related metrics in one card.
```
┌─────────────────────────────┐
│                             │
│   14 days  │  60%   │  90%  │
│   to hire  │ saved  │ stay  │
│                             │
│   ─────────────────────────  │
│   Speed. Savings. Retention. │
│                             │
└─────────────────────────────┘
```

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Define the Metric

**Gather information:**
```
RAW NUMBER: [The actual value]
CONTEXT: [What it measures]
COMPARISON: [vs. what? Industry? Before? Competitor?]
IMPLICATION: [Why it matters to the viewer]
```

**Example:**
```
RAW NUMBER: 14
CONTEXT: Days from signup to first driver hired
COMPARISON: vs. 84-day industry average
IMPLICATION: Your trucks are back on the road in weeks, not months
```

---

### Step 2: Choose Card Type

| Metric Type | Card Type | Example |
|-------------|-----------|---------|
| Single impressive number | Big Number | "14 days" |
| Before/after | Comparison | "84 → 14 days" |
| Percentage/rate | Percentage | "60% reduction" |
| Dollar amount | Money | "$1,200/day" |
| Multiple related stats | Multi-Metric | "14 / 60% / 90%" |

---

### Step 3: Design Card Structure

**Standard card specs:**

```
DIMENSIONS:
- Square: 600 x 600px (social, grid layouts)
- Wide: 800 x 400px (inline callouts)
- Tall: 400 x 600px (sidebar placements)

BACKGROUND:
- Primary: White #FFFFFF
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)
- Border radius: 24px

PADDING:
- Outer: 48px
- Between elements: 16-24px

TYPOGRAPHY:
- Number: Inter Black (900), 72-120px, Dark Blue #002233
- Unit/context: Inter Bold (700), 24-32px, Dark Blue #002233
- Description: Inter Medium (500), 16-18px, Dark Blue at 70% opacity
- Annotation: Inter Regular (400), 14px, Dark Blue at 50% opacity
```

---

### Step 4: Add Visual Elements

**Icon selection:**
```
Speed metrics → Clock, speedometer, arrow
Cost metrics → Dollar sign, wallet, chart down
Quality metrics → Star, checkmark, shield
Scale metrics → Users, trucks, chart up
Comparison → Arrows, scales, split
```

**Accent elements:**
```
- Lime underline under number (8px height)
- Lime progress bar fill
- Lime icon background (circle or square)
- Lime border on one side (4px)
- Lime tag/badge for key insight
```

**Status indicators:**
```
Positive/Good: Success Green #50CD89 or Lime #7CFC00
Neutral/Info: Blue #009EF7
Caution: Warning Yellow #FFC700
Negative/Bad: Error Red #F1416C
```

---

### Step 5: Construct Prompt

**Big Number Card Prompt:**
```
Metric card in Uptime Data Dashboard style.

CARD:
- Background: White #FFFFFF
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)
- Padding: 48px

PRIMARY NUMBER:
- Value: "[NUMBER]"
- Font: Inter Black (900)
- Size: 96px
- Color: Dark Blue #002233

UNIT/CONTEXT:
- Text: "[unit like 'days' or '/day']"
- Font: Inter Bold (700)
- Size: 28px
- Color: Dark Blue #002233
- Position: Immediately after or below number

DESCRIPTION:
- Text: "[what this number means]"
- Font: Inter Medium (500)
- Size: 18px
- Color: Dark Blue #002233 at 70% opacity
- Position: Below number block

ACCENT:
- Lime Green #7CFC00 underline below number (8px height, 60% number width)
- OR Lime icon in top-left corner (48px, geometric style)

COMPOSITION: Centered, generous whitespace, clean hierarchy.
Number is hero. Everything else supports it.
```

**Comparison Card Prompt:**
```
Comparison metric card in Uptime Data Dashboard style.

CARD:
- Background: White #FFFFFF
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0, 34, 51, 0.12)

LEFT VALUE (Before/Industry):
- Number: "[OLD VALUE]"
- Label: "[Industry / Before / Old way]"
- Color: Dark Blue #002233 at 50% opacity
- Style: Slightly muted, secondary

ARROW/TRANSITION:
- Direction indicator between values
- Dark Blue #002233

RIGHT VALUE (After/Uptime):
- Number: "[NEW VALUE]"
- Label: "[Uptime / After / New way]"
- Color: Dark Blue #002233
- Accent: Lime Green #7CFC00 underline

COMPARISON BAR:
- Full width progress bar
- Background: Dark Blue #002233 at 10%
- Fill: Lime Green #7CFC00
- Fill represents improvement ratio

SUMMARY:
- Text: "[X faster / X% better / $X saved]"
- Font: Inter Bold
- Color: Dark Blue #002233

Emphasis on the improvement. Old value faded, new value prominent.
```

---

### Step 6: Generate

```bash
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1200x1200 \
  --output /path/to/metric-card.png
```

**Aspect ratios:**
- Square (1:1): 1200 x 1200px
- Wide (2:1): 1200 x 600px
- LinkedIn (1.91:1): 1200 x 628px

---

### Step 7: Validate

**Checklist:**

- [ ] **Number is hero?** Largest, most prominent element
- [ ] **Clear at glance?** Understand in 3 seconds
- [ ] **Context included?** Know what number represents
- [ ] **Implication clear?** Know why it matters
- [ ] **On-brand colors?** Lime accent, dark blue, white
- [ ] **Professional quality?** Enterprise SaaS aesthetic
- [ ] **Readable at size?** Works at actual display size
- [ ] **Shareable?** Would work as standalone social image

---

## Example Implementations

### "14 Days" Speed Card
```
PROMPT:
Metric card in Uptime Data Dashboard style.

Card: White background, 24px radius, subtle shadow.

Primary element:
- "14" in Inter Black 120px, Dark Blue #002233
- "days" in Inter Bold 32px, immediately right of number
- Lime Green underline below (8px height)

Supporting text:
- "to first driver" in Inter Medium 20px
- Dark Blue at 70% opacity
- 24px below number

Icon: Simple clock icon, top-right corner
- 40px, Dark Blue #002233 outline style

Clean, centered composition. Number dominates.
```

### "$1,200/day" Cost Card
```
PROMPT:
Money metric card in Uptime Data Dashboard style.

Card: White background, 24px radius, shadow.

Primary element:
- "$1,200" in Inter Black 96px, Dark Blue #002233
- "/day" in Inter Bold 28px, baseline aligned

Supporting text:
- "cost per empty seat" in Inter Medium 18px
- Dark Blue at 70% opacity

Secondary calculation:
- "= $438,000/year" in Inter Regular 16px
- Dark Blue at 50% opacity
- Small tag/badge style with Lime border

Accent: Lime Green left border (4px width, full height)

Emphasis on the daily cost. Annual is supporting context.
```

### "60% Reduction" Percentage Card
```
PROMPT:
Percentage metric card in Uptime Data Dashboard style.

Card: White background, 24px radius, shadow.

Primary element:
- "60%" in Inter Black 96px, Dark Blue #002233

Progress bar:
- Full width, 12px height
- Background: Dark Blue #002233 at 10%
- Fill (60%): Lime Green #7CFC00
- Border radius: 6px

Supporting text:
- "reduced hiring costs" in Inter Medium 18px
- Dark Blue at 70% opacity

Accent: Checkmark icon in Lime Green, top-right

Clean composition. Progress bar visualizes the percentage.
```

---

## Multi-Metric Layouts

### 3-Metric Row
```
┌────────────┬────────────┬────────────┐
│    14      │    60%     │    90%     │
│   days     │   saved    │   stay     │
│            │            │            │
│  to hire   │  on costs  │ first year │
└────────────┴────────────┴────────────┘

Specs:
- Each card: Equal width
- Dividers: 1px Dark Blue at 10%
- Numbers: Inter Black 64px
- Labels: Inter Medium 16px
```

### 4-Metric Grid
```
┌────────────┬────────────┐
│    14      │   $30k     │
│   days     │   saved    │
├────────────┼────────────┤
│    3x      │    90%     │
│   more     │   stay     │
└────────────┴────────────┘

Specs:
- 2x2 grid
- Each cell: Equal size
- Numbers: Inter Black 56px
- Unified card with internal grid
```

---

## Social Media Optimization

### LinkedIn (1200 x 628)
```
- Metric on left 60%
- Logo/branding on right
- Context text below metric
- Lime accent bar at bottom (full width, 8px)
```

### Twitter/X (1200 x 600)
```
- Metric centered
- Minimal supporting text
- High contrast for timeline visibility
- Lime accent element for brand recognition
```

### Instagram Square (1200 x 1200)
```
- Metric centered
- More generous padding
- Can include more context
- Works in feed and grid
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Number too small | Make it 72-120px — number is the hero |
| No context | Always include what the number means |
| Too many metrics | One card = one primary metric (or tight theme) |
| Weak contrast | Dark Blue on White, Lime for accent |
| Generic look | Add Uptime-specific touches (lime accents, proper typography) |
| Cluttered | Generous whitespace, clean hierarchy |
| No "so what" | Include implication, not just the stat |

---

**Great metric cards make the data undeniable. One glance, and they get it.**
