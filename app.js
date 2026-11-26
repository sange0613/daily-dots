"use strict";

const paths = {
  book: '<path d="M12 6a6 6 0 0 0-8-1v13a6 6 0 0 1 8 1 6 6 0 0 1 8-1V5a6 6 0 0 0-8 1v13"/>',
  leaf: '<path d="M20 4c0 10-4 15-10 15-3 0-5-2-5-5 0-5 5-8 15-10ZM4 20l9-9"/>',
  pen: '<path d="m15 5 4 4M5 15l-1 5 5-1 11-11a2.8 2.8 0 0 0-4-4Z"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  water: '<path d="M12 3c-2 4-6 7-6 11a6 6 0 1 0 12 0c0-4-4-7-6-11Z"/>',
  moon: '<path d="M19.7 14.5A8 8 0 0 1 9.5 4.3 8.3 8.3 0 1 0 19.7 14.5Z"/>',
  study: '<path d="m3 9 9-5 9 5-9 5-9-5Zm3 2v5c4 3 8 3 12 0v-5m3-2v6"/>',
  walk: '<circle cx="13.5" cy="4.7" r="1.6"/><path d="m4 12 4-2 2-2 4 2 3 3h3m-8-4-2 6 4 3v3M10 15l-2 3-4 1"/>',
  note: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2-12-4 14"/>',
  star: '<path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9L12 3Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><rect x="14" y="14" width="6" height="6" rx="1.2"/>',
  chart: '<path d="M4 4v16h16M8 16v-4m5 4V8m5 8v-6"/>',
  widgets: '<rect x="4" y="6" width="12" height="13" rx="2"/><path d="M9 3h9a2 2 0 0 1 2 2v10"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
  ring: '<circle cx="12" cy="12" r="6" stroke-dasharray="1 5"/>',
  contrast: '<circle cx="12" cy="12" r="8"/><path fill="currentColor" stroke="none" d="M12 4a8 8 0 0 1 0 16Z"/>'
};
const iconNames = { book:"书本", leaf:"叶子", pen:"铅笔", activity:"心率", water:"水滴", moon:"月亮", study:"学士帽", walk:"散步", note:"笔记", code:"代码", star:"星星" };
const toneNames = { violet:"紫色", green:"绿色", orange:"杏色", blue:"蓝色", rose:"玫瑰色", gold:"沙色" };
const initialHabits = [
  ["reading", "阅读", "book", "violet"], ["meditation", "冥想", "leaf", "green"],
  ["writing", "写作", "pen", "orange"], ["workout", "运动", "activity", "blue"],
  ["water", "喝水", "water", "blue"], ["sleep", "早睡", "moon", "violet"],
  ["study", "学习", "study", "rose"], ["walk", "散步", "walk", "green"],
  ["journal", "日记", "note", "gold"], ["coding", "编程", "code", "violet"]
];
const nav = [["overview", "总览", "grid"], ["trends", "统计", "chart"], ["widgets", "小组件", "widgets"]];
const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const periods = { week:"周", month:"月", year:"年" };
const storageKey = "daily-dots.web.v1";
const themeKey = "daily-dots.theme";
const app = document.querySelector("#app");
const editor = document.querySelector("#editor");
const manager = document.querySelector("#manager");
const managerList = document.querySelector("#manager-list");
const editActions = document.querySelector("#edit-actions");
const archiveAction = document.querySelector("#archive-action");
const deleteConfirmation = document.querySelector("#delete-confirmation");
const deleteDescription = document.querySelector("#delete-description");
const nameInput = document.querySelector("#habit-name");
const notice = document.querySelector("#notice");
const zhFull = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" });
const zhDate = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" });
const zhMonth = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" });
let today = dayKey(new Date());
let selected = today;
let detailDay = today;
let period = "month";
let trendsPeriod = "week";
let store = loadStore();
let preview = store.mode === "demo";
let monochrome = loadTheme();
let editing;
let editingExisting = false;
let noticeTimer;
let initialNavigation = true;

