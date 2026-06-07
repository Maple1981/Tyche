# Tyche Agent Notes

## Project Scope

Tyche is a static, frontend-only web application for strict Hellenistic natal chart work. Keep it pure `html + css + js` with no backend, no build step, and no copied source attachments.

The default practice model is traditional:

- Tropical zodiac by default.
- Whole Sign Houses by default.
- Seven visible planets as the base set: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
- Modern planets may be displayed only as optional mixed-mode additions.
- Traditional domicile rulers only: Aries/Scorpio Mars, Taurus/Libra Venus, Gemini/Virgo Mercury, Cancer Moon, Leo Sun, Sagittarius/Pisces Jupiter, Capricorn/Aquarius Saturn.
- The Hour-Marker/Ascendant and its domicile lord are central. Always surface the house and condition of the Ascendant ruler prominently.

## Calculation Priorities

Core derived data:

- Ascendant/Hour-Marker, MC, IC, Descendant.
- Whole sign houses from the rising sign.
- MC/IC sign and their whole sign house.
- Sect by solar altitude: diurnal if the Sun is above the horizon, nocturnal if below.
- Benefic/malefic of the sect: Jupiter/Saturn for day, Venus/Mars for night.
- Dignities: domicile, detriment, exaltation, fall, triplicity, Egyptian bounds, decans.
- Angularity by whole sign: angular 1/4/7/10, succedent 2/5/8/11, cadent 3/6/9/12.
- Lots: Fortune, Spirit, Eros, Necessity, Courage, Victory, Nemesis.
- Solar phase states: morning/evening, under beams, combustion, cazimi.
- Lunar condition: phase, applying/separating aspects, optional void-of-course.

This app uses approximate browser-side astronomy. Make that limitation visible in the UI and documentation; do not present the results as professional ephemeris-grade.

## Interpretive Guardrails

Avoid modern conflations:

- Do not equate Aries with the first house, Taurus with the second, etc.
- Do not make Uranus, Neptune, or Pluto part of the strict base reading.
- Do not use modern sign rulers.
- Do not make psychological sun-sign text the center of the reading.

Preferred reading order:

1. Determine sect.
2. Inspect the Hour-Marker and domicile lord of the Hour-Marker.
3. Inspect angularity and condition of the seven visible planets.
4. Inspect benefic and malefic of sect by house and relation.
5. Inspect Fortune, Spirit, their rulers, and derived context.
6. Use triplicity rulers of the sect light for broad support/stability.

## UI Direction

The interface should feel mobile-first, calm, scholarly, and usable:

- White or pearl-gray background in day mode.
- Deep blue Greek-key/frieze ornamentation.
- Serif display/body type with a readable Google Font stored locally.
- Standard zodiac and planetary glyphs.
- Day/night theme toggle.
- English/Spanish language toggle.
- First-screen form fields: date, exact time, birthplace, optional sex/gender, advanced options button.
- Advanced options: zodiac, house system, orb, lots, terms system, modern planets, strict vs mixed mode.

## Repository Hygiene

- Keep all synthesized doctrine in `docs/*.md`.
- Do not add source PDFs, spreadsheets, extracts, OCR dumps, or attachment-derived scratch files to the repository.
- Do not include personal chart examples or personal data in docs.
- Do not mention external source names in the project documentation.
- Hard rule: do not run `git push`, publish, deploy, or update GitHub Pages unless the user explicitly asks for that exact action in the current turn.
