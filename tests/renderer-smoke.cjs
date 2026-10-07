// Run against npm run dev:web. Supply a read-only PoB XML via POK_SMOKE_XML or argv[2].
// Fixture needs an equipped Weapon 1, another stored item, skill groups and two config sets.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
require('tsx/cjs');
const { parseBuild } = require('../src/shared/pob-document.ts');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.local');
const source = process.env.POK_SMOKE_XML || process.argv[2];
if (!source) throw new Error('Set POK_SMOKE_XML or pass a read-only PoB XML path as the first argument.');
const expected = parseBuild(fs.readFileSync(source, 'utf8'));
const expectedSkills = expected.skillSets.find(set => set.active);
const expectedConfig = expected.configs.find(set => set.active);
const alternateConfig = expected.configs.find(set => !set.active);
if (!expectedSkills?.groups.length || !alternateConfig || expected.items.length < 2 || !expected.itemSets.find(set => set.active)?.slots['Weapon 1'])
  throw new Error('Smoke fixture needs an equipped Weapon 1, two stored items, skill groups and two config sets.');
const digest = () => createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const originalHash = digest();
const failures = [], errors = [];
fs.mkdirSync(artifacts, { recursive: true });
const launch = () => chromium.launchPersistentContext(path.join(artifacts, 'renderer-smoke-profile'), {
  channel: process.env.POK_SMOKE_BROWSER || (process.platform === 'win32' ? 'msedge' : undefined),
  headless: true, viewport: { width: 1920, height: 1080 }, colorScheme: 'dark',
});
let context, page;
async function check(name, operation) {
  try { await operation(); console.log('PASS: ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL: ' + name + ': ' + error.message); }
}
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('pok-preview-v1')));
const parsed = async () => { const current = await state(); return parseBuild(current.builds.find(build => build.id === current.activeBuildId).xml); };
const saved = () => page.waitForFunction(() => document.querySelector('.statusbar [role=status]')?.textContent === '저장됨');
const nav = name => page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('button', { name, exact: true }).click();
const undo = () => page.locator('.top-actions').getByRole('button', { name: '되돌리기', exact: true }).click();
async function renameCurrent(title) {
  const row = page.locator('.history-row[data-active=true]');
  await row.locator('summary').click();
  await row.getByRole('button', { name: '이름 변경', exact: true }).click();
  await page.getByRole('textbox', { name: '대화 제목', exact: true }).fill(title);
  await page.getByRole('dialog', { name: '대화 이름 변경' }).getByRole('button', { name: '저장', exact: true }).click();
  await saved();
}
(async () => {
  context = await launch();
  page = context.pages()[0] || await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(8000);
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('heading', { name: '빌드를 가져와 시작하세요' }).waitFor();
  const chooser = page.waitForEvent('filechooser');
  await page.locator('.top-actions').getByRole('button', { name: '가져오기', exact: true }).click();
  await (await chooser).setFiles(source);
  await page.getByRole('heading', { name: '장비', exact: true }).waitFor();
  await saved();
  await check('actual XML import and saved original', async () => {
    const build = await parsed();
    const skills = build.skillSets.find(set => set.active);
    assert.deepEqual(build, expected);
    assert.equal((await state()).builds[0].originalXml, fs.readFileSync(source, 'utf8'));
    assert.equal(await page.locator('.library-row').count(), expected.items.length);
    await nav('스킬');
    assert.equal(await page.locator('.group-row').count(), expectedSkills.groups.length);
    assert.equal(await page.locator('.group-row[aria-pressed=true]').textContent(), await page.locator('.group-row').nth(expected.mainSocketGroup - 1).textContent());
    assert((await page.locator('.page-heading').textContent()).includes(`${skills.groups.length}그룹 · ${skills.groups.flatMap(group => group.gems).length}젬`));
    await nav('장비');
  });
  await check('item edit/apply and undo restore', async () => {
    const initial = await state();
    await page.locator('.raw-editor summary').click();
    const input = page.getByRole('textbox', { name: '아이템 원문', exact: true });
    const text = await input.inputValue();
    await input.fill(text + '\nUI QA temporary text');
    await page.locator('.raw-editor').getByRole('button', { name: '적용', exact: true }).click();
    await saved();
    assert((await parsed()).items.some(item => item.text.endsWith('UI QA temporary text')));
    assert((await page.locator('.stat-row strong').allTextContents()).every(value => value === '—'));
    await page.getByRole('combobox', { name: '능력치 출처' }).selectOption('original');
    assert.match(await page.locator('.stat-note').textContent(), /과거 계산값/);
    assert((await page.locator('.stat-row strong').allTextContents()).some(value => value !== '—'));
    assert.deepEqual((await parsed()).stats, parseBuild(initial.builds[0].xml).stats);
    await page.getByRole('combobox', { name: '능력치 출처' }).selectOption('current');
    assert((await page.locator('.stat-row strong').allTextContents()).every(value => value === '—'));
    await undo(); await saved();
    assert.equal((await state()).builds[0].xml, initial.builds[0].xml);
  });
  await check('slot replacement and undo', async () => {
    const initial = await state();
    const data = await parsed();
    const set = data.itemSets.find(set => set.active);
    const index = data.items.findIndex(item => item.id !== set.slots['Weapon 1']);
    await page.locator('.library-row').nth(index).getByRole('button').click();
    await saved();
    assert.equal((await parsed()).itemSets.find(set => set.active).slots['Weapon 1'], data.items[index].id);
    await undo(); await saved();
    assert.equal((await state()).builds[0].xml, initial.builds[0].xml);
  });
  await check('empty slot accepts a new raw item and both insertion/assignment can undo', async () => {
    const initial = await state();
    if (!(await page.locator('.raw-editor').evaluate(element => element.open))) await page.locator('.raw-editor summary').click();
    await page.locator('.raw-editor').getByRole('button', { name: '장착 해제', exact: true }).click();
    await saved();
    await page.waitForFunction(() => document.querySelector('.slot-row[aria-pressed=true] .item-label')?.textContent === '없음');
    if (!(await page.locator('.raw-editor').evaluate(element => element.open))) await page.locator('.raw-editor summary').click();
    await page.getByRole('textbox', { name: '아이템 원문', exact: true }).fill('Rarity: NORMAL\nSynthetic UI Base');
    await page.locator('.raw-editor').getByRole('button', { name: '적용', exact: true }).click();
    await saved();
    const data = await parsed();
    assert.equal(data.items.length, expected.items.length + 1);
    const assigned = data.itemSets.find(set => set.active).slots['Weapon 1'];
    assert.equal(data.items.find(item => item.id === assigned).name, 'Synthetic UI Base');
    await undo(); await undo(); await undo(); await saved();
    assert.equal((await state()).builds[0].xml, initial.builds[0].xml);
  });
  await check('config set selection preserves separate inputs and can undo', async () => {
    await nav('설정');
    await page.getByRole('combobox', { name: '전투 조건 세트' }).selectOption(alternateConfig.id);
    await saved();
    assert.equal(await page.locator('.config-field').count(), Object.keys(alternateConfig.inputs).length);
    assert.equal((await parsed()).configs.find(set => set.active).id, alternateConfig.id);
    await undo(); await saved();
    assert.equal(await page.locator('.config-field').count(), Object.keys(expectedConfig.inputs).length);
    assert.equal((await parsed()).configs.find(set => set.active).id, expectedConfig.id);
  });
  await check('new chat, rename and pin', async () => {
    await page.getByRole('button', { name: '새 대화', exact: true }).click();
    await renameCurrent('QA renamed conversation');
    const row = page.locator('.history-row[data-active=true]');
    if (!(await row.locator('details').evaluate(element => element.open))) await row.locator('summary').click();
    await row.getByRole('button', { name: '고정', exact: true }).click();
    await saved();
    assert.equal((await state()).chats[0].pinned, true);
    assert.equal(await page.locator('.chat-view h1').textContent(), 'QA renamed conversation');
  });
  await check('custom chat title survives first message', async () => {
    await page.getByRole('textbox', { name: '에이전트 메시지' }).fill('QA first user message');
    await page.getByRole('button', { name: '메시지 보내기' }).click();
    await page.locator('.message.assistant .warning').waitFor();
    await saved();
    assert.match(await page.locator('.message.assistant').textContent(), /데스크톱 앱/);
    assert.equal((await state()).chats[0].title, 'QA renamed conversation');
  });
  await check('user message edit removes following answer and retains revised input', async () => {
    await page.getByRole('button', { name: '메시지 편집' }).click();
    await page.getByRole('textbox', { name: '메시지 수정' }).fill('QA revised user message');
    await page.getByRole('button', { name: '수정 저장', exact: true }).click();
    await saved();
    assert.equal(await page.locator('.message').count(), 1);
    assert.equal((await state()).chats[0].messages[0].text, 'QA revised user message');
  });
  await check('chat delete/undo preserves title, pinned state and content', async () => {
    const before = (await state()).chats[0];
    const row = page.locator('.history-row[data-active=true]');
    if (!(await row.locator('details').evaluate(element => element.open))) await row.locator('summary').click();
    await row.getByRole('button', { name: '대화 삭제', exact: true }).click();
    await saved();
    assert.equal((await state()).chats.length, 0);
    await page.locator('.toast').getByRole('button', { name: '되돌리기', exact: true }).click();
    await saved();
    assert.deepEqual((await state()).chats[0], before);
    await page.locator('.history-title').first().click();
    assert.equal(await page.locator('.message.user .message-text').textContent(), 'QA revised user message');
  });
  await nav('장비');
  await page.getByRole('combobox', { name: '능력치 출처' }).selectOption('original');
  for (const [width, height] of [[1920, 1080], [1024, 768]]) await check(`${width}px layout and screenshot`, async () => {
    await page.setViewportSize({ width, height });
    await page.locator('.app-shell').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const metrics = await page.evaluate(() => {
      const box = selector => { const element = document.querySelector(selector), r = element.getBoundingClientRect(); return { x: r.x, right: r.right, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
      const stats = document.querySelector('.stats-rail');
      return { app: box('.app-shell'), slots: box('.slot-panel'), selected: box('.item-detail'), library: box('.item-library'), stats: box('.stats-rail'),
        statsClient: stats.clientHeight, statsScroll: stats.scrollHeight, groups: stats.querySelectorAll('details[open]').length,
        statsVisible: getComputedStyle(stats).display !== 'none', overflow: document.documentElement.scrollWidth > innerWidth,
        padding: getComputedStyle(document.querySelector('.feature')).padding, gap: getComputedStyle(document.querySelector('.equipment-columns')).gap,
        summaries: Array.from(stats.querySelectorAll('summary')).map(element => element.getBoundingClientRect().bottom) };
    });
    await page.screenshot({ path: path.join(artifacts, `ui-${width}.png`) });
    console.log(JSON.stringify({ width, height, metrics }));
    assert.equal(metrics.statsVisible, true);
    assert.equal(metrics.groups, 5);
    assert(metrics.summaries.every(bottom => bottom <= height), 'all stats summaries visible');
    assert(metrics.selected.right <= metrics.library.x + 1, 'item and library side by side');
    assert(metrics.library.right <= metrics.stats.x + 1, 'stats panel has its own column');
    assert.equal(metrics.overflow, false);
  });
  const beforeRestart = await state();
  await context.close();
  context = await launch(); page = context.pages()[0] || await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('heading', { name: '장비', exact: true }).waitFor();
  await check('browser restart retains local workspace', async () => {
    assert.deepEqual(await state(), beforeRestart);
    assert.equal(await page.locator('.library-row').count(), expected.items.length);
    await page.locator('.history-title').first().click();
    assert.equal(await page.locator('.message.user .message-text').textContent(), 'QA revised user message');
  });
  assert.equal(digest(), originalHash);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(artifacts, 'renderer-smoke-result.json'), JSON.stringify({ failures, errors, sourceHashUnchanged: true }, null, 2));
  if (failures.length) throw new Error(failures.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (context) await context.close(); });
