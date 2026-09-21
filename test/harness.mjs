import vm from 'node:vm';
import fs from 'node:fs';

export function boot({ brokenStorage = false } = {}) {
  // haalt het script rechtstreeks uit de app, zodat er geen tweede kopie kan verouderen
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const src = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const store = new Map();
  const els = new Map();

  const mkEl = () => {
    const e = {
      _kids: [], innerHTML: '', textContent: '', hidden: false, className: '',
      style: {}, onclick: null,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      appendChild(c) { e._kids.push(c); return c; },
      addEventListener() {}, setAttribute() {},
    };
    return e;
  };

  const sandbox = {
    console,
    Date, Math, JSON, Number, String, Object, Array, Boolean, Error,
    setTimeout: (fn) => { fn(); return 0; },          // synchroon voor de test
    setInterval: () => 0,
    clearInterval: () => {},
    confirm: () => true,
    localStorage: brokenStorage ? {
      getItem: () => { throw new Error('QuotaExceededError'); },
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => { throw new Error('QuotaExceededError'); },
    } : {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    document: {
      getElementById(id) { if (!els.has(id)) els.set(id, mkEl()); return els.get(id); },
      querySelectorAll() { return []; },
      createElement() { return mkEl(); },
      addEventListener() {},
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const exportLine = `
    globalThis.T = {
      get state() { return state; }, set state(v) { state = v; },
      get run() { return run; },
      startRun, press, backspace, submit, finish, buildQuestions,
      tableStats, BADGES, verschil, pickTable, activeTables, activeLabel, statsKey, sanitize, loadState, saveState, level, stars, clock, secs, defaultState
    };`;
  vm.runInContext(src + exportLine, sandbox, { filename: 'app.js' });
  return { T: sandbox.T, store, els };
}

export function answerAll(T, { wrongEvery = 0 } = {}) {
  let n = 0;
  while (T.run) {
    const q = T.run.qs[T.run.i];
    n++;
    const makeWrong = wrongEvery && n % wrongEvery === 0;
    const value = makeWrong ? String(q.answer + (q.answer % 10 === 9 ? -1 : 1)) : String(q.answer);
    for (const d of value) T.press(d);
    if (T.run) T.submit(); // fout antwoord heeft geen auto-submit
  }
  return n;
}
