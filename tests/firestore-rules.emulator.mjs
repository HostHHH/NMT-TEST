// Перевірка firestore.rules у справжньому емуляторі Firestore.
//
// НЕ входить у `npm test` — потребує Java і firebase-tools, які в проєкті
// навмисно не встановлені (щоб не тягнути ~200 МБ node_modules заради
// перевірки, яка потрібна лише перед деплоєм правил).
//
// Як запустити:
//   1. Встановити разово (в будь-якій окремій теці, не в проєкті):
//        npm install firebase-tools @firebase/rules-unit-testing firebase
//   2. Потрібна Java (для емулятора Firestore)
//   3. З кореня проєкту:
//        npx firebase emulators:exec --only firestore --project demo-limbo \
//            "node tests/firestore-rules.emulator.mjs"
//
// Робити це ОБОВ'ЯЗКОВО перед кожним деплоєм firestore.rules: помилкове
// правило блокує запис повністю і гра перестає зберігати прогрес.
// Саме так тут було виявлено вичерпання ліміту в 1000 виразів.
//
// Останній результат: 18/18 пройдено.

import { readFileSync } from 'node:fs';
import {
    initializeTestEnvironment,
    assertFails,
    assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const RULES_PATH = new URL('../firestore.rules', import.meta.url);

const ALICE = 'alice-uid';
const BOB = 'bob-uid';

let pass = 0, fail = 0;
const failures = [];

async function check(label, promise) {
    try { await promise; pass++; console.log(`  ✔ ${label}`); }
    catch (e) { fail++; failures.push(`${label} — ${e.message}`); console.log(`  ✖ ${label}`); }
}

// Мінімальний валідний прогрес (як createEmptyProgress у progressStore.js)
function emptyProgress() {
    const stages = {};
    for (let s = 1; s <= 8; s++) {
        stages[s] = { bossDefeated: false, bonusApplied: 0, levels: {} };
    }
    return {
        schemaVersion: 1,
        totalStars: 0,
        bonus: { balance: 0, earnedTotal: 0, spentTotal: 0, todayEarned: 0, todayDate: null },
        playtime: { totalSeconds: 0, creditedSeconds: 0, lastHeartbeatAt: null },
        certificate: null,
        stages
    };
}

const testEnv = await initializeTestEnvironment({
    projectId: 'demo-limbo',
    firestore: {
        rules: readFileSync(RULES_PATH, 'utf8'),
        host: '127.0.0.1',
        port: 8080
    }
});

const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
const bobDb = testEnv.authenticatedContext(BOB).firestore();
const anonDb = testEnv.unauthenticatedContext().firestore();

const aliceRef = (db) => doc(db, 'users', ALICE);

// Заповнює документ Alice в обхід правил.
async function seed(progress, extra = {}) {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', ALICE), {
            displayName: 'Alice', highScore: 0, progress, ...extra
        });
    });
}

console.log('\n═══ Доступ ═══');
await testEnv.clearFirestore();
await check('власник створює свій документ',
    assertSucceeds(setDoc(aliceRef(aliceDb), {
        displayName: 'Alice', highScore: 0, progress: emptyProgress()
    })));

await check('чужий НЕ може писати в документ Alice',
    assertFails(setDoc(aliceRef(bobDb), { highScore: 999 })));

await check('неавтентифікований НЕ може читати',
    assertFails(getDoc(aliceRef(anonDb))));

await check('автентифікований читає чужий документ (потрібно лідерборду)',
    assertSucceeds(getDoc(aliceRef(bobDb))));

await check('видалення заборонено власнику',
    assertFails(deleteDoc(aliceRef(aliceDb))));

