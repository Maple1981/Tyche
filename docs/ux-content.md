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
- Traditional Hellenistic vs Traditional + modern planets mode.
- Time zone and manual offset controls.
- Coordinates controls.
- Optional sex metadata. It does not affect current base calculations and is reserved for historical examples or future traditional techniques that explicitly require it.

## Output Hierarchy

After calculation, show the result in this order:

1. Chart wheel.
2. Sect.
3. Angles and time-zone basis.
4. Hour-Marker lord panel.
5. Lunar condition.
6. Plain-language natal reading with collapsible technical evidence.
7. Planet table.
8. Whole sign houses.
9. Lots.
10. Configurations/aspects.
11. Collapsed technical notes, calculation limits, and audit details.

The calculated chart view should include a visible but visually secondary technical-notes section, not only footer text. Keep it out of the immediate sect card. It should state chart-specific calculation limits, approximate planetary precision, angle sensitivity to time/place/zone, and boundary/audit details. General privacy, educational-use, attribution, and external-service language belongs in the footer.

The chart header should show date, time, and birthplace. Optional sex metadata stays in advanced options and historical cards, but should not appear in the calculated chart header while it does not affect the base judgment.

Advanced options that move away from the default model should warn immediately, not only after calculation. This applies to Julian calendar, approximate sidereal zodiac, and modern planets shown as an unweighted layer in traditional mode.

Keep three output layers visually distinct:

- Reading: plain-language synthesis and topical emphasis.
- Evidence: technical reasons behind the reading, including scores, lot testimony, reception, and lunar condition.
- Audit: calculation sensitivity, boundary warnings, precision limits, external services, and data reliability.

Do not make boundary warnings or dense lot audits look like narrative interpretation paragraphs. They are technical controls for trust and traceability.

The Hour-Marker lord panel should answer:

- Which planet rules the Ascendant sign?
- Where is it by sign, degree, and house?
- Is it angular, succedent, or cadent?
- What essential dignities or weaknesses does it have?
- What life topics are emphasized by its house?

Whole Sign Houses should explain that the MC and IC are astronomical points and do not always fall in houses 10 and 4.

The `Sect` card should stay doctrinally narrow: chart type, sect light, benefic of sect, malefic of sect, malefic contrary to sect, and any liminal/sensitive sect warning. Put Ascendant, Descendant, MC, IC, and the time-zone basis in a separate `Angles and zone` card.

If a liminal or sensitive sect chart needs alternate roles or alternate Fortune/Spirit positions, keep that material inside a collapsible subsection within the Sect card.

The `Zone used` value should stay visually clean: show the actual IANA zone or UTC offset, not the provenance suffix. Explain whether it came from IANA rules, manual offset, LMT, or historical-character data in the glossary/help modal for the label.

## Tone

Use concise, sober interpretive language. Avoid deterministic fatalism, medical/legal claims, and overly modern psychological sun-sign phrasing.

The interpretation panel should read like a clear human explanation first. Use technical terms such as benefic, malefic, sect, testimony, dignity, and angularity in the evidence layer or glossary; translate them in the first layer into support, tension, repeated signals, resources, visibility, and difficulty.

Do not erase traditional difficult topics from technical tables or glossary entries. In the plain reading, contextualize them so they do not sound like a fatalistic sentence.

Use a consistent double layer:

- Visible reading: when a difficult place such as 6, 8, or 12 is central, include both the traditional topics and a contextual caution.
- Technical evidence: preserve the traditional topics plainly so the user can audit the doctrine behind the reading.

Use paired labels such as `Lugares/Casas` when a UI element needs both traditional vocabulary and immediate clarity.

Visible `dl`, `ul`, and `ol` entries should start with an uppercase initial word. Internal reason codes and translated fragments may remain lowercase in data, but rendered definition/list items should be normalized for reading polish.

## Historical Archive Metadata

Keep natal-data source and interpretive-reference source separate. The historical data model treats natal metadata as the only basis for audit status:

- Natal-data source: source label, URL when audited, source type, rating, and time-source wording.
- Reliability metadata: `auditStatus`, `timeConfidence`, and `zoneReliability`.
- Interpretive references: secondary notes that a chart was discussed as an example.

Interpretive references should remain structured separately by:

- Type: book, podcast, course, article, or other.
- Role: central example, brief example, technical mention, or comparative note.
- Technique: sect, Ascendant lord, lots, annual profections, zodiacal releasing, or another named method.

Do not imply that an interpretive example is the source for the birth time unless the natal data source explicitly says so.

Historical character cards should stay compact: show only date, place, and sex in the repeated card body. Put repeated provenance fields such as natal-data source, Rodden rating, time source, source date, and interpretive references in a small detail popover opened from the `Date`/`Fecha` label.

Historical character Wikipedia links should follow the active UI language: Spanish UI opens `es.wikipedia.org`, and English UI opens `en.wikipedia.org`.

## Future Topic Readings

The current interpretation is a general natal reading. Topic-specific readings should be added as a separate module before prediction/timing modules become too prominent. Suggested topics:

- Life direction.
- Profession and reputation.
- Relationships.
- Resources.
- Body, illness, and strain.
- Parents, home, and foundations.
- Travel, religion, astrology, and study.

Each topic should use its own significators and evidence rather than recycling the general focus score as if it answered every question.

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
