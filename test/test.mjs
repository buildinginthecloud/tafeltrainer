import assert from 'node:assert/strict';
import { boot, answerAll } from './harness.mjs';

const arr = (x) => Array.from(x);   // arrays uit de vm-context vergelijkbaar maken
let pass = 0, fail = 0;
const test = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; } };

console.log('\nsommen genereren');
test('examen geeft 100 sommen, elke som precies 10x', () => {
  const { T } = boot();
  const qs = T.buildQuestions([6], 100);
  assert.equal(qs.length, 100);
  const tally = {};
  qs.forEach(q => { tally[q.other] = (tally[q.other] || 0) + 1; assert.equal(q.answer, 6 * q.other); });
  for (let n = 1; n <= 10; n++) assert.equal(tally[n], 10, 'som 6x' + n + ' komt ' + tally[n] + 'x voor');
});
test('geen twee dezelfde sommen achter elkaar (50 runs)', () => {
  const { T } = boot();
  for (let r = 0; r < 50; r++) {
    const qs = T.buildQuestions([6], 100);
    for (let i = 1; i < qs.length; i++) assert.notEqual(qs[i].other, qs[i - 1].other, 'dubbel op index ' + i);
  }
});
test('sprint geeft 20 sommen, elke som 2x', () => {
  const { T } = boot();
  const qs = T.buildQuestions([7], 20);
  assert.equal(qs.length, 20);
  const tally = {};
  qs.forEach(q => tally[q.other] = (tally[q.other] || 0) + 1);
  for (let n = 1; n <= 10; n++) assert.equal(tally[n], 2);
});
test('omgekeerd aan: beide volgordes komen voor, antwoord blijft kloppen', () => {
  const { T } = boot();
  T.state.reverse = true;
  const qs = T.buildQuestions([6], 100);
  qs.forEach(q => assert.equal(q.a * q.b, q.answer));
  assert.ok(qs.some(q => q.a === 6), 'geen enkele 6 x n');
  assert.ok(qs.some(q => q.b === 6 && q.a !== 6), 'geen enkele n x 6');
});
test('omgekeerd uit: altijd tafel voorop', () => {
  const { T } = boot();
  const qs = T.buildQuestions([6], 100);
  qs.forEach(q => assert.equal(q.a, 6));
});

console.log('\ninvoer');
test('antwoord wordt pas bij volledige match automatisch verstuurd', () => {
  const { T } = boot();
  T.startRun('exam');
  const q = T.run.qs[0];
  const digits = String(q.answer);
  if (digits.length > 1) { T.press(digits[0]); assert.equal(T.run.i, 0, 'te vroeg doorgeschoten'); }
  for (const d of digits.slice(digits.length > 1 ? 1 : 0)) T.press(d);
  assert.equal(T.run.i, 1);
  assert.equal(T.run.correct, 1);
});
test('fout antwoord schuift pas door na OK', () => {
  const { T } = boot();
  T.startRun('exam');
  const q = T.run.qs[0];
  const wrong = String(q.answer + (q.answer % 10 === 9 ? -1 : 1));
  for (const d of wrong) T.press(d);
  assert.equal(T.run.i, 0, 'fout antwoord schoot door');
  T.submit();
  assert.equal(T.run.i, 1);
  assert.equal(T.run.wrong, 1);
  assert.equal(T.run.mistakes[0].given, wrong);
  assert.equal(T.run.mistakes[0].answer, q.answer);
});
test('OK op een leeg vak doet niets', () => {
  const { T } = boot();
  T.startRun('exam');
  T.submit(); T.submit();
  assert.equal(T.run.i, 0);
});
test('wis haalt het laatste cijfer weg', () => {
  const { T } = boot();
  T.startRun('exam');
  T.press('7'); T.press('7'); T.backspace();   // 77 is nooit een antwoord, dus geen auto-verzending
  assert.equal(T.run.buffer, '7');
  T.backspace(); T.backspace();
  assert.equal(T.run.buffer, '');
});
test('maximaal drie cijfers', () => {
  const { T } = boot();
  T.startRun('exam');
  '9999'.split('').forEach(d => T.press(d));
  assert.equal(T.run.buffer.length, 3);
});
test('voorloopnul wordt opgeruimd', () => {
  const { T } = boot();
  T.startRun('exam');
  T.press('0'); T.press('4'); T.press('2');
  assert.ok(!T.run || T.run.buffer === '42' || T.run.i === 1, 'buffer was ' + (T.run && T.run.buffer));
});

