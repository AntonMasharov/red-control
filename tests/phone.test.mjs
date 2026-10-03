import test from 'node:test';
import assert from 'node:assert/strict';
import { validPhone, normalizePhone, formatPhone } from '../src/data/phone.ts';

for (const value of ['+7 (999) 123-45-67', '8 999 123 45 67', '123', '+44 (20) 1234-5678']) {
  test(`valid telephone: ${value}`, () => assert.equal(validPhone(value), true));
}
for (const value of ['', ' ', '12', '+', 'abc123', '123/456', '++123', '123;456']) {
  test(`invalid telephone: ${JSON.stringify(value)}`, () => assert.equal(validPhone(value), false));
}
test('telephone normalization and formatting preserve international and short numbers', () => {
  assert.equal(normalizePhone('9991234567'), '+79991234567');
  assert.equal(normalizePhone('8 (999) 123-45-67'), '+79991234567');
  assert.equal(normalizePhone(' +442012345678 '), '+442012345678');
  assert.equal(formatPhone('89991234567'), '+7 (999) 123-45-67');
  assert.equal(formatPhone('123'), '123');
});
