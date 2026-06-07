# Interpretation Layer

## Purpose

The interpretation layer turns calculated chart data into a natal judgment. It must not work as a list of isolated placement keywords. Its job is to collect repeated testimonies, weight them, and explain why a reading follows from the technical craft data.

The first implementation is natal only. Timing, prediction, and activation require separate modules.

## Reading Order

The default hierarchy is:

1. Sect.
2. Ascendant and domicile lord of the Ascendant.
3. House, sign, angularity, and essential condition of the Ascendant lord.
4. Angular visible planets.
5. Benefic of the sect and malefic contrary to sect.
6. MC/IC as astronomical points within Whole Sign Houses.
7. Fortune and Spirit, when selected.

This order keeps the app from treating every placement as equally important.

## Unit of Judgment

A judgment should combine:

`planet + house + sign + condition + angularity + sect + configurations + rulerships + lots`

The house supplies the life topic. The planet supplies the actor or principle. The sign describes style and environment. Essential condition describes whether the planet has resources of its own or acts with friction. Angularity describes prominence, not automatic benefit.

Prominence and ease must remain separate:

- Angular means strong, visible, active, or dominant.
- Domicile, exaltation, and triplicity indicate resources.
- Detriment and fall indicate friction.
- The benefic of sect tends to show help or cohesion.
- The malefic contrary to sect needs special attention as a sharper source of pressure.

## Output Structure

The UI should expose three levels:

1. Clear summary.
2. Traditional reading.
3. Technical evidence.

The evidence list is not decoration. It is the audit trail that shows why Tyche has produced a judgment. If the evidence is weak or missing, the text should say so plainly instead of pretending certainty.

## Timing Boundary

Natal interpretation describes the structure of the chart. Prediction or activation in time must be handled by separate techniques such as annual profections, zodiacal releasing, and transits to activated points.

Do not mix timing language into the natal report unless a timing module explicitly supplies activated houses, planets, or periods.