console.log('\nexamen');
test('alles goed geeft 100, record, XP en medailles', () => {
  const { T } = boot();
  T.startRun('exam');
  const n = answerAll(T);
  assert.equal(n, 100);
  const st = T.tableStats(6);
  assert.equal(st.best, 100);
  assert.equal(st.attempts.length, 1);
  assert.equal(st.attempts[0].c, 100);
  assert.equal(T.state.xp, 125, 'xp was ' + T.state.xp);
  assert.ok(T.state.badges.eerste && T.state.badges.perfect && T.state.badges.snel);
  assert.equal(T.state.streak.days, 1);
});
test('een op de tien fout geeft 90 goed en 10 in de foutenlijst', () => {
  const { T } = boot();
  T.startRun('exam');
  answerAll(T, { wrongEvery: 10 });
  const st = T.tableStats(6);
  assert.equal(st.best, 90);
  assert.ok(!T.state.badges.perfect, 'perfect mocht niet');
  assert.equal(T.state.xp, 115);
});
test('tijd om: alleen de gemaakte sommen tellen', () => {
  const { T } = boot();
  T.startRun('exam');
  for (let i = 0; i < 30; i++) { const q = T.run.qs[T.run.i]; String(q.answer).split('').forEach(d => T.press(d)); }
  T.finish('tijd');
  const st = T.tableStats(6);
  assert.equal(st.attempts[0].answered, 30);
  assert.equal(st.attempts[0].c, 30);
  assert.equal(st.bestMs, null, 'onvoltooid examen mag geen tijdrecord zijn');
  assert.equal(T.state.xp, 30, 'geen bonus bij tijd om');
});
test('stoppen zonder enige som gaat terug zonder poging op te slaan', () => {
  const { T } = boot();
  T.startRun('exam');
  T.finish('gestopt');
  assert.equal(T.tableStats(6).attempts.length, 0);
  assert.equal(T.state.xp, 0);
});
test('halverwege stoppen telt niet mee in de geschiedenis, XP blijft staan', () => {
  const { T } = boot();
  T.startRun('exam');
  for (let i = 0; i < 30; i++) { const q = T.run.qs[T.run.i]; String(q.answer).split('').forEach(d => T.press(d)); }
  T.finish('gestopt');
  const st = T.tableStats(6);
  assert.equal(st.attempts.length, 0, 'gestopte poging kwam toch in de grafiek');
  assert.equal(st.best, 0, 'gestopte poging werd een record');
  assert.equal(T.state.xp, 30);
  assert.ok(!T.state.badges.eerste, 'medaille voor eerste examen bij een gestopte poging');
});
test('verschil met de vorige poging', () => {
  const { T } = boot();
  assert.equal(T.verschil(6), '6 beter');
  assert.equal(T.verschil(-4), '4 minder');
  assert.equal(T.verschil(0), 'net zoveel');
});
test('tien examens geeft de volhouder-medaille', () => {
  const { T } = boot();
  for (let i = 0; i < 10; i++) { T.startRun('exam'); answerAll(T); }
  assert.ok(T.state.badges.volhouder);
  assert.equal(T.tableStats(6).attempts.length, 10);
});
test('scores per tafel staan los van elkaar', () => {
  const { T } = boot();
  T.startRun('exam'); answerAll(T);
  T.state.table = 3;
  T.startRun('exam'); answerAll(T, { wrongEvery: 2 });
  assert.equal(T.tableStats(6).best, 100);
  assert.equal(T.tableStats(3).best, 50);
});

console.log('\nsprint');
test('sprint zonder fouten zet een record', () => {
  const { T } = boot();
  T.startRun('sprint');
  answerAll(T);
  const st = T.tableStats(6);
  assert.ok(st.sprintBest !== null);
  assert.ok(T.state.badges.sprinter && T.state.badges.foutloos);
  assert.equal(T.state.xp, 50, 'xp was ' + T.state.xp);
});
test('fouten geven drie seconden straftijd elk', () => {
  const { T } = boot();
  T.startRun('sprint');
  answerAll(T, { wrongEvery: 2 });
  assert.ok(T.tableStats(6).sprintBest >= 10 * 3000, 'straftijd niet meegeteld');
  assert.ok(!T.state.badges.foutloos);
});
test('een tragere sprint verdringt het record niet', () => {
  const { T } = boot();
  T.startRun('sprint'); answerAll(T);
  const first = T.tableStats(6).sprintBest;
  T.startRun('sprint'); answerAll(T, { wrongEvery: 1 });
  assert.equal(T.tableStats(6).sprintBest, first);
});


