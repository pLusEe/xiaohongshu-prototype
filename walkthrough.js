/* The phone owns every action. The guide follows those actions without
   navigating, sending, publishing, or moving focus on normal progression. */
window.createXHSWalkthrough = env => {
  "use strict";
  const root = document.getElementById("walkthrough");
  const body = document.getElementById("walkthrough-body");
  const device = document.getElementById("device");
  const { esc } = env;
  const readers = ["reader-yu", "reader-xia", "reader-zhi", "reader-bai"];
  const steps = ["留下一个赞", "晒出这份喜欢", "查看自己的晒赞", "找到同好", "聊一聊", "继续对话"];
  const extras = [
    ["feed-hold", "首页长按晒赞", ["长按卡片爱心", "选择并完成晒赞"]],
    ["detail-hold", "详情长按晒赞", ["长按底部爱心", "选择并完成晒赞"]],
    ["privacy", "赞过页管理", ["打开全部赞过", "长按加入晒赞", "撤回晒赞，保留点赞"]],
    ["interests", "共同兴趣", ["点兴趣词筛选", "展开更多兴趣", "打开 TA 还赞过的笔记"]],
    ["profile", "主页共同关系", ["从主页查看共同赞过", "从主页查看共同关注"]]
  ];
  const complete = new Set(), skipped = new Set();
  const checks = new Map(extras.map(([id]) => [id, new Set()]));
  let step = 0, branch = null, branchTarget, checkpoint;
  let target, peer, baseline, seenDetail = false, expectedForm = null, noNewNotes = false;
  let extrasOpen = false, frame = 0, signature = "", taskSignature = "", lastTarget = null;
  let events = [], cueFrame = 0, cueGeometry = "";
  const experienceTargets = new Map();
  const trackedAnimations = new WeakSet();
  const state = () => env.state();
  const selector = (action, id) => `[data-action="${action}"]${id ? `[data-id="${id}"]` : ""}`;
  const pick = query => query && [...document.querySelectorAll(query)].find(el =>
    !el.closest(".route-snapshot") && !el.closest('[data-closing="true"]') && !el.hidden && el.getClientRects().length);
  const messagesSince = (s, ids) => s.messages.filter(m => !ids.has(m.id));
  const branchDone = id => checks.get(id).size === extras.find(x => x[0] === id)[2].length;
  const missing = id => extras.find(x => x[0] === id)[2].findIndex((_, i) => !checks.get(id).has(i));
  const noteRoute = id => `${env.notes.find(n => n.id === id)?.video ? "video" : "note"}/${id}`;
  function choosePeer(id) {
    peer = readers.find(p => env.publicNotes(p).some(n => n.id === id)) ||
      readers.toSorted((a, b) => env.common(b).length - env.common(a).length)[0];
  }
  function chooseStory() {
    const feed = env.recommendedNotes();
    noNewNotes = feed.length === 0;
    const story = feed.find(n => !n.video && !n.noGallery) || feed[0] ||
      env.notes.find(n => !n.video && n.authorId !== state().actor);
    target = story.id;
    choosePeer(target);
    baseline = new Set(state().messages.map(m => m.id));
    seenDetail = false; expectedForm = null;
  }
  chooseStory();
  const cue = document.createElement("div");
  cue.id = "walkthrough-cue";
  cue.setAttribute("aria-hidden", "true");
  cue.hidden = true;
  // Page annotation: outside the device's zoom and rounded clipping.
  document.body.appendChild(cue);

  function schedule() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
  }
  function scheduleCue() {
    if (!cueFrame) cueFrame = requestAnimationFrame(() => { cueFrame = 0; positionCue(); });
  }
  const appTarget = (action, id) => `#app ${selector(action, id)}`;
  const backTarget = '#app header [data-action="back"]';
  function modalTask(s) {
    if (!s.modal) return null;
    const inOverlay = query => `#overlay-root ${query}`;
    if (s.modal.kind === "like-menu") {
      const id = s.modal.id, pub = env.isPublic(id), liked = env.isLiked(id);
      if (branch === "privacy" && checks.get(branch).has(1)) return {
        title: "撤回这篇的晒赞", copy: "点「撤回晒赞」。这篇仍会保留在你的赞过里。",
        target: inOverlay(selector("social-withdraw", id)), hint: "黄心会变回红心，普通点赞仍保留。"
      };
      if (pub && branch && ["feed-hold", "detail-hold", "privacy"].includes(branch) && !branchDone(branch)) return {
        title: "这篇已经晒赞", copy: "可以先撤回，再体验从这个入口加入晒赞。",
        target: inOverlay(selector("social-withdraw", id)), hint: "撤回晒赞会保留点赞。"
      };
      return {
        title: pub ? "这篇已经晒赞" : liked ? "晒出这份喜欢" : "选择点赞并晒赞",
        copy: pub ? "点「看看同好」，看看谁也喜欢这篇。" : liked ? "点「晒赞」，让大家看见这份喜欢。" : "点「点赞并晒赞」，再确认加入。",
        target: inOverlay(selector(pub ? "social-find" : liked ? "social-publish" : "social-like-and-publish", id)),
        hint: "打开菜单还未完成晒赞；只加入你选择的这一篇。"
      };
    }
    if (s.modal.kind === "public-like") return {
      title: "确认晒赞", copy: "点底部按钮，晒出这一篇。",
      target: inOverlay(selector("social-confirm-public")), hint: "其他赞过的隐私设置不变，晒赞可以随时撤回。"
    };
    if (s.modal.kind === "confirm") return {
      title: "发送笔记", copy: "点「发送」，留言可不填。",
      target: "#share-form [type=submit]", hint: pick('.send-dialog[data-share-context="common"]') ? "对方会看到「来自找同好」和共同赞过的笔记；发送前仍可取消。" : "留言可不填；发送前仍可取消。"
    };
    return { title: "先完成当前操作", copy: "可以继续操作这个面板，或关闭后回到当前体验。", target: null, hint: "" };
  }
  function branchTask(s) {
    const id = branch, index = missing(id), route = s.route;
    const base = { hint: "", target: null };
    if (branchDone(id)) return { ...base, title: "这项体验已完成", copy: "可以继续在手机里探索，或返回刚才的主线。", done: true };
    if (["feed-hold", "detail-hold"].includes(id)) return {
      ...base, title: id === "feed-hold" ? "按住卡片的爱心" : "按住底部的爱心",
      copy: "按住约半秒，再选择「晒赞」或「点赞并晒赞」。",
      target: appTarget("like", branchTarget), hint: "确认晒赞后才完成；电脑也可以右键或按 Shift+F10。"
    };
    if (id === "privacy") return {
      ...base, title: index === 0 ? "打开全部赞过" : index === 1 ? "从赞过里晒出一篇喜欢" : "撤回这篇晒赞",
      copy: index === 0 ? "点「全部」，找到想晒赞的笔记。" : index === 1 ? "长按提示的爱心，选择「晒赞」。" : "长按这篇的黄心，再选「撤回晒赞」。",
      target: index === 0 ? '#app [data-action="social-filter"][data-value="all"]' : appTarget("like", branchTarget),
      hint: "撤回晒赞仍保留点赞，不改变其他赞过的隐私设置。"
    };
    if (id === "interests") {
      if (route.startsWith("note/") || route.startsWith("video/")) return { ...base, title: "看看这篇新发现", copy: "读完后点左上角返回，共同兴趣还在原来的位置。", target: backTarget };
      return {
        ...base, title: ["从一个兴趣词展开", "看看更多共同兴趣", "发现 TA 还赞过的内容"][index],
        copy: ["点一个彩色兴趣词，下面的共同笔记会跟着筛选。", "点「更多共同兴趣」，看看其他共同点。", "向下浏览「TA 还赞过」，打开一篇笔记。"][index],
        target: index === 0 ? '#app [data-action="social-topic"][data-value]:not([data-value=""])' : index === 1 ? appTarget("social-insights-toggle") : '#app .peer-discovery .feed-cover[data-action="social-open-note"]',
        hint: "每个共同点都能回到具体笔记验证。"
      };
    }
    if (id === "profile") {
      if (!route.startsWith(`profile/${peer}`)) return { ...base, title: "回到 TA 的主页", copy: "点左上角返回，继续试试主页里的其他功能。", target: backTarget };
      return {
        ...base, title: index === 0 ? "从主页查看共同赞过" : "找到共同关注的博主",
        copy: index === 0 ? "向下浏览主页，点「共同赞过」，查看具体笔记。" : "点同一行的「共同关注」，看看你们都关注了谁。",
        target: `#app .profile-common-link${selector(index === 0 ? "social-together" : "social-common-following", peer)}`,
        hint: "从他人主页也能进入共同关系。"
      };
    }
    return { ...base, title: "返回这项体验", copy: "回到刚才的入口继续操作。" };
  }
  function mainTask(s) {
    const r = s.route, own = `profile/${s.actor}`, isDetail = /^(note|video)\//.test(r);
    const base = { hint: "", target: null };
    if (step >= steps.length) return {
      ...base, title: "体验完成",
      copy: complete.size === steps.length ? "试试下方的其他入口。" : `已体验 ${complete.size} 步，跳过 ${skipped.size} 步。`,
      hint: "补充体验只包含晒赞及共同关系的其他入口。", done: true
    };
    if (step === 0) {
      if (noNewNotes && r === "feed") return {
        ...base, title: "暂时没有新的推荐", copy: "暂时没有未浏览、未赞过且未收藏的演示笔记，可以去主页看看。",
        target: appTarget("profile", s.actor), hint: ""
      };
      if (isDetail) return { ...base, title: "点个赞", copy: "点底部爱心。", target: appTarget("like", target), hint: "普通点赞不会自动加入晒赞。" };
      return { ...base, title: "打开一篇笔记", copy: "点开高亮的笔记。", target: appTarget("note", target), hint: "点开后，试试底部的爱心。" };
    }
    if (step === 1) return {
      ...base, title: "晒出喜欢", copy: "长按爱心，选择「晒赞」。电脑也可右键。",
      target: appTarget("like", target), hint: "电脑可右键爱心；红心为普通赞，黄心为晒赞。"
    };
    if (step === 2) {
      if (isDetail) return { ...base, title: "去自己的主页看看", copy: "点左上角返回，再点底部的「我」。", target: backTarget, hint: "刚才的笔记会出现在你的「晒赞」里。" };
      if (!r.startsWith(own)) return { ...base, title: "打开自己的主页", copy: "点底部的「我」。", target: appTarget("profile", s.actor), hint: "" };
      if (!r.includes("/liked")) return { ...base, title: "找到刚才赞过的笔记", copy: "点主页里的「赞过」。", target: '#app [data-action="profile-tab"][data-tab="liked"]', hint: "普通赞过与晒赞都保留在「全部」中。" };
      return { ...base, title: "看看自己的晒赞", copy: "点「晒赞」，刚才这篇就在里面。", target: '#app [data-action="social-filter"][data-value="public"]', hint: "这里是你主动晒出的喜欢，不是赞过页的隐私开关。" };
    }
    if (step === 3) {
      if (r === "kindred") {
        const firstPeer = pick('#app .kindred-list [data-action="social-together"]')?.dataset.id || peer;
        return {
          ...base, title: "看看共同喜欢", copy: "点高亮的「共同赞过」。",
          target: appTarget("social-together", firstPeer), hint: "共同赞过和共同关注，是这里的推荐理由。"
        };
      }
      return { ...base, title: "找同好", copy: "点「找同好」。", target: appTarget("social-find"), hint: "" };
    }
    if (step === 4) return {
      ...base, title: "聊一聊", copy: "选一篇共同笔记，点「聊一聊」。",
      target: appTarget("social-talk"), hint: "有了共同话题，打招呼更自然。"
    };
    return {
      ...base, title: "等待回复", copy: "对方会自动回复。",
      hint: "演示中的对方回复为本地模拟。", waiting: r === `chat/${peer}`
    };
  }
  function task(s) {
    // Completed long-press exercises keep the actual menu open and usable.
    return modalTask(s) || (branch ? branchTask(s) : mainTask(s));
  }
  function consume(s) {
    for (const e of events.splice(0)) {
      if (e.branch !== branch) continue;
      // Record feature-specific entry paths even when used during the main tour.
      const published = ["social-publish", "social-like-and-publish", "social-confirm-public"].includes(e.action) && env.isPublic(e.id);
      if (published) {
        for (const id of ["feed-hold", "detail-hold"]) {
          if (checks.get(id).has(0) && experienceTargets.get(id) === e.id) checks.get(id).add(1);
        }
      }
      if (e.action === "social-topic" && e.value && pick("#shared-notes")) checks.get("interests").add(0);
      if (e.action === "social-insights-toggle" && pick('[data-action="social-insights-toggle"][aria-expanded="true"]')) checks.get("interests").add(1);
      if (e.action === "social-open-note" && e.discovery && /^(note|video)\//.test(s.route)) checks.get("interests").add(2);
      if (e.profileLink && e.action === "social-together" && s.route.startsWith("together/")) checks.get("profile").add(0);
      if (e.profileLink && e.action === "social-common-following" && s.route.startsWith("common-following/")) checks.get("profile").add(1);
      if (!branch) {
        if (step === 0 && ["note", "social-open-note"].includes(e.action) && env.notes.some(n => n.id === e.id)) {
          target = e.id; choosePeer(target);
        }
        if (e.action === "social-talk") expectedForm = { peer: e.peer, id: e.id };
      } else {
        const c = checks.get(branch);
        if (branch === "privacy") {
          if (published && e.id === branchTarget) c.add(1);
          if (c.has(1) && e.action === "social-withdraw" && e.id === branchTarget && env.isLiked(e.id) && !env.isPublic(e.id)) c.add(2);
        }
      }
    }
  }
  function observe(s) {
    if (s.modal?.kind === "like-menu") {
      const entry = s.route === "feed" ? "feed-hold" : /^(note|video)\//.test(s.route) ? "detail-hold" : null;
      if (entry) {
        checks.get(entry).add(0); experienceTargets.set(entry, s.modal.id);
        if (branch === entry) branchTarget = s.modal.id;
      }
    }
    consume(s);
    if (branch) {
      const c = checks.get(branch);
      if (branch === "privacy" && s.route === `profile/${s.actor}/liked/notes`) c.add(0);
      return;
    }
    // A supplemental action may have liked the original first card. On return,
    // follow the refreshed recommendation instead of pointing at a removed card.
    if (step === 0 && s.route === "feed" && !pick(appTarget("note", target))) chooseStory();
    if (step === 0 && /^(note|video)\//.test(s.route)) {
      const opened = s.route.split("/")[1];
      if (env.notes.some(n => n.id === opened)) { target = opened; choosePeer(target); seenDetail = true; }
    }
    // A single real action can satisfy adjacent stages (e.g. like-and-publish).
    // Only observed data and visited routes count; navigation is never automatic.
    let changed;
    do {
      changed = false;
      let satisfied = false;
      if (step === 0) satisfied = seenDetail && env.isLiked(target);
      if (step === 1) satisfied = env.isPublic(target);
      if (step === 2) satisfied = s.route === `profile/${s.actor}/liked/notes/public`;
      if (step === 3 && s.route.startsWith("together/")) {
        const who = s.route.split("/")[1];
        satisfied = env.common(who).length > 0;
        if (satisfied) peer = who;
      }
      if (step === 4) {
        const sent = messagesSince(s, baseline).find(m => m.from === s.actor && m.type === "note" &&
          m.socialContext === "common" && (expectedForm ? m.noteId === expectedForm.id && m.to === expectedForm.peer : m.to === peer));
        if (sent) { peer = sent.to; satisfied = true; }
      }
      if (step === 5) satisfied = messagesSince(s, baseline).some(m => m.from === peer && m.simulated);
      if (satisfied && step < steps.length) {
        complete.add(step); step++; changed = true;
        if (step === steps.length) extrasOpen = true;
      }
    } while (changed);
  }
  function positionCue() {
    if (!lastTarget?.isConnected || document.querySelector("#app .route-snapshot") ||
      document.getElementById("overlay-root").dataset.closing || !lastTarget.getClientRects().length ||
      matchMedia("(max-width:520px)").matches && root.dataset.expanded === "true") {
      cue.hidden = true; return;
    }
    // A modal's transform changes its on-screen bounds without a DOM mutation.
    // Wait for that entrance/exit to settle before positioning a target cue.
    let moving = false;
    for (let el = lastTarget; el && el !== device; el = el.parentElement) {
      for (const animation of el.getAnimations()) {
        if (animation.playState !== "running" || !Number.isFinite(animation.effect?.getComputedTiming().endTime)) continue;
        moving = true;
        if (!trackedAnimations.has(animation)) {
          trackedAnimations.add(animation);
          animation.finished.then(scheduleCue, scheduleCue);
        }
      }
    }
    if (moving) { cue.hidden = true; return; }
    const bounds = lastTarget.getBoundingClientRect(), container = device.getBoundingClientRect();
    const scroller = lastTarget.closest(".page-scroll,.share-rail,.share-tools,.share-friends");
    const visible = scroller?.getBoundingClientRect();
    const fullyVisible = !visible || bounds.top >= visible.top - 2 && bounds.bottom <= visible.bottom + 2 && bounds.left >= visible.left - 2 && bounds.right <= visible.right + 2;
    if (!fullyVisible || bounds.width < 1 || bounds.height < 1 || bounds.top < container.top || bounds.bottom > container.bottom) { cue.hidden = true; return; }
    // Fill the target in viewport coordinates. Navigation cells have generous
    // invisible hit areas, so use their text bounds rather than the whole cell.
    let anchor = bounds;
    if (lastTarget.parentElement?.classList.contains("bottom-nav")) {
      const range = document.createRange();
      range.selectNodeContents(lastTarget);
      const text = range.getBoundingClientRect();
      if (text.width && text.height) anchor = text;
    }
    const scale = container.width / device.offsetWidth, pad = 3 * scale;
    const x = anchor.left - pad, y = anchor.top - pad;
    const width = anchor.width + pad * 2, height = anchor.height + pad * 2;
    const computed = getComputedStyle(lastTarget);
    const radius = Math.min(height / 2, Math.max(6 * scale, parseFloat(computed.borderTopLeftRadius) * scale + pad));
    const geometry = [x, y, width, height, radius].map(n => Math.round(n * 10) / 10).join(",");
    if (geometry !== cueGeometry) {
      cueGeometry = geometry;
      cue.style.left = `${x}px`; cue.style.top = `${y}px`;
      cue.style.width = `${width}px`; cue.style.height = `${height}px`;
      cue.style.borderRadius = `${radius}px`;
    }
    cue.hidden = false;
  }
  function followTarget(t) {
    const next = pick(t.target);
    document.querySelectorAll(".walkthrough-target").forEach(el => { if (el !== next) el.classList.remove("walkthrough-target"); });
    if (next) next.classList.add("walkthrough-target");
    lastTarget = next;
    positionCue();
    // The guide annotates visible controls; it never scrolls the application.
  }
  function update() {
    const s = state(); observe(s);
    const t = task(s), branchComplete = branch && branchDone(branch), mainComplete = step >= steps.length;
    followTarget(t);
    const progress = branch ? checks.get(branch).size : complete.size;
    const total = branch ? extras.find(x => x[0] === branch)[2].length : steps.length;
    const caption = branch ? extras.find(x => x[0] === branch)[1] : mainComplete ? "主线已结束" : `主线 · ${step + 1} / ${steps.length}`;
    const isAway = !t.target || !pick(t.target);
    const html = `<header class="walkthrough-header"><span class="walkthrough-eyebrow">体验引导</span><button type="button" class="walkthrough-reset" data-guide="restart">重来</button><button type="button" class="walkthrough-close" data-guide="close">收起</button></header>
      <h1>晒出喜欢，遇见同好</h1>
      <div class="walkthrough-progress"><span>${esc(caption)}</span>${branch || mainComplete ? `<span>${progress} / ${total}</span>` : ""}</div>
      <ol class="walkthrough-track" aria-label="主线体验进度">${steps.map((label, i) => `<li class="${complete.has(i) ? "is-done" : skipped.has(i) ? "is-skipped" : !branch && i === step ? "is-current" : ""}" ${!branch && i === step ? 'aria-current="step"' : ""} title="${esc(label)}"><span class="sr-only">${i + 1}. ${esc(label)}，${complete.has(i) ? "已体验" : skipped.has(i) ? "已跳过" : i === step ? "当前步骤" : "待体验"}</span></li>`).join("")}</ol>
      <section class="walkthrough-current" aria-labelledby="walkthrough-task-title"><div class="walkthrough-task-heading"><span class="walkthrough-current-dot ${t.done ? "is-done" : ""}" aria-hidden="true"></span><h2 id="walkthrough-task-title">${esc(t.title)}</h2></div><p class="walkthrough-task-copy" role="status" aria-live="polite">${esc(t.copy)}</p>
      <footer class="walkthrough-actions">${branch ? `<button type="button" class="walkthrough-return" data-guide="return">${branchComplete ? "返回主线" : "结束这项体验"}</button>` : !mainComplete ? '<button type="button" class="walkthrough-skip" data-guide="skip">跳过此步</button>' : ""}${isAway && !s.modal && !t.done && !t.waiting ? '<button type="button" class="walkthrough-recover" data-guide="recover">回到当前体验</button>' : ""}</footer></section>
      <details class="walkthrough-extras" ${extrasOpen ? "open" : ""}><summary><span>补充体验</span><small>${extras.filter(([id]) => branchDone(id)).length} / ${extras.length}</small><span class="walkthrough-chevron" aria-hidden="true"></span></summary><div class="walkthrough-extra-grid">${extras.map(([id, title]) => `<button type="button" class="walkthrough-extra ${branchDone(id) ? "is-done" : ""}" data-guide="branch" data-branch="${id}" aria-current="${branch === id}" ${branch === id ? 'aria-pressed="true"' : 'aria-pressed="false"'}><span>${esc(title)}</span><small aria-label="${branchDone(id) ? "已体验" : "进入体验"}">${branchDone(id) ? "✓" : "↗"}</small></button>`).join("")}</div></details>`;
    if (html !== signature) {
      const scroll = root.scrollTop, focused = document.activeElement?.closest("#walkthrough [data-guide]");
      const focusKey = focused && [focused.dataset.guide, focused.dataset.branch];
      signature = html; body.innerHTML = html; root.scrollTop = scroll;
      if (focusKey) [...body.querySelectorAll("[data-guide]")].find(el =>
        el.dataset.guide === focusKey[0] && el.dataset.branch === focusKey[1])?.focus({ preventScroll: true });
      body.querySelector("details").addEventListener("toggle", e => { extrasOpen = e.target.open; });
      const taskKey = `${branch || step}:${t.title}`;
      if (taskSignature && taskSignature !== taskKey && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        body.querySelector(".walkthrough-current").animate([{ opacity: .4, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }],
          { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" });
      }
      taskSignature = taskKey;
    }
    const toggle = root.querySelector(".walkthrough-toggle");
    toggle.textContent = branch ? `引导 · ${extras.find(x => x[0] === branch)[1]}` : mainComplete ? "引导 · 体验完成" : `引导 · ${step + 1} / ${steps.length}`;
  }
  function locate() {
    if (branch) {
      const routes = {
        "feed-hold": "feed", "detail-hold": noteRoute(branchTarget), privacy: `profile/${state().actor}/liked/notes`,
        interests: `together/${peer}`, profile: `profile/${peer}`
      };
      env.navigate(routes[branch]);
    } else {
      const routes = ["feed", noteRoute(target), `profile/${state().actor}`, `profile/${state().actor}/liked/notes/public`, `together/${peer}`, `chat/${peer}`];
      if (step < steps.length) env.navigate(routes[step]);
    }
    lastTarget = null; schedule();
  }
  function startBranch(id) {
    if (!checks.has(id)) return;
    if (!branch) checkpoint = env.checkpoint();
    branch = id; extrasOpen = true; events = [];
    const pool = id === "feed-hold" ? env.recommendedNotes() :
      id === "privacy" ? env.notes.filter(n => env.isLiked(n.id)) : env.notes.filter(n => !n.video && !n.noGallery);
    branchTarget = (pool.find(n => !env.isPublic(n.id)) || pool[0] || env.notes[0]).id;
    // Completed paths remain checked; returning to them never requires replay.
    locate();
  }
  function expand(value) {
    root.dataset.expanded = String(value);
    root.querySelector(".walkthrough-toggle").setAttribute("aria-expanded", String(value));
    if (value) body.querySelector(".walkthrough-close")?.focus({ preventScroll: true });
    else root.querySelector(".walkthrough-toggle").focus({ preventScroll: true });
    scheduleCue();
  }
  root.querySelector(".walkthrough-toggle").addEventListener("click", () => expand(true));
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-guide]");
    if (!b) return;
    const action = b.dataset.guide;
    if (action === "restart") {
      step = 0; branch = null; checkpoint = null; complete.clear(); skipped.clear(); checks.forEach(c => c.clear());
      experienceTargets.clear(); events = []; chooseStory(); env.navigate("feed");
    }
    if (action === "skip") {
      skipped.add(step); step = Math.min(step + 1, steps.length);
      if (step === steps.length) extrasOpen = true;
      events = []; locate();
    }
    if (action === "recover") locate();
    if (action === "branch") startBranch(b.dataset.branch);
    if (action === "return") {
      branch = null; events = [];
      if (checkpoint) env.restore(checkpoint);
      checkpoint = null;
    }
    if (action === "close") expand(false);
    if (matchMedia("(max-width:520px)").matches && action !== "close") expand(false);
    schedule(); scheduleCue();
  });
  // Record intent before the app handles the action. Completion is checked from
  // the resulting route/data on the next frame, never from a click alone.
  document.addEventListener("click", e => {
    const b = e.target.closest("#device [data-action]");
    if (!b || b.disabled || b.closest(".route-snapshot") || b.closest('[data-closing="true"]')) return;
    events.push({ action: b.dataset.action, id: b.dataset.id, peer: b.dataset.peer, value: b.dataset.value,
      discovery: Boolean(b.closest(".peer-discovery")),
      profileLink: Boolean(b.closest(".profile-common-link")), route: state().route, branch });
    schedule();
  });
  document.addEventListener("submit", schedule);
  document.addEventListener("scroll", scheduleCue, true);
  window.addEventListener("resize", scheduleCue);
  window.visualViewport?.addEventListener("resize", scheduleCue);
  window.visualViewport?.addEventListener("scroll", scheduleCue);
  const observer = new MutationObserver(schedule);
  ["app", "overlay-root", "toast", "social-snackbar"].forEach(id => observer.observe(document.getElementById(id), {
    childList: true, subtree: true, characterData: true
  }));
  schedule();
  return { update: schedule };
};
