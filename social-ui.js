/* Ordinary likes do not join 晒赞. The one-time demo seed is authorized;
   subsequent participation always requires an intentional user action. */
window.createXHSSocial = env => {
  "use strict";
  const { esc, photo, avatar, icon, iconButton, note, notes, account, go, render, save, toast, showModal, closeModal, scrollRemember, sendMessage } = env;
  const db = env.db, actor = env.actor;
  const peerLikes = {
    man: ["night", "acid", "labo", "wood", "cafe", "burial", "resonance", "daily-2", "daily-4", "weeknd"],
    sen: ["night", "acid", "burial", "resonance", "author-drama", "daily-2", "daily-10", "schedule"],
    qing: ["labo", "local-art", "work", "wood", "siri", "room", "daily-5", "daily-7", "notion"]
  };
  const data = window.XHS_DATA;
  const readers = ["reader-yu", "reader-xia", "reader-zhi", "reader-bai"].map(account);
  Object.assign(peerLikes, {
    "reader-yu": ["night","acid","wood","author-drama","daily-2","daily-4","daily-10","daily-12","daily-18","daily-20","extra-04","extra-01","extra-03","burial","weeknd","extra-08","extra-14","extra-15","extra-16","extra-22","extra-25","extra-26","extra-30","extra-33"],
    "reader-xia": ["wood","work","local-art","daily-5","daily-13","extra-03","extra-05","extra-01","siri","extra-07","extra-09","extra-11","extra-12","extra-18","extra-19","extra-23","extra-29","extra-31","extra-35"],
    "reader-zhi": ["labo","author-talk","herb-food","daily-7","daily-15","extra-02","extra-06","extra-10","extra-17","extra-21","extra-24","extra-27","extra-34","extra-25"],
    "reader-bai": ["extra-01","extra-03","daily-15","cat","live-cat","daily-6","daily-14","daily-22","extra-12","extra-13","extra-21","extra-28"]
  });
  // Other authors have their own small public lists; authored notes are not
  // inferred to be liked by them.
  data.accounts.filter(a => a.creator).forEach((a, i) => {
    peerLikes[a.id] = notes.filter((n, j) => n.authorId !== a.id && (j + i * 3) % 11 === 0).map(n => n.id);
  });
  for (const id of Object.keys(peerLikes)) peerLikes[id] = [...new Set(peerLikes[id])];
  const validIds = new Set(notes.map(n => n.id));
  db().publicLikes ||= {};
  db().peerFollowing ||= {};
  db().socialThreads ||= {};
  db().communityDemoRevision ||= 0;
  if (db().communityDemoRevision < 1) {
    for (const id of data.demoPublicLikeIds) {
      const k = `lin:${id}`;
      if (db().likes[k] === false || Object.hasOwn(db().publicLikes, k)) continue;
      db().likes[k] = true;
      db().publicLikes[k] = true;
    }
    for (const id of data.peerFollowingSeeds.lin) {
      const k = `lin:${id}`;
      if (!Object.hasOwn(db().peerFollowing, k)) db().peerFollowing[k] = true;
    }
    // Migrate author follows from per-note keys to the author identity.
    for (const [k, followed] of Object.entries(db().following)) {
      if (!k.startsWith("lin:")) continue;
      const n = notes.find(n => n.id === k.slice(4));
      if (n && !Object.hasOwn(db().peerFollowing, `lin:${n.authorId}`)) db().peerFollowing[`lin:${n.authorId}`] = followed;
    }
    db().communityDemoRevision = 1;
  }
  const PUBLIC_LIKES_GUIDE_VERSION = 1;
  db().publicLikesGuideSeen ||= {};
  const key = id => `${actor()}:${id}`;
  const isFollowing = id => Boolean(db().peerFollowing[key(id)]);
  const followingIds = () => data.accounts.filter(a => a.id !== actor() && isFollowing(a.id)).map(a => a.id);
  const peerFollows = peer => peer === actor() ? followingIds() : (data.peerFollowingSeeds[peer] || []);
  const commonCreators = peer => peerFollows(peer).filter(id => isFollowing(id)).map(account);
  const hasProfile = id => data.accounts.some(a => a.id === id && !a.group && !a.ai && id !== "activity");
  if (!db().followerIdentityRevision) {
    for (const [id, followed] of Object.entries(db().followerBack)) {
      if (followed && hasProfile(id) && !Object.hasOwn(db().peerFollowing, key(id))) db().peerFollowing[key(id)] = true;
    }
    db().followerIdentityRevision = 1;
  }
  const isPublic = id => validIds.has(id) && env.isLiked(id) && db().publicLikes[key(id)] === true;
  const myLiked = () => env.likedNotes();
  const publicNotes = peer => peer === actor()
    ? myLiked().filter(n => isPublic(n.id))
    : (peerLikes[peer] || []).filter(id => validIds.has(id)).map(note);
  const common = peer => {
    const ids = new Set(publicNotes(peer).map(n => n.id));
    return publicNotes(actor()).filter(n => ids.has(n.id));
  };
  const others = peer => {
    const ids = new Set(publicNotes(actor()).map(n => n.id));
    return publicNotes(peer).filter(n => !ids.has(n.id));
  };
  const countTopics = pool => {
    const counts = new Map();
    const ignored = new Set(["推荐", "我的日常", "日常", "周末不宅家", "生活记录"]);
    for (const n of pool) {
      for (const word of new Set([n.category, ...n.tags].filter(t => t && !ignored.has(t)))) counts.set(word, (counts.get(word) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  };
  const heading = title => `<header class="simple-header">${iconButton("back", "back", "返回")}<h1>${esc(title)}</h1><span></span></header>`;
  const empty = (title, description, label = "", action = "social-manage") => `<div class="social-empty"><h2>${esc(title)}</h2><p>${esc(description)}</p>${label ? `<button class="social-primary" data-action="${action}">${esc(label)}</button>` : ""}</div>`;
  const refresh = () => { scrollRemember(); save(); render(); };
  const expanded = new Set();
  const railPositions = new Map(), selectedTopics = new Map();
  const topicGroups = pool => {
    const grouped = new Map(), ignored = new Set(["推荐", "日常", "我的日常", "生活记录", "听歌日常", "周末不宅家"]);
    for (const n of pool) {
      const words = [n.category, ...n.tags];
      const topic = /音乐|Acid|黑胶|听歌/i.test(words.join(" ")) ? "音乐" : words.find(t => t && !ignored.has(t));
      if (!topic) continue;
      if (!grouped.has(topic)) grouped.set(topic, []);
      grouped.get(topic).push(n);
    }
    return [...grouped].sort((a, b) => b[1].length - a[1].length);
  };
  const topicNotes = (pool, topic) => topicGroups(pool).find(([t]) => t === topic)?.[1] || pool.filter(n => n.category === topic || n.tags.includes(topic));
  function commonInsights(peer, shared) {
    const groups = topicGroups(shared), selected = selectedTopics.get(`${actor()}:${peer}`);
    const tag = (text, tone, action, id, extra = "") => `<button class="interest-tag ${tone}" data-action="${action}" data-id="${esc(id)}" ${extra}>${esc(text)}</button>`;
    const title = (n, tone) => `<button class="interest-note ${tone}" data-action="social-open-note" data-id="${n.id}" data-peer="${peer}">“${esc(n.title)}”</button>`;
    const interests = groups.slice(0, 2).map(([topic, pool], i) => {
      const tone = i ? "interest-green" : "interest-blue";
      const subtopic = countTopics(pool).find(t => ![topic, "听歌日常"].includes(t));
      const keywords = [topic, ...(subtopic ? [subtopic] : [])].map(t => tag(t, tone, "social-topic", peer, `data-value="${esc(t)}" aria-pressed="${selected === t}"`)).join(" ");
      return `<p>你们都赞过 ${keywords} 相关的笔记，比如 ${title(pool[0], tone)}。</p>`;
    });
    const creators = commonCreators(peer), withPosts = creators.filter(a => shared.some(n => n.authorId === a.id));
    const creatorEvidence = withPosts.slice(0, 2).map(a => {
      const pool = shared.filter(n => n.authorId === a.id);
      return `<p>你们都关注了 ${tag(a.name, "interest-orange", "profile", a.id)}，还共同赞过 TA 的 ${title(pool[0], "interest-orange")}。</p>`;
    });
    const remaining = creators.filter(a => !withPosts.slice(0, 2).some(c => c.id === a.id));
    const moreCreators = remaining.length ? `<p>也都关注了 ${remaining.slice(0, 2).map(a => tag(a.name, "interest-orange", "profile", a.id)).join("、")}${remaining.length > 2 ? ` 等 ${remaining.length} 位博主` : ""}。</p>` : "";
    const evidence = [interests[0], creatorEvidence[0] || moreCreators, ...interests.slice(1), ...creatorEvidence.slice(1), ...(creatorEvidence.length ? [moreCreators] : [])].filter(Boolean);
    if (!evidence.length) return '<p class="common-interest-empty">还没有共同晒赞的笔记，之后有了共同记录再来看看。</p>';
    const full = expanded.has(`${actor()}:${peer}:insights`), extraId = `common-insights-${peer}`;
    return `<div class="common-insights"><h2>你们的共同兴趣</h2>${evidence.slice(0, 2).join("")}${evidence.length > 2 ? `<div id="${extraId}" class="common-insights-more" ${full ? "" : "hidden"}>${evidence.slice(2).join("")}</div><button class="common-insights-toggle" data-action="social-insights-toggle" data-id="${peer}" aria-expanded="${full}" aria-controls="${extraId}">${full ? "收起" : "更多共同兴趣"} ${icon("next")}</button>` : ""}</div>`;
  }
  let snackTimer, snackAnimation, snackVersion = 0, snackClosing = false, nextSnack = null, pendingPublication = null;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function dismissSnack(immediate = false) {
    clearTimeout(snackTimer);
    nextSnack = null;
    const el = document.querySelector("#social-snackbar");
    el.style.pointerEvents = "none";
    el.onpointerenter = el.onfocusin = el.onpointerleave = el.onfocusout = null;
    if (el.hidden || immediate === true || reduceMotion()) {
      ++snackVersion; snackAnimation?.cancel(); snackAnimation = null;
      el.hidden = true; snackClosing = false; return;
    }
    if (snackClosing) return;
    const version = ++snackVersion, style = getComputedStyle(el);
    const start = { opacity: style.opacity, transform: style.transform };
    snackAnimation?.cancel();
    snackClosing = true;
    const animation = el.animate([start, { opacity: 0, transform: "translateY(10px)" }], { duration: 160, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
    snackAnimation = animation;
    animation.finished.then(() => {
      if (version !== snackVersion) return;
      el.hidden = true; snackClosing = false;
      animation.cancel(); snackAnimation = null;
      const pending = nextSnack; nextSnack = null;
      if (pending) showSnack(...pending);
    }).catch(() => {});
  }
  function snack(text, label, action, id = "") {
    const el = document.querySelector("#social-snackbar");
    if (!el.hidden) {
      // Leave the old text in place until it has completely exited.
      if (!snackClosing) dismissSnack();
      if (!el.hidden) { nextSnack = [text, label, action, id]; return; }
    }
    showSnack(text, label, action, id);
  }
  function showSnack(text, label, action, id) {
    clearTimeout(snackTimer);
    ++snackVersion;
    snackAnimation?.cancel();
    snackClosing = false; nextSnack = null;
    const el = document.querySelector("#social-snackbar");
    el.innerHTML = `<img class="feedback-success" src="assets/ios/feedback-success.png" alt=""><span>${esc(text)}</span><button data-action="${action}" data-id="${esc(id)}">${esc(label)}<img src="assets/ios/feedback-next.png" alt=""></button>`;
    el.hidden = false;
    el.style.pointerEvents = "";
    snackAnimation = reduceMotion() ? null : el.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 200, easing: "cubic-bezier(.22,1,.36,1)" });
    // A fixed lifetime; hovering must not keep the feedback on screen.
    snackTimer = setTimeout(() => dismissSnack(), 3000);
  }
  function onLike(id) {
    if (env.isLiked(id)) {
      if (/^(note|video)\//.test(env.route())) snack("已点赞", "晒赞", "social-publish", id);
      else dismissSnack();
    }
    else {
      const wasPublic = db().publicLikes[key(id)];
      delete db().publicLikes[key(id)];
      save(); dismissSnack();
      if (wasPublic && env.route() !== "feed") toast("已取消点赞，同时撤回晒赞");
    }
    if (/^(profile|kindred|together)\//.test(env.route())) refresh();
  }
  function publish(id, addLike = false) {
    dismissSnack();
    if (!validIds.has(id) || (!env.isLiked(id) && !addLike)) return;
    if (isPublic(id)) { manageNote(id); return; }
    pendingPublication = { id, addLike: addLike && !env.isLiked(id) };
    if (db().publicLikesGuideSeen[actor()] === PUBLIC_LIKES_GUIDE_VERSION) { confirmPublic(id); return; }
    const n = note(id);
    showModal("public-like", id, `<section class="social-sheet public-like-guide" role="dialog" aria-modal="true" aria-labelledby="public-like-title" aria-describedby="public-like-benefits public-like-privacy" tabindex="-1">
      <header><h2 id="public-like-title">晒出喜欢，遇见同好</h2><button data-action="close-modal" aria-label="关闭">×</button></header>
      ${compactNote(n)}
      <p class="public-like-benefits" id="public-like-benefits">找到也喜欢这篇的人，聊聊共同话题。</p>
      <p class="social-muted public-like-privacy" id="public-like-privacy">仅公开这一篇，不影响其他赞过。可随时撤回。</p>
      <div class="social-sheet-actions"><button data-action="close-modal">暂不晒赞</button><button class="social-primary" data-action="social-confirm-public" data-id="${id}">${pendingPublication.addLike ? "点赞并晒赞" : "晒赞"}</button></div>
    </section>`);
  }
  function confirmPublic(id) {
    const addLike = pendingPublication?.id === id && pendingPublication.addLike;
    if (!validIds.has(id) || (!env.isLiked(id) && !addLike)) { closeModal(); toast("这篇笔记已取消点赞"); return; }
    if (addLike) db().likes[key(id)] = true;
    db().publicLikes[key(id)] = true;
    db().publicLikesGuideSeen[actor()] = PUBLIC_LIKES_GUIDE_VERSION;
    pendingPublication = null;
    closeModal(); refresh();
    snack("已晒赞", "看看同好", "social-find");
  }
  function withdraw(id) {
    delete db().publicLikes[key(id)];
    closeModal(); dismissSnack(); refresh(); toast("已撤回晒赞，点赞仍保留");
  }
  function compactNote(n) {
    return `<div class="social-note-context">${photo(n.cover || n.images[0], "", n.title)}<div><b>${esc(n.title)}</b><small>${esc(n.author)}</small></div></div>`;
  }
  function manageNote(id) {
    likeOptions(id);
  }
  function likeOptions(id, anchor) {
    if (!validIds.has(id)) return;
    const liked = env.isLiked(id), pub = isPublic(id);
    anchor ||= document.querySelector(`#app [data-action="like"][data-id="${id}"]`);
    const items = pub
      ? [["social-withdraw", "撤回晒赞", "保留点赞，不再用于发现同好"], ["social-find", "看看同好", "发现共同赞过的人"]]
      : liked
        ? [["social-publish", "晒赞", "让大家看见这份喜欢，发现同好"], ["social-unlike", "取消点赞", "从你的赞过中移除"]]
        : [["social-like-private", "点赞", "普通点赞，不加入晒赞"], ["social-like-and-publish", "点赞并晒赞", "让大家看见这份喜欢，发现同好"]];
    showModal("like-menu", id, `<section class="like-popover" role="dialog" aria-modal="true" aria-labelledby="like-menu-title" tabindex="-1"><p id="like-menu-title">${pub ? "这篇已晒赞" : liked ? "这篇已点赞" : "选择点赞方式"}</p>${items.map(([action, title, description]) => `<button data-action="${action}" data-id="${id}"><b>${title}</b><small>${description}</small></button>`).join("")}</section>`, { anchor });
  }
  // One delegated gesture across feed, detail, own likes and peer likes.
  // Movement cancels the hold, and the release after a hold cannot unlike.
  let hold = null, consumedClick = null;
  const cancelHold = () => { if (hold) clearTimeout(hold.timer); hold = null; };
  document.addEventListener("pointerdown", e => {
    cancelHold(); consumedClick = null;
    const b = e.target.closest('#app [data-action="like"]');
    if (!b || e.button !== 0 || b.closest(".route-snapshot")) return;
    hold = { b, id: e.pointerId, x: e.clientX, y: e.clientY };
    hold.timer = setTimeout(() => {
      if (!hold || !b.isConnected) return;
      // Touch browsers may send the release click to the newly opened sheet.
      // Consume that click even when its target is no longer the held heart.
      consumedClick = { b, pointerId: hold.id, at: performance.now(), anyTarget: true };
      cancelHold(); likeOptions(b.dataset.id, b);
    }, 500);
  });
  document.addEventListener("pointermove", e => {
    if (hold && e.pointerId === hold.id && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 8) {
      consumedClick = { b: hold.b, pointerId: hold.id, at: performance.now() };
      cancelHold();
    }
  });
  ["pointerup","pointercancel"].forEach(name => document.addEventListener(name, e => {
    if (consumedClick?.pointerId === e.pointerId) consumedClick.at = performance.now();
    cancelHold();
  }));
  document.addEventListener("scroll", cancelHold, true);
  document.addEventListener("click", e => {
    if (consumedClick && performance.now() - consumedClick.at < 1200 && (consumedClick.anyTarget || consumedClick.b.contains(e.target))) {
      e.preventDefault(); e.stopImmediatePropagation(); consumedClick = null;
    }
  }, true);
  document.addEventListener("contextmenu", e => {
    const b = e.target.closest('#app [data-action="like"]');
    if (b) { e.preventDefault(); cancelHold(); if (!document.querySelector("#overlay-root [role=dialog]")) likeOptions(b.dataset.id, b); }
  });
  document.addEventListener("keydown", e => {
    const b = e.target.closest('#app [data-action="like"]');
    if (b && ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu")) {
      e.preventDefault(); likeOptions(b.dataset.id, b);
    }
  });
  function ownCard(n) {
    return env.card(n, true);
  }
  function discoveryFeed(pool, peer) {
    const card = (n, i) => env.card(n, i < 2).replaceAll('data-action="note"', `data-action="social-open-note" data-peer="${peer}"`);
    return `<div class="masonry peer-discovery-grid"><div class="feed-column">${pool.filter((_, i) => i % 2 === 0).map(card).join("")}</div><div class="feed-column">${pool.filter((_, i) => i % 2).map(card).join("")}</div></div>`;
  }
  function ownTools() {
    const filter = env.route().split("/")[4] === "public" ? "public" : "all";
    return `<div class="public-likes-tools"><div class="public-like-filters" role="group" aria-label="全部赞过与晒赞">${[["all", "全部"], ["public", "晒赞"]].map(([id, label]) => `<button class="${filter === id ? "selected" : ""}" aria-pressed="${filter === id}" data-action="social-filter" data-value="${id}">${label}</button>`).join("")}</div><button class="find-kindred" data-action="social-find">找同好 ${icon("next")}</button></div>`;
  }
  function ownLikes() {
    const filter = env.route().split("/")[4] || "all";
    const all = myLiked(), pub = all.filter(n => isPublic(n.id));
    const pool = filter === "public" ? pub : all;
    return pool.length ? `<div class="masonry public-likes-grid"><div class="feed-column">${pool.filter((_, i) => i % 2 === 0).map(ownCard).join("")}</div><div class="feed-column">${pool.filter((_, i) => i % 2).map(ownCard).join("")}</div></div>` : empty(filter === "public" ? "还没有晒赞" : "这里还没有笔记", filter === "public" ? "从赞过里选一篇，晒出喜欢，发现同好。" : "看到喜欢的笔记，点一下爱心吧。", filter === "public" ? "选择一篇赞过" : "去首页看看", filter === "public" ? "social-manage" : "home");
  }
  function find() {
    const pool = publicNotes(actor());
    const candidates = readers.map(({ id }) => ({ id, shared: common(id) })).sort((a, b) => b.shared.length - a.shared.length);
    const matches = pool.length ? candidates.filter(x => x.shared.length || commonCreators(x.id).length) : candidates;
    const noMatches = pool.length > 0 && !matches.length;
    const visible = noMatches ? candidates : matches;
    return `<div class="page social-page">${heading("找同好")}<div class="page-scroll social-scroll">
      ${!pool.length ? `<div class="kindred-intro"><button data-action="social-manage">晒出一篇喜欢，发现共同兴趣 <span>去选择 ${icon("next")}</span></button><p>也可以先看看大家晒赞的笔记</p></div>` : ""}
      ${noMatches ? `${empty("暂时还没找到同好", "还没有人与你共同赞过或关注。可以再晒赞几篇，也可以先看看大家的笔记。", "选择更多赞过")}<h2 class="kindred-browse-heading">先看看大家赞过</h2>` : ""}
      <div class="kindred-list">${visible.map(({ id, shared }) => {
        const a = account(id), topics = countTopics(shared);
        const previews = shared.length ? shared : publicNotes(id);
        const creators = commonCreators(id);
        return `<article class="kindred-person"><button class="kindred-person-heading" data-action="profile" data-id="${id}">${avatar(a.avatar)}<span><b>${esc(a.name)}</b><small>${esc(a.bio)}</small></span></button><button class="common-evidence" data-action="${shared.length ? "social-together" : "social-peer-likes"}" data-id="${id}"><strong>${shared.length ? `共同赞过 ${shared.length} 篇` : "TA 最近晒赞"}</strong><span class="common-topics">${topics.map(esc).join(" · ")}</span>${icon("next")}</button><div class="common-thumbnails" data-peer="${id}" role="region" aria-label="${esc(a.name)}的${shared.length ? "共同赞过" : "晒赞"}，可左右滑动">${previews.map(n => `<button data-action="social-open-note" data-id="${n.id}" data-peer="${id}"><span class="common-cover">${photo(n.cover || n.images[0], "", n.title)}</span><small>${esc(n.title || "生活片刻")}</small></button>`).join("")}</div>${creators.length ? `<button class="common-creators-preview" data-action="social-common-following" data-id="${id}"><span>${creators.slice(0,3).map(a=>avatar(a.avatar)).join("")}</span>共同关注 ${creators.length} 位博主 ${icon("next")}</button>` : ""}</article>`;
      }).join("")}</div>
    </div></div>`;
  }
  function row(n, peer, shared = false) {
    return `<article class="social-note-row" data-social-note="${n.id}"><button class="social-note-open" data-action="social-open-note" data-id="${n.id}" data-peer="${peer}">${photo(n.cover || n.images[0], "", n.title)}<span><b>${esc(n.title || "生活片刻")}</b><small>${avatar(n.avatar)}${esc(n.author)}</small>${!shared && env.isLiked(n.id) && !isPublic(n.id) ? '<small>你也赞过 · 未晒赞</small>' : ""}</span></button>${shared ? `<button class="talk-note" data-action="social-talk" data-id="${n.id}" data-peer="${peer}">聊一聊</button>` : env.likeButton(n.id, "icon-button", "like", "")}</article>`;
  }
  function together(peer) {
    if (!peerLikes[peer]) return `<div class="page social-page">${heading("共同赞过")}${empty("暂无共同赞过", "对方还没有晒赞。")}</div>`;
    const a = account(peer), shared = common(peer), topicKey = `${actor()}:${peer}`;
    let selected = selectedTopics.get(topicKey);
    if (selected && !topicNotes(shared, selected).length) { selectedTopics.delete(topicKey); selected = null; }
    const pool = selected ? topicNotes(shared, selected) : shared;
    const nameParts = a.name.match(/^(.*?)([（(][^）)]*[）)])$/);
    const pairedName = nameParts ? `${esc(nameParts[1])}<wbr><span class="paired-name-aside">${esc(nameParts[2])}</span>` : esc(a.name);
    const full = expanded.has(`${peer}:shared`), otherPool = others(peer);
    return `<div class="page social-page">${heading(`你和${a.name}`)}<div class="page-scroll social-scroll">
      <div class="together-hero"><div class="paired-people"><span>${avatar(account(actor()).avatar)}<small>你</small></span><div class="paired-connection"><span class="paired-caption">${shared.length ? `共同赞过 ${shared.length} 篇` : "还没有共同赞过"}</span><button class="social-follow ${isFollowing(peer) ? "following" : ""}" data-action="social-follow" data-id="${peer}">${isFollowing(peer) ? "已关注" : "关注 TA"}</button></div><div class="paired-peer"><button class="paired-profile" data-action="profile" data-id="${peer}" aria-label="查看${esc(a.name)}的主页">${avatar(a.avatar)}<small><span>${pairedName}</span></small></button></div></div>${commonInsights(peer, shared)}</div>
      <section class="together-section" id="shared-notes"><div class="shared-notes-heading"><h2>${selected ? `${esc(selected)} · 共同赞过` : "共同赞过"} <span>${pool.length} 篇</span></h2>${selected ? `<button data-action="social-topic" data-id="${peer}" data-value="">全部 ${shared.length} 篇</button>` : ""}</div>${pool.length ? pool.slice(0, full || selected ? pool.length : 3).map(n => row(n, peer, true)).join("") : '<p class="social-section-empty">还没有共同晒赞的笔记</p>'}${!selected && pool.length > 3 ? `<button class="social-expand" data-action="social-expand" data-id="${peer}:shared" aria-expanded="${full}">${full ? "收起" : `查看全部 ${pool.length} 篇`} ${full ? "⌃" : "⌄"}</button>` : ""}</section>
      ${otherPool.length ? `<section class="together-section peer-discovery"><h2>TA 还赞过 <span>${otherPool.length} 篇</span></h2>${discoveryFeed(otherPool, peer)}</section>` : ""}
    </div></div>`;
  }
  function otherLikes(peer) {
    const pool = others(peer), a = account(peer);
    return `<div class="page social-page">${heading("TA 另外赞过")}<div class="page-scroll social-scroll"><div class="social-list-context">${avatar(a.avatar)}<span>${esc(a.name)}晒赞的其他 ${pool.length} 篇</span></div><section class="together-section peer-discovery">${pool.length ? discoveryFeed(pool, peer) : '<p class="social-section-empty">TA 的晒赞，你也都晒赞过</p>'}</section></div></div>`;
  }
  const expandedProfileSuggestions = new Set();
  function peerProfile(peer, tab = "notes") {
    const a = account(peer), pub = publicNotes(peer), shared = common(peer);
    if (!["notes", "saved", "liked"].includes(tab)) tab = "notes";
    const pool = tab === "liked" ? pub : tab === "notes" ? notes.filter(n => n.authorId === peer).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))) : [];
    const creators = commonCreators(peer);
    const following = isFollowing(peer);
    const mutual = following && peerFollows(peer).includes(actor());
    const familiarFollowers = data.accounts.filter(person => person.id !== peer && isFollowing(person.id) && peerFollows(person.id).includes(peer));
    const suggestionsOpen = expandedProfileSuggestions.has(peer);
    const peerTopics = new Set(notes.filter(n => n.authorId === peer).map(n => n.category));
    if (peerTopics.has("艺术")) peerTopics.add("设计");
    if (peerTopics.has("设计")) peerTopics.add("艺术");
    const suggestions = data.accounts.filter(person => person.id !== peer && person.id !== actor() && !isFollowing(person.id) && !person.group && !person.ai && notes.some(n => n.authorId === person.id && peerTopics.has(n.category))).slice(0, 3);
    const grid = pool.length ? `<div class="masonry"><div class="feed-column">${pool.filter((_, i) => i % 2 === 0).map(n => env.card(n, true, { pinned: tab === "notes" })).join("")}</div><div class="feed-column">${pool.filter((_, i) => i % 2).map(n => env.card(n, true, { pinned: tab === "notes" })).join("")}</div></div>` : `<p class="profile-empty">${tab === "saved" ? "TA 的收藏仅自己可见" : tab === "liked" ? "TA 还没有晒赞" : "还没有发布笔记"}</p>`;
    return `<div class="page social-peer-profile" data-peer="${peer}">
      <header class="peer-native-toolbar">${iconButton("back", "back", "返回")}<span>${avatar(a.profileAvatar || a.avatar)}<b>${esc(a.name)}</b></span>${iconButton("more", "social-profile-menu", "主页选项", `data-id="${peer}"`)}</header>
      <div class="page-scroll peer-native-scroll">
        <div class="peer-native-hero">
          <div class="peer-native-person">${avatar(a.profileAvatar || a.avatar)}<div><h1>${esc(a.name)}</h1><p>小红书号：${esc(a.redId)}<button class="peer-copy-id" data-action="social-copy-id" data-id="${peer}" aria-label="复制小红书号"><img src="assets/ios/peer-copy.png" alt="" aria-hidden="true"></button></p><p>IP：${esc(a.location || "浙江")}</p></div></div>
          <div class="peer-native-stats"><button data-action="social-following-list" data-id="${peer}"><b>${peerFollows(peer).length}</b> 关注</button><span><b>${(a.followers || 0) + (following ? 1 : 0)}</b> 粉丝</span><span><b>${env.number(a.received || 0)}</b> 获赞与收藏</span></div>
          ${a.bio ? `<p class="peer-native-bio">${esc(a.bio)}</p>` : ""}
          ${a.profileTags?.length ? `<div class="peer-native-tags">${a.profileTags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
          <div class="peer-native-actions"><button class="social-follow ${following ? "following" : ""}" data-action="social-follow" data-id="${peer}" aria-pressed="${following}">${mutual ? "互相关注" : following ? "已关注" : "关注"}${following ? '<img class="peer-follow-chevron" src="assets/ios/peer-chevron.png" alt="" aria-hidden="true">' : ""}</button><button data-action="chat" data-id="${peer}">发私信</button><button class="peer-recommend" data-action="social-profile-recommend" data-id="${peer}" aria-label="推荐用户" aria-expanded="${suggestionsOpen}" aria-controls="peer-profile-suggestions">${photo("ios:peer-recommend", "", "")}</button></div>
          ${familiarFollowers.length ? `<button class="peer-familiar-followers" data-action="profile" data-id="${familiarFollowers[0].id}">${avatar(familiarFollowers[0].avatar)}<span>${esc(familiarFollowers[0].name)}${familiarFollowers.length > 1 ? `等${familiarFollowers.length}人` : ""} 关注了TA</span>${icon("next")}</button>` : ""}
          ${suggestionsOpen ? `<section class="peer-profile-suggestions" id="peer-profile-suggestions" aria-label="推荐用户"><h2>你可能感兴趣</h2>${suggestions.length ? suggestions.map(person => `<div class="peer-profile-suggestion"><button data-action="profile" data-id="${person.id}">${avatar(person.avatar)}<span>${esc(person.name)}</span></button><button data-action="social-follow" data-id="${person.id}">关注</button></div>`).join("") : '<p>暂时没有更多推荐用户</p>'}</section>` : ""}
        </div>
        <div class="peer-native-content"><div class="peer-profile-tabs" role="tablist" aria-label="他人主页">${[["notes", "笔记"], ["saved", "收藏"], ["liked", "赞过"]].map(([id, label]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? "selected" : ""}" data-action="social-peer-tab" data-id="${peer}" data-value="${id}">${id === "saved" ? '<img src="assets/ios/glyph-lock.png" class="peer-lock" alt="私密">' : ""}${label}</button>`).join("")}</div>
        ${peerLikes[peer] && (shared.length || creators.length) ? `<div class="profile-common-links">${shared.length ? `<button class="profile-common-link" data-action="social-together" data-id="${peer}"><span>共同赞过 ${shared.length} 篇</span>${icon("next")}</button>` : ""}${shared.length && creators.length ? '<span class="profile-common-divider" aria-hidden="true">·</span>' : ""}${creators.length ? `<button class="profile-common-link" data-action="social-common-following" data-id="${peer}"><span>共同关注 ${creators.length} 位博主</span>${icon("next")}</button>` : ""}</div>` : ""}
        ${grid}</div>
      </div>
    </div>`;
  }
  function compose(peer, id, context = "common") {
    if (!peerLikes[peer] || !validIds.has(id)) return;
    if (context === "common" && !common(peer).some(n => n.id === id)) { toast("这篇已不在你们共同晒赞的笔记中"); return; }
    env.shareConfirm([peer], id, { context, openChat: true });
  }
  function attachments(peer) {
    const pool = publicNotes(actor());
    showModal("social-attachments", peer, `<section class="social-sheet social-attachment-sheet" role="dialog" aria-modal="true" aria-label="分享赞过的笔记" tabindex="-1"><header><h2>分享赞过的笔记</h2><button data-action="close-modal" aria-label="关闭">×</button></header><p class="social-muted">从你的晒赞里选一篇</p><div class="social-attachment-list">${pool.map(n => `<button data-action="social-share-another" data-peer="${peer}" data-id="${n.id}">${compactNote(n)}</button>`).join("") || '<p class="social-section-empty">还没有晒赞</p>'}</div><button class="social-option" data-action="social-other-attachments">从其他笔记中选择 ${icon("next")}</button></section>`);
  }
  const replyTimers = new Map();
  function scheduleReply(message) {
    const { from: sender, to: peer } = message, threadKey = `${sender}:${peer}`;
    if (!peerLikes[peer] || !(db().socialThreads[threadKey] || message.socialContext === "common" || readers.some(r => r.id === peer))) return;
    clearTimeout(replyTimers.get(threadKey));
    // One send may include both a note and a comment. Reply once to the latest
    // message, and retain its sender even if the current view changes.
    replyTimers.set(threadKey, setTimeout(() => {
      replyTimers.delete(threadKey);
      const messages = db().messages.filter(m => m.from === sender && m.to === peer || m.from === peer && m.to === sender);
      const sent = messages.findLast(m => m.from === sender);
      if (!sent || sent.id !== message.id || messages.some(m => m.simulatedFor === sent.id)) return;
      demoReply(peer, sender, messages, sent);
    }, 900));
  }
  function demoReply(peer, sender, messages, sent) {
    const received = messages.filter(m => m.simulated).length;
    const original = messages.findLast(m => m.from === sender && m.type === "note");
    const source = original ? note(original.noteId) : null;
    const candidates = peerLikes[peer].filter(id => validIds.has(id) && id !== source?.id &&
      !(db().likes[`${sender}:${id}`] && db().publicLikes[`${sender}:${id}`] === true)).map(note);
    const similarity = n => source ? n.tags.filter(t => source.tags.includes(t)).length * 2 + Number(n.category === source.category && n.category !== "推荐") : 0;
    const recommended = candidates.sort((a, b) => similarity(b) - similarity(a)).find(n => similarity(n) > 0);
    const topic = source ? [source.title, source.category, ...source.tags].join(" ") : "";
    const opener = /音乐|现场|唱片|黑胶|Acid|weeknd/i.test(topic) ? "听的！最近也在找这种风格的歌。" : /香水|LABO/i.test(topic) ? "我也被这篇里的气味描述吸引了，想去店里试试。" : /设计|图形|艺术|印刷|电影/.test(topic) ? "我最喜欢这篇的颜色，第一眼就记住了。" : "我也喜欢这篇里的细节，忍不住多看了几遍。";
    const text = received ? "收到啦，留着慢慢看。下次有新发现再分享给你。" : !source ? `你好呀！${account(peer).bio}你最近有什么新发现？` : `${opener}${recommended ? "这篇也想分享给你。" : "你最喜欢里面哪一点？"}`;
    const at = Date.now();
    db().messages.push({ id: `demo-reply-${at}-${sender}-${peer}`, from: peer, to: sender, type: "text", text, at, simulated: true, simulatedFor: sent.id });
    if (!received && recommended) db().messages.push({ id: `demo-reply-note-${at}-${sender}-${peer}`, from: peer, to: sender, type: "note", noteId: recommended.id, at: at + 1, simulated: true, simulatedFor: sent.id });
    save();
    // Only refresh the open conversation. Its overlay is a separate root, so
    // a reply can appear behind an open modal without replacing that modal.
    if (actor() === sender && env.route() === `chat/${peer}`) render();
  }
  function chatContext(peer) {
    if (!db().socialThreads[key(peer)] && readers.some(r => r.id === peer) && env.conversation(peer).some(m => m.from === actor())) {
      db().socialThreads[key(peer)] = { noteId: env.conversation(peer).findLast(m => m.type === "note")?.noteId || null };
      save();
    }
    if (!db().socialThreads[key(peer)]) return "";
    const shared = common(peer);
    return `<button class="chat-common-context" data-action="social-together" data-id="${peer}">${shared.length ? "从共同赞过聊起" : "从晒赞里认识"}<span>${shared.length ? `共同赞过 ${shared.length} 篇` : "查看晒赞"} ${icon("next")}</span></button>`;
  }
  function afterRender(page, id, fresh) {
    document.querySelectorAll("#app .common-thumbnails").forEach(rail => {
      const railKey = `${actor()}:${rail.dataset.peer}`;
      rail.scrollLeft = railPositions.get(railKey) || 0;
      if (!fresh) return;
      rail.addEventListener("scroll", () => railPositions.set(railKey, rail.scrollLeft), { passive: true });
      // Touch keeps the browser's native horizontal/vertical gesture arbitration.
      // Only mouse dragging needs capture; a dragged cover must not open a note.
      let drag = null, suppressClickUntil = 0;
      rail.addEventListener("pointerdown", e => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: rail.scrollLeft, moved: false };
      });
      rail.addEventListener("pointermove", e => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (!drag.moved && Math.abs(dx) > 6) {
          drag.moved = true;
          rail.setPointerCapture(e.pointerId);
          rail.classList.add("is-dragging");
        }
        if (drag.moved) {
          e.preventDefault();
          const scale = rail.getBoundingClientRect().width / rail.offsetWidth;
          rail.scrollLeft = drag.left - dx / scale;
        }
      });
      const finish = e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (drag.moved) suppressClickUntil = performance.now() + 500;
        drag = null; rail.classList.remove("is-dragging");
        if (rail.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
      };
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => rail.addEventListener(name, finish));
      rail.addEventListener("pointerleave", e => { if (drag && !drag.moved) finish(e); });
      rail.addEventListener("click", e => {
        if (performance.now() < suppressClickUntil && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); suppressClickUntil = 0; }
      }, true);
      rail.addEventListener("dragstart", e => e.preventDefault());
      rail.addEventListener("keydown", e => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        const buttons = [...rail.querySelectorAll(":scope > button")], current = buttons.indexOf(document.activeElement);
        const next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (e.key === "ArrowRight" ? 1 : -1)));
        if (!buttons[next]) return;
        e.preventDefault(); buttons[next].focus({ preventScroll: true });
        const bounds = rail.getBoundingClientRect(), target = buttons[next].getBoundingClientRect();
        const scale = bounds.width / rail.offsetWidth;
        const gap = target.left < bounds.left ? target.left - bounds.left - 2
          : target.right > bounds.right ? target.right - bounds.right + 2 : 0;
        rail.scrollLeft = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft + gap / scale));
      });
    });
    const device = document.querySelector("#device");
    const peerPage = document.querySelector(".social-peer-profile"), ownProfile = document.querySelector(".recorded-profile");
    device.classList.toggle("peer-profile-device", Boolean(peerPage));
    if (peerPage || ownProfile) {
      const a = account(peerPage?.dataset.peer || actor());
      device.style.setProperty("--community-profile-image", `url("${env.photoURL(a.wallpaper)}")`);
    }
    if (peerPage) {
      const scroll = peerPage.querySelector(".peer-native-scroll");
      const sync = () => {
        if (!scroll.isConnected) return;
        const top = Math.max(0, scroll.scrollTop);
        const person = peerPage.querySelector(".peer-native-person"), toolbar = peerPage.querySelector(".peer-native-toolbar");
        const fadeEnd = person.offsetTop + person.querySelector(".avatar").offsetHeight - toolbar.offsetHeight;
        device.style.setProperty("--peer-header-opacity", String(Math.min(1, top / Math.max(1, fadeEnd))));
        device.style.setProperty("--peer-background-y", `${-top}px`);
      };
      if (fresh) scroll.addEventListener("scroll", sync, { passive: true });
      sync();
    }
    if (fresh && page === "note") {
      const parts = env.route().split("/");
      if (parts[2] === "from" && peerLikes[parts[3]]) {
        const a = account(parts[3]);
        document.querySelector(".note-copy")?.insertAdjacentHTML("afterbegin", `<button class="social-note-source" data-action="social-together" data-id="${a.id}">从${esc(a.name)}赞过中发现 ${icon("next")}</button>`);
      }
    }
  }
  function toggleFollow(id) {
    if (!hasProfile(id) || id === actor()) return;
    db().peerFollowing[key(id)] = !isFollowing(id);
    refresh(); toast(isFollowing(id) ? "已关注" : "已取消关注");
  }
  function following(peer = actor(), sharedOnly = false) {
    const ids = sharedOnly ? commonCreators(peer).map(a => a.id) : peerFollows(peer);
    const otherIds = sharedOnly ? peerFollows(peer).filter(id => id !== actor() && !isFollowing(id)) : [];
    const people = pool => pool.map(id => {
      const a = account(id);
      const bio = a.bio || countTopics(notes.filter(n => n.authorId === id)).join(" · ");
      return `<div class="following-person" data-following-person="${id}"><button data-action="profile" data-id="${id}">${avatar(a.avatar)}<span><b>${esc(a.name)}</b>${bio ? `<small>${esc(bio)}</small>` : ""}</span></button><button class="social-follow ${isFollowing(id) ? "following" : ""}" data-action="social-follow" data-id="${id}">${isFollowing(id) ? "已关注" : "关注"}</button></div>`;
    }).join("");
    const section = (kind, title, pool, fallback) => `<section class="following-section" data-following-group="${kind}"><h2>${title} <span>${pool.length} 位博主</span></h2>${people(pool) || `<p class="following-empty">${fallback}</p>`}</section>`;
    return `<div class="page social-page">${heading(sharedOnly ? "共同关注" : "关注")}<div class="page-scroll">${sharedOnly
      ? `<div class="social-list-context">${avatar(account(peer).avatar)}<span>你和${esc(account(peer).name)}</span></div>${section("common", "共同关注", ids, "暂时还没有共同关注的博主")}${section("other", "TA 还关注", otherIds, "TA 关注的博主，你也都关注了")}`
      : people(ids) || '<p class="profile-empty">还没有关注的人</p>'}</div></div>`;
  }
  const actions = {
    "social-dismiss": dismissSnack,
    "social-publish": b => publish(b.dataset.id),
    "social-like-and-publish": b => publish(b.dataset.id, true),
    "social-like-private": b => { closeModal(true); if (!env.isLiked(b.dataset.id)) env.likeNote(b.dataset.id); },
    "social-unlike": b => { closeModal(true); if (env.isLiked(b.dataset.id)) env.likeNote(b.dataset.id); },
    "social-confirm-public": b => confirmPublic(b.dataset.id),
    "social-withdraw": b => withdraw(b.dataset.id),
    "social-manage-note": b => manageNote(b.dataset.id),
    "social-find": () => go("kindred"),
    "social-manage": () => go(`profile/${actor()}/liked/notes`),
    "social-filter": b => go(`profile/${actor()}/liked/notes/${b.dataset.value}`, true, { preserveScroll: true, animate: false }),
    "following-list": () => go("following"),
    "social-together": b => go(`together/${b.dataset.id}`),
    "social-insights-toggle": b => {
      const id = `${actor()}:${b.dataset.id}:insights`, full = !expanded.has(id);
      if (full) expanded.add(id); else expanded.delete(id);
      b.setAttribute("aria-expanded", String(full));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !full;
      b.innerHTML = `${full ? "收起" : "更多共同兴趣"} ${icon("next")}`;
      const scroll = b.closest(".page-scroll"), bounds = b.getBoundingClientRect(), viewport = scroll.getBoundingClientRect();
      if (bounds.top < viewport.top) scroll.scrollTop += (bounds.top - viewport.top) / (Number(getComputedStyle(document.querySelector("#device")).zoom) || 1);
    },
    "social-topic": b => {
      const topicKey = `${actor()}:${b.dataset.id}`, value = b.dataset.value;
      if (!value || selectedTopics.get(topicKey) === value) selectedTopics.delete(topicKey);
      else selectedTopics.set(topicKey, value);
      scrollRemember(); render();
      const section = document.querySelector("#shared-notes"), scroll = section?.closest(".page-scroll");
      if (scroll) {
        const scale = scroll.getBoundingClientRect().height / scroll.offsetHeight;
        scroll.scrollTop += (section.getBoundingClientRect().top - scroll.getBoundingClientRect().top) / scale;
      }
    },
    "social-common-following": b => go(`common-following/${b.dataset.id}`),
    "social-other-likes": b => go(`other-likes/${b.dataset.id}`),
    "social-peer-likes": b => go(`profile/${b.dataset.id}/liked`),
    "social-open-note": b => go(`${note(b.dataset.id).video ? "video" : "note"}/${b.dataset.id}/from/${b.dataset.peer}`),
    "social-expand": b => { const id = b.dataset.id; if (expanded.has(id)) expanded.delete(id); else expanded.add(id); scrollRemember(); render(); },
    "social-follow": b => toggleFollow(b.dataset.id),
    "social-profile-recommend": b => {
      const id = b.dataset.id;
      if (expandedProfileSuggestions.has(id)) expandedProfileSuggestions.delete(id); else expandedProfileSuggestions.add(id);
      scrollRemember(); render();
    },
    "social-copy-id": async b => {
      const id = account(b.dataset.id).redId;
      try { await navigator.clipboard.writeText(id); toast("小红书号已复制"); }
      catch { toast(`小红书号：${id}`); }
    },
    "social-following-list": b => go(`following/${b.dataset.id}`),
    "social-profile-menu": b => {
      const a = account(b.dataset.id);
      showModal("peer-profile-menu", a.id, `<section class="social-sheet" role="dialog" aria-modal="true" aria-label="主页选项" tabindex="-1"><header><h2>${esc(a.name)}</h2><button data-action="close-modal" aria-label="关闭">×</button></header><button class="social-option" data-action="social-copy-profile" data-id="${a.id}">复制主页链接</button><button class="social-option" data-action="social-together" data-id="${a.id}">查看共同点 ${icon("next")}</button><button class="social-option" data-action="close-modal">取消</button></section>`);
    },
    "social-copy-profile": async b => { try { await navigator.clipboard.writeText(new URL(`index.html#/profile/${b.dataset.id}`, location.href).href); closeModal(); toast("主页链接已复制"); } catch { toast("可复制地址栏中的主页链接"); } },
    "social-peer-tab": b => go(`profile/${b.dataset.id}/${b.dataset.value}`, true, { preserveScroll: true, animate: false }),
    "social-talk": b => compose(b.dataset.peer, b.dataset.id),
    "social-share-another": b => compose(b.dataset.peer, b.dataset.id, "share"),
    "social-other-attachments": () => env.otherAttachments()
  };
  return { isPublic, publicNotes, common, commonCreators, onLike, ownLikes, ownTools, find, together, otherLikes, peerProfile, following, followingIds, hasProfile, isFollowing, toggleFollow, hasPeer: id => Boolean(peerLikes[id]), actions, afterRender, dismissSnack, snack, chatContext, scheduleReply, attachments };
};
