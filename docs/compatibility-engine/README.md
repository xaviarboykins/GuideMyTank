# GuideMyTank Compatibility Engine

## Overview

The GuideMyTank Compatibility Engine is a deterministic, rule-based scoring system that evaluates the compatibility between two aquarium species.

Unlike a simple pass/fail system, the engine produces:

* A numeric compatibility score (0–100)
* A compatibility status
* Human-readable reasons explaining the result

The primary goal is transparency. Every point earned or lost can be traced back to a specific compatibility rule, making the engine explainable rather than a "black box."

---

# Design Goals

The compatibility engine was designed around the following principles:

* Deterministic

  * The same two species will always produce the same result using the same data.

* Explainable

  * Every compatibility decision includes reasons that explain why the score was assigned.

* Modular

  * Every compatibility rule is isolated into its own evaluator.

* Extensible

  * New compatibility factors can be added without rewriting the engine.

* Testable

  * Each evaluator can be tested independently.

---

# Engine Architecture

The engine follows a simple evaluation pipeline.

```
Species A
Species B

        │
        ▼

calculateCompatibility()

        │
        ▼

Temperature Evaluator
        │

pH Evaluator
        │

Aggression Evaluator
        │

Schooling Evaluator
        │

Predation Evaluator
        │

Tank Size Evaluator

        │
        ▼

Aggregate Score

        │
        ▼

Determine Status

        │
        ▼

Generate Reasons

        │
        ▼

Return Final Result
```

Each evaluator contributes:

* A score
* One or more human-readable reasons

The engine then combines every evaluator into a final compatibility score.

---

# Output

Example output:

```json
{
  "score": 92,
  "status": "Very Compatible",
  "reasons": [
    "Temperature ranges overlap.",
    "pH requirements overlap.",
    "Species have similar temperament.",
    "No predation risk detected.",
    "Tank size requirements align."
  ]
}
```

---

# Compatibility Rules

## 1. Temperature Compatibility

Weight:

**20 Points**

Purpose:

Determines whether the preferred temperature ranges overlap.

Possible outcomes:

* Full overlap
* Partial overlap
* No overlap

Example reasons:

* Temperature ranges overlap.
* Partial temperature overlap.
* Temperature requirements conflict.

---

## 2. pH Compatibility

Weight:

**15 Points**

Purpose:

Determines whether preferred pH ranges overlap.

Possible outcomes:

* Full overlap
* Partial overlap
* No overlap

Example reasons:

* pH requirements overlap.
* Partial pH overlap.
* pH requirements conflict.

---

## 3. Aggression Compatibility

Weight:

**25 Points**

Purpose:

Determines how well both species coexist based on temperament and aggression level.

Possible considerations:

* Peaceful
* Semi-Aggressive
* Aggressive
* Aggression score

Example reasons:

* Species have similar temperament.
* One species may become territorial.
* Aggression levels create a significant conflict.

---

## 4. Schooling Compatibility

Weight:

**10 Points**

Purpose:

Evaluates whether schooling requirements create compatibility concerns.

Example considerations:

* Both species are schooling fish.
* One species requires a school.
* Both species have compatible social behavior.

Example reasons:

* Social requirements align.
* One species should be kept in a proper school.
* Different social requirements require planning.

---

## 5. Predation Risk

Weight:

**20 Points**

Purpose:

Determines whether one species may prey upon the other based on size, diet, and behavior.

Example reasons:

* No predation risk detected.
* Large size difference creates predation risk.
* Carnivorous behavior increases risk.

---

## 6. Tank Size Compatibility

Weight:

**10 Points**

Purpose:

Compares minimum tank size requirements.

Example reasons:

* Tank size requirements align.
* One species requires a substantially larger aquarium.
* Larger aquarium recommended.

---

# Scoring Weights

| Rule        | Maximum Points |
| ----------- | -------------: |
| Temperature |             20 |
| pH          |             15 |
| Aggression  |             25 |
| Schooling   |             10 |
| Predation   |             20 |
| Tank Size   |             10 |

Total:

```
100 Points
```

---

# Compatibility Status Thresholds

|  Score | Status                    |
| -----: | ------------------------- |
| 96–100 | Overwhelmingly Compatible |
|  90–95 | Very Compatible           |
|  70–89 | Compatible                |
|  50–69 | Caution                   |
|   0–49 | Incompatible              |

These thresholds are intentionally designed to provide users with a more intuitive understanding of compatibility.

A score in the 90s represents an excellent pairing, while scores approaching 100 indicate species that are exceptionally well suited for living together.

---

# Reason Generation