console.log('\n═══ Зірки ═══');
await seed(emptyProgress());
{
    const p = emptyProgress();
    p.stages[1].levels = { 1: { stars: 3, bestCorrect: 5, attempts: 1 } };
    p.totalStars = 3;
    await check('нарахування 3 зірок проходить',
        assertSucceeds(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}
{
    // ВІДОМЕ ОБМЕЖЕННЯ: перевірка зірок кожного рівня не вміщається
    // в ліміт 1000 виразів, тому правила її не роблять. Захист —
    // clamp(stars, 0, 3) на клієнті в rules.js.
    const p = emptyProgress();
    p.stages[1].levels = { 1: { stars: 4 } };
    p.totalStars = 4;
    await check('4 зірки за рівень проходять (відоме обмеження, див. коментар у правилах)',
        assertSucceeds(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}
{
    // Натомість агрегат обмежений жорстко.
    const p = emptyProgress();
    p.totalStars = 200;
    await check('totalStars = 200 відхилено (стеля 96)',
        assertFails(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}
{
    const seeded = emptyProgress();
    seeded.stages[1].levels = { 1: { stars: 3 } };
    seeded.totalStars = 3;
    await seed(seeded);

    const lowered = emptyProgress();
    lowered.stages[1].levels = { 1: { stars: 1 } };
    lowered.totalStars = 1;
    await check('пониження зірок відхилено',
        assertFails(setDoc(aliceRef(aliceDb), { progress: lowered }, { merge: true })));
}
{
    const seeded = emptyProgress();
    seeded.stages[1].levels = { 1: { stars: 2 } };
    seeded.totalStars = 2;
    await seed(seeded);

    const raised = emptyProgress();
    raised.stages[1].levels = { 1: { stars: 3 } };
    raised.totalStars = 3;
    await check('підвищення зірок дозволено',
        assertSucceeds(setDoc(aliceRef(aliceDb), { progress: raised }, { merge: true })));
}

console.log('\n═══ Бос ═══');
{
    const seeded = emptyProgress();
    seeded.stages[1].bossDefeated = true;
    await seed(seeded);

    const undone = emptyProgress();
    undone.stages[1].bossDefeated = false;
    await check('переможеного боса не можна скасувати',
        assertFails(setDoc(aliceRef(aliceDb), { progress: undone }, { merge: true })));
}

console.log('\n═══ Бонусні зірки ═══');
await seed(emptyProgress());
{
    const p = emptyProgress();
    p.bonus.balance = 2;
    p.bonus.earnedTotal = 2;
    await check('нарахування 2 бонусних зірок проходить',
        assertSucceeds(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}
{
    const p = emptyProgress();
    p.bonus.balance = 10;
    await check('баланс 10 відхилено (стеля 3)',
        assertFails(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}
{
    await seed(emptyProgress());
    const p = emptyProgress();
    p.bonus.balance = 3;
    p.bonus.earnedTotal = 3;
    await check('стрибок балансу 0→3 дозволено (денний ліміт)',
        assertSucceeds(setDoc(aliceRef(aliceDb), { progress: p }, { merge: true })));
}

console.log('\n═══ Монотонні лічильники ═══');
{
    const seeded = emptyProgress();
    seeded.playtime.totalSeconds = 1000;
    seeded.bonus.earnedTotal = 2;
    await seed(seeded);

    const back = emptyProgress();
    back.playtime.totalSeconds = 10;
    back.bonus.earnedTotal = 2;
    await check('відкат ігрового часу відхилено',
        assertFails(setDoc(aliceRef(aliceDb), { progress: back }, { merge: true })));
}
{
    const seeded = emptyProgress();
    seeded.totalStars = 20;
    await seed(seeded);

    const back = emptyProgress();
    back.totalStars = 5;
    await check('пониження totalStars відхилено',
        assertFails(setDoc(aliceRef(aliceDb), { progress: back }, { merge: true })));
}

console.log('\n═══ Код підтвердження ═══');
{
    const seeded = emptyProgress();
    seeded.certificate = { code: 'LMB-AAAA-BBBB-CCCC', completedAt: 1, version: 1 };
    await seed(seeded);

    const changed = emptyProgress();
    changed.certificate = { code: 'LMB-ZZZZ-ZZZZ-ZZZZ', completedAt: 2, version: 1 };
    await check('виданий код не можна підмінити',
        assertFails(setDoc(aliceRef(aliceDb), { progress: changed }, { merge: true })));
}

console.log('\n═══ Інші колекції ═══');
await check('стороння колекція закрита',
    assertFails(setDoc(doc(aliceDb, 'secrets', 'x'), { a: 1 })));

await testEnv.cleanup();

console.log('\n' + '─'.repeat(56));
if (fail === 0) {
    console.log(`✅ ПРАВИЛА ПРОЙШЛИ — ${pass} перевірок`);
} else {
    console.log(`❌ ПРОВАЛЕНО ${fail} з ${pass + fail}`);
    failures.forEach(f => console.log('   • ' + f));
    process.exitCode = 1;
}
