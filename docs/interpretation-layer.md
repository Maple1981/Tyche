# Interpretation Layer

## Purpose

The interpretation layer turns calculated chart data into a natal judgment. It must not work as a list of isolated placement keywords. Its job is to collect repeated testimonies, weight them, and explain why a reading follows from the technical craft data.

The first implementation is natal only. Timing, prediction, and activation require separate modules.

The user-facing layer should be plain and accessible. Technical terms may remain in the evidence section and glossary, but the first reading should say what the chart emphasizes in ordinary language.

## Reading Order

The default hierarchy is:

1. Sect.
2. Ascendant and domicile lord of the Ascendant.
3. House, sign, angularity, and essential condition of the Ascendant lord.
4. Angular visible planets.
5. Benefic of the sect and malefic contrary to sect.
6. MC/IC as astronomical points within Whole Sign Houses.
7. Visible planets close to exact angles as an additional prominence flag.
8. Fortune and Spirit, when selected.
9. Solar phase and concealment of key planets.
10. Configurations, bonification, maltreatment, overcoming, and reception.
11. Lunar condition and application/separation.
12. Triplicity rulers of the sect light as background support.

This order keeps the app from treating every placement as equally important.

The visible summary should normally show the first three strongest topical focuses, not only one dominant house. A single house can be technically central without describing the whole chart by itself.

Public projection should be its own plain-language block when interpretation is rendered. It should combine MC, the 10th whole-sign house, the ruler of the 10th house, and visible planets in the 10th. This block clarifies reputation, craft, rank, and action in public without replacing the Ascendant lord as the main life-direction thread.

The public transcript synthesis in `docs/public-transcript-synthesis.md` supports this order as Tyche's current source map for practical delineation.

## Unit of Judgment

A judgment should combine:

`planet + house + sign + condition + angularity + sect + configurations + rulerships + lots`

The house supplies the life topic. The planet supplies the actor or principle. The sign describes style and environment. Essential condition describes whether the planet has resources of its own or acts with friction. Angularity describes prominence, not automatic benefit.

## Rulership Grammar

Rulers of places are one of the main ways Tyche should connect topics:

- A place supplies the topic.
- The ruler of that place administers or carries that topic.
- The ruler's house shows where the topic is redirected, expressed, supported, or pressured.
- The ruler's condition, angularity, sect status, solar phase, and configurations describe how well that administration works.

This applies even when a place is empty. Do not treat empty places as inactive when their rulers are prominent.

The detailed weighting rules live in `docs/judgment-matrix.md`. That matrix is the checklist for whether a calculated factor should enter the visible report, the evidence layer, or a future module.

Prominence and ease must remain separate:

- Angular means strong, visible, active, or dominant.
- Domicile, exaltation, and triplicity indicate resources.
- Detriment and fall indicate friction.
- The benefic of sect tends to show help or cohesion.
- The malefic contrary to sect needs special attention as a sharper source of pressure.
- Reception can mitigate pressure or strengthen help when configured planets receive one another by dignity.

In the plain-language layer, translate technical roles:

- Benefic of sect: the planet that most facilitates.
- Malefic contrary to sect: the planet that most demands attention.
- Angularity: visibility and strength, not automatic ease.
- Fortune: what arrives through body, circumstance, and events.
- Spirit: what the person tries to direct through intention and action.

The plain-language layer may add context for difficult houses, but it should not censor the traditional topics. Technical surfaces can retain words such as illness, death, enemies, loss, and confinement when those are the relevant house topics.

When space allows, UI labels can use paired terms such as `Lugares/Casas` and `Lugar/Casa` so the traditional vocabulary remains visible while the interface stays readable.

## Output Structure

The UI should expose three levels:

1. One-sentence reading.
2. Plain-language interpretation.
3. Technical evidence.

The evidence list is not decoration. It is the audit trail that shows why Tyche has produced a judgment. It can be collapsed by default, but it must remain easy to open. If the evidence is weak or missing, the text should say so plainly instead of pretending certainty.

The reading may also show compact qualitative indicators, such as prominence, ease, support, and tension. These are reading aids, not absolute scores.

## Timing Boundary

Natal interpretation describes the structure of the chart. Prediction or activation in time must be handled by separate techniques such as annual profections, zodiacal releasing, and transits to activated points.

Do not mix timing language into the natal report unless a timing module explicitly supplies activated houses, planets, or periods.
