# Social Cards Workflow

**Creates scroll-stopping social media graphics optimized for each platform.**

---

## Purpose

Social graphics need to communicate value in a fraction of a second while fighting for attention. This workflow creates shareable visuals that drive engagement and brand recognition.

**Use for:**
- LinkedIn posts
- Twitter/X posts
- Social ad creative
- Instagram posts
- Quote graphics
- Data callouts for social
- Campaign visuals

---

## Platform Specifications

### LinkedIn
```
DIMENSIONS: 1200 x 628px (1.91:1)
CONTEXT: Professional, industry-focused
TONE: Authoritative, thought leadership
TEXT: Can include more detail
BEST CONTENT: Data, insights, industry commentary
```

### Twitter/X
```
DIMENSIONS: 1200 x 675px (16:9) or 1200 x 1200px (1:1)
CONTEXT: Fast-scrolling, high competition
TONE: Punchy, provocative, shareable
TEXT: Minimal, high contrast
BEST CONTENT: Hot takes, single stats, quotes
```

### Instagram Feed
```
DIMENSIONS: 1080 x 1080px (1:1) or 1080 x 1350px (4:5)
CONTEXT: Visual-first, curated feeds
TONE: On-brand, aesthetic consistency
TEXT: Minimal, design-forward
BEST CONTENT: Quotes, data viz, branded moments
```

### Instagram Stories
```
DIMENSIONS: 1080 x 1920px (9:16)
CONTEXT: Full-screen, ephemeral
TONE: Dynamic, engaging
TEXT: Large, readable on mobile
BEST CONTENT: Quick stats, quotes, CTAs
```

---

## Social Card Types

### Type 1: Data Callout
Single striking statistic.
```
┌─────────────────────────────┐
│                             │
│         $1,200              │
│          /day               │
│                             │
│   cost per empty seat       │
│                             │
│   [UPTIME LOGO]             │
└─────────────────────────────┘
```

### Type 2: Quote Card
Shareable statement or insight.
```
┌─────────────────────────────┐
│                             │
│   "Your ATS is a $50k/year  │
│    suggestion box."         │
│                             │
│   ─────────────────         │
│                             │
│   [UPTIME LOGO]             │
└─────────────────────────────┘
```

### Type 3: Comparison
Before/after or X vs Y.
```
┌─────────────────────────────┐
│                             │
│   84 days  │   14 days      │
│   Industry │   Uptime       │
│                             │
│   ─────────────────         │
│   70 days faster            │
│                             │
└─────────────────────────────┘
```

### Type 4: List/Tips
Numbered insights or tips.
```
┌─────────────────────────────┐
│                             │
│   3 Signs Your Hiring       │
│   Process is Broken         │
│                             │
│   1. [Point]                │
│   2. [Point]                │
│   3. [Point]                │
│                             │
│   [UPTIME LOGO]             │
└─────────────────────────────┘
```

### Type 5: Branded Moment
Campaign visual or announcement.
```
┌─────────────────────────────┐
│                             │
│      [GRAPHIC/PHOTO]        │
│                             │
│   ─────────────────         │
│                             │
│   HEADLINE TEXT             │
│                             │
│   [UPTIME LOGO]             │
└─────────────────────────────┘
```

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Define Content & Platform

```
PLATFORM: [LinkedIn / Twitter / Instagram Feed / Stories]
CONTENT TYPE: [Data / Quote / Comparison / List / Branded]
PRIMARY MESSAGE: [The one thing they should take away]
CTA GOAL: [Engagement / Click / Share / Follow]
```

---

### Step 2: Choose Template

| Content | Platform | Template |
|---------|----------|----------|
| Single stat | Any | Data Callout |
| Hot take/insight | Twitter, LinkedIn | Quote Card |
| Before/after | LinkedIn | Comparison |
| Thought leadership | LinkedIn | List/Tips |
| Campaign/announcement | Any | Branded Moment |

---

### Step 3: Design Composition

**LinkedIn (1200 x 628):**
```
┌──────────────────────────────────────────────┐
│                                              │
│   [MAIN CONTENT - 70% of space]              │
│                                              │
│   Large text or data visualization           │
│   High contrast, readable in feed            │
│                                              │
├──────────────────────────────────────────────┤
│   [FOOTER - 30% of space]                    │
│   Context text + Logo                        │
└──────────────────────────────────────────────┘

Background: Dark Blue #002233 or White #FFFFFF
Text: Contrasting color
Accent: Lime #7CFC00 for emphasis
```

**Twitter (1200 x 675):**
```
┌──────────────────────────────────────────────┐
│                                              │
│         [SINGLE DOMINANT ELEMENT]            │
│                                              │
│         Big number, bold quote,              │
│         or striking visual                   │
│                                              │
│   [Logo in corner]                           │
└──────────────────────────────────────────────┘

Minimal text. Maximum impact.
Fast to parse in timeline.
```

**Instagram Square (1080 x 1080):**
```
┌─────────────────────────────┐
│                             │
│   [CENTERED CONTENT]        │
│                             │
│   Balanced composition      │
│   Works in grid preview     │
│                             │
│   [Logo at bottom]          │
└─────────────────────────────┘

Consistent with brand aesthetic.
Consider how it looks in 3x3 grid.
```

---

### Step 4: Apply Uptime Social Style

**Color combinations:**

| Variant | Background | Text | Accent |
|---------|------------|------|--------|
| **Dark Mode** | Dark Blue #002233 | White #FFFFFF | Lime #7CFC00 |
| **Light Mode** | White #FFFFFF | Dark Blue #002233 | Lime #7CFC00 |
| **Lime Pop** | Lime #7CFC00 | Dark Blue #002233 | White #FFFFFF |
| **Soft** | Light Green #F6FFED | Dark Blue #002233 | Lime #7CFC00 |

