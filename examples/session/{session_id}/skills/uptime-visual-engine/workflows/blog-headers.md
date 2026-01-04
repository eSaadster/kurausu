# Blog Headers Workflow

**Creates editorial illustrations that make blog posts feel premium and worth reading.**

---

## Purpose

Blog headers set the tone before a single word is read. This workflow creates visuals that communicate the article's essence while establishing Uptime as a thought leader.

**Use for:**
- Blog post featured images
- Newsletter headers
- Content thumbnails
- Article social previews
- Resource library covers
- Whitepaper covers

---

## Recommended Styles

**Primary: Fleet Geometric**
Best for: Technical content, how-to guides, industry analysis

**Secondary: Industrial Editorial**
Best for: Driver stories, testimonials, human-interest content

---

## Blog Header Types

### Type 1: Conceptual Abstract
Visual metaphor representing the article topic.
```
┌────────────────────────────────────┐
│                                    │
│   [ABSTRACT GEOMETRIC CONCEPT]     │
│                                    │
│   Shapes, lines, and icons that    │
│   represent the topic abstractly   │
│                                    │
└────────────────────────────────────┘
```

### Type 2: Data-Driven
Article topic represented through data visualization.
```
┌────────────────────────────────────┐
│                                    │
│   [KEY STAT]    [VISUAL ELEMENT]   │
│                                    │
│   Number or chart that anchors     │
│   the article's main point         │
│                                    │
└────────────────────────────────────┘
```

### Type 3: Photo + Treatment
Photography with editorial overlay (Industrial Editorial).
```
┌────────────────────────────────────┐
│                                    │
│   [PHOTOGRAPHY]                    │
│                                    │
│   + Graphic overlay                │
│   + Lime accent elements           │
│                                    │
└────────────────────────────────────┘
```

### Type 4: Typographic
Bold typography as the visual element.
```
┌────────────────────────────────────┐
│                                    │
│   "KEY PHRASE                      │
│    FROM ARTICLE"                   │
│                                    │
│   Large, impactful text            │
│   + minimal graphic accent         │
│                                    │
└────────────────────────────────────┘
```

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Analyze the Article

**Gather information:**
```
ARTICLE TITLE: [Full title]
CORE TOPIC: [One-sentence summary]
ARTICLE TYPE: [How-to / Analysis / Opinion / News / Case study]
KEY CONCEPT: [The main idea to visualize]
VISUAL METAPHOR: [How to represent it visually]
TONE: [Technical / Conversational / Provocative / Inspirational]
```

**Example:**
```
ARTICLE TITLE: "Why Your Cost-Per-Hire Metric is Lying to You"
CORE TOPIC: Traditional CPH misses the true cost of bad hires
ARTICLE TYPE: Analysis / Opinion
KEY CONCEPT: Hidden costs, beneath the surface
VISUAL METAPHOR: Iceberg (visible vs hidden), or broken calculator
TONE: Provocative, challenging conventional wisdom
```

---

### Step 2: Choose Visual Approach

| Article Type | Visual Approach | Style |
|--------------|-----------------|-------|
| How-to guide | Process visualization | Fleet Geometric |
| Industry analysis | Data + concept | Fleet Geometric |
| Opinion/hot take | Bold typography | Fleet Geometric |
| Driver story | Photography | Industrial Editorial |
| Case study | Results data | Data Dashboard |
| Company news | Branded moment | Fleet Geometric |
| Technical deep-dive | Abstract concept | Fleet Geometric |

---

### Step 3: Develop Visual Concept

**Concept development process:**

1. **Extract key visual idea** from article
2. **List 3-5 metaphor options** that could represent it
3. **Select strongest metaphor** (most unique, most clear)
4. **Define visual elements** needed
5. **Plan composition** and emphasis

**Example concepts by topic:**

| Topic | Metaphor Options | Recommended |
|-------|------------------|-------------|
| Hidden costs | Iceberg, shadow, buried treasure | Iceberg |
| Speed | Race, clock, arrow, highway | Highway/road |
| Pipeline | Tubes, flow, funnel, river | Funnel with stages |
| Matching | Puzzle, magnet, key/lock | Puzzle pieces |
| Broken system | Cracked machine, leaky bucket | Leaky bucket |
| Growth | Stairs, plant, rocket | Stairs (systematic) |
| Retention | Anchor, roots, handshake | Roots/foundation |

---

### Step 4: Design Composition

**Standard blog header: 1600 x 800px (2:1)**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   [Left 40%]                    [Right 60%]                  │
│                                                              │
│   Text area                     Visual area                  │
│   (if including                 (main illustration           │
│    title in image)               or concept)                 │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

OR

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    [CENTERED CONCEPT]                        │
│                                                              │
│                   Main visual element                        │
│                   with supporting elements                   │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Composition guidelines:**
- **Rule of thirds** for asymmetric layouts
- **Central focus** for iconic concepts
- **Breathing room** — don't fill every space
- **Clear focal point** — one main element

---

### Step 5: Construct Prompt

**Conceptual Abstract (Fleet Geometric):**
```
Blog header illustration in Uptime Fleet Geometric style.

DIMENSIONS: 1600 x 800px (2:1 aspect ratio)

CONCEPT: [Describe the visual metaphor]
- Main element: [Primary visual]
- Supporting elements: [Secondary visuals]
- Relationship: [How elements interact]

BACKGROUND: [White #FFFFFF / Light Green #F6FFED / Dark Blue #002233]

COMPOSITION:
- [Describe layout - centered, asymmetric, etc.]
- Focal point: [Where the eye should go first]
- Negative space: [Where to leave breathing room]

STYLE:
- Clean geometric shapes
- Bold outlines (2-3px stroke)
- Flat colors, no gradients
- Systematic, organized arrangement

COLORS:
- Primary structure: Dark Blue #002233
- Accent elements: Lime Green #7CFC00 (sparingly)
- Background: [As specified above]

NO TEXT in the illustration (title overlaid separately).

Professional, editorial quality. Would work in major publication.
```