console.log('\nmix van meerdere tafels');
test('mix verdeelt 100 sommen gelijk over de gekozen tafels', () => {
  const { T } = boot();
  const qs = T.buildQuestions([6, 7], 100);
  assert.equal(qs.length, 100);
  const tally = {};
  qs.forEach(q => {
    assert.equal(q.answer, q.table * q.other);
    const k = q.table + 'x' + q.other;
    tally[k] = (tally[k] || 0) + 1;
  });
  assert.equal(Object.keys(tally).length, 20, 'niet alle 20 sommen komen voor');
  Object.keys(tally).forEach(k => assert.equal(tally[k], 5, k + ' komt ' + tally[k] + 'x voor'));
});
test('mix over vier tafels geeft elke tafel precies een kwart', () => {
  const { T } = boot();
  const qs = T.buildQuestions([2, 5, 8, 10], 100);
  const perTable = {};
  qs.forEach(q => { perTable[q.table] = (perTable[q.table] || 0) + 1; });
  assert.deepEqual(Object.keys(perTable).sort(), ['10', '2', '5', '8']);
  [2, 5, 8, 10].forEach(t => assert.equal(perTable[t], 25));
});
test('bij een oneven verdeling schelen de tafels hooguit een som (30 runs)', () => {
  const { T } = boot();
  for (let r = 0; r < 30; r++) {
    [[3, 6, 7], [2, 3, 4, 5, 6, 7, 8]].forEach(sel => {
      const perTable = {};
      T.buildQuestions(sel, 100).forEach(q => { perTable[q.table] = (perTable[q.table] || 0) + 1; });
      const counts = sel.map(t => perTable[t] || 0);
      assert.equal(counts.reduce((a, b) => a + b, 0), 100);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1,
        'scheve verdeling over ' + sel.length + ' tafels: ' + counts.join(', '));
    });
  }
});
test('binnen een tafel schelen de tien sommen hooguit een beurt (30 runs)', () => {
  const { T } = boot();
  for (let r = 0; r < 30; r++) {
    const perSum = {};
    T.buildQuestions([2, 5, 8, 10], 100).forEach(q => {
      const k = q.table + 'x' + q.other;
      perSum[k] = (perSum[k] || 0) + 1;
    });
    const counts = Object.values(perSum);
    assert.equal(counts.length, 40, 'niet alle 40 sommen komen voor');
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, 'scheve sommen: ' + counts.join(','));
  }
});
test('mix bevat geen tafels buiten de selectie', () => {
  const { T } = boot();
  T.buildQuestions([3, 9], 100).forEach(q => assert.ok(q.table === 3 || q.table === 9, 'tafel ' + q.table + ' hoort er niet bij'));
});
test('ook in een mix nooit twee keer dezelfde som achter elkaar (50 runs)', () => {
  const { T } = boot();
  for (let r = 0; r < 50; r++) {
    const qs = T.buildQuestions([6, 7], 100);
    for (let i = 1; i < qs.length; i++) {
      assert.ok(!(qs[i].table === qs[i - 1].table && qs[i].other === qs[i - 1].other), 'dubbel op index ' + i);
    }
  }
});
test('mix-scores staan los van de losse tafels', () => {
  const { T } = boot();
  T.startRun('exam'); answerAll(T);                  // tafel van 6, alles goed
  T.state.mix = true; T.state.mixTables = [6, 7];
  T.startRun('exam'); answerAll(T, { wrongEvery: 4 });
  assert.equal(T.tableStats(6).best, 100, 'de mix heeft de tafelscore overschreven');
  assert.equal(T.tableStats('mix').best, 75);
  assert.equal(T.tableStats(7).attempts.length, 0, 'tafel 7 kreeg een eigen poging van de mix');
});
test('een fout in de mix telt bij de tafel waar de som bij hoort', () => {
  const { T } = boot();
  T.state.mix = true; T.state.mixTables = [6, 7];
  T.startRun('exam');
  const q = T.run.qs[0];
  const wrong = String(q.answer + (q.answer % 10 === 9 ? -1 : 1));
  for (const d of wrong) T.press(d);
  T.submit();
  const key = q.table + 'x' + q.other;
  assert.equal(T.state.sums[key].wrong, 1, 'som niet geteld bij tafel ' + q.table);
});
test('de laatste twee tafels kunnen niet uit de mix', () => {
  const { T } = boot();
  T.state.mix = true; T.state.mixTables = [6, 7, 8];
  T.pickTable(8);
  assert.deepEqual(arr(T.state.mixTables), [6, 7]);
  T.pickTable(7);
  assert.deepEqual(arr(T.state.mixTables), [6, 7], 'er bleef maar een tafel over');
  T.pickTable(3);
  assert.deepEqual(arr(T.state.mixTables), [6, 7, 3]);
});
test('buiten de mix kiest een tik gewoon een tafel', () => {
  const { T } = boot();
  T.pickTable(9);
  assert.equal(T.state.table, 9);
  assert.deepEqual(arr(T.state.mixTables), [6, 7], 'de mixselectie veranderde mee');
});
test('naamgeving van de selectie', () => {
  const { T } = boot();
  assert.equal(T.activeLabel(), 'Tafel van 6');
  T.state.mix = true;
  T.state.mixTables = [7, 6];
  assert.equal(T.activeLabel(), 'Mix van 6 en 7');
  T.state.mixTables = [9, 3, 6];
  assert.equal(T.activeLabel(), 'Mix van 3, 6 en 9');
  assert.deepEqual(arr(T.activeTables()), [3, 6, 9]);
  assert.equal(T.statsKey(), 'mix');
});
test('een kapotte of oude opslag wordt rechtgezet', () => {
  const { T } = boot();
  assert.deepEqual(arr(T.sanitize({ mixTables: [3], table: 99 }).mixTables), [6, 7]);
  assert.equal(T.sanitize({ mixTables: [3], table: 99 }).table, 6);
  assert.deepEqual(arr(T.sanitize({ mixTables: [2, 44, 'x', 5], table: 4 }).mixTables), [2, 5]);
  assert.deepEqual(arr(T.sanitize({ table: 4 }).mixTables), [6, 7]);
});
test('opslag van een vorige versie zonder mix blijft werken', () => {
  const h = boot();
  h.store.set('tafeltrainer.v1', JSON.stringify({ xp: 40, table: 8, tables: {}, sums: {}, badges: {}, streak: { last: null, days: 2 } }));
  const fresh = h.T.loadState();
  assert.equal(fresh.table, 8);
  assert.equal(fresh.mix, false);
  assert.deepEqual(arr(fresh.mixTables), [6, 7]);
});

