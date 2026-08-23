import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  companyIdentityLines,
  controllerParagraph,
  isLegalEntityRegistered,
  operatorLeadName,
  providerParagraph,
  publicGeneralContact,
  publicPrivacyContact,
  resolveOperatorField,
} from "./placeholders.ts";

describe("resolveOperatorField", () => {
  it("treats bracket placeholders as unresolved", () => {
    assert.equal(resolveOperatorField("[registrikood]"), null);
    assert.equal(resolveOperatorField("[aadress]"), null);
    assert.equal(resolveOperatorField("[e-post]"), null);
    assert.equal(resolveOperatorField("[telefon]"), null);
  });

  it("treats blank values as unresolved", () => {
    assert.equal(resolveOperatorField(null), null);
    assert.equal(resolveOperatorField(""), null);
    assert.equal(resolveOperatorField("   "), null);
  });

  it("keeps real values", () => {
    assert.equal(resolveOperatorField("12345678"), "12345678");
    assert.equal(resolveOperatorField(" Kvalifits OÜ "), "Kvalifits OÜ");
  });
});

describe("pre-launch LAUNCH_OPERATOR public copy", () => {
  it("does not claim a registered legal entity", () => {
    assert.equal(isLegalEntityRegistered(), false);
  });

  for (const locale of ["et", "en", "ru"] as const) {
    it(`avoids fake operator placeholders in ${locale}`, () => {
      const snippets = [
        operatorLeadName(locale),
        controllerParagraph(locale),
        providerParagraph(locale),
        publicPrivacyContact(locale),
        publicGeneralContact(locale),
        ...companyIdentityLines(locale),
      ].join("\n");

      assert.doesNotMatch(snippets, /\[registrikood\]/);
      assert.doesNotMatch(snippets, /\[aadress\]/);
      assert.doesNotMatch(snippets, /\[e-post\]/);
      assert.doesNotMatch(snippets, /\[telefon\]/);
      assert.doesNotMatch(snippets, /Kvalifits OÜ/);
    });
  }

  it("uses pre-launch operator wording in Estonian", () => {
    assert.equal(operatorLeadName("et"), "Kvalifitsi meeskond");
    assert.match(controllerParagraph("et"), /eelkäivitusjärgus/);
    assert.match(companyIdentityLines("et").join(" "), /kontaktivormi lehel Kontakt/);
  });
});
