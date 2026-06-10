# Calculation Rules

## Required Birth Data

Minimum inputs:

- Birth date.
- Exact birth time.
- Birthplace as city/country or coordinates.
- Historical time zone, ideally computed from place plus date.

The static app cannot guarantee global place lookup. It should support a curated city list, manual coordinates, and manual or IANA time zone selection. If a recognized IANA zone is available, use it to compute the historical UTC offset for the birth date.

## Time and Zodiac

Use UTC for astronomical calculations. Convert local civil time to UTC through:

1. Recognized IANA time zone, with historical offset from browser `Intl` data.
2. Manual offset fallback when the place or time zone is not recognized.

When a manual offset is used, label it as manual or as historical example data. Do not imply that an old local mean time or historical offset came from IANA data.

Default zodiac is tropical. A sidereal option may be present only as an advanced setting and should be labeled as outside the strict default.

## Angles

Calculate:

- Julian day.
- Mean obliquity.
- Local sidereal time.
- MC from local sidereal time.
- Ascendant from local sidereal time and latitude; verify that the formula returns the eastern horizon, not the western horizon/Descendant.
- IC and Descendant by opposition.

Whole sign houses begin from the Ascendant sign.

As a secondary prominence flag, mark visible planets within about 5 degrees of the exact Ascendant, Descendant, MC, or IC. This does not change Whole Sign House angularity; it only adds an "near exact angle" testimony for interpretation and evidence.

Boundary notices are audit flags, not reinterpretations. Show them when:

- The Ascendant is within 1 degree of a sign change.
- A selected lot is within 1 degree of a sign/whole-sign-house change.
- A visible planet is within 30 arcminutes of an Egyptian bound change.

Show the boundary audit in technical data, and repeat the detailed notices in the interpretation evidence when any notices exist.

## Sect

Sect is determined by the Sun's altitude:

- Sun above horizon: day chart.
- Sun below horizon: night chart.

Derived sect roles:

- Sect light: Sun by day, Moon by night.
- Benefic of sect: Jupiter by day, Venus by night.
- Malefic of sect: Saturn by day, Mars by night.
- Benefic contrary to sect: Venus by day, Jupiter by night.
- Malefic contrary to sect: Mars by day, Saturn by night.

Mercury is assigned toward day if it is a morning star and toward night if it is an evening star.

## Essential Condition

Evaluate each traditional planet by essential dignities and weaknesses:

- Domicile.
- Exaltation.
- Triplicity ruler of the sign.
- Egyptian bound.
- Decan/face.
- Detriment.
- Fall.

Domicile, exaltation, triplicity, bound, and decan are dignities. Detriment and fall are essential weaknesses and should not be described as dignities.

For weighting, do not collapse all dignity into one strength score:

- Domicile and exaltation are major resources.
- Active triplicity by sect is real support, but it is not equivalent to domicile or exaltation.
- Out-of-sect and cooperating triplicity remain relevant but lower priority.
- Bounds and decans are minor dignities.

Triplicity is not weighted as a single undifferentiated dignity. The ruler active by sect is the strongest triplicity testimony, the contrary/out-of-sect ruler is secondary, and the cooperating ruler modifies the support of both.

Triplicity rulers:

| Element | Day | Night | Cooperating |
|---|---|---|---|
| Fire | Sun | Jupiter | Saturn |
| Earth | Venus | Moon | Mars |
| Air | Saturn | Mercury | Jupiter |
| Water | Venus | Mars | Moon |

Egyptian bounds:

| Sign | Bounds |
|---|---|
| Aries | Jupiter 0-6, Venus 6-14, Mercury 14-21, Mars 21-26, Saturn 26-30 |
| Taurus | Venus 0-8, Mercury 8-15, Jupiter 15-22, Saturn 22-26, Mars 26-30 |
| Gemini | Mercury 0-6, Jupiter 6-12, Venus 12-17, Mars 17-24, Saturn 24-30 |
| Cancer | Mars 0-7, Venus 7-13, Mercury 13-19, Jupiter 19-26, Saturn 26-30 |
| Leo | Jupiter 0-6, Venus 6-11, Saturn 11-18, Mercury 18-24, Mars 24-30 |
| Virgo | Mercury 0-7, Venus 7-13, Jupiter 13-17, Mars 17-21, Saturn 21-30 |
| Libra | Saturn 0-6, Mercury 6-14, Jupiter 14-21, Venus 21-28, Mars 28-30 |
| Scorpio | Mars 0-7, Venus 7-11, Mercury 11-19, Jupiter 19-24, Saturn 24-30 |
| Sagittarius | Jupiter 0-12, Venus 12-17, Mercury 17-21, Saturn 21-26, Mars 26-30 |
| Capricorn | Mercury 0-7, Jupiter 7-14, Venus 14-22, Saturn 22-26, Mars 26-30 |
| Aquarius | Mercury 0-7, Venus 7-13, Jupiter 13-20, Mars 20-25, Saturn 25-30 |
| Pisces | Venus 0-12, Jupiter 12-16, Mercury 16-19, Mars 19-28, Saturn 28-30 |

