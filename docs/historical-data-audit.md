# Historical Data Audit

This file records the current reliability policy for the historical example archive. It deliberately avoids inventing individual ratings or exact source notes.

## Current Data Policy

Every historical example must have:

- Public figure name.
- Sex.
- Birth date.
- Clock time.
- Birthplace with coordinates.
- Calendar.
- IANA zone or deliberate manual offset.
- Image and alt text.

The presence of date, time, place, and image is not enough to call a record audited.

Natal-data source and interpretive-reference source are separate. A chart can be discussed in a secondary interpretive context without that context becoming the source for its birth time. Audit status must use natal metadata only: natal source label/URL, source type, rating, time-source wording, time confidence, and zone reliability.

## Normalized Reliability

When a person has no explicit `auditStatus`, Tyche derives display grouping only as:

- `partial` if source/rating/time-source metadata exists but is incomplete.
- `pending` if no individual audit metadata exists.

It does not infer `audited` from ordinary strings. Explicit `auditStatus: "audited"` is required.

When a person has no explicit `timeConfidence`, Tyche treats the time as `reported` rather than `exact`. This reflects that the app has a clock time but has not necessarily reviewed the individual source.

When a person has no IANA zone but has a manual offset, Tyche treats the zone as `historical`. This makes sect-boundary warnings more cautious.

## Fields To Add During Individual Audit

Use these fields only when individually checked:

```js
auditStatus: "audited" | "partial" | "pending",
timeConfidence: "exact" | "rounded-to-minute" | "rounded-to-5-min" | "rounded-to-15-min" | "rounded-to-hour" | "reported" | "uncertain",
zoneReliability: "iana" | "manual" | "lmt" | "historical" | "unknown",
sourceType: "birth-record" | "biography" | "rated-database" | "secondary-reference" | "unknown",
sourceUrl: "https://...",
roddenRating: "AA" | "A" | "B",
timeSource: { es: "...", en: "..." },
natalDataSource: {
  label: { es: "...", en: "..." },
  url: "https://...",
  type: "birth-record" | "biography" | "rated-database" | "secondary-reference" | "unknown",
  roddenRating: "AA" | "A" | "B",
  timeSource: { es: "...", en: "..." },
},
interpretiveReferences: [{
  label: { es: "...", en: "..." },
  type: "book" | "podcast" | "course" | "article" | "other",
  role: "central-example" | "brief-example" | "technical-mention" | "comparative-note",
  technique: "sect" | "ascendant-lord" | "lots" | "annual-profections" | "zodiacal-releasing" | "other",
  url: "https://...",
}],
```

Do not use C, DD, X, rectified, speculative, or time-unknown records unless explicitly approved.

## Current Archive Status

The current archive should be treated as an example archive with normalized caution:

- Records without explicit individual metadata are pending individual audit.
- Manual offsets are retained for reproducibility but do not prove civil-time certainty.
- Julian-calendar examples must keep both the calendar flag and visible label clear.
- No person should be described as audited unless `auditStatus: "audited"` is explicitly present.

This keeps the modal useful while avoiding false certainty.
