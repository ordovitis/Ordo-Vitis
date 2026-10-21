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
const sandbox = {};
vm.createContext(sandbox);
for (const name of ['convertirUnite', 'calculerStocksTraitement']) {
  const source = html.match(new RegExp('function ' + name + '\\([^]*?\\n\\}'));
  assert.ok(source, name + ' doit exister dans le code livré');
  vm.runInContext(source[0], sandbox);
}
const plan = (next, previous, catalogue) => JSON.parse(JSON.stringify(
  sandbox.calculerStocksTraitement(next, previous, catalogue)
));
const product = (id, stock, unit = 'L') => ({ id, nom: id, stock_actuel: stock, conditionnement_unite: unit });
const quantity = (id, dose, unite = 'L') => ({ produit_id: id, dose, unite });
const previous = (id, quantite_utilisee, unite_quantite = 'L') => ({ produit_id: id, quantite_utilisee, unite_quantite });

test('800 mL utilisés retirent exactement 0,8 L du stock de 10 L', () => {
  assert.deepEqual(plan([quantity('A', 800, 'mL')], [], [product('A', 10)]),
    [{ produit_id: 'A', stock_actuel: 9.2 }]);
});

test('une quantité totale de 0,8 L est débitée telle quelle', () => {
  assert.equal(plan([quantity('A', 0.8)], [], [product('A', 10)])[0].stock_actuel, 9.2);
});

test('modifier 800 mL en 1 L remplace le mouvement : le stock devient 9 L', () => {
  assert.equal(plan([quantity('A', 1)], [previous('A', 800, 'mL')], [product('A', 9.2)])[0].stock_actuel, 9);
});

test('réenregistrer une quantité identique ne consomme pas deux fois le produit', () => {
  assert.equal(plan([quantity('A', 0.8)], [previous('A', 0.8)], [product('A', 9.2)])[0].stock_actuel, 9.2);
});

test('changer de produit restitue le premier et consomme le second', () => {
  assert.deepEqual(plan([quantity('B', 1)], [previous('A', 0.8)], [product('A', 9.2), product('B', 5)]),
    [{ produit_id: 'A', stock_actuel: 10 }, { produit_id: 'B', stock_actuel: 4 }]);
});

test('un stock insuffisant est refusé sans modifier les données fournies', () => {
  const catalogue = [product('A', 10), product('B', 0.1)];
  assert.throws(() => plan([quantity('A', 1), quantity('B', 0.2)], [], catalogue), /Stock insuffisant/);
  assert.equal(catalogue[0].stock_actuel, 10);
  assert.equal(catalogue[1].stock_actuel, 0.1);
});

test('la quantité déjà utilisée est disponible pour une modification', () => {
  assert.equal(plan([quantity('A', 10)], [previous('A', 0.8)], [product('A', 9.2)])[0].stock_actuel, 0);
  assert.throws(() => plan([quantity('A', 10.001)], [previous('A', 0.8)], [product('A', 9.2)]), /Stock insuffisant/);
});

test('les conversions g/kg conservent la quantité', () => {
  assert.equal(plan([quantity('A', 800, 'g')], [], [product('A', 10, 'kg')])[0].stock_actuel, 9.2);
});

test('une unité incompatible ou une quantité invalide sont refusées', () => {
  assert.throws(() => plan([quantity('A', 1, 'kg')], [], [product('A', 10)]), /Unité incompatible/);
  for (const dose of [0, -1, NaN, Infinity]) {
    assert.throws(() => plan([quantity('A', dose)], [], [product('A', 10)]), /quantité totale positive/);
  }
});

test('un produit dont le stock n’est pas suivi reste utilisable', () => {
  assert.deepEqual(plan([quantity('A', 1)], [], [product('A', null)]), []);
});
