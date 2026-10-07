import test from "node:test";
import assert from "node:assert/strict";
import {
  required,
  isEmail,
  minLength,
  securePassword,
  validateSchema,
  parseJsonObject,
  numberRange,
  integer,
} from "../src/lib/schemaValidator";
import {
  buildRegistrationSchema,
  defaultOptions,
  validExample,
  invalidExample,
} from "../src/lib/exampleSchema";
test("required rejects missing, null and whitespace but retains zero and false", () => {
  for (const value of [undefined, null, "", "   "])
    assert.ok(required()(value));
  assert.equal(required()(0), null);
  assert.equal(required()(false), null);
});
test("email expression accepts ordinary addresses without requiring a literal dollar", () => {
  assert.equal(isEmail()("marcos@example.com"), null);
  for (const value of ["marcos@", "a b@example.com", 123])
    assert.ok(isEmail()(value));
});
test("password rule uses real anchors and rejects nonstrings", () => {
  assert.equal(securePassword()("ExemploSeguro2026"), null);
  for (const value of ["somente123", "SOMENTE123", "SemNumero", 123])
    assert.ok(securePassword()(value));
});
test("configured schema aggregates errors without changing input", () => {
  const schema = buildRegistrationSchema(defaultOptions);
  assert.equal(validateSchema(validExample, schema).isValid, true);
  const before = JSON.stringify(invalidExample);
  const result = validateSchema(invalidExample, schema);
  assert.equal(result.isValid, false);
  assert.equal(Object.keys(result.errors).length, 4);
  assert.equal(JSON.stringify(invalidExample), before);
});
test("rules stop at the first failure for each field", () => {
  let calls = 0;
  const result = validateSchema(
    { name: "" },
    {
      name: [
        required(),
        () => {
          calls++;
          return "second";
        },
      ],
    },
  );
  assert.equal(calls, 0);
  assert.equal(result.errors.name, "Este campo é obrigatório");
});
test("strict types reject string numbers and enforce dynamic rule configuration", () => {
  assert.ok(numberRange(18, 120)("28"));
  assert.ok(integer()(20.5));
  assert.equal(integer()(20), null);
  assert.equal(
    validateSchema(
      validExample,
      buildRegistrationSchema({ ...defaultOptions, passwordMin: 20 }),
    ).isValid,
    false,
  );
  assert.throws(() => minLength(-1));
});
test("extra keys, prototype keys, arrays and inherited records are rejected safely", () => {
  assert.equal(
    validateSchema(
      { ...validExample, admin: true },
      buildRegistrationSchema(defaultOptions),
    ).isValid,
    false,
  );
  const data = JSON.parse('{"name":"Marcos","__proto__":{"polluted":true}}');
  const result = validateSchema(data, { name: [required()] });
  assert.equal(result.isValid, false);
  assert.ok(result.unknownKeys.includes("__proto__"));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  for (const value of [[], null, "text", Object.create({ name: "Inherited" })])
    assert.equal(validateSchema(value, { name: [required()] }).isValid, false);
});
test("JSON errors and size boundaries are explicit, optional values skip optional rules", () => {
  assert.throws(() => parseJsonObject("{"));
  assert.throws(() => parseJsonObject(" ".repeat(10001)));
  assert.equal(isEmail()(undefined), null);
  assert.equal(minLength(3)(null), null);
  assert.ok(minLength(3)(123));
});
