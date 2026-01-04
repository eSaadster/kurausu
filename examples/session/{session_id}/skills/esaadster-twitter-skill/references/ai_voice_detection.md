# Detecting AI Voice Patterns

How to spot and avoid the specific patterns that make replies sound artificially generated.

## The Example You Gave

> "exactly. the abstraction shifted from 'model as tool' to 'agent as primitive'. claude code made it obvious because it had to *be* the agent. couldn't offload to copilot or cursor. so the constraint forced you to think in terms of action loops, not chat completions."

**Why this sounds fake:**
- Uses abstract terminology ("abstraction shifted", "agent as primitive") without concrete examples
- Claims insight ("made it obvious") without explaining what was obvious
- Name-drops tools for credibility (Claude Code, Copilot, Cursor)
- Ends with a pseudo-profound summary ("action loops, not chat completions")

## Common AI Voice Patterns

### 1. The Abstract Remix
**Pattern:** [Abstract concept] + [shifted/evolved/revealed] + [other abstract concept]
**Example:** "the paradigm shifted from deterministic execution to probabilistic reasoning"
**Problem:** Sounds smart but says nothing specific
**Fix:** Talk about what you actually built, not the conceptual framework

### 2. The Fake Deep Take
**Pattern:** "the interesting thing is" + [obvious observation] + [pretend it's profound]
**Example:** "the interesting thing is when you realize constraints actually enable creativity"
**Problem:** Treats basic observations as insights
**Fix:** Either ask a real question or share actual experience

### 3. The Tool Name-Drop
**Pattern:** [Tool name] + [vague benefit] + [implication of superiority]
**Example:** "Claude Code forces you to think differently because it had to be the agent"
**Problem:** Uses tools as credibility markers without specifics
**Fix:** What specifically did you build? What broke? What constraint hit?

### 4. The Pseudo-Technical Summary
**Pattern:** [Technical terms] + [arranged to sound meaningful]
**Example:** "so the constraint forced you to think in terms of action loops, not chat completions"
**Problem:** Technical words without technical meaning
**Fix:** What specific code did you write differently? What architectural decision changed?

## How to Sound Real

### Instead of abstract concepts, talk about:
- What you actually built (specific file names, function calls, database schemas)
- What broke (error messages, failed requests, timeout logs)
- What constraint forced your hand (rate limits, memory usage, latency requirements)
- What you tried that didn't work (and why you abandoned it)

### Instead of claiming insights, either:
- Ask specific questions you're genuinely curious about
- Share one specific thing that worked (or failed)
- Skip the reply entirely

### Instead of name-dropping tools, focus on:
- What problem you were trying to solve
- What approach you took
- Whether it worked or not
- What you'd do differently

## The "So What" Test

After writing a reply, ask: **"So what?"**

If the answer is:
- "It sounds insightful" → Don't send it
- "It shows I understand the topic" → Don't send it  
- "It adds a new perspective" → Maybe send it, if it's based on real experience
- "It shares something useful from actual experience" → Send it

## Examples: AI Voice vs Real Voice

### On agent memory:
**AI voice:** "the abstraction of memory reveals itself as a governance layer, where persistence becomes politics"
**Real voice:** "ended up with json files per user/entity. sqlite was overkill, redis lost data on crashes. simple wins."

### On tool selection:
**AI voice:** "the paradigm shifts when you realize tool boundaries are actually capability negotiation interfaces"
**Real voice:** "started with 20 tools, agent picked wrong ones 40% of time. cut to 5, accuracy went up. less is more."

### On context windows:
**AI voice:** "the constraint of limited context forces architectural clarity through intentional information design"
**Real voice:** "bigger context just means it reads the old rant too. i filter at the tool boundary."

## Red Flag Phrases

If your reply contains these, it's probably AI voice:
- "the interesting thing is"
- "what people miss is" 
- "the shift from X to Y"
- "when you realize"
- "the abstraction of"
- "paradigm shift"
- "reveals itself as"
- "forces you to think"

## Green Flag Patterns

If your reply sounds like this, it's probably real:
- Mentions specific file formats, function names, or error messages
- Describes something that broke and how you fixed it
- Asks about implementation details you're genuinely stuck on
- References specific numbers (latency, accuracy, memory usage)
- Admits something was harder than expected or didn't work

Remember: Real engineers talk about real problems. If you're not describing something you actually built, hit, or fixed, you're probably generating AI slop.
