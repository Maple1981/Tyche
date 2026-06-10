# Historical Character Audit

External natal-data audit closed on 2026-06-10.

All current historical examples have an individual Astro-Databank entry with Rodden rating `AA`, `A`, or `B`. Tyche stores only structured audit metadata: source label, link, Rodden rating, time confidence, zone reliability, and audit date. It does not store raw source-note dumps.

External source index: https://www.astro.com/astro-databank/

## Audit Rules

- `AA`: treated as exact clock-time confidence when the app data matches the linked entry.
- `A` or `B`: treated as externally audited but reported clock-time confidence, so time-sensitive boundary warnings may still widen when relevant.
- `lmt`: used when the linked entry explicitly relies on local mean time.
- `historical`: used for historical civil, standard, daylight, war-time, or other deliberate non-IANA offsets.
- New characters must add a row in `HISTORICAL_AUDIT_ROWS`; otherwise static tests fail.
- C, DD, X, rectified, speculative, or time-unknown records remain excluded unless explicitly approved.

## Future Addition Checklist

When adding a new historical character:

1. Add the person entry to `HISTORICAL_PEOPLE` with exact date, clock time, sex, coordinates, calendar, and deliberate zone/offset.
2. Add the matching `id` to `HISTORICAL_AUDIT_ROWS` with rating, source class, source URL, and zone reliability.
3. Use `sourceDateLabel` if the source and stored chart date use different calendar labels.
4. Keep natal-data source metadata separate from `interpretiveReferences`.
5. Run `node tests\static-contract-tests.js` and the browser regression runner. A new person without an audit row must fail static tests.

## Current Archive

| Character | Rating | Source class | Zone reliability | Note |
|---|---|---|---|---|
| Ada Lovelace | B | Bio/autobiography | lmt | Audited |
| Alan Turing | A | From memory | historical | Audited |
| Albert Einstein | AA | BC/BR in hand | lmt | Audited |
| Amelia Earhart | AA | BC/BR in hand | historical | Audited |
| Al Gore | AA | BC/BR in hand | historical | Audited |
| Amanda Knox | AA | BC/BR in hand | historical | Audited |
| Arnold Schwarzenegger | A | From memory | historical | Audited |
| Barack Obama | AA | BC/BR in hand | historical | Audited |
| Bill Clinton | A | From memory | historical | Audited |
| Carl Sagan | AA | BC/BR in hand | historical | Audited |
| Elvis Presley | AA | BC/BR in hand | historical | Audited |
| Ernest Hemingway | AA | BC/BR in hand | historical | Audited |
| Frank Lloyd Wright | A | From memory | lmt | Audited |
| Pablo Picasso | AA | Quoted BC/BR | lmt | Audited |
| Frida Kahlo | AA | BC/BR in hand | lmt | Audited |
| Gabriel García Márquez | B | Bio/autobiography | historical | Audited |
| George Lucas | AA | BC/BR in hand | historical | Corrected from 05:42 to 05:40 |
| George W. Bush | AA | Quoted BC/BR | historical | Audited |
| Hans Christian Andersen | AA | Quoted BC/BR | lmt | Audited |
| Henri Matisse | AA | BC/BR in hand | lmt | Audited |
| Herman Melville | AA | Quoted BC/BR | lmt | Audited |
| Igor Stravinsky | AA | Quoted BC/BR | historical | Tyche stores Julian 5 June 1882; source also gives Gregorian equivalent |
| Jorge Luis Borges | AA | BC/BR in hand | historical | Audited |
| Julio Cortázar | AA | BC/BR in hand | historical | Audited |
| Jonathan Brandis | A | From memory | historical | Audited |
| Kurt Cobain | AA | BC/BR in hand | historical | Audited |
| Le Corbusier | AA | Quoted BC/BR | historical | Audited |
| Lisa Marie Presley | AA | BC/BR in hand | historical | Audited |
| M. C. Escher | AA | BC/BR in hand | historical | Audited |
| Marilyn Monroe | AA | BC/BR in hand | historical | Audited |
| Michael J. Fox | A | From memory | historical | Audited |
| Patrick Swayze | A | From memory | historical | Audited |
| Robert Downey Jr. | A | From memory | historical | Audited |
| Salvador Dalí | AA | BC/BR in hand | historical | Audited |
| Simone de Beauvoir | AA | BC/BR in hand | historical | Audited |
| René Magritte | AA | BC/BR in hand | historical | Audited |
| Sigmund Freud | AA | Quoted BC/BR | historical | Audited |
| Steve Wozniak | AA | Quoted BC/BR | historical | Audited |
| Vanessa Williams | AA | BC/BR in hand | historical | Audited |
| Whitney Houston | AA | BC/BR in hand | historical | Audited |
| Victoria del Reino Unido | AA | Quoted BC/BR | lmt | Audited |
| Vincent van Gogh | AA | BC/BR in hand | lmt | Audited |
| Winston Churchill | A | From memory | historical | Audited |
