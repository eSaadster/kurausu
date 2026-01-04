# Dashboard Previews Workflow

**Creates polished app screenshots that showcase Uptime's product while maintaining brand consistency.**

---

## Purpose

Dashboard previews sell the product before the demo. They show prospects exactly what they'll get—a clean, powerful system that makes hiring effortless. This workflow creates consistent, polished screenshots and mockups.

**Use for:**
- Product screenshots on landing pages
- Feature demos in marketing materials
- App store/marketplace listings
- Sales deck product slides
- Blog post product illustrations
- Social media product teasers

---

## Recommended Style

**Primary: Data Dashboard**
Metronic-inspired, clean interface captures with enterprise polish.

---

## Preview Types

### Type 1: Full Dashboard Screenshot
Complete interface view.
```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [Header Bar]                             │
│             │─────────────────────────────────────────  │
│  ▶ Menu     │                                           │
│  ○ Item     │  [Main Content Area]                      │
│  ○ Item     │                                           │
│  ○ Item     │   Charts, cards, tables                   │
│             │                                           │
│             │                                           │
└─────────────────────────────────────────────────────────┘
```

### Type 2: Feature Spotlight
Zoomed view on specific feature.
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │   [Zoomed Feature]      │                │
│              │                         │                │
│              │   Highlighted area      │                │
│              │   with callout          │                │
│              │                         │                │
│              └─────────────────────────┘                │
│                                                         │
│                    ↑                                    │
│             "AI-Powered Matching"                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Type 3: Device Mockup
Screenshot in laptop/phone frame.
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            ┌─────────────────────────────┐              │
│            │  ○ ○ ○                      │              │
│            │  ┌─────────────────────────┐│              │
│            │  │                         ││              │
│            │  │    [Dashboard View]     ││              │
│            │  │                         ││              │
│            │  │                         ││              │
│            │  └─────────────────────────┘│              │
│            └─────────────────────────────┘              │
│                      MacBook                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Type 4: Multi-Screen Showcase
Multiple views in composition.
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌──────────────────────┐  ┌───────────────┐           │
│   │                      │  │               │           │
│   │   [Main Dashboard]   │  │   [Detail     │           │
│   │                      │  │    View]      │           │
│   │                      │  │               │           │
│   └──────────────────────┘  └───────────────┘           │
│                                                         │
│              ┌──────────────────┐                       │
│              │  [Mobile View]   │                       │
│              │                  │                       │
│              └──────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Type 5: Before/After Dashboard
Transformation comparison.
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   "Before Uptime"          "After Uptime"               │
│                                                         │
│   ┌──────────────┐         ┌──────────────┐             │
│   │              │    →    │              │             │
│   │  [Messy      │         │  [Clean      │             │
│   │   Spreadsheet]         │   Dashboard] │             │
│   │              │         │              │             │
│   └──────────────┘         └──────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 MANDATORY WORKFLOW STEPS

### Step 1: Define the View

**Gather information:**
```
SCREEN: [Which dashboard/feature to show]
PURPOSE: [What should viewer understand/feel]
KEY ELEMENTS: [What must be visible]
DATA SHOWN: [Real or sample data - specify]
SENSITIVE DATA: [What to blur/anonymize]
DEVICE FRAME: [None / Laptop / Phone / Browser]
```

**Example:**
```
SCREEN: Main Pipeline Dashboard
PURPOSE: Show at-a-glance visibility into hiring pipeline
KEY ELEMENTS: Pipeline stages, candidate counts, time-to-hire metric
DATA SHOWN: Sample data - realistic numbers
SENSITIVE DATA: None (using sample)
DEVICE FRAME: Laptop mockup for hero section
```

---

### Step 2: Prepare the Screenshot

**Data preparation:**
```
SAMPLE DATA:
- Use realistic but fictional names
- Use believable numbers (not round numbers)
- Match company size context (10-truck vs 500-truck fleet)
- Keep metrics consistent with claims

ANONYMIZATION:
- Blur real customer names
- Replace with "[Company Name]" placeholder
- Remove PII (emails, phone numbers)
- Use sample driver profiles
```

**Visual preparation:**
```
CLEAN THE UI:
- Close unnecessary modals/dropdowns
- Reset to default view state
- Ensure no error states showing
- Hide development/debug elements
- Set to light mode (brand-consistent)
```

---

### Step 3: Capture the Screenshot

