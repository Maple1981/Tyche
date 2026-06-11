# Historical Data Audit

This file records the current reliability policy for the historical example archive. It deliberately avoids inventing individual ratings or exact source notes.

The external audit for the current archive was closed on 2026-06-10. The per-person checklist is recorded in `docs/historical-character-audit.md`; the app stores the enforceable metadata in `HISTORICAL_AUDIT_ROWS`.

## Current Data Policy

The current public archive follows a strict production policy: published historical examples must be externally audited. The `partial` and `pending` states remain supported by the model and UI for future staging, deliberate review workflows, or explicitly approved exceptions, but they are not the normal public-archive policy.

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

When a person has no explicit `auditStatus` through either direct person metadata or `HISTORICAL_AUDIT_ROWS`, Tyche treats the record as:

- `pending`.

It does not infer `partial` or `audited` from ordinary source strings. Explicit audited or partial metadata is required. For the current archive, `HISTORICAL_AUDIT_ROWS` supplies `auditStatus: "audited"` through normalized metadata; future additions must add an audit row before the static contract test passes.

When a person has no explicit `timeConfidence`, Tyche treats the time as `reported` rather than `exact`. This reflects that the app has a clock time but has not necessarily reviewed the individual source. `reported` is deliberately conservative near the horizon; only `exact` avoids widening the sect-sensitivity threshold by itself.

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

For the current implementation, prefer adding future per-person birth-data audit metadata to `HISTORICAL_AUDIT_ROWS` rather than duplicating source fields inside the character object. Each row must include:

```js
{ id: "person-id", rating: "AA" | "A" | "B", source: "source class", url: "https://...", zoneReliability: "iana" | "manual" | "lmt" | "historical" | "unknown" }
```

Use optional `sourceDateLabel` only when the source date and the stored chart date need clarification, especially for Julian/Gregorian equivalence.

## Current Archive Status

The current archive is closed as an externally audited example archive with normalized caution:

- Every current character has an individual `HISTORICAL_AUDIT_ROWS` entry with a rated external natal-data source, source URL, time-confidence classification, zone-reliability classification, and audit date.
- New records without an audit row are not allowed to pass the static contract test.
- The production test intentionally requires the current public archive to contain audited records only. If a future release deliberately exposes partial or pending examples, that policy change must be documented and the tests should validate each state separately instead of relaxing the rule silently.
- Manual offsets are retained for reproducibility but do not prove civil-time certainty.
- Julian-calendar examples must keep both the calendar flag and visible label clear.
- No person should be described as audited unless audited metadata is explicitly present through the character object or `HISTORICAL_AUDIT_ROWS`.

This keeps the modal useful while avoiding false certainty.