test('elke combinatie van tafels levert een geldige reeks op (stresstest)', () => {
  const { T } = boot();
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let size = 1; size <= 10; size++) {
    for (let r = 0; r < 12; r++) {
      const sel = [];
      const pot = all.slice();
      while (sel.length < size) sel.push(pot.splice(Math.floor(Math.random() * pot.length), 1)[0]);
      [100, 20].forEach(count => {
        const qs = T.buildQuestions(sel, count);
        assert.equal(qs.length, count);
        for (let i = 1; i < qs.length; i++) {
          assert.ok(!(qs[i].table === qs[i - 1].table && qs[i].other === qs[i - 1].other),
            size + ' tafels, ' + count + ' sommen: dubbel op index ' + i);
        }
        const perTable = {};
        qs.forEach(q => { perTable[q.table] = (perTable[q.table] || 0) + 1; });
        const counts = sel.map(t => perTable[t] || 0);
        assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, 'scheef: ' + counts.join(','));
      });
    }
  }
});

console.log('\nopslag');
test('scores overleven een herstart', () => {
  const h = boot();
  h.T.startRun('exam'); answerAll(h.T);
  const saved = h.store.get('tafeltrainer.v1');
  assert.ok(saved, 'niets opgeslagen');
  const back = JSON.parse(saved);
  assert.equal(back.tables['6'].best, 100);
  assert.equal(back.xp, 125);
  assert.ok(back.badges.perfect);
});
test('app draait door als de opslag weigert', () => {
  const { T, els } = boot({ brokenStorage: true });
  assert.equal(els.get('storageNote').hidden, false, 'waarschuwing niet getoond');
  T.startRun('exam');
  answerAll(T);
  assert.equal(T.tableStats(6).best, 100, 'spel liep vast zonder opslag');
  assert.equal(T.state.xp, 125);
});
test('niveau loopt op met XP', () => {
  const { T } = boot();
  assert.equal(T.level(), 1);
  T.state.xp = 149; assert.equal(T.level(), 1);
  T.state.xp = 150; assert.equal(T.level(), 2);
  T.state.xp = 620; assert.equal(T.level(), 5);
});
test('sterren kloppen met de grenzen', () => {
  const { T } = boot();
  assert.equal(T.stars(69), '☆☆☆');
  assert.equal(T.stars(70), '⭐️☆☆');
  assert.equal(T.stars(85), '⭐️⭐️☆');
  assert.equal(T.stars(95), '⭐️⭐️⭐️');
  assert.equal(T.stars(100), '⭐️⭐️⭐️');
});
test('klok en secondes in Nederlandse notatie', () => {
  const { T } = boot();
  assert.equal(T.clock(480000), '8:00');
  assert.equal(T.clock(65000), '1:05');
  assert.equal(T.clock(-5), '0:00');
  assert.equal(T.secs(41230), '41,2 s');
});

console.log('\n' + pass + ' van de ' + (pass + fail) + ' controles geslaagd' + (fail ? ', ' + fail + ' mislukt' : '') + '\n');