Every evaluator is responsible for generating its own explanations.

Reasons should always be:

* Human readable
* Concise
* Positive when appropriate
* Actionable when caution is required

Example:

```
Temperature ranges overlap.
Species have similar temperament.
No predation risk detected.
Tank size requirements align.
```

Example caution:

```
One species requires a larger school.
Territorial behavior may require additional hiding places.
```

Example incompatibility:

```
Temperature requirements conflict.
Predation risk detected.
Aggression levels are incompatible.
```

The engine should avoid vague messages whenever possible.

---

# Why a Rule-Based System?

A rule-based system provides several important advantages:

* Predictable
* Transparent
* Easy to debug
* Easy to test
* Easy to expand
* No hidden decision making

Each compatibility decision can be traced back to measurable biological or husbandry data.

---

# Extending the Compatibility Engine

The compatibility engine is intentionally modular.

Each compatibility factor is implemented independently.

Adding a new compatibility factor should never require rewriting the engine.

Instead, follow the existing evaluation pattern.

## Implementation Workflow

### Step 1

Add any required species data.

Example:

```
minimum_GH
maximum_GH
preferred_flow
swimming_zone
```

---

### Step 2

Create a new evaluator.

Example:

```
evaluateWaterHardness()

evaluateFlow()

evaluateSwimmingZone()
```

Each evaluator should:

* Evaluate only one rule
* Return a score contribution
* Generate one or more reasons
* Remain independent from other evaluators

---

### Step 3

Assign a scoring weight.

Example:

```
Water Hardness

Maximum:
10 Points
```

Every new evaluator should have a clearly documented maximum contribution to the overall score.

If necessary, rebalance existing weights so the total remains meaningful.

---

### Step 4

Integrate into the scoring pipeline.

```
Temperature

↓

pH

↓

Aggression

↓

Schooling

↓

Predation

↓

Tank Size

↓

NEW RULE

↓

Aggregate Score
```

The evaluator should simply become another step in the existing pipeline.

No other evaluator should require modification.

---

### Step 5

Generate reasons.

Every evaluator should generate:

Positive reasons

Example:

```
Water hardness requirements align.
```

Caution reasons

Example:

```
Water hardness differs slightly.
```

Negative reasons

Example:

```
Water hardness requirements conflict.
```

---

### Step 6

Document the rule.

Every new evaluator should be added to this README, including:

* Purpose
* Weight
* Scoring behavior
* Example reasons
* Any assumptions

Keeping the documentation synchronized with the implementation ensures future contributors can understand and extend the engine confidently.

---

# Potential Future Compatibility Factors

The architecture is intentionally designed to support future expansion.

Possible future evaluators include:

* Water hardness (GH/KH)
* Flow preference
* Swimming zone
* Breeding aggression
* Fin-nipping tendencies
* Plant safety
* Reef-safe behavior (for future saltwater support)
* Bioload interactions
* Territorial footprint
* Activity level
* Lighting preference
* Aquascape preference
* Water current tolerance
* Species-specific exceptions
* Expert override rules

These additions should follow the same implementation workflow described above.

Because every rule is isolated, future enhancements should not require redesigning or rewriting the engine.

---

# Guiding Philosophy

The GuideMyTank Compatibility Engine is intended to assist aquarium planning—not replace responsible fishkeeping.

Compatibility scores are generated using measurable husbandry data and transparent evaluation rules.

The engine should always provide users with enough information to understand **why** a compatibility score was assigned, enabling informed decisions rather than relying solely on a numeric result.

As GuideMyTank evolves, new evaluators and improved biological data can be incorporated while preserving the engine's modular architecture, transparency, and maintainability.

# Compatibility Disclaimer

The GuideMyTank Compatibility Score is designed to help you evaluate how likely two aquarium species are to coexist successfully based on known aquarium husbandry data.

Our compatibility engine analyzes multiple factors, including:

- 🌡️ Temperature compatibility
- 💧 pH compatibility
- 😌 Temperament and aggression
- 🐟 Schooling and social behavior
- 🦈 Predation risk
- 🏠 Minimum tank size requirements

These factors are combined into an overall compatibility score and accompanied by clear explanations to help you understand the recommendation.

Compatibility scores are recommendations, not guarantees. Individual fish behavior can vary based on age, sex, temperament, tank size, aquascape, stocking density, water quality, and introduction method.

A future `/compatibility/disclaimer` page should explain:

- How compatibility scores work
- Recommendations versus guarantees
- Why fish behavior can vary
- Best practices when introducing new tankmates
- GuideMyTank’s transparent recommendation philosophy