**Browser capture settings:**
```
RESOLUTION:
- Standard: 1920 x 1080 (16:9)
- Retina: 3840 x 2160 (2x for retina)

BROWSER:
- Chrome or Safari (clean chrome)
- Incognito mode (no extensions)
- Zoom: 100%

CAPTURE AREA:
- Full page: Entire viewport
- Feature: Specific element + context
- Component: Individual UI element
```

**Best practices:**
```
- Capture at 2x resolution for crisp exports
- Use browser dev tools for consistent viewport
- Consider scroll position for feature highlights
- Ensure hover/active states if relevant
```

---

### Step 4: Apply Visual Treatment

**Standard treatment:**
```
SHADOW:
- Box shadow around screenshot
- 0 8px 32px rgba(0, 34, 51, 0.12)
- Creates floating effect

BORDER RADIUS:
- 12px on screenshot corners
- Matches app's design language

BACKGROUND:
- Light Green #F6FFED for marketing context
- White #FFFFFF for clean presentation
- Subtle gradient for depth (optional)
```

**Device mockup treatment:**
```
LAPTOP FRAME:
- MacBook style (clean, minimal)
- Titanium or Space Gray
- Screenshot fills screen area
- Realistic perspective (optional)

BROWSER FRAME:
- Minimal browser chrome
- Optional URL bar showing "app.uptime.com"
- Traffic light buttons (macOS style)

PHONE FRAME:
- iPhone style (clean, modern)
- For mobile dashboard views
- Optional hand holding device
```

**Annotation treatment:**
```
CALLOUT BOXES:
- Rounded rectangle
- White background with shadow
- Lime accent bar on left
- Arrow pointing to feature

HIGHLIGHT OVERLAY:
- Semi-transparent overlay on non-focus areas
- Spotlight effect on key feature
- Lime Green glow on highlighted element
```

---

### Step 5: Design Compositions

**Full Dashboard (1920 x 1080):**
```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [Full Dashboard Screenshot]                           │
│                                                         │
│   Applied treatments:                                   │
│   - Box shadow for floating effect                      │
│   - 12px border radius                                  │
│   - Optional device frame                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

BACKGROUND: Light Green #F6FFED or subtle gradient
POSITION: Centered with generous padding
```

**Feature Spotlight (1200 x 800):**
```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [Dashboard with focus area highlighted]               │
│                                                         │
│            ┌─────────────────┐                          │
│            │                 │  ← Spotlight             │
│            │  [Feature]      │    (clear focus)         │
│            │                 │                          │
│            └─────────────────┘                          │
│                    ↑                                    │
│         [Callout: "Feature Name"]                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

OVERLAY: Dark Blue #002233 at 50% on non-focus areas
SPOTLIGHT: Clear area around featured element
CALLOUT: White background, Lime left bar, pointing arrow
```

**Device Mockup (1600 x 1000):**
```
LAYOUT:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Laptop Device Frame]                      │
│                                                         │
│            ┌─────────────────────────┐                  │
│            │  ○ ○ ○    app.uptime.com │                  │
│            │─────────────────────────│                  │
│            │                         │                  │
│            │    [Dashboard View]     │                  │
│            │                         │                  │
│            │                         │                  │
│            └─────────────────────────┘                  │
│               ═══════════════════                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

DEVICE: Minimal laptop mockup (MacBook style)
SHADOW: Under device for grounding
BACKGROUND: Light Green or White with subtle shadow
```

---

### Step 6: Construct Prompt

**Full Dashboard Prompt:**
```
Product dashboard preview in Uptime Data Dashboard style.

SCREENSHOT:
- Uptime pipeline dashboard interface
- Shows: Candidate pipeline with stages
- Metrics visible: Time-to-hire, active candidates, conversion rate
- Style: Clean, Metronic-inspired enterprise SaaS
- Colors: Dark Blue #002233 sidebar, White content area, Lime accents

TREATMENT:
- Border radius: 12px
- Box shadow: 0 8px 32px rgba(0, 34, 51, 0.12)

BACKGROUND: Light Green #F6FFED

FRAME:
- Dimensions: 1920 x 1200px
- Generous padding around screenshot
- Centered composition

Enterprise SaaS quality. Clean, professional, powerful.
```

**Feature Spotlight Prompt:**
```
Feature spotlight preview in Uptime Data Dashboard style.

SCREENSHOT:
- Uptime dashboard with AI Matching feature highlighted
- Overlay: Dark Blue #002233 at 50% on surrounding areas
- Spotlight: Clear view of matching interface

CALLOUT:
- Label: "AI-Powered Matching"
- Style: White background, 16px rounded corners
- Lime Green left bar accent (4px)
- Pointing arrow to featured area
- Font: Inter Bold 16px

BACKGROUND: White #FFFFFF

FRAME:
- Dimensions: 1200 x 800px
- Feature is clear hero
- Context visible but muted

Clear hierarchy. Feature dominates.
```

