# UX and Content Model

## First Screen

The first screen should be the working chart creator, not a landing page.

Primary fields:

- Birth date.
- Birth time.
- Birthplace.
- Submit button.
- Advanced options disclosure.

Advanced options:

- Zodiac: tropical default.
- Houses: Whole Sign default.
- Aspect mode: sign, degree, or both.
- Orb.
- Lots to show.
- Terms/bounds system.
- Include modern planets.
- Strict Hellenistic vs mixed modern mode.
- Time zone and manual offset controls.
- Coordinates controls.
- Optional sex metadata. It does not affect current base calculations and is reserved for historical examples or future traditional techniques that explicitly require it.

## Output Hierarchy

After calculation, show the result in this order:

1. Chart wheel.
2. Sect and core angles.
3. Hour-Marker lord panel.
4. Plain-language natal reading with technical evidence.
5. Planet table.
6. Whole sign houses.
7. Lots.
8. Configurations/aspects.
9. Notes on astronomical precision.

The Hour-Marker lord panel should answer:

- Which planet rules the Ascendant sign?
- Where is it by sign, degree, and house?
- Is it angular, succedent, or cadent?
- What essential dignities or weaknesses does it have?
- What life topics are emphasized by its house?

Whole Sign Houses should explain that the MC and IC are astronomical points and do not always fall in houses 10 and 4.

## Tone

Use concise, sober interpretive language. Avoid deterministic fatalism, medical/legal claims, and overly modern psychological sun-sign phrasing.

The interpretation panel should read like a clear human explanation first. Use technical terms such as benefic, malefic, sect, testimony, dignity, and angularity in the evidence layer or glossary; translate them in the first layer into support, tension, repeated signals, resources, visibility, and difficulty.

Examples of preferred language:

- "This placement emphasizes..."
- "Traditional judgment gives weight to..."
- "This topic is made more visible because..."
- "This condition can mitigate..."

Avoid:

- "You are destined to..."
- "This proves..."
- "Your sun sign means..."

## Multilingual Text

The interface supports English and Spanish. Keep labels short enough for mobile. Avoid hard-coded explanatory paragraphs inside compact controls. Use tables, badges, and compact panels for repeated chart data.

## Visual Direction

The visual design is:

- Pearl white and light gray in day mode.
- Deep navy and desaturated blue ornaments.
- Blue Greek-key friezes as structural dividers.
- Serif typography stored locally.
- Zodiac and planetary glyphs used as visual anchors.
- Night mode with dark ink, muted blue ornaments, and high contrast text.

Do not use a marketing hero. The usable chart creator is the first viewport.