**Typography:**
```
Headlines: Inter Black (900), 48-72px
Subtext: Inter Medium (500), 18-24px
Body: Inter Regular (400), 16-18px

All caps for short punchy headlines: YES
Mixed case for longer text: YES
```

**Signature elements:**
- Lime underline on key word
- Lime accent bar (top, bottom, or side)
- Logo in corner (consistent position)
- URL or handle if space permits

---

### Step 5: Construct Prompt

**Data Callout (Dark Mode):**
```
Social media card in Uptime Data Dashboard style.

DIMENSIONS: 1200 x 628px (LinkedIn)
BACKGROUND: Dark Blue #002233

PRIMARY ELEMENT:
- Number: "$1,200"
- Font: Inter Black 96px
- Color: White #FFFFFF
- Unit: "/day" in Inter Bold 36px

SUPPORTING TEXT:
- "cost per empty seat"
- Font: Inter Medium 24px
- Color: White at 70%

ACCENT:
- Lime Green #7CFC00 underline below number
- 8px height, 50% number width

LOGO:
- Uptime logo, bottom-right corner
- White version, 40px height

Clean, bold, stops the scroll.
```

**Quote Card (Light Mode):**
```
Social media card in Uptime style.

DIMENSIONS: 1200 x 628px (LinkedIn)
BACKGROUND: White #FFFFFF

QUOTE:
- Text: "Your ATS is a $50k/year suggestion box."
- Font: Inter Bold 48px
- Color: Dark Blue #002233
- Quotation marks: Large, Lime Green #7CFC00

ATTRIBUTION (optional):
- Line below quote
- Source or context

ACCENT:
- Lime vertical bar on left side (4px width)

LOGO:
- Uptime logo, bottom-right
- Dark Blue version

High contrast, shareable quote format.
```

**Comparison Card:**
```
Social media card for comparison in Uptime style.

DIMENSIONS: 1200 x 628px (LinkedIn)
BACKGROUND: White #FFFFFF

LEFT SIDE (Industry/Before):
- Number: "84"
- Label: "days"
- Context: "Industry average"
- Color: Dark Blue #002233 at 50% (muted)

DIVIDER:
- Vertical line or arrow pointing right
- Dark Blue #002233

RIGHT SIDE (Uptime/After):
- Number: "14"
- Label: "days"
- Context: "With Uptime"
- Color: Dark Blue #002233 (full)
- Accent: Lime underline

SUMMARY:
- "70 days faster"
- Font: Inter Bold 24px
- Color: Lime Green #7CFC00

LOGO: Bottom-right corner

Clear before/after comparison.
```

---

### Step 6: Generate

```bash
# LinkedIn
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1200x628 \
  --output /path/to/linkedin.png

# Twitter
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1200x675 \
  --output /path/to/twitter.png

# Instagram Square
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1080x1080 \
  --output /path/to/instagram.png
```

---

### Step 7: Validate

**Checklist:**

- [ ] **Stops the scroll?** Visually distinctive in feed
- [ ] **Message clear?** Understand in 2 seconds
- [ ] **Platform optimized?** Right dimensions, right density
- [ ] **On-brand?** Lime accent, proper typography
- [ ] **Logo included?** Brand recognition
- [ ] **Shareable?** Would you repost this?
- [ ] **Mobile readable?** Text size works on phone
- [ ] **Accessible?** Sufficient contrast

---

## Content Ideas by Platform

### LinkedIn Best Performers
```
- Industry statistics with commentary
- "X things I learned about..." lists
- Before/after comparisons
- Controversial takes on industry practices
- Customer success metrics
- "The real cost of..." calculations
```

### Twitter Best Performers
```
- Single shocking statistic
- Hot takes in one sentence
- "Thread: [Topic]" openers
- Quick tips (3 or fewer)
- Industry memes (tasteful)
- Real-time commentary
```

### Instagram Best Performers
```
- Beautiful data visualizations
- Quote cards from thought leaders
- Behind-the-scenes moments
- Customer testimonial highlights
- Carousel educational content
- Branded announcements
```

---

## Social Content Library

### Data Stats for Social
```
"$1,200/day — cost per empty seat"
"14 days — not 84"
"60% — hiring cost reduction"
"90% — first-year retention"
"3x — more qualified applicants"
"48 hours — to first match"
"$438,000 — annual cost per parked truck"
"0 — ghosted interviews"
```

### Quotable Statements
```
"Your ATS is a $50k/year suggestion box."
"Stop chasing drivers. Build a pipeline."
"Your trucks aren't parked because there's a driver shortage."
"Every day without a driver is $1,200 burning."
"The best drivers aren't looking. They're being found."
"Hiring that runs like the rest of your fleet."
```

### Engagement Hooks
```
"Here's what most fleet managers miss about retention..."
"The math no one talks about in driver hiring:"
"We analyzed 10,000 driver placements. Here's what we found:"
"Your recruiting metrics are lying to you. Here's why:"
"The 14-day challenge: Can your process match this?"
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Too much text | Reduce to essential message only |
| Small text | Minimum 24px for body, 48px for headlines |
| No logo | Always include brand mark |
| Wrong dimensions | Use platform-specific sizes |
| Generic look | Add Uptime accents (lime, typography) |
| Busy background | Simple backgrounds, one focal point |
| No clear message | One takeaway per graphic |
| Low contrast | Dark Blue on White or White on Dark Blue |

---

**Great social cards get shared. That's the only metric that matters.**