**Device Mockup Prompt:**
```
Device mockup preview in Uptime style.

DEVICE: MacBook Pro style laptop
- Titanium/silver finish
- Minimal, modern design
- Screen fills with dashboard view

SCREENSHOT ON SCREEN:
- Uptime main dashboard
- Clean, data-rich interface
- Pipeline visible at a glance

BROWSER CHROME (optional):
- Traffic light buttons
- URL: "app.uptime.com/dashboard"

SHADOW:
- Soft shadow under laptop
- Creates floating/grounded effect

BACKGROUND:
- Light Green #F6FFED
- Or subtle gradient to white

COMPOSITION:
- Laptop centered
- Slight upward angle (optional)
- Professional product shot feel

Premium, enterprise-ready product presentation.
```

---

### Step 7: Generate

```bash
# Full dashboard
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1920x1200 \
  --output /path/to/dashboard.png

# Feature spotlight
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1200x800 \
  --output /path/to/feature.png

# Device mockup
npx tsx tools/generate-uptime-image.ts \
  --style data-dashboard \
  --prompt "[YOUR PROMPT]" \
  --size 1600x1000 \
  --output /path/to/mockup.png
```

---

### Step 8: Validate

**Checklist:**

- [ ] **Data is sample/anonymized?** No real PII visible
- [ ] **UI is clean?** No errors, debug, or unfinished states
- [ ] **Numbers are realistic?** Believable sample data
- [ ] **Brand consistent?** Matches app's actual design
- [ ] **Feature is clear?** (for spotlights) Key area is obvious
- [ ] **Device is modern?** Current-gen mockup frames
- [ ] **Resolution sufficient?** Sharp at display size
- [ ] **On-brand treatment?** Lime accents, proper shadows

---

## Dashboard Views to Showcase

### Core Dashboard Views
```
MAIN PIPELINE:
- Shows all candidate stages
- Key metrics visible
- Activity feed or recent actions
- Use for: Hero sections, "how it works"

CANDIDATE DETAIL:
- Individual driver profile
- Qualification scores
- Match percentage
- Use for: "Smart Matching" feature showcase

ANALYTICS:
- Charts and graphs
- Time trends
- Comparison metrics
- Use for: "Real-time Dashboard" feature showcase

INTEGRATIONS:
- Connected systems view
- Data flow visualization
- Use for: "Seamless Integration" feature showcase
```

### Feature-Specific Views
```
AI MATCHING:
- Match score interface
- Driver-fleet compatibility
- Recommendation cards

AUTOMATED SCREENING:
- Qualification checklist
- Auto-qualified indicators
- Filtering interface

MULTI-CHANNEL:
- Source aggregation
- Job board connections
- Application feed
```

---

## Sample Data Guidelines

### Realistic Numbers
```
PIPELINE METRICS:
- New Applications: 47 (not 50)
- In Screening: 23 (not 25)
- Matched: 12 (not 10)
- Time to Hire: 13 days (not 14 exactly)

CANDIDATE DATA:
- Names: Mix of ethnicities, genders
- Experience: Varied (2-15 years)
- CDL Types: A, B mix
- Locations: Diverse US regions
```

### Avoid These
```
- Round numbers (50, 100, 1000)
- Obviously fake names ("John Doe")
- Perfect metrics (100% anything)
- Unrealistic scale (10,000 applications for small fleet)
```

---

## Device Mockup Library

### Laptop Mockups
```
MacBook Pro 16": For hero shots, main dashboard views
MacBook Air: For lighter, mobile-focused contexts
Generic laptop: For platform-neutral contexts
```

### Mobile Mockups
```
iPhone 15 Pro: For mobile dashboard features
Generic smartphone: For platform-neutral mobile
```

### Browser Mockups
```
Chrome window: Minimal chrome, focus on content
Safari window: macOS-native look
Generic browser: Universal contexts
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Real customer data visible | Use sample data, anonymize |
| UI has errors/bugs | Capture clean, stable state |
| Outdated device frame | Use current-gen mockups |
| Low resolution | Capture at 2x for retina |
| Too zoomed out | Focus on key features |
| Too cluttered | Simplify view, hide extras |
| Wrong context | Match screenshot to use case |
| Inconsistent across set | Use same treatments for all |

---

**Great dashboard previews make the product sell itself. Show the system, not just tell about it.**
