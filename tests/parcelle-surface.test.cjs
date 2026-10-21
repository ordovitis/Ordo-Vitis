const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appPath = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../ORDO VITIS/ordo-vitis-deploy/index.html')
].find(candidate => fs.existsSync(candidate));
assert.ok(appPath, 'Le fichier index.html doit être disponible');
const html = fs.readFileSync(appPath, 'utf8');
const validation = html.match(/function lireSurfaceParcelle\([^]*?\n\}/)[0];
const sauvegarde = html.match(/async function saveParcelle\([^]*?\n\}/)[0];
const context = vm.createContext({});
vm.runInContext(validation, context);

test('les surfaces négatives sont refusées, même proches de zéro', () => {
  for (const value of ['-0.25', '-0.0001', '-1e-10', '-100']) {
    assert.throws(() => context.lireSurfaceParcelle(value), /ne peut pas être négative/);
  }
});

test('les surfaces vides, non numériques et infinies sont refusées', () => {
  for (const value of ['', ' ', 'abc', '1abc', 'NaN', 'Infinity', '-Infinity']) {
    assert.throws(() => context.lireSurfaceParcelle(value), /surface valide/);
  }
});

test('zéro reste autorisé conformément au minimum existant du formulaire', () => {
  assert.equal(context.lireSurfaceParcelle('0'), 0);
});

test('les surfaces positives gardent leurs décimales', () => {
  assert.equal(context.lireSurfaceParcelle('0.25'), 0.25);
  assert.equal(context.lireSurfaceParcelle('0.1234'), 0.1234);
});

for (const id of ['', 'parcelle-existante']) {
  test(`une surface négative ne déclenche aucune écriture en ${id ? 'modification' : 'création'}`, async () => {
    let writes = 0;
    let focused = false;
    const alerts = [];
    const fields = {
      'p-id': { value: id },
      'p-nom': { value: 'Parcelle témoin' },
      'p-surface': { value: '-0.25', focus() { focused = true; } }
    };
    const cache = { parcelles: [{ id: 'parcelle-existante', surface: 0.3 }] };
    const sandbox = vm.createContext({
      document: { getElementById: key => fields[key] },
      getCepageInputsValue: () => 'Syrah',
      alert: text => alerts.push(text),
      console,
      cache,
      sb: { from() { writes++; throw new Error('Écriture inattendue'); } }
    });
    vm.runInContext(validation + '\n' + sauvegarde, sandbox);
    await sandbox.saveParcelle();
    assert.equal(writes, 0);
    assert.equal(cache.parcelles[0].surface, 0.3);
    assert.deepEqual(alerts, ['La surface ne peut pas être négative.']);
    assert.equal(focused, true);
  });
}
