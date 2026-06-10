# Judgment Codebook

This file records stable internal codes used for tests, audit trails, and documentation. User-facing copy may change; these codes should change only deliberately.

## Test API

- `TycheTest.schemaVersion`: current regression helper schema. Current value: `2`. Increment when exposed helper names or result shapes change.
- `TycheTest` is installed only when the URL contains `?test=regression`.

## Boundary Codes

| Code | Meaning | Required structured fields |
|---|---|---|
| `sect-boundary` | Sun close enough to horizon for sect-dependent judgment to be sensitive. | `distance`, `threshold`, `thresholdReasonCodes`, `changeCodes`, `actionCode` |
| `asc-sign-boundary` | Ascendant close to a sign change. | `distance`, `changeCodes`, `actionCode` |
| `mc-sign-boundary` | MC close to a sign change. | `distance`, `boundarySideCode`, `currentSign`, `possibleSign`, `currentHouse`, `possibleHouse` |
| `ic-sign-boundary` | IC close to a sign change. | `distance`, `boundarySideCode`, `currentSign`, `possibleSign`, `currentHouse`, `possibleHouse` |
| `lot-boundary:{lot}` | A calculated lot close to a sign/whole-sign-house change. | `distance`, `lotKey`, `changeCodes`, `actionCode` |
| `planet-bound-boundary:{planet}` | Visible planet close to an Egyptian bound change. | `distance`, `planetKey`, `changeCodes`, `actionCode` |

Common `changeCodes` include `sect`, `sect-light`, `benefic-malefic-of-sect`, `contrary-malefic`, `fortune-spirit-formulas`, `general-judgment`, `whole-sign-houses`, `lot-house`, `lot-lord`, `degree-administration`, `own-minor-dignity`, and `bound-reception`.

## Score Reason Codes

Score items must carry both a human `reason` and a stable `reasonCode`.

| Prefix | Meaning |
|---|---|
| `asc-lord:{planet}` | House of the Ascendant ruler. |
| `sect-light:{planet}` | House of the sect light. |
| `mc-house` | Whole-sign house containing the MC. |
| `tenth-ruler:{planet}` | House of the 10th whole-sign place ruler. |
| `angular-planet:{planet}` | Visible planet in an angular whole-sign house. |
| `near-angle:{planet}:{angle}` | Visible planet close to Ascendant, Descendant, MC, or IC. |
| `lot:fortune` / `lot:spirit` | Principal lot house. |
| `lot-lord:{lot}:{planet}` | House of the principal lot's domicile lord. |
| `triplicity:active:{planet}` | Active triplicity ruler of the sect light. |
| `triplicity:out-of-sect:{planet}` | Out-of-sect triplicity ruler of the sect light. |
| `triplicity:cooperating:{planet}` | Cooperating triplicity ruler of the sect light. |

Modern planets must not appear in base Hellenistic score reason codes.

## Historical Reliability Codes

`auditStatus`:

- `audited`: individual time source, reliable rating/equivalent, and clear zone/offset have been reviewed.
- `partial`: useful but incomplete metadata, rounded time, missing rating/source detail, or inferred zone.
- `pending`: no individual audit yet.

`timeConfidence`:

- `exact`: documentary or audited exact clock time; does not widen the sect threshold by itself.
- `rounded-to-minute`: minute-level clock time that may still be rounded or copied from a secondary presentation.
- `rounded-to-5-min`: rounded to a five-minute mark.
- `rounded-to-15-min`: rounded to a quarter-hour mark.
- `rounded-to-hour`: rounded to the hour.
- `reported`: exact-looking time from memory, biography, or otherwise non-documentary report; useful, but treated as sensitive near the horizon.
- `uncertain`: insufficient confidence for time-sensitive judgment.

`zoneReliability`:

- `iana`
- `manual`
- `lmt`
- `historical`
- `unknown`

Historical audit records may also expose:

- `externalAuditDate`: date when the character's external natal-data source was reviewed.
- `sourceDateLabel`: optional human label when the external source date and the stored chart date need calendar clarification.

Sect sensitivity should rely on these reliability codes, not on whether the chart belongs to a named historical figure.