Decans follow the repeating Chaldean order by ten-degree segments, beginning with Mars for the first decan of Aries.

## Configurations

Use sign-based configurations as the strict default:

- Copresence: same sign.
- Sextile: signs two signs apart, 60 degrees by degree.
- Square: signs three signs apart, 90 degrees by degree.
- Trine: signs four signs apart, 120 degrees by degree.
- Opposition: signs six signs apart, 180 degrees by degree.
- Aversion: signs that do not see one another by the above relationships.

Copresence is a cohabitation testimony rather than an automatically benefic or malefic relationship. It can intensify support or pressure depending on the planets involved, sect, essential condition, reception, degree closeness, and solar visibility.

Degree-based aspects are optional and use configurable orbs. A planet can be configured by sign but not perfected by degree.

The natal judgment should continue to use sign-based configuration as the traditional frame even when the user asks the tables to show degree-based aspects. Degree closeness acts as a precision/perfection layer rather than replacing sign-based judgment.

Right-sided/superior configurations matter. In sextiles, squares, and trines, the planet earlier in zodiacal order by the relevant configured interval overcomes the planet later in zodiacal order. The superior square, or being upon the tenth, deserves special emphasis. The direction must remain explicit: a benefic or malefic overcoming a significator is not judged the same as a significator retaining the superior position against that benefic or malefic.

Reception should be calculated only when two planets are configured. A planet receives another when it has dignity in the sign or bound occupied by the other planet:

- Strong reception: domicile or exaltation.
- Medium reception: active-by-sect triplicity or bound.
- Weak reception: out-of-sect triplicity or cooperating triplicity.

Tyche uses "reception by dignity" in this broad technical sense. Domicile reception remains the principal form, with exaltation also treated as strong.

Reception mitigates pressure when a malefic testimony is received by the significator, or when the malefic receives the significator in a way that gives the contact a formal channel. It can also strengthen benefic support. It should be shown as its own testimony instead of being hidden inside a generic aspect score.

## Lots

All lots are projected from the Ascendant in zodiacal order.

Principal lots:

- Fortune: day Asc + Moon - Sun; night Asc + Sun - Moon.
- Spirit: day Asc + Sun - Moon; night Asc + Moon - Sun.

The standard rule reverses the luminaries by day and night. A small number of near-horizon charts may be discussed with a diurnal lot calculation when the Sun is just below the Ascendant and the example is explicitly framed that way. Tyche should not silently switch formulas for ordinary charts; if that exception is ever implemented, it should be visible as a technical option or a clearly labeled historical-example override.

Eros and Necessity use the older Fortune/Spirit-based tradition:

- Eros: day Asc + Spirit - Fortune; night Asc + Fortune - Spirit.
- Necessity: day Asc + Fortune - Spirit; night Asc + Spirit - Fortune.

Hermetic planetary lots:

- Courage: day Asc + Fortune - Mars; night Asc + Mars - Fortune.
- Victory: day Asc + Jupiter - Spirit; night Asc + Spirit - Jupiter.
- Nemesis: day Asc + Fortune - Saturn; night Asc + Saturn - Fortune.

For each lot, show sign, degree, whole sign house, domicile lord, lord's house, and whether benefics/malefics are copresent or configured.

## Solar Phase

For each non-luminary planet:

- Morning/oriental if earlier than the Sun in zodiacal order and outside the solar beams.
- Evening/occidental if later than the Sun in zodiacal order and outside the solar beams.
- Under the beams within 15 degrees of the Sun.
- Combust within 8 degrees.
- Cazimi within 1 degree.

For strict mode, use "in the heart" for the 1-degree condition and show "cazimi" as a familiar parenthetical label. Tyche intentionally uses this broader 1-degree convention; some narrower traditions use about 17 arcminutes, so the UI must describe the convention rather than imply universality.

When a planet is under the beams, combust, or in the heart, show the exact distance from the Sun in the planet table. For under-the-beams and combust states, also show whether chariot mitigation is present by domicile, exaltation, or bound.

## Annual Profections Boundary

Annual profections are a future timing module. The basic calculation is one sign per year from the rising sign; the sign reached by age and its domicile lord become activated for that year. Tyche must not use this in the natal judgment until the UI supplies an age/year and the module can show the profected place, lord of the year, and activated natal testimonies.

## Lunar Condition

Calculate:

- Lunar phase angle from Sun to Moon.
- Named phase.
- Last separating major contact and next applying major contact to the visible planets, using conjunction for bodily contact and sextile, square, trine, and opposition for the other major relationships.
- Void-of-course by the broader Hellenistic 30-degree definition: the Moon is void when no major contact perfects within the next 30 degrees of lunar motion.
- Void-of-course by sign exit: show separately whether the Moon perfects a major contact before leaving its current sign.
- A separate modern/orb-style indicator for whether there is no applying contact within the displayed lunar orb. Do not collapse this into the Hellenistic void-of-course judgment.
