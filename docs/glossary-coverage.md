# Glossary Coverage

Tyche uses glossary popovers for compact technical terms. The glossary is not a substitute for the judgment evidence; it explains terms, while evidence explains why a chart receives a reading.

## Required Coverage

The glossary should cover:

- Birth data controls: date, time, place, latitude, longitude, IANA zone, UTC offset, calendar.
- Technical defaults: tropical zodiac, Whole Sign Houses, aspect mode, orb, Egyptian bounds, strict/mixed technique.
- Planets, visible classical planets, modern planets as optional layer.
- Sect, sect light, benefic of sect, malefic of sect, malefic contrary to sect.
- Ascendant, Ascendant lord, MC, IC, Descendant.
- Whole-sign places/houses and topics.
- Essential condition, major dignity, triplicity support, own minor dignity, degree administration, detriment, fall.
- Bounds, bound lord, decan, decan lord.
- Lots: Fortune, Spirit, Eros, Necessity, Courage, Victory, Nemesis.
- Solar phase: morning/evening, under the beams, combustion, in the heart/cazimi, chariot protection.
- Lunar condition: phase, applications/separations, void of course by 30 degrees, void before sign exit, no close application within orb.
- Configurations: copresence, sextile, square, trine, opposition, aversion, sign-based, degree-based, overcoming.
- Reception, mutual reception, bonification, maltreatment.
- Precision/audit terms: ephemeris, boundary audit, sect-sensitive context, historical/manual offset.

## Wording Rules

- Spanish UI should use `Ascendente`, not `Hour-Marker`, except in English mode.
- `Condición esencial` must stay limited to essential dignities and debilities, not angularity or reception.
- `Lugar/Casa` or `Lugares/Casas` should remain visible where space allows.
- Difficult terms such as illness, death, enemies, and loss may appear in technical evidence; the plain reading should contextualize them rather than erase them.
- Glossary text should explain Tyche's implemented convention when traditions vary.

## Human Audit Checklist

Automated tests only verify that every `data-glossary` key used in HTML has an entry. A content pass should also check:

- The first sentence defines the term plainly.
- The second sentence, when present, states Tyche's implemented convention or limitation.
- The Spanish text does not leave avoidable English technical labels except deliberate dual labels such as `Whole Sign Houses`.
- The English and Spanish entries carry the same doctrine even when they are not literal translations.
- The entry explains the concept; it does not argue the full judgment. Evidence belongs in the interpretation layer.
