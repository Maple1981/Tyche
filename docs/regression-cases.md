# Regression Cases

This file records technical scenarios that should remain stable when Tyche's calculation or judgment layer changes.

`tests/regression.html` is the first browser-executable smoke test page. It does not replace the full checklist below, but it verifies important regressions without a build step: principal lots remain auditable when hidden from the visible lot table, modern planets shown in traditional mode trigger an immediate warning, own bound differs from foreign-bound administration, bound-only reception does not reduce strong malefic pressure, lot testimony items preserve direct lord and sect-role metadata, the 10th-place ruler contributes a stable public-focus reason code, focus evidence shows house rulers rather than treating empty places as inactive, modern planets do not alter the base focus score, score items expose stable reason codes separate from translated prose, sect/MC/IC boundary notices are emitted with stable codes, sensitive-sect widening depends on time reliability, sensitive sect shows alternate benefic/malefic roles as well as alternate lots, lunar fallback calculation crosses 0 Aries correctly, iterative lunar search emits refined contacts for a complete chart, Fortune/Spirit swap correctly when sect is reversed, and every current historical example exposes audited natal-source metadata.

`tests/static-contract-tests.js` is the no-browser contract check. It validates static invariants that are easy to break during refactors: vendor script order, exposed `TycheTest` helpers, BCE/calendar documentation, historical reliability normalization, complete `HISTORICAL_PEOPLE` to `HISTORICAL_AUDIT_ROWS` coverage, natal-source and interpretive-reference separation, glossary key coverage, score/boundary code documentation, and the presence of the factor/precision/codebook docs.

`tests/browser-regression-runner.js` is an optional local browser runner for the smoke page. It starts a temporary local HTTP server and uses Playwright plus an installed Edge/Chrome executable. The app still has no build step and no runtime dependency on Playwright.

Regression tests should prefer stable hooks over visible prose:

- Use `data-test` attributes for rendered UI checks.
- Use `window.TycheTest` only in `?test=regression` mode for calculation-layer checks.
- Keep `window.TycheTest` frozen and expose only stable calculation or judgment helpers needed by tests.
- Assert `window.TycheTest.schemaVersion` before relying on helper names or result shapes.
- Treat objects returned by `window.TycheTest` as disposable test results. Do not mutate them and then reuse them as if they were internal app state.
- Avoid asserting translated copy unless the test is specifically about content.
- Wait for `window.__TYCHE_READY__` or the `tyche:chart-rendered` event rather than using fixed sleeps.
- Tests that submit charts should race `tyche:chart-rendered` against `tyche:chart-error`, so validation failures are reported rather than timing out.
- `TycheTest.calculateChart()` throws direct exceptions for calculation-layer tests; form submission catches errors and emits `tyche:chart-error`.
- Static tests should read source contracts, not execute the app or duplicate domain formulas.

## Boundary Audits

- Sun within 1 degree of the horizon: the audit must warn that sect, sect light, benefic/malefic of sect, malefic contrary to sect, Fortune/Spirit formulas, and the judgment can change.
- Sun within about 2.5 degrees of the horizon in manual, historical, Julian, or otherwise context-sensitive time handling: the audit should also warn about sect sensitivity.
- When the widened sect threshold is used, the audit must show the applied threshold and the reasons for the sensitive time context.
- The summary should distinguish `liminal` within 1 degree from `sensitive` in the widened reliability threshold.
- If sect is liminal or sensitive, the summary should show the Fortune and Spirit positions used by Tyche and the alternate positions if sect were reversed.
- Ascendant within 1 degree of a sign boundary: the audit must warn that the Ascendant lord, whole-sign houses, lots, and main topical focuses can change.
- MC or IC within 1 degree of a sign boundary: the audit must warn that the whole-sign place receiving public-projection or foundation testimony can change.
- Visible planet within 30 arcminutes of an Egyptian-bound boundary: the audit must warn that degree administration, own minor dignity if applicable, and reception by bound can change.
- Boundary warnings should use unique keys/codes such as `asc-sign-boundary`, `mc-sign-boundary`, `lot-boundary:fortune`, and `planet-bound-boundary:mars`; rendered warning cards should expose `data-test="boundary-warning"` and `data-code`.
- MC and IC boundary tests should cover both previous-boundary and next-boundary cases, using structured fields rather than translated prose.
- Inverted Fortune/Spirit tests should compare angular distance, not raw subtraction across 0 Aries.

## Principal Lots

- If the user hides Fortune and Spirit in the lot selector, Tyche must still calculate both internally and use them in the interpretation evidence.
- The lot table should display only the selected lots, while the evidence layer states that Fortune and Spirit remain calculated for judgment.

## Solar Phase

- A planet under the beams or combust in domicile or exaltation should use the stronger chariot mitigation label.
- A planet under the beams or combust only in its own bound should use the softer chariot-like protection label.
- Solar phase language should describe zodiacal/symbolic legibility, not observational heliacal visibility.

## Reception

- Domicile or exaltation reception can reduce malefic pressure or strengthen support when the planets are configured.
- Bound-only reception must appear in evidence as a technical channel but should not reduce a strong malefic-pressure level by itself.
- Benefic testimony to a lot by square/opposition with strong reception to the lot lord should be labeled as negotiated support rather than simple friction.
- Reception language around lots should say that the testifying planet is in reception with the lord of the lot, not that the lot itself receives.
- Mutual reception involving malefic pressure should be described as giving the pressure form, continuity, or reciprocal dependence rather than automatically turning it into help.
- Lot-audit tests should cover direct lord roles, such as a principal lot administered by the benefic of sect or by the malefic contrary to sect.

## Lunar Condition

- The Moon's next application should be refined by iterative search when possible, with the linear speed estimate used only as fallback.
- Future browser tests should include lunar edge cases where iterative search changes the result: retrograde planet application, crossing 0 Aries, perfection after sign exit but within 30 degrees, no perfection within 30 degrees despite a misleading linear estimate, and competing candidates where the earliest real perfection wins.
- The current smoke test covers the linear fallback for crossing 0 Aries, retrograde application, ordered future candidates, perfection after sign exit but within 30 degrees, no contact when relative speed is zero, and at least one iterative contact from a complete calculated chart.
- Void-of-course by the 30-degree Hellenistic rule and void before sign exit must remain separate outputs in the lunar panel and evidence layer.
- The close no-application-within-orb indicator must remain separate from both void-of-course criteria.

## Modern/Mixed Layer

- When modern planets are enabled, the technical audit must show that they are displayed.
- The technical audit must also state that modern planets are not weighted in the base Hellenistic judgment.
- Regression score comparisons should use stable `reasonCode` fields rather than translated or editable human prose.
- Modern planets may appear in display data when enabled, but base score items, lot formulas, traditional regencies, and judgment focus signals must not contain Uranus, Neptune, or Pluto.