**Data-Driven Header:**
```
Blog header in Uptime Data Dashboard style.

DIMENSIONS: 1600 x 800px

CONCEPT: [Article's key data point as visual]

PRIMARY DATA ELEMENT:
- Number/stat: "[THE NUMBER]"
- Visual treatment: [How to display - large, with chart, etc.]
- Emphasis: [What makes this stand out]

SUPPORTING VISUAL:
- [Chart type, icon, or illustration that contextualizes]
- Position: [Relative to data]

BACKGROUND: [Color choice]

COMPOSITION:
- Data prominent but not alone
- Visual context supports understanding
- Clean, professional, editorial

COLORS:
- Numbers: Dark Blue #002233
- Accent: Lime Green #7CFC00
- Supporting: [As needed]

Metronic-inspired, thought leadership aesthetic.
```

---

### Step 6: Generate

```bash
npx tsx tools/generate-uptime-image.ts \
  --style fleet-geometric \
  --prompt "[YOUR PROMPT]" \
  --size 3200x1600 \
  --output /path/to/blog-header.png
```

**Generate at 2x for retina displays:**
- Blog header: 3200 x 1600px
- Social preview: 2400 x 1256px

---

### Step 7: Validate

**Checklist:**

- [ ] **Represents topic?** Visual relates to article content
- [ ] **Works without title?** Image is complete on its own
- [ ] **Works with title overlay?** Space for text if needed
- [ ] **Thumbnail-friendly?** Clear at small sizes
- [ ] **On-brand?** Lime accent, geometric style, professional
- [ ] **Editorial quality?** Would work in major publication
- [ ] **Not cliché?** Avoids overused stock image concepts
- [ ] **Consistent with series?** Matches other Uptime blog headers

---

## Concept Library by Topic

### Hiring & Recruiting
| Topic | Visual Concept |
|-------|----------------|
| Cost of bad hire | Money burning, iceberg (hidden costs) |
| Pipeline building | Flowing tubes, funnel with stages |
| Sourcing channels | Multiple streams converging |
| Screening | Filter/funnel, sieve |
| Speed to hire | Clock, calendar, fast-forward |

### Driver-Related
| Topic | Visual Concept |
|-------|----------------|
| Retention | Roots, anchor, foundation |
| Driver experience | Road, journey, horizon |
| Driver shortage | Empty seats, parked trucks |
| Quality matching | Puzzle fit, magnet |
| Onboarding | Welcome mat, open door |

### Industry & Market
| Topic | Visual Concept |
|-------|----------------|
| Industry trends | Upward graph, shifting landscape |
| Competition | Race track, positioning |
| Market changes | Shifting blocks, transformation |
| Regulations | Checklist, rulebook |
| Technology | Circuit patterns, connections |

### Business & ROI
| Topic | Visual Concept |
|-------|----------------|
| Cost savings | Downward dollar, piggy bank |
| ROI | Scale balancing, returns chart |
| Efficiency | Streamlined path, optimization |
| Growth | Stairs, expansion, scaling |
| Success metrics | Dashboard, checkmarks |

---

## Article Type → Style Guide

### How-To Articles
```
Style: Fleet Geometric
Concept: Process visualization or tool representation
Colors: Light background, dark blue structure, lime highlights
Mood: Helpful, clear, actionable
```

### Opinion/Hot Takes
```
Style: Fleet Geometric with bold typography
Concept: Provocative visual or challenged assumption
Colors: Can use dark background for drama
Mood: Challenging, thought-provoking
```

### Industry Analysis
```
Style: Fleet Geometric or Data Dashboard
Concept: Data visualization or trend representation
Colors: Professional, clean
Mood: Authoritative, informed
```

### Case Studies
```
Style: Industrial Editorial or Data Dashboard
Concept: Results/outcomes or customer story
Colors: Brand colors prominent
Mood: Trustworthy, proven
```

### Driver Stories
```
Style: Industrial Editorial
Concept: Photography with editorial treatment
Colors: Warm, human, authentic
Mood: Relatable, inspiring
```

---

## Common Blog Header Mistakes

| Mistake | Fix |
|---------|-----|
| Generic stock imagery | Create custom conceptual illustration |
| Literal interpretation | Abstract metaphor is more memorable |
| Too busy | One focal point, breathing room |
| Unrelated visual | Visual must connect to article topic |
| Poor thumbnail | Test at small sizes |
| Inconsistent series | Maintain style across all posts |
| Dark text area | Ensure text overlay will be readable |
| Cliché concepts | Avoid handshakes, lightbulbs, arrows |

---

## Series Consistency

**For a cohesive blog visual identity:**

1. **Same aspect ratio** across all posts (2:1 recommended)
2. **Same style** (Fleet Geometric primary)
3. **Same color palette** (Lime, Dark Blue, White)
4. **Same logo placement** (if including)
5. **Same level of abstraction** (conceptual, not literal)
6. **Same composition principles** (rule of thirds, focal points)

---

**Great blog headers make readers think: "This is going to be worth my time."**
