# Precision and Reliability Limits

Tyche is an educational browser app. It can calculate a coherent Hellenistic natal chart, but it should not be presented as a professional rectification or research ephemeris.

## Planetary Positions

- Normal runtime uses the vendored local Astronomy Engine file.
- The approximate target communicated in the UI is about +/-1 arcminute.
- The compact built-in formulas remain only as fallback if the local vendor file fails.
- Results should be checked against professional ephemerides before critical research.

## Angles and Houses

Ascendant, MC, IC, Descendant, and Whole Sign House placement are highly sensitive to:

- Birth time.
- Latitude and longitude.
- Historical time zone or manual offset.
- Calendar conversion for older dates.
- Browser IANA time-zone behavior.

Small changes can alter:

- Ascendant sign and all whole-sign houses.
- Sect when the Sun is near the horizon.
- Fortune/Spirit formulas and positions.
- MC/IC whole-sign house.
- Lot lords and lot houses.

## Time Zones

Tyche distinguishes:

- `iana`: named time zone with browser historical offset support.
- `historical`: manually stored historical example offset.
- `manual`: user-entered fallback offset.
- `lmt`: local mean time or similar non-standard historical handling.
- `unknown`: insufficient reliability.

Historical/manual offsets are reproducibility data, not guarantees that civil-time practice has been fully researched.

## Calendars and BCE

Gregorian dates are the default. Julian support is basic and requires explicit warning.

BCE dates are blocked until a dedicated CE/BCE control exists. This avoids silent confusion between historical BCE numbering and astronomical year numbering, where year 0 exists.

## Historical Examples

Historical examples are public example charts. The current archive is externally audited as of 2026-06-10, but that does not make the charts professional rectifications or guarantee every historical civil-time detail beyond the stored source classification.

Unless a future record carries explicit audited metadata, Tyche treats it as pending or partial:

- Missing individual source/rating metadata should never be silently upgraded.
- A reported clock time is not the same as an audited exact time.
- A manual offset should be treated as historical-example data unless an IANA zone is present.
- A rated natal-data source should remain separate from any secondary interpretive source that discusses the chart.

Reliability can widen boundary warnings, especially near sect or angle changes.