function glyph(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.star}</svg>`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
}
function dayKey(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function dayFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
function addDays(date, delta) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta, 12);
}
function dayList(start, end) {
  const days = [];
  for (let date = start; date < end; date = addDays(date, 1)) days.push(dayKey(date));
  return days;
}
function firstColumn(date) {
  return (date.getDay() + 6) % 7;
}
function periodDays(key, type) {
  const date = dayFromKey(key);
  const y = date.getFullYear();
  const m = date.getMonth();
  if (type === "week") {
    const first = addDays(date, -firstColumn(date));
    return dayList(first, addDays(first, 7));
  }
  if (type === "year") return dayList(new Date(y, 0, 1, 12), new Date(y + 1, 0, 1, 12));
  return dayList(new Date(y, m, 1, 12), new Date(y, m + 1, 1, 12));
}
function monthCells(key) {
  const days = periodDays(key, "month");
  const blanks = Array(firstColumn(dayFromKey(days[0]))).fill(null);
  const cells = [...blanks, ...days];
  return [...cells, ...Array(42 - cells.length).fill(null)];
}
function makeHabits(sample) {
  return initialHabits.map(([id, name, icon, tone], index) => {
    const days = [];
    if (sample) {
      for (let offset = 1; offset <= 160; offset++) {
        if ((offset * 11 + index * 7 + Math.floor(offset / 5)) % 17 < 11) {
          days.push(dayKey(addDays(dayFromKey(today), -offset)));
        }
      }
      if ([0, 1, 4, 7].includes(index)) days.push(today);
    }
    return { id, name, icon, tone, days };
  });
}
function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    if (parsed && Array.isArray(parsed.demo) && Array.isArray(parsed.mine)) return parsed;
  } catch {
    // Safari can deny storage in restricted contexts.
  }
  return { mode: "demo", demo: makeHabits(true), mine: makeHabits(false) };
}
function loadTheme() {
  try {
    return localStorage.getItem(themeKey) === "monochrome";
  } catch {
    return false;
  }
}
function applyTheme() {
  document.documentElement.dataset.theme = monochrome ? "monochrome" : "lavender";
  document.querySelector('meta[name="theme-color"]').content = monochrome ? "#f5f5f5" : "#f5f3f8";
  app.querySelector('[data-action="theme"]')?.setAttribute("aria-pressed", String(monochrome));
}
function toggleTheme() {
  monochrome = !monochrome;
  applyTheme();
  try {
    localStorage.setItem(themeKey, monochrome ? "monochrome" : "lavender");
  } catch {
    notify("当前浏览器无法记住主题选择");
  }
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch {
    notify("浏览器暂时无法保存，刷新后可能丢失");
    return false;
  }
}
function habits() {
  return preview ? store.demo : store.mine;
}
function activeHabits() {
  return habits().filter(habit => !habit.archived);
}
function route() {
  const [page, id] = location.hash.slice(1).split("/");
  const habit = page === "habit" ? habits().find(item => item.id === id) : undefined;
  return { page: habit ? "habit" : nav.some(item => item[0] === page) ? page : "overview", habit };
}
function go(page) {
  if (location.hash === "#" + page) {
    window.scrollTo(0, 0);
    return;
  }
  location.hash = page;
}
function notify(text) {
  clearTimeout(noticeTimer);
  notice.hidden = false;
  notice.textContent = text;
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 2600);
}
function totalOn(key, list = habits()) {
  return list.filter(item => item.days.includes(key)).length;
}
function toggle(id, key) {
  const habit = habits().find(item => item.id === id);
  if (!habit || habit.archived || !key || key > today) return;
  const index = habit.days.indexOf(key);
  if (index >= 0) habit.days.splice(index, 1);
  else habit.days.push(key);
  const saved = save();
  render();
  if (saved) notify(index >= 0 ? `${habit.name} · 已撤销` : `${habit.name} · 已打卡`);
}
function streak(keys, through) {
  const entries = new Set(keys);
  let cursor = entries.has(through) ? dayFromKey(through) : addDays(dayFromKey(through), -1);
  let result = 0;
  while (entries.has(dayKey(cursor))) {
    result++;
    cursor = addDays(cursor, -1);
  }
  return result;
}
function pageTitle(title, eyebrow) {
  return `<header class="page-head"><div>
    ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
    <h1>${title}</h1></div>
    <div class="page-actions">
      <button class="chip" data-action="mode" aria-label="${preview ? "当前为示例数据，切换到我的记录" : "当前为我的记录，切换到示例"}">
        <span>${preview ? "示例 · 开始使用" : "我的记录"}</span>
      </button>
      <button class="theme-toggle" data-action="theme" aria-label="黑白主题" aria-pressed="${monochrome}">
        ${glyph("contrast")}<span>黑白</span>
      </button>
    </div>
  </header>`;
}
function dock(page) {
  return `<nav class="dock${page === "habit" ? " split-dock" : ""}" aria-label="主导航"><div class="dock-inner"><div class="tabs">
    ${nav.map(([id, title, image]) => `<button class="tab" data-action="nav" data-key="${id}" ${id === page || (page === "habit" && id === "overview") ? 'aria-current="page"' : ""}>
      ${glyph(image)}<span>${title}</span></button>`).join("")}
    </div><button class="add" data-action="add" aria-label="添加习惯">${glyph("plus")}</button></div></nav>`;
}
function dots(habit, cells, active, year = false) {
  const entries = new Set(habit.days);
  return `<div class="dots${year ? " year" : ""}" aria-hidden="true">${cells.map(key => {
    const style = !key ? "blank" : entries.has(key) ? "filled" : key > today ? "future" : "";
    return `<span class="${style}${key && key === active ? " active" : ""}"><i></i></span>`;
  }).join("")}</div>`;
}
function card(habit, key, mini = false, isSelected = false) {
  const done = habit.days.includes(key);
  const cells = monthCells(key);
  const count = cells.filter(day => habit.days.includes(day)).length;
  const badge = `<span class="badge">${glyph(habit.icon)}</span>`;
  return `<article class="habit-card surface tone-${habit.tone}${isSelected ? " selected-card" : ""}">
    <div class="card-head">
      <button class="card-link" data-action="detail" data-id="${habit.id}" aria-label="${escapeHTML(habit.name)}详情"${isSelected ? ' aria-current="true"' : ""}>${badge}<span>${escapeHTML(habit.name)}</span></button>
      ${mini ? "" : `<button class="check-button" data-action="check" data-id="${habit.id}" data-key="${key}" aria-label="${escapeHTML(habit.name)}打卡" aria-pressed="${done}">
        <span>${glyph(done ? "check" : "plus")}</span></button>`}
    </div>
    ${dots(habit, cells, key)}
    <p class="card-foot">本月 ${count} 次</p>
  </article>`;
}
function overview(selectedHabit) {
  const active = activeHabits();
  const count = totalOn(selected, active);
  const total = active.length;
  return `${pageTitle("日常打卡", zhFull.format(dayFromKey(today)))}
    <section class="progress-card surface" aria-labelledby="progress-title">
      <div class="progress-head">
        <h2 id="progress-title">${selected === today ? "今日进度" : zhDate.format(dayFromKey(selected)) + "进度"}</h2>
        <p class="progress-count"><strong>${count}</strong> / ${total} 项已完成</p>
        <div class="ring" style="--fill:${total ? count / total * 100 : 0}%" aria-hidden="true"><span>${glyph(count === total && total ? "check" : "ring")}</span></div>
      </div>
      <div class="week-strip" role="group" aria-label="本周日期">
        ${periodDays(today, "week").map((key, index) => `<button class="${totalOn(key, active) ? "has-log" : ""}" data-action="select-day" data-key="${key}" aria-label="${zhFull.format(dayFromKey(key))}" aria-pressed="${key === selected}" ${key > today ? "disabled" : ""}>
          <span class="weekday">${weekdays[index]}</span><span>${dayFromKey(key).getDate()}</span><i></i></button>`).join("")}
      </div>
    </section>
    <div class="section-line habits-heading"><h2>我的习惯</h2><div class="section-actions">
      <p>${dayFromKey(selected).getMonth() + 1} 月记录</p><button class="manage-button" data-action="manage">管理</button>
    </div></div>
    ${active.length ? `<section class="habit-grid" aria-label="习惯列表">${active.map(habit => card(habit, selected, false, habit.id === selectedHabit)).join("")}</section>` : `
      <div class="empty-state surface"><p>暂无进行中的习惯</p><button class="secondary" data-action="add">添加习惯</button></div>`}`;
}
function segments(current, action) {
  return `<div class="segments" role="group" aria-label="统计周期">
    ${Object.entries(periods).map(([key, title]) => `<button data-action="${action}" data-key="${key}" aria-pressed="${key === current}">${title}</button>`).join("")}
    </div>`;
}
function metrics(firstTitle, first, firstUnit, secondTitle, second, secondUnit) {
  return `<div class="metric-grid"><div class="metric surface"><p>${firstTitle}</p><strong>${first}</strong><small>${firstUnit}</small></div>
    <div class="metric surface"><p>${secondTitle}</p><strong>${second}</strong><small>${secondUnit}</small></div></div>`;
}
function detail(habit) {
  const days = periodDays(detailDay, period);
  const entries = new Set(habit.days);
  const count = days.filter(key => entries.has(key)).length;
  const done = entries.has(detailDay);
  const heading = period === "year" ? `${dayFromKey(detailDay).getFullYear()} 年` : period === "month" ? zhMonth.format(dayFromKey(detailDay)) : `${zhDate.format(dayFromKey(days[0]))}至${zhDate.format(dayFromKey(days.at(-1)))}`;
  const cells = period === "month" ? monthCells(detailDay) : days;
  const calendar = period === "year" ? dots(habit, days, detailDay, true) : `<div class="calendar-row">
    ${weekdays.map(day => `<small>${day}</small>`).join("")}
    ${cells.map(key => key ? `<button class="${entries.has(key) ? "filled" : ""}" data-action="detail-day" data-key="${key}" aria-label="${zhDate.format(dayFromKey(key))}${entries.has(key) ? "，已打卡" : ""}" aria-pressed="${key === detailDay}" ${key > today ? "disabled" : ""}>${dayFromKey(key).getDate()}<i></i></button>` : "<span></span>").join("")}
    </div>`;
  return `<div class="detail-nav"><button data-action="nav" data-key="overview" aria-label="返回总览">${glyph("left")} 总览</button>
    <button class="icon-button" data-action="edit" data-id="${habit.id}" aria-label="编辑习惯">${glyph("pen")}</button></div>
    <div class="tone-${habit.tone}"><header class="detail-heading"><span class="badge">${glyph(habit.icon)}</span><h1>${escapeHTML(habit.name)}</h1></header>
    ${habit.archived ? '<p class="archive-tag">已归档</p>' : ""}
    ${segments(period, "period")}
    ${metrics("连续打卡", streak(entries, today), "天", `本${periods[period]}打卡`, count, "次")}
    ${habit.archived ? `<button class="secondary restore-button" data-action="restore-habit" data-id="${habit.id}">恢复习惯</button>` :
      `<button class="primary${done ? " checked" : ""}" data-action="check" data-id="${habit.id}" data-key="${detailDay}" aria-pressed="${done}">
        ${glyph(done ? "check" : "plus")}${detailDay === today ? "今天" : zhDate.format(dayFromKey(detailDay))}${done ? "已打卡 · 撤销" : "打卡"}</button>`}
    <section class="detail-calendar surface"><h2>${heading}</h2>${calendar}</section></div>`;
}
function chartBuckets(days, type) {
  if (type === "year") {
    return Array.from({ length: 12 }, (_, month) => ({
      label: String(month + 1), keys: days.filter(day => dayFromKey(day).getMonth() === month)
    }));
  }
  const step = type === "month" ? 7 : 1;
  return days.filter((_, index) => index % step === 0).map((key, index) => ({
    label: type === "month" ? String(dayFromKey(key).getDate()) + "日" : weekdays[index],
    keys: days.slice(index * step, index * step + step)
  }));
}
function trends() {
  const days = periodDays(today, trendsPeriod);
  const eligible = days.filter(key => key <= today);
  const groupCount = eligible.reduce((sum, key) => sum + totalOn(key), 0);
  const datesWithLogs = eligible.filter(key => totalOn(key) > 0).length;
  const list = habits().map(habit => ({ habit, count: eligible.filter(key => habit.days.includes(key)).length }))
    .sort((a, b) => b.count - a.count);
  const buckets = chartBuckets(days, trendsPeriod).map(({ label, keys }) => ({
    label, count: keys.reduce((sum, key) => sum + totalOn(key), 0)
  }));
  const max = Math.max(1, ...buckets.map(bucket => bucket.count));
  return `${pageTitle("打卡统计", "习惯进度")}
    ${segments(trendsPeriod, "trends-period")}
    ${metrics("打卡总次数", groupCount, "次", "有打卡的天数", datesWithLogs, "天")}
    <section class="chart surface"><h2>打卡分布</h2>
      <div class="chart-grid" style="--bars:${buckets.length}">
        ${buckets.map(({ label, count }) => `<div class="bar" aria-label="${label}，${count} 次"><div class="bar-track"><i class="bar-fill" style="height:${100 * count / max}%;${count ? "" : "visibility:hidden"}"></i></div><span>${label}</span></div>`).join("")}
      </div>
    </section>
    <div class="section-line"><h2>按习惯</h2></div>
    <section class="habit-grid" aria-label="习惯打卡次数">
    ${list.map(({ habit, count }) => `<article class="stat-row surface tone-${habit.tone}">
      <button class="card-link" data-action="detail" data-id="${habit.id}"><span class="badge">${glyph(habit.icon)}</span><span>${escapeHTML(habit.name)}</span></button>
      <span class="count">${count} 次${habit.archived ? " · 已归档" : ""}</span>
      <div class="track" aria-hidden="true"><i style="width:${eligible.length ? count / eligible.length * 100 : 0}%"></i></div>
    </article>`).join("")}</section>`;
}
function widgets() {
  const active = activeHabits();
  const first = active[0];
  return `${pageTitle("小组件", "主屏幕样式预览")}
    <div class="widget-board">
      <section class="widget surface"><h2>本月习惯</h2>${first ? `<div class="habit-grid">${active.slice(0, 2).map(habit => card(habit, today, true)).join("")}</div>` : "<p>暂无进行中的习惯</p>"}</section>
      ${first ? `<section class="widget surface tone-${first.tone}"><h2>${escapeHTML(first.name)} · 全年</h2>
        ${dots(first, periodDays(today, "year"), null, true)}</section>` : ""}
    </div>
    <p class="widget-note">可通过 Safari 将打卡网页添加到 iPhone 主屏幕。</p>`;
}
function render() {
  const focus = document.activeElement;
  const match = focus?.dataset.action && app.contains(focus) ? { ...focus.dataset } : null;
  const detailFocused = focus?.closest(".detail-pane");
  const { page, habit } = route();
  const content = page === "habit" ? `<section class="overview-pane" aria-label="习惯总览">${overview(habit.id)}</section>
    <section class="detail-pane" aria-label="习惯详情">${detail(habit)}</section>` :
    page === "trends" ? trends() : page === "widgets" ? widgets() : overview();
  app.innerHTML = `<main class="shell${page === "habit" ? " habit-layout" : ""}">${content}</main>${dock(page)}`;
  if (manager.open) renderManager();
  if (match) {
    const scope = detailFocused ? app.querySelector(".detail-pane") : app;
    const successor = [...(scope?.querySelectorAll("button") ?? [])].find(button => Object.entries(match).every(([key, value]) => button.dataset[key] === value));
    successor?.focus({ preventScroll: true });
  }
}
function renderManager() {
  const focus = managerList.contains(document.activeElement) ? document.activeElement.dataset : null;
  const active = activeHabits();
  const archived = habits().filter(habit => habit.archived);
  const item = (habit, controls) => `<li class="manage-row tone-${habit.tone}" data-habit="${habit.id}">
    <button class="card-link" data-action="managed-detail" data-id="${habit.id}" aria-label="${escapeHTML(habit.name)}详情">
      <span class="badge">${glyph(habit.icon)}</span><span>${escapeHTML(habit.name)}</span>
    </button>
    <div class="manage-controls">${controls}</div></li>`;
  managerList.innerHTML = `<section class="manage-section" aria-labelledby="active-title">
    <h3 id="active-title">进行中 <span>${active.length}</span></h3>
    ${active.length ? `<ul>${active.map((habit, index) => item(habit, `
      <button class="move-button" data-action="reorder" data-id="${habit.id}" data-key="up" aria-label="上移${escapeHTML(habit.name)}" ${index === 0 ? "disabled" : ""}>${glyph("up")}</button>
      <button class="move-button" data-action="reorder" data-id="${habit.id}" data-key="down" aria-label="下移${escapeHTML(habit.name)}" ${index === active.length - 1 ? "disabled" : ""}>${glyph("down")}</button>
      <button class="manage-text" data-action="archive-habit" data-id="${habit.id}" aria-label="归档${escapeHTML(habit.name)}">归档</button>
    `)).join("")}</ul>` : '<p class="manage-empty">暂无进行中的习惯</p>'}
  </section>
  <section class="manage-section" aria-labelledby="archived-title">
    <h3 id="archived-title">已归档 <span>${archived.length}</span></h3>
    ${archived.length ? `<ul>${archived.map(habit => item(habit, `
      <button class="manage-text" data-action="restore-habit" data-id="${habit.id}" aria-label="恢复${escapeHTML(habit.name)}">恢复</button>
    `)).join("")}</ul>` : '<p class="manage-empty">暂无已归档的习惯</p>'}
  </section>`;
  if (!focus) return;
  const candidates = [...managerList.querySelectorAll("button:not(:disabled)")].filter(button => button.dataset.id === focus.id);
  const next = candidates.find(button => button.dataset.action === focus.action && button.dataset.key === focus.key)
    ?? candidates.find(button => button.dataset.action !== "managed-detail");
  next?.focus({ preventScroll: true });
}
function reorderHabit(id, direction) {
  const list = habits();
  const active = activeHabits();
  const index = active.findIndex(habit => habit.id === id);
  const neighbor = active[index + (direction === "up" ? -1 : 1)];
  if (index < 0 || !neighbor) return;
  const from = list.indexOf(active[index]);
  const to = list.indexOf(neighbor);
  [list[from], list[to]] = [list[to], list[from]];
  if (!save()) [list[from], list[to]] = [list[to], list[from]];
  render();
}
function setArchived(id, archived) {
  const habit = habits().find(item => item.id === id);
  if (!habit || Boolean(habit.archived) === archived) return;
  const previous = habit.archived;
  habit.archived = archived;
  if (!save()) {
    habit.archived = previous;
    return;
  }
  render();
  notify(archived ? "习惯已归档，历史记录已保留" : "习惯已恢复");
}
function openDetail(id) {
  const page = "habit/" + id;
  if (location.hash === "#" + page) return;
  period = "month";
  detailDay = selected;
  go(page);
}
function editorOptions() {
  document.querySelector("#icon-options").innerHTML = Object.entries(iconNames).map(([key, name]) =>
    `<button class="option" type="button" data-action="pick-icon" data-key="${key}" aria-label="${name}" aria-pressed="${editing.icon === key}">${glyph(key)}</button>`).join("");
  document.querySelector("#tone-options").innerHTML = Object.entries(toneNames).map(([key, name]) =>
    `<button class="option tone-${key}" type="button" data-action="pick-tone" data-key="${key}" aria-label="${name}" aria-pressed="${editing.tone === key}"><span class="swatch"></span></button>`).join("");
}
function showEditor(id) {
  const source = habits().find(habit => habit.id === id);
  if (id && !source) return;
  editingExisting = Boolean(source);
  editing = source ? { ...source } : { id: crypto.randomUUID?.() || Math.random().toString(36).slice(2), name: "", icon: "star", tone: "violet", days: [] };
  document.querySelector("#editor-title").textContent = source ? "编辑习惯" : "添加习惯";
  nameInput.value = editing.name;
  nameInput.setCustomValidity("");
  deleteConfirmation.hidden = true;
  editActions.hidden = !source;
  archiveAction.textContent = source?.archived ? "恢复习惯" : "归档习惯";
  editorOptions();
  editor.showModal();
  if (!source) nameInput.focus();
}
function showDeleteConfirmation() {
  const habit = habits().find(item => item.id === editing?.id);
  if (!editor.open || !editingExisting || !habit) return;
  const records = habit.days.length ? `及其 ${habit.days.length} 条打卡记录` : "";
  deleteDescription.textContent = `将永久删除「${habit.name}」${records}。`;
  deleteConfirmation.hidden = false;
  deleteConfirmation.querySelector('[data-action="cancel-delete"]').focus();
}
function cancelDelete() {
  deleteConfirmation.hidden = true;
  editActions.querySelector('[data-action="ask-delete"]').focus();
}
function deleteHabit() {
  if (!editor.open || deleteConfirmation.hidden || !editingExisting) return;
  const list = habits();
  const index = list.findIndex(habit => habit.id === editing.id);
  if (index < 0) return;
  const [removed] = list.splice(index, 1);
  if (!save()) {
    list.splice(index, 0, removed);
    deleteDescription.textContent = "暂时无法保存删除操作。习惯和记录仍在，请重试。";
    return;
  }
  editor.close();
  if (location.hash === "#habit/" + removed.id) go("overview");
  else render();
  notify("习惯已删除");
}
document.querySelector("#habit-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!deleteConfirmation.hidden) return;
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.setCustomValidity("请输入习惯名称");
    nameInput.reportValidity();
    return;
  }
  const list = habits();
  const index = list.findIndex(habit => habit.id === editing.id);
  if (editingExisting && index < 0) {
    editor.close();
    notify("此习惯已删除");
    return;
  }
  const { icon, tone } = editing;
  if (index < 0) list.push({ ...editing, name });
  else list[index] = { ...list[index], name, icon, tone };
  const saved = save();
  editor.close();
  render();
  if (saved) notify(index < 0 ? "已添加习惯" : "已保存修改");
});
editor.addEventListener("cancel", event => {
  if (!deleteConfirmation.hidden) {
    event.preventDefault();
    cancelDelete();
  }
});
nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
document.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const { action, id, key } = button.dataset;
  switch (action) {
    case "nav": go(key); break;
    case "detail": openDetail(id); break;
    case "managed-detail": manager.close(); openDetail(id); break;
    case "check": toggle(id, key); break;
    case "select-day":
      selected = key;
      if (route().page === "habit") detailDay = key;
      render();
      break;
    case "detail-day": detailDay = key; render(); break;
    case "period": period = key; render(); break;
    case "trends-period": trendsPeriod = key; render(); break;
    case "add": showEditor(); break;
    case "edit": showEditor(id); break;
    case "close-editor": editor.close(); break;
    case "manage": renderManager(); manager.showModal(); break;
    case "close-manager": manager.close(); break;
    case "reorder": reorderHabit(id, key); break;
    case "archive-habit": setArchived(id, true); break;
    case "restore-habit": setArchived(id, false); break;
    case "archive-edited": {
      const habit = habits().find(item => item.id === editing?.id);
      if (!habit) break;
      setArchived(habit.id, !habit.archived);
      archiveAction.textContent = habit.archived ? "恢复习惯" : "归档习惯";
      break;
    }
    case "ask-delete": showDeleteConfirmation(); break;
    case "cancel-delete": cancelDelete(); break;
    case "delete-habit": deleteHabit(); break;
    case "pick-icon":
    case "pick-tone": {
      editing[action === "pick-icon" ? "icon" : "tone"] = key;
      button.parentElement.querySelectorAll("button").forEach(item => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      break;
    }
    case "theme": toggleTheme(); break;
    case "mode":
      preview = !preview;
      store.mode = preview ? "demo" : "mine";
      if (save()) notify(preview ? "已切换到示例数据" : "已切换到我的记录");
      render();
      break;
  }
});
function navigate() {
  if (!initialNavigation) {
    const switchingPane = route().page === "habit" && app.querySelector(".overview-pane")?.getClientRects().length;
    if (!switchingPane) window.scrollTo(0, 0);
    render();
    const heading = app.querySelector(".detail-pane h1") ?? app.querySelector("h1");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  } else {
    initialNavigation = false;
    render();
  }
}
function refreshDate() {
  const current = dayKey(new Date());
  if (current === today) return;
  selected = current;
  detailDay = current;
  today = current;
  render();
}
window.addEventListener("hashchange", navigate);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDate(); });
window.addEventListener("focus", refreshDate);
window.addEventListener("storage", event => {
  if (event.key === themeKey || event.key === null) {
    monochrome = loadTheme();
    applyTheme();
  }
  if (event.key !== storageKey && event.key !== null) return;
  store = loadStore();
  if (preview !== (store.mode === "demo")) {
    if (editor.open) editor.close();
    if (manager.open) manager.close();
  }
  preview = store.mode === "demo";
  render();
});
setInterval(refreshDate, 30_000);
applyTheme();
navigate();
