# User Journey Mapping Guide

## What is Journey Mapping?

A user journey map visualizes the experience a user has when interacting with a product to achieve a goal. It captures:

- **Actions**: What the user does
- **Thoughts**: What they're thinking
- **Emotions**: How they feel
- **Pain points**: Frustrations encountered
- **Opportunities**: Areas for improvement

---

## Journey Map Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY: [GOAL NAME]                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERSONA: [Name] │ SCENARIO: [Context] │ DURATION: [Time span]              │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────────────┤
│  PHASE  │ Aware-  │ Consi-  │ Acqui-  │ Service │ Loyal-  │ Advocacy        │
│         │ ness    │ deration│ sition  │         │ ty      │                 │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ ACTIONS │         │         │         │         │         │                 │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│THOUGHTS │         │         │         │         │         │                 │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│EMOTIONS │   😐    │   🤔    │   😊    │   😤    │   😊    │    🎉           │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│  PAIN   │         │         │         │         │         │                 │
│ POINTS  │         │         │         │         │         │                 │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────────┤
│ OPPOR-  │         │         │         │         │         │                 │
│TUNITIES │         │         │         │         │         │                 │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────────────┘
```

---

## Journey Mapping Process

### 1. Define the Scope

| Question                              | Answer             |
| ------------------------------------- | ------------------ |
| Who is the user?                      | [Persona name]     |
| What goal are they trying to achieve? | [Specific goal]    |
| Where does the journey start?         | [Entry point]      |
| Where does it end?                    | [Success criteria] |
| What timeframe?                       | [Hours/days/weeks] |

### 2. Research Methods

- **User interviews**: Direct conversations
- **Observation**: Watch users in context
- **Analytics**: Behavioral data
- **Surveys**: Quantitative feedback
- **Support tickets**: Common issues
- **Usability testing**: Task-based testing

### 3. Identify Stages

Common journey stages:

| Stage             | Description                    | Example                          |
| ----------------- | ------------------------------ | -------------------------------- |
| **Awareness**     | User realizes they have a need | Sees ad, hears recommendation    |
| **Consideration** | User evaluates options         | Compares features, reads reviews |
| **Acquisition**   | User commits to solution       | Signs up, makes purchase         |
| **Onboarding**    | User learns to use product     | Tutorial, setup wizard           |
| **Usage**         | User achieves regular tasks    | Daily interactions               |
| **Support**       | User needs help                | FAQ, customer service            |
| **Retention**     | User continues or churns       | Renewal, upgrade                 |
| **Advocacy**      | User recommends to others      | Reviews, referrals               |

---

## Emotion Mapping

### Emotion Scale

```
 😡  Frustrated/Angry
 😟  Worried/Anxious
 😐  Neutral
 🙂  Content
 😊  Happy
 🎉  Delighted
```

### Emotional Journey Line

```
Delight  │                              ╭──╮
         │                    ╭────────╯  │
Happy    │          ╭────────╯            │
         │    ╭────╯                      ╰──╮
Neutral  │────╯                              │
         │                                   ╰────
Frustrat │
         └────────────────────────────────────────
           Discover → Sign Up → First Use → Ongoing
```

---

## Touchpoint Analysis

### Touchpoint Types

| Type          | Description         | Examples                   |
| ------------- | ------------------- | -------------------------- |
| **Digital**   | Online interactions | Website, app, email        |
| **Physical**  | In-person/tangible  | Store, packaging, mail     |
| **Human**     | Person-to-person    | Sales, support, community  |
| **Marketing** | Promotional         | Ads, social media, content |

### Touchpoint Evaluation

For each touchpoint, assess:

- **Importance**: How critical is this touchpoint?
- **Performance**: How well does it work?
- **Gap**: Importance vs Performance difference

```
              High Importance
                    │
     Improve ◀──────┼────────▶ Maintain
     Priority       │         Excellence
                    │
   Low ─────────────┼───────────── High
   Performance      │            Performance
                    │
     Monitor        │           Deprioritize
                    │
              Low Importance
```

---

## Pain Point Categories

### Severity Levels

| Level           | Description                                 | Action        |
| --------------- | ------------------------------------------- | ------------- |
| 🔴 **Critical** | Blocks user from completing goal            | Immediate fix |
| 🟠 **High**     | Significant frustration, workarounds needed | Prioritize    |
| 🟡 **Medium**   | Notable friction, but manageable            | Plan fix      |
| 🟢 **Low**      | Minor annoyance                             | Backlog       |

### Pain Point Types

1. **Process pain**: Too many steps, complexity
2. **Interaction pain**: UI/UX issues, confusing interface
3. **Financial pain**: Cost concerns, hidden fees
4. **Support pain**: Can't get help, slow response
5. **Emotional pain**: Anxiety, frustration, confusion

---

## Opportunity Framework

### Opportunity Identification

| Pain Point | Root Cause       | Opportunity | Effort | Impact |
| ---------- | ---------------- | ----------- | ------ | ------ |
| [Issue]    | [Why it happens] | [Solution]  | H/M/L  | H/M/L  |

### Prioritization Matrix

```
            High Impact
                │
   Quick Wins   │   Big Bets
   (Do First)   │   (Plan)
                │
  Low ──────────┼────────── High
  Effort        │          Effort
                │
   Fill-ins     │   Money Pits
   (Do Later)   │   (Avoid)
                │
            Low Impact
```

---

## Journey Map Example: E-commerce Checkout

```markdown
## User Journey: Complete a Purchase

**Persona**: Sarah, 32, busy professional
**Goal**: Buy a birthday gift for her nephew
**Duration**: 15-30 minutes

### Stages

| Stage             | Browse                          | Select                           | Cart                      | Checkout               | Confirmation             |
| ----------------- | ------------------------------- | -------------------------------- | ------------------------- | ---------------------- | ------------------------ |
| **Actions**       | Search for toys, filter by age  | Read reviews, check availability | Add to cart, review items | Enter shipping/payment | Review order details     |
| **Thoughts**      | "What would a 7-year-old like?" | "Is this good quality?"          | "Did I get everything?"   | "Is my info secure?"   | "When will it arrive?"   |
| **Emotions**      | 😐 Neutral                      | 🙂 Hopeful                       | 😊 Satisfied              | 😟 Anxious             | 😊 Relieved              |
| **Touchpoints**   | Search, filters, categories     | PDP, reviews, recommendations    | Cart page, cross-sells    | Checkout form, payment | Confirmation page, email |
| **Pain Points**   | Too many results                | Reviews not helpful              | Shipping cost surprise    | Form is long           | No tracking info         |
| **Opportunities** | Better filters                  | Verified reviews                 | Show shipping early       | Guest checkout         | Instant tracking         |
```

---

## Tools for Journey Mapping

### Digital Tools

- Miro
- Figma
- Lucidchart
- UXPressia
- Smaply

### Low-Fidelity Options

- Sticky notes on wall
- Whiteboard
- Spreadsheet
- Markdown document

---

## Best Practices

1. **Base on real data**: Use research, not assumptions
2. **Include emotions**: They drive decisions
3. **Be specific**: Use concrete examples
4. **Focus on one persona**: Don't blend users
5. **Identify ownership**: Who owns each touchpoint?
6. **Keep it living**: Update as you learn more
7. **Share widely**: Make visible to the team
