(() => {
  "use strict";
  const { accounts, notes, icons, iosIcons, iosFeed } = window.XHS_DATA;
  const DEVICE_WIDTH = 402, DEVICE_HEIGHT = 874;
  const STORAGE = "xhs-community-public-likes-v1";
  const LEGACY_STORAGE = "xhs-image-note-mvp-v1";
  const $ = (s, root = document) => root.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const account = id => accounts.find(a => a.id === id) || accounts[0];
  const note = id => notes.find(n => n.id === id) || notes[0];
  const photoURL = (name = "ios:super-cover") => name.startsWith("data:image/") ? name : name.startsWith("community:") ? `assets/community/${name.slice(10)}.jpg` : name.startsWith("youth:") ? `assets/youth/${name.slice(6)}.jpg` : name.startsWith("ios:") ? `assets/ios/${name.slice(4)}.png` : `assets/images/${name}.jpg`;
  const photo = (name, className = "", alt = "", lazy = false) => `<img class="${className}" src="${esc(photoURL(name))}" alt="${esc(alt)}" ${lazy ? 'loading="lazy" decoding="async"' : 'decoding="auto"'}>`;
  const icon = (name, className = "") => (iosIcons?.[name] || icons[name]) ? `<img class="icon ${className}" src="${iosIcons?.[name] || `assets/icons/${icons[name]}`}" alt="" aria-hidden="true">` : "";
  const iconButton = (name, action, label, extra = "") => `<button type="button" class="icon-button" data-action="${action}" aria-label="${esc(label)}" ${extra}>${icon(name)}</button>`;
  const avatar = (name, className = "") => photo(name, `avatar ${className}`);
  const number = v => v >= 10000 ? `${(Math.floor(v / 1000) / 10).toFixed(1)}万` : String(v);
  const seedSearchHistory = ["黑胶唱片入门", "周末看展", "独立书店", "杭州周末live演出", "咖啡店"];
  const searchSuggestions = ["周末看展", "小众香水怎么选", "黑胶唱片", "杭州值得去的独立书店", "地下声场", "live现场"];
  const freshDB = () => ({
    version: 1, actor: "lin", likes: {}, saves: {}, following: {}, comments: {}, read: {},
    commentLikes: {}, publicComments: {}, expanded: {}, recommendations: {}, albums: {}, viewed: {},
    supplementVersion: 1, searchContentRevision: 0,
    aiHistory: [], notificationLikes: {}, followerBack: {}, searchHistory: [...seedSearchHistory],
    messages: [...window.XHS_DATA.seedMessages,
      { id: "seed-text", from: "man", to: "lin", type: "text", text: "这张唱片我也一直想收", at: Date.now() - 960000 },
      { id: "seed-note", from: "man", to: "lin", type: "note", noteId: "weeknd", at: Date.now() - 950000 }
    ]
  });
  let db;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE) || localStorage.getItem(LEGACY_STORAGE));
    db = stored && stored.version === 1 && Array.isArray(stored.messages) ? { ...freshDB(), ...stored } : freshDB();
    if (stored?.version === 1 && Array.isArray(stored.messages) && !stored.supplementVersion) db.supplementVersion = 0;
  } catch (_) { db = freshDB(); }
  // Add the supplemental demo once; keep all user-created local interactions.
  if (!db.supplementVersion) {
    db.messages.push(...window.XHS_DATA.seedMessages);
    db.supplementVersion = 1;
  }
  if (db.visualRevision !== 3) {
    const demoMessages = new Map(window.XHS_DATA.seedMessages.map(m => [m.id, m]));
    demoMessages.set("seed-text", { text: "这张唱片我也一直想收" });
    demoMessages.set("seed-note", { noteId: "weeknd" });
    db.messages = db.messages.map(m => demoMessages.has(m.id) ? { ...m, ...demoMessages.get(m.id), at: m.at } : m);
    db.visualRevision = 3;
  }
  // Replace the previously copied screenshot history once with fictional demo data.
  if (db.searchContentRevision !== 1) {
    db.searchHistory = [...seedSearchHistory];
    db.searchContentRevision = 1;
  }
  db.actor = "lin";
  let actor = db.actor;
  let route = location.hash.slice(2) || "feed";
  let stack = [], modal = null, returnFocus = null, lastRecipient = null, toastTimer;
  const positions = new Map();
  const galleryPositions = new Map();
  const pageViews = new Map();
  let channel = "发现", category = "推荐", searchQuery = "", searchDraft = "", searchHistoryExpanded = false, shareSelection = new Set();
  let searchKeyboardShift = false, searchKeyboardNumbers = false;
  let community, supplement, social;
  const app = $("#app"), overlay = $("#overlay-root");
  let pageAnimations = [], pageSnapshot = null, modalAnimations = [];
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function save() {
    db.actor = actor;
    // Inline actions can mutate the mounted DOM without render(). Do not retain
    // an old markup signature for that now-modified view.
    for (const [key, view] of pageViews) {
      if (view.element === app.firstElementChild) pageViews.delete(key);
    }
    try { localStorage.setItem(STORAGE, JSON.stringify(db)); }
    catch (_) { toast("记录未能保存，请检查浏览器存储设置"); }
  }
  const markKey = (id) => `${actor}:${id}`;
  const isLiked = (id) => community ? community.liked(id) : Boolean(db.likes[markKey(id)]);
  const isSaved = (id) => community ? community.saved(id) : Boolean(db.saves[markKey(id)]);
  const likeCount = n => n.likes + (isLiked(n.id) ? 1 : 0) - (actor === "lin" && window.XHS_DATA.myProfile.likedIds.includes(n.id) ? 1 : 0);
  const saveCount = n => n.saves + (isSaved(n.id) ? 1 : 0) - (actor === "lin" && window.XHS_DATA.myProfile.savedIds.includes(n.id) ? 1 : 0);
  function likeButton(id, className = "", outline = "like", countTag = "span") {
    const liked = isLiked(id), pub = Boolean(social?.isPublic(id)), n = note(id);
    const label = liked ? pub ? "取消点赞；当前赞过已公开，长按管理" : "取消点赞；当前赞过仅自己可见，长按公开" : "点赞；长按选择点赞方式";
    return `<button type="button" class="${className} ${liked ? "liked" : ""} ${pub ? "is-public-like" : ""}" data-action="like" data-id="${id}" aria-label="${esc(`${label}：${n.title}`)}" aria-pressed="${liked}" aria-haspopup="dialog">${icon(liked ? pub ? "liked-public" : "liked" : outline)}${countTag ? `<${countTag}>${number(likeCount(n))}</${countTag}>` : ""}</button>`;
  }
  function followButton(id, className = "", video = false) {
    const author = note(id).authorId, followed = Boolean(social?.isFollowing(author));
    return `<button type="button" class="${className} ${followed ? "is-following" : ""}" data-action="follow" data-id="${id}" aria-label="${followed ? "取消关注作者" : "关注作者"}" aria-pressed="${followed}" ${author === actor || (video && followed) ? "hidden" : ""}>${video ? "+" : followed ? "已关注" : "关注"}</button>`;
  }
  const chatDrafts = new Map();
  function rememberChatDraft() {
    const input = $("#chat-text"), peer = input?.form?.dataset.peer;
    if (peer) chatDrafts.set(`${actor}:${peer}`, { text: input.value, start: input.selectionStart, end: input.selectionEnd });
  }
  function restoreChatDraft(peer, focusedPeer) {
    const input = $("#chat-text"), draft = chatDrafts.get(`${actor}:${peer}`);
    if (!input || !draft) return;
    input.value = draft.text;
    input.setSelectionRange(draft.start, draft.end);
    $(".chat-send").hidden = !draft.text.trim();
    $(".chat-plus").hidden = Boolean(draft.text.trim());
    if (focusedPeer === peer) input.focus({ preventScroll: true });
  }
  function scrollRemember() {
    rememberChatDraft();
    const el = $(".page-scroll", app);
    if (el) positions.set(`${actor}:${route}`, el.scrollTop);
  }
  function setHash(replace = false) {
    history[replace ? "replaceState" : "pushState"]({ xhs: true, route }, "", `#/${route}`);
  }
  function go(next, replace = false, options = {}) {
    social?.dismissSnack(true);
    clearToast();
    closeModal(true);
    scrollRemember();
    if (next === route) return;
    const previous = route;
    if (options.preserveScroll) positions.set(`${actor}:${next}`, positions.get(`${actor}:${route}`) || 0);
    if (!replace) stack.push(route);
    route = next;
    setHash(replace);
    const rootTab = value => ["feed", "messages", `profile/${actor}`].includes(value);
    render(options.animate === false || (rootTab(previous) && rootTab(next)) ? 0 : 1);
  }
  function back() {
    social?.dismissSnack(true);
    clearToast();
    if (modal) { closeModal(); return; }
    scrollRemember();
    route = stack.pop() || (route.startsWith("chat/") ? "messages" : "feed");
    setHash(true);
    render(-1);
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2300);
  }
  function clearToast() {
    clearTimeout(toastTimer);
    $("#toast").classList.remove("visible");
  }
  function conversation(peer) {
    return db.messages.filter(m => (m.from === actor && m.to === peer) || (m.to === actor && m.from === peer)).sort((a, b) => a.at - b.at);
  }
  const knownPeer = a => !a.socialPeer || social?.followingIds().includes(a.id) || conversation(a.id).length > 0;
  function unread(peer) {
    return conversation(peer).filter(m => m.to === actor && m.at > (db.read[`${actor}:${peer}`] || 0)).length;
  }
  const allUnread = () => accounts.filter(a => a.id !== actor).reduce((n, a) => n + unread(a.id), 0);
  function readChat(peer) {
    db.read[`${actor}:${peer}`] = Date.now();
    save();
  }
  function bottomNav(active) {
    const badge = allUnread();
    return `<nav class="bottom-nav" aria-label="底部导航">
      <button data-action="home" class="${active === "feed" ? "active" : ""}">首页</button>
      <button data-action="scope" data-label="市集">市集</button>
      <button data-action="scope" data-label="发布" class="publish" aria-label="发布笔记"><span>+</span></button>
      <button data-action="messages" class="${active === "messages" ? "active" : ""}"><span class="nav-text">消息${badge ? `<i class="nav-badge">${badge}</i>` : ""}</span></button>
      <button data-action="profile" data-id="${actor}" class="${active === "profile" ? "active" : ""}">我</button>
    </nav>`;
  }
  function mediaLocation(n) {
    if (!n.mediaLocation) return "";
    const { name, distance } = n.mediaLocation;
    return `<span class="media-location" aria-label="${esc(`${name}${distance ? `，距离${distance}` : ""}`)}"><img src="assets/ios/media-location-pin.png" alt="" aria-hidden="true"><span>${esc(name)}</span>${distance ? `<span class="media-location-distance">${esc(distance)}</span>` : ""}</span>`;
  }
  function card(n, eager = false, options = {}) {
    return `<article class="feed-card ${n.captured ? "captured" : ""}" data-note-card="${n.id}">
      <button class="feed-cover" data-action="note" data-id="${n.id}" aria-label="打开笔记：${esc(n.title)}" style="aspect-ratio:${n.ratio}">${n.cover || n.images[0] ? photo(n.cover || n.images[0], "", n.title, eager !== true) : `<span class="text-note-cover">${esc(n.title)}</span>`}${options.pinned && n.pinned ? '<span class="media-pin">置顶</span>' : ""}${mediaLocation(n)}${n.recordedVideoCover ? '<span class="recorded-video-indicator" aria-label="视频封面">'+photo("ios:media-play", "", "")+'</span>' : ""}${!n.captured && n.images.length > 1 ? '<span class="multi-image"><i></i><i></i></span>' : ""}</button>
      <button class="feed-title" data-action="note" data-id="${n.id}">${esc(n.title)}</button>
      <div class="feed-meta"><button class="feed-author" data-action="author" data-id="${n.id}">${avatar(n.avatar)}<span>${esc(n.author)}</span></button>
        ${likeButton(n.id, "feed-like", "like-small")}
      </div></article>`;
  }
  function feed() {
    let pool = category === "推荐" ? iosFeed.map(note) : [];
    if (channel === "关注") pool = notes.filter(n => social?.isFollowing(n.authorId));
    if (channel === "杭州") pool = window.XHS_DATA.localFeed.map(note);
    const left = pool.filter((_, i) => i % 2 === 0), right = pool.filter((_, i) => i % 2);
    return `<div class="page feed-page">
      <header class="feed-header">${iconButton("friends", "people", "查找好友")}<div class="main-tabs" role="tablist" aria-label="首页内容">${["关注", "发现", "杭州"].map(t => `<button role="tab" aria-selected="${channel === t}" class="${channel === t ? "selected" : ""}" data-action="channel" data-value="${t}">${t}</button>`).join("")}</div>${iconButton("search", "search", "搜索笔记")}</header>
      <div class="category-tabs" role="tablist" aria-label="笔记分类">${(channel === "杭州" ? ["全城", "推荐", "活动", "美食", "新热打卡", "周末出行"] : ["推荐", "RED", "直播", "热点", "短剧", "足球"]).map(t => `<button role="tab" aria-selected="${category === t}" class="${category === t ? "selected" : ""}" data-action="category" data-value="${t}">${t}</button>`).join("")}<span class="category-fade">⌄</span></div>
      <div class="page-scroll feed-scroll">${pool.length ? `<div class="masonry"><div class="feed-column">${left.map((n, i) => card(n, i < 2)).join("")}</div><div class="feed-column">${right.map((n, i) => card(n, i < 2)).join("")}</div></div><p class="feed-end">- 到底了 -</p>` : '<div class="empty-state">暂时没有更多笔记<button data-action="channel" data-value="发现">返回发现</button></div>'}</div>
      ${bottomNav("feed")}</div>`;
  }
  function detail(id) {
    const n = note(id);
    const images = n.detailImages || n.images;
    const paged = !n.noGallery && images.length > 1;
    const current = Math.min(galleryPositions.get(`${actor}:${id}`) || 0, images.length - 1);
    const [widthRatio, heightRatio] = (n.detailRatio || n.ratio).split("/").map(Number);
    const galleryHeight = DEVICE_WIDTH * heightRatio / widthRatio;
    return `<div class="page detail-page ${paged ? "has-gallery-pages" : ""} ${n.audio ? "has-audio" : ""} ${n.noGallery ? "comments-captured-detail" : ""} ${n.id === "crab" ? "crab-detail" : ""}" data-note-id="${n.id}">
      <header class="detail-header">${iconButton("back", "back", "返回")}<button class="detail-author" data-action="author" data-id="${n.id}">${avatar(n.avatar)}<span>${esc(n.author)}${n.audio ? `<small>♫ ${esc(n.audio)}</small>` : ""}</span></button>${followButton(n.id, "follow-button")}${iconButton("share", "share", "分享笔记", `data-id="${n.id}"`)}</header>
      <div class="page-scroll note-scroll">
        ${!n.noGallery ? `<div class="note-gallery" aria-label="笔记图片"><div class="gallery-track ${paged ? "is-draggable" : ""}" style="height:${galleryHeight}px" tabindex="0" aria-label="${paged ? "左右滑动查看图片" : "笔记图片"}">${images.map((im, i) => `<div class="gallery-slide">${photo(im, "", `${n.title}，第 ${i + 1} 张图片`)}${i === 0 ? mediaLocation(n) : ""}</div>`).join("")}</div>${paged ? `<span class="gallery-counter" aria-live="polite">${current + 1}/${images.length}</span><button class="gallery-prev" data-action="gallery-prev" aria-label="上一张图片">‹</button><button class="gallery-next" data-action="gallery-next" aria-label="下一张图片">›</button>` : ""}</div>` : ""}
        ${paged ? `<div class="gallery-dots" aria-label="图片页码">${images.map((_, i) => `<button class="${i === current ? "active" : ""}" data-action="gallery-index" data-index="${i}" aria-current="${i === current}" aria-label="第 ${i + 1} 张图片"></button>`).join("")}</div>` : ""}
        <article class="note-copy">${!n.noGallery ? `<h1>${esc(n.title)}</h1>` : ""}${n.body || n.tags.length ? `<p class="note-body">${esc(n.body).replace(/\n/g, "<br>")}${n.body && n.tags.length && !/\s$/.test(n.body) ? " " : ""}${n.tags.length ? `<span class="note-tags">${n.tags.map(t => `<button data-action="tag" data-value="${esc(t)}">#${esc(t)}</button>`).join(" ")}</span>` : ""}</p>` : ""}${n.collection ? `<div class="note-collection">${esc(n.collection)}</div><div class="note-venue">${photo("ios:venue-night")}<div>${esc(n.venue)}<small>${esc(n.venueInfo)}</small></div>${icon("collect")}</div>` : ""}${n.group ? `<button class="note-group" data-action="profile-groups">${community.glyph("people")}${esc(n.group)}</button>` : ""}<div class="note-date"><span>${esc(n.date)}${n.location ? ` ${esc(n.location)}` : ""}</span><button data-action="dislike">${community.glyph("minus")}不喜欢</button></div></article>
        ${community.comments(n.id)}
      </div>
      <footer class="note-footer"><button class="write-comment" data-action="comment" data-id="${n.id}">${icon("pencil")}说点什么...</button>
        ${likeButton(n.id, "note-stat")}
        <button class="note-stat ${isSaved(n.id) ? "saved" : ""}" data-action="save-note" data-id="${n.id}" aria-label="${isSaved(n.id) ? "取消收藏" : "收藏"}" aria-pressed="${isSaved(n.id)}">${icon(isSaved(n.id) ? "collected" : "collect")}<span>${number(saveCount(n))}</span></button>
        <button class="note-stat" data-action="comments-scroll" data-id="${n.id}" aria-label="查看评论">${icon("comment")}<span>${number(n.comments + (db.comments[n.id] || []).length) || "评论"}</span></button>
      </footer></div>`;
  }
  function messages() {
    const peers = accounts.filter(a => a.id !== actor).map(a => ({ ...a, thread: conversation(a.id) })).sort((a, b) => (b.thread.at(-1)?.at || 0) - (a.thread.at(-1)?.at || 0));
    return `<div class="page messages-page"><header class="messages-header"><span></span><h1>消息</h1><button data-action="people">发现好友</button></header>
      <div class="page-scroll messages-scroll"><div class="notification-shortcuts">${[["notificationLike", "赞和收藏"], ["notificationFollow", "新增关注"], ["notificationComment", "评论和@" ]].map(([im, label]) => `<button data-action="notification" data-label="${label}">${icon(im)}<span>${label}</span></button>`).join("")}</div>
      <div class="conversation-list">${peers.map(a => {
        const last = a.thread.at(-1), count = unread(a.id);
        const preview = last ? last.type === "note" ? `[笔记] ${note(last.noteId).title}` : last.text : "你们已经互相关注，打个招呼吧";
        return `<button class="conversation-row" data-action="chat" data-id="${a.id}"><div class="conversation-avatar">${avatar(a.avatar)}${count ? `<i class="unread-badge">${count}</i>` : ""}</div><div class="conversation-copy"><div><strong>${esc(a.name)}</strong><time>${last ? timeLabel(last.at) : ""}</time></div><p>${esc(preview)}</p></div></button>`;
      }).join("")}</div></div>${bottomNav("messages")}</div>`;
  }
  function timeLabel(at) {
    const date = new Date(at);
    return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) : `${date.getMonth() + 1}-${date.getDate()}`;
  }
  function noteMessage(n, message = {}) {
    const commonOrigin = message.socialContext === "common";
    return `<button class="chat-note-card" data-action="note" data-id="${n.id}" aria-label="打开分享的笔记：${esc(n.title)}">${commonOrigin ? '<div class="chat-note-origin"><b>来自找同好</b><small>你们共同赞过这篇笔记</small></div>' : ""}${n.images[0] ? photo(n.images[0], "chat-note-image", n.title) : `<span class="text-note-cover">${esc(n.title)}</span>`}<div class="chat-note-copy"><h2>${esc(n.title)}</h2><div>${avatar(n.avatar)}<span>${esc(n.author)}</span><b>小红书</b></div></div></button>`;
  }
  function chat(peerId) {
    const peer = account(peerId), thread = conversation(peer.id);
    readChat(peer.id);
    let previousAt = 0;
    const historyHTML = thread.map(m => {
      const me = m.from === actor, sender = account(m.from);
      const showTime = m.at - previousAt > 180000; previousAt = m.at;
      return `${showTime ? `<div class="chat-time">${timeLabel(m.at)}</div>` : ""}<div class="message-row ${me ? "outgoing" : "incoming"}" data-message-id="${esc(m.id)}"><button class="message-avatar" data-action="profile" data-id="${sender.id}" aria-label="查看${esc(sender.name)}的主页">${avatar(sender.avatar)}</button>${m.type === "note" ? noteMessage(note(m.noteId), m) : `<div class="text-bubble">${esc(m.text).replace(/\n/g, "<br>")}</div>`}</div>`;
    }).join("");
    return `<div class="page chat-page"><header class="chat-header">${iconButton("back", "back", "返回消息列表")}<h1>${esc(peer.name)}</h1>${iconButton("more", "chat-info", "聊天设置", `data-id="${peer.id}"`)}</header><div class="page-scroll chat-scroll">${historyHTML || '<div class="chat-greeting">你们已经互相关注，可以开始聊天了</div>'}</div>
      <form class="chat-composer" id="chat-form" data-peer="${peer.id}"><button type="button" class="composer-control voice-button" data-action="scope" data-label="语音消息" aria-label="语音消息"><span></span></button><label class="sr-only" for="chat-text">给${esc(peer.name)}发消息</label><input id="chat-text" name="text" autocomplete="off" spellcheck="false" aria-label="消息内容" maxlength="1000"><button type="button" class="composer-control smile-button" data-action="emoji" aria-label="添加表情"><span>☺</span></button><button type="button" class="composer-control chat-plus" data-action="chat-attachments" aria-label="更多聊天功能">${icon("plus")}</button><button type="submit" class="chat-send" hidden>发送</button></form></div>`;
  }
  function profile(id, authorMode = false) {
    const person = authorMode ? { name: note(id).author, avatar: note(id).avatar, bio: "记录生活里值得喜欢的小事。" } : account(id);
    const mine = !authorMode && id === actor;
    const pool = mine ? notes.filter(n => isSaved(n.id)) : authorMode ? notes.filter(n => n.author === person.name) : notes.filter(n => n.avatar === person.avatar);
    return `<div class="page profile-page"><header class="simple-header">${iconButton("back", "back", "返回")}<span></span>${iconButton("more", "scope", "更多")}</header><div class="page-scroll profile-scroll"><div class="profile-info">${avatar(person.avatar)}<div><h1>${esc(person.name)}</h1><p>小红书号：${authorMode ? "sy202610" : `202610${accounts.indexOf(account(id)) + 100}`}</p></div></div><p class="profile-bio">${esc(person.bio)}</p><div class="profile-stats"><span><b>128</b>关注</span><span><b>256</b>粉丝</span><span><b>1.2万</b>获赞与收藏</span>${!mine && !authorMode ? `<button data-action="chat" data-id="${id}">发消息</button>` : ""}</div><div class="profile-tabs"><span>${mine ? "收藏" : "笔记"}</span></div>${pool.length ? `<div class="masonry"><div class="feed-column">${pool.filter((_, i) => i % 2 === 0).map(card).join("")}</div><div class="feed-column">${pool.filter((_, i) => i % 2).map(card).join("")}</div></div>` : '<p class="profile-empty">还没有收藏笔记</p>'}</div>${mine ? bottomNav("profile") : ""}</div>`;
  }
  function search() {
    const q = searchQuery.toLocaleLowerCase();
    const results = q ? notes.filter(n => `${n.title}${n.body}${n.tags.join("")}${n.category}`.toLocaleLowerCase().includes(q)) : [];
    const control = name => `<img class="search-control" src="assets/ios/search-${name}.png" alt="" aria-hidden="true">`;
    const historyItems = Array.isArray(db.searchHistory) ? db.searchHistory : seedSearchHistory;
    const landing = `<section class="search-history"><header><h2>历史记录</h2><button data-action="search-clear-history" aria-label="清空搜索历史">${control("trash")}</button></header><div class="search-history-pills ${searchHistoryExpanded ? "expanded" : ""}">${historyItems.slice(0, searchHistoryExpanded ? 20 : 5).map((text, i) => `<button data-action="search-term" data-value="${esc(text)}" class="history-pill ${i === 3 ? "history-long" : ""}" title="${esc(text)}">${esc(text)}</button>`).join("")}${historyItems.length ? `<button class="history-expand" data-action="search-expand-history" aria-expanded="${searchHistoryExpanded}" aria-label="${searchHistoryExpanded ? "收起" : "展开"}搜索历史">${control("expand")}</button>` : '<p class="search-history-empty">暂无搜索历史</p>'}</div></section><section class="recorded-search-suggestions"><header><h2>猜你想搜</h2><button data-action="search-suggestion-options" aria-label="搜索推荐选项">${control("more")}</button></header><div class="search-suggestion-grid">${searchSuggestions.map((text, i) => `<button data-action="search-term" data-value="${esc(text)}"><span>${esc(text)}</span>${i === 3 ? control("hot") : ""}</button>`).join("")}</div></section>`;
    return `<div class="page search-page ${searchQuery ? "search-results-page" : "search-landing"}"><form class="recorded-search-header" id="search-form">${iconButton("back", "back", "返回")}<div class="recorded-search-capsule"><label class="sr-only" for="search-query">搜索笔记</label><input type="search" id="search-query" name="query" value="${esc(searchDraft)}" placeholder="${esc(searchSuggestions[0])}" autocomplete="off" spellcheck="false" enterkeyhint="search"><button type="button" class="search-camera" data-action="search-camera" aria-label="拍照搜索">${control("camera")}</button><button type="submit" class="recorded-search-submit">搜索</button></div><input type="file" id="search-camera-file" accept="image/*" capture="environment" hidden></form><div class="page-scroll search-scroll">${!searchQuery ? landing : results.length ? `<div class="masonry"><div class="feed-column">${results.filter((_, i) => i % 2 === 0).map(n => card(n, true)).join("")}</div><div class="feed-column">${results.filter((_, i) => i % 2).map(n => card(n, true)).join("")}</div></div>` : '<div class="empty-state">没有找到相关笔记<p>本地演示可搜索「LE LABO」「live」「杭州」</p></div>'}</div>${!searchQuery ? `<div class="search-voice-region"><button data-action="search-voice" aria-label="按住提问，有问必答"></button></div>${searchKeyboard()}` : ""}</div>`;
  }
  function searchKeyboard() {
    searchKeyboardShift = false;
    searchKeyboardNumbers = false;
    const key = (text, value, x, y, w, h = 44) => `<button type="button" data-action="search-key" data-value="${esc(value)}" aria-label="${esc(text)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></button>`;
    return `<div class="search-keyboard" aria-label="搜索键盘"><img src="assets/ios/search-keyboard.png" alt="" aria-hidden="true">${[["qwertyuiop", 7, 52], ["asdfghjkl", 26, 106], ["zxcvbnm", 66, 160]].map(([row, x, y]) => Array.from(row).map((c, i) => key(c, c, x + i * 39.6, y, 34)).join("")).join("")}${key("切换大写", "shift", 7, 160, 46)}${key("删除", "delete", 350, 160, 46)}${key("数字和符号", "numbers", 7, 214, 92)}${key("空格", "space", 105, 214, 192)}${key("搜索", "submit", 303, 214, 92)}${key("切换输入语言", "language", 16, 270, 54, 54)}${key("语音输入", "voice", 332, 270, 54, 54)}</div>`;
  }
  function submitSearch(value) {
    searchQuery = String(value || "").trim();
    searchDraft = searchQuery;
    if (searchQuery) {
      db.searchHistory = [searchQuery, ...(db.searchHistory || []).filter(q => q !== searchQuery)].slice(0, 20);
      save();
    }
    positions.delete(`${actor}:search`);
    if (route === "search") render(); else go("search");
  }
  function searchKey(value) {
    const input = $("#search-query");
    if (!input) return;
    if (value === "submit") { $("#search-form").requestSubmit(); return; }
    if (value === "voice") { actions["search-voice"](); return; }
    if (value === "language") { input.focus({ preventScroll: true }); toast("中文输入请使用电脑或手机的系统输入法"); return; }
    const keyboard = $(".search-keyboard");
    if (value === "shift" || value === "numbers") {
      if (value === "shift") searchKeyboardShift = !searchKeyboardShift;
      else searchKeyboardNumbers = !searchKeyboardNumbers;
      const letters = Array.from("qwertyuiopasdfghjklzxcvbnm"), symbols = Array.from("1234567890-/:;()¥&@.,?!'\"[]{}");
      keyboard.querySelectorAll("button").forEach(b => {
        const i = letters.indexOf(b.dataset.value);
        if (i >= 0) {
          const shown = searchKeyboardNumbers ? symbols[i] : searchKeyboardShift ? b.dataset.value.toUpperCase() : b.dataset.value;
          b.textContent = shown; b.setAttribute("aria-label", shown);
          b.classList.add("search-key-label");
        }
        if (b.dataset.value === "numbers") { b.textContent = searchKeyboardNumbers ? "ABC" : "123"; b.classList.add("search-key-label"); }
      });
      return;
    }
    const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
    let text = value === "space" ? " " : value;
    if (searchKeyboardNumbers && text !== " ") text = Array.from("1234567890-/:;()¥&@.,?!'\"[]{}")[Array.from("qwertyuiopasdfghjklzxcvbnm").indexOf(value)] || value;
    else if (searchKeyboardShift) text = text.toUpperCase();
    const deleteAt = start === end ? Math.max(0, start - 1) : start;
    input.value = value === "delete" ? input.value.slice(0, deleteAt) + input.value.slice(end) : input.value.slice(0, start) + text + input.value.slice(end);
    input.focus({ preventScroll: true });
    try {
      const caret = value === "delete" ? deleteAt : start + text.length;
      input.setSelectionRange(caret, caret);
    } catch (_) { /* Older browsers may not expose search-input selection. */ }
    searchDraft = input.value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function people() {
    return `<div class="page"><header class="simple-header">${iconButton("back", "back", "返回")}<h1>发现好友</h1><span></span></header><div class="page-scroll people-list">${accounts.filter(a => a.id !== actor).map(a => `<div class="person-row">${avatar(a.avatar)}<div><b>${esc(a.name)}</b><p>${esc(a.bio)}</p></div><button data-action="chat" data-id="${a.id}">发消息</button></div>`).join("")}</div></div>`;
  }
  function render(direction = 0) {
    const focusedChatPeer = document.activeElement === $("#chat-text") ? $("#chat-text").form.dataset.peer : null;
    rememberChatDraft();
    pageAnimations.forEach(a => a.cancel());
    pageAnimations = [];
    pageSnapshot?.remove();
    pageSnapshot = null;
    let snapshot;
    if (direction && !reducedMotion() && app.firstElementChild) {
      const previous = app.firstElementChild;
      snapshot = previous.cloneNode(true);
      snapshot.classList.add("route-snapshot");
      snapshot.inert = true;
      snapshot.setAttribute("aria-hidden", "true");
      snapshot.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      const originalScrollers = previous.querySelectorAll(".page-scroll,.gallery-track");
      snapshot.querySelectorAll(".page-scroll,.gallery-track").forEach((el, i) => {
        el.dataset.restoreTop = originalScrollers[i].scrollTop;
        el.dataset.restoreLeft = originalScrollers[i].scrollLeft;
      });
    }
    const [page, id, tab, sub] = route.split("/");
    const renderers = { feed, messages: () => supplement.messages(), note: () => detail(id), video: () => community.video(id), chat: () => supplement.chat(id), profile: () => id === actor ? community.profile(tab, sub) : social.hasProfile(id) ? social.peerProfile(id, tab) : profile(id), author: () => note(id).authorId === actor ? community.profile(tab, sub) : social.peerProfile(note(id).authorId, tab), notifications: () => supplement.notifications(decodeURIComponent(id)), "message-search": () => supplement.search(), "ai-chat": () => supplement.aiPage(), kindred: () => social.find(), together: () => social.together(id), following: () => social.following(id), "common-following": () => social.following(id, true), "other-likes": () => social.otherLikes(id), search, people };
    if (!renderers[page]) { route = "feed"; setHash(true); }
    const html = (renderers[page] || feed)(), viewKey = `${actor}:${route}`;
    const cacheable = !["chat", "video", "search", "ai-chat"].includes(page);
    const cached = cacheable && pageViews.get(viewKey);
    const fresh = !cached || cached.html !== html;
    // Compare current data-derived markup so likes, messages and profile edits
    // invalidate stale views, while unchanged tabs retain their decoded images.
    if (fresh) app.innerHTML = html;
    else if (app.firstElementChild !== cached.element) app.replaceChildren(cached.element);
    if (cacheable) {
      pageViews.delete(viewKey);
      pageViews.set(viewKey, { html, element: app.firstElementChild });
      while (pageViews.size > 12) pageViews.delete(pageViews.keys().next().value);
    }
    // Restore before profile-header synchronization and the next paint.
    const scroll = $(".page-scroll", app);
    if (scroll) scroll.scrollTop = page === "chat" ? scroll.scrollHeight : (positions.get(viewKey) || 0);
    community.afterRender(page, id, fresh);
    supplement.afterRender(page, id, fresh);
    social.afterRender(page, id, fresh);
    if (page === "chat") restoreChatDraft(id, focusedChatPeer);
    delete document.documentElement.dataset.initialSurface;
    const renderedPage = app.firstElementChild;
    if (fresh) bindGallery(id);
    if (page === "search" && !searchQuery) $("#search-query")?.focus({ preventScroll: true });
    if (snapshot) {
      pageSnapshot = snapshot;
      app.appendChild(snapshot);
      snapshot.querySelectorAll("[data-restore-top]").forEach(el => {
        el.scrollTop = Number(el.dataset.restoreTop);
        el.scrollLeft = Number(el.dataset.restoreLeft);
      });
      const timing = { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" };
      snapshot.style.zIndex = direction > 0 ? "0" : "2";
      renderedPage.style.zIndex = "1";
      pageAnimations = [
        renderedPage.animate([{ transform: `translateX(${direction > 0 ? "100%" : "-24%"})` }, { transform: "translateX(0)" }], timing),
        snapshot.animate([{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${direction > 0 ? "-24%" : "100%"})`, opacity: direction > 0 ? .7 : 1 }], { ...timing, fill: "forwards" })
      ];
      pageAnimations[0].finished.then(() => { snapshot.remove(); if (pageSnapshot === snapshot) pageSnapshot = null; }).catch(() => {});
    }
  }
  const motionBehavior = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  function bindGallery(id) {
    const gallery = $(".gallery-track", app);
    if (!gallery) return;
    const count = gallery.children.length, key = `${actor}:${id}`;
    const clamp = index => Math.max(0, Math.min(count - 1, index));
    const indexNow = () => clamp(Math.round(gallery.scrollLeft / gallery.clientWidth));
    const showIndex = () => {
      const index = indexNow();
      galleryPositions.set(key, index);
      const counter = $(".gallery-counter", app);
      if (counter) counter.textContent = `${index + 1}/${count}`;
      app.querySelectorAll(".gallery-dots button").forEach((button, i) => {
        button.classList.toggle("active", i === index);
        button.setAttribute("aria-current", String(i === index));
      });
      const prev = $(".gallery-prev", app), next = $(".gallery-next", app);
      if (prev) prev.hidden = index === 0;
      if (next) next.hidden = index === count - 1;
    };
    const settle = index => gallery.scrollTo({ left: clamp(index) * gallery.clientWidth, behavior: motionBehavior() });
    gallery.scrollLeft = clamp(galleryPositions.get(key) || 0) * gallery.clientWidth;
    showIndex();
    gallery.addEventListener("scroll", showIndex, { passive: true });
    gallery.addEventListener("keydown", e => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        settle(e.key === "Home" ? 0 : e.key === "End" ? count - 1 : indexNow() + (e.key === "ArrowLeft" ? -1 : 1));
      }
    });
    if (count < 2) return;
    let drag = null, suppressClickUntil = 0;
    gallery.addEventListener("dragstart", e => e.preventDefault());
    gallery.addEventListener("pointerdown", e => {
      // Touch keeps native momentum and vertical page scrolling.
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: gallery.scrollLeft, index: indexNow(), active: false };
      gallery.setPointerCapture(e.pointerId);
    });
    gallery.addEventListener("pointermove", e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          gallery.releasePointerCapture(drag.id); drag = null; return;
        }
        drag.active = true;
        gallery.classList.add("is-dragging");
      }
      e.preventDefault();
      const scale = gallery.getBoundingClientRect().width / gallery.clientWidth;
      gallery.scrollLeft = drag.left - dx / scale;
    });
    const finish = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const last = drag; drag = null;
      if (gallery.hasPointerCapture(last.id)) gallery.releasePointerCapture(last.id);
      if (!last.active) return;
      suppressClickUntil = performance.now() + 300;
      const delta = gallery.scrollLeft - last.left;
      const target = e.type === "pointercancel" ? indexNow() : Math.abs(delta) > gallery.clientWidth * .15 ? last.index + Math.sign(delta) : last.index;
      gallery.classList.remove("is-dragging");
      settle(target);
    };
    gallery.addEventListener("pointerup", finish);
    gallery.addEventListener("pointercancel", finish);
    gallery.addEventListener("lostpointercapture", finish);
    gallery.addEventListener("click", e => {
      if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
  function updateMarks(id) {
    app.querySelectorAll(`[data-action="like"][data-id="${id}"]`).forEach(b => {
      const template = document.createElement("template");
      const className = [...b.classList].filter(c => !["liked", "is-public-like"].includes(c)).join(" ");
      template.innerHTML = likeButton(id, className, b.classList.contains("feed-like") ? "like-small" : "like", b.classList.contains("icon-button") ? "" : b.closest(".video-side") ? "small" : "span");
      const next = template.content.firstElementChild;
      for (const name of ["class", "aria-pressed", "aria-label", "aria-haspopup"]) b.setAttribute(name, next.getAttribute(name));
      // Keep the focused control, but never change src on its decoded image.
      b.replaceChildren(...next.childNodes);
      if (isLiked(id) && !reducedMotion()) b.querySelector(".icon")?.animate([{ transform: "scale(.85)" }, { transform: "scale(1.13)", offset: .55 }, { transform: "scale(1)" }], { duration: 220, easing: "ease-out" });
    });
    app.querySelectorAll(`[data-action="save-note"][data-id="${id}"]`).forEach(b => {
      const n = note(id), saved = isSaved(id);
      b.classList.toggle("saved", saved); b.setAttribute("aria-pressed", String(saved));
      b.setAttribute("aria-label", saved ? "取消收藏" : "收藏");
      b.innerHTML = `${icon(saved ? "collected" : "collect")}${b.closest(".video-side") ? "<small>收藏</small>" : `<span>${number(saveCount(n))}</span>`}`;
    });
  }
  function showModal(kind, id, content, options = {}) {
    social?.dismissSnack(true);
    clearToast();
    modalAnimations.forEach(a => a.cancel());
    modalAnimations = [];
    overlay.style.pointerEvents = "";
    delete overlay.dataset.closing;
    if (!modal) returnFocus = options.anchor || document.activeElement;
    modal = { kind, id };
    overlay.innerHTML = `<div class="modal-backdrop ${kind === "share" ? "share-backdrop" : kind === "like-menu" ? "like-menu-backdrop" : ""}"><button class="scrim" data-action="close-modal" tabindex="-1" aria-label="关闭弹层"></button>${content}</div>`;
    app.inert = true;
    const dialog = $('[role="dialog"]', overlay), scrim = $(".scrim", overlay), instance = modal;
    const anchored = dialog?.classList.contains("like-popover");
    if (anchored) {
      const bounds = overlay.getBoundingClientRect(), anchor = options.anchor?.getBoundingClientRect();
      const scale = bounds.width / overlay.clientWidth;
      const x = anchor ? (anchor.left + anchor.width / 2 - bounds.left) / scale : overlay.clientWidth / 2;
      const y = anchor ? (anchor.top - bounds.top) / scale : overlay.clientHeight / 2;
      const below = anchor ? (anchor.bottom - bounds.top) / scale + 8 : y;
      const top = y - dialog.offsetHeight - 8;
      dialog.style.left = `${Math.max(12, Math.min(x - dialog.offsetWidth / 2, overlay.clientWidth - dialog.offsetWidth - 12))}px`;
      dialog.style.top = `${Math.max(70, Math.min(top >= 70 ? top : below, overlay.clientHeight - dialog.offsetHeight - 40))}px`;
      dialog.style.transformOrigin = top >= 70 ? "bottom center" : "top center";
    }
    if (dialog && !reducedMotion()) {
      const centered = dialog.classList.contains("send-dialog");
      modalAnimations = [
        dialog.animate([{ transform: anchored ? "scale(.96)" : centered ? "scale(.96)" : "translateY(100%)", opacity: anchored || centered ? 0 : 1 }, { transform: "none", opacity: 1 }], { duration: anchored ? 140 : 240, easing: "cubic-bezier(.22,1,.36,1)" }),
        scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })
      ];
    }
    requestAnimationFrame(() => {
      if (modal === instance && dialog && !dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true });
    });
  }
  function closeModal(immediate = false) {
    // data-action handlers pass a button; only literal true skips the exit.
    immediate = immediate === true;
    if (!modal) {
      if (immediate) { modalAnimations.forEach(a => a.cancel()); overlay.innerHTML = ""; delete overlay.dataset.closing; }
      return;
    }
    const backdrop = overlay.firstElementChild, dialog = $('[role="dialog"]', overlay), scrim = $(".scrim", overlay);
    const startTransform = dialog ? getComputedStyle(dialog).transform : "none";
    modalAnimations.forEach(a => a.cancel());
    modalAnimations = [];
    modal = null; app.inert = false;
    overlay.style.pointerEvents = "none";
    overlay.dataset.closing = "true";
    if (immediate || reducedMotion() || !dialog) { overlay.innerHTML = ""; delete overlay.dataset.closing; }
    else {
      modalAnimations = [
        dialog.animate([{ transform: startTransform, opacity: 1 }, { transform: dialog.matches(".send-dialog,.like-popover") ? "scale(.96)" : "translateY(100%)", opacity: 0 }], { duration: dialog.classList.contains("like-popover") ? 100 : 160, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }),
        scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" })
      ];
      modalAnimations[0].finished.then(() => { backdrop.remove(); if (!modal) delete overlay.dataset.closing; }).catch(() => {});
    }
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
  function shareSheet(id) {
    const friends = accounts.filter(a => a.id !== actor && !a.ai && a.id !== "activity" && knownPeer(a));
    const control = name => `<img class="share-control" src="assets/ios/share-light-${name}.png" alt="" aria-hidden="true" draggable="false">`;
    const tools = [["ask", "问点点", "ask-ai"], ["link", "复制链接", "copy-link"], ["image", "生成分享图", "share-image"], ["quote", "引用发笔记", "client-share-tool"], ["circle", "发到小红圈", "client-share-tool"], ["group", "建群分享", "share-more"], ["download", "保存图片", "download-image"], ["dislike", "不喜欢", "dislike"], ["report", "举报", "report"]];
    showModal("share", id, `<section class="share-sheet recorded-share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-heading" tabindex="-1">
      <header class="recorded-share-header"><h2 id="share-heading">分享至</h2><button data-action="close-modal" aria-label="关闭分享面板">${control("close")}</button></header>
      <div class="share-friends share-rail" tabindex="0" aria-label="选择分享好友">${friends.map(a => `<button data-action="share-friend" data-id="${a.id}" aria-label="分享给${esc(a.name)}">${avatar(a.avatar)}<span>${esc(a.name)}</span></button>`).join("")}</div>
      <div class="share-channels">${[["private", "私信好友", "share-more"], ["wechat", "微信好友", "external-share"], ["moments", "朋友圈", "external-share"]].map(([im, label, action]) => `<button data-action="${action}" data-label="${label}">${control(im)}<small>${label}</small></button>`).join("")}</div>
      ${social.shareControl(id)}
      <div class="share-tools share-rail" tabindex="0" aria-label="更多分享操作">${tools.map(([im, label, action]) => `<button data-action="${action}" data-id="${id}" data-label="${label}">${control(im)}<small>${label}</small></button>`).join("")}</div>
    </section>`);
    overlay.querySelectorAll(".share-rail").forEach(shareRail);
  }
  function shareRail(rail) {
    let drag = null, suppressClickUntil = 0;
    rail.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, left: rail.scrollLeft, moved: false };
    });
    rail.addEventListener("pointermove", e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = (e.clientX - drag.x) / (Number(getComputedStyle($("#device")).zoom) || 1);
      if (Math.abs(dx) > 5 && !drag.moved) {
        drag.moved = true; rail.setPointerCapture(e.pointerId);
      }
      if (drag.moved) { rail.scrollLeft = drag.left - dx; e.preventDefault(); }
    });
    const finish = () => {
      if (!drag) return;
      if (drag.moved) suppressClickUntil = performance.now() + 250;
      const id = drag.id; drag = null;
      if (rail.hasPointerCapture(id)) rail.releasePointerCapture(id);
    };
    rail.addEventListener("pointerup", finish);
    rail.addEventListener("pointercancel", finish);
    rail.addEventListener("lostpointercapture", finish);
    rail.addEventListener("pointerleave", () => { if (!drag?.moved) finish(); });
    rail.addEventListener("click", e => {
      if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    rail.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY; e.preventDefault();
      }
    }, { passive: false });
    rail.addEventListener("keydown", e => {
      if (e.target === rail && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); rail.scrollBy({ left: e.key === "ArrowRight" ? 70 : -70, behavior: motionBehavior() });
      }
    });
  }
  async function shareImage(id) {
    // file:// images taint canvas in Chromium. Use locally generated posters
    // so the user's external-browser preview can export without a server.
    if (location.protocol === "file:") {
      try {
        if (!window.XHS_SHARE_POSTERS?.[id]) await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `assets/share/${encodeURIComponent(id)}.js`;
          script.onload = () => { script.remove(); resolve(); };
          script.onerror = () => { script.remove(); reject(new Error("poster")); };
          document.head.appendChild(script);
        });
        const a = document.createElement("a");
        a.download = `${id}-分享图.png`; a.href = window.XHS_SHARE_POSTERS[id]; a.click();
        closeModal(); toast("分享图已生成");
      } catch (_) { toast("分享图加载失败，请重试"); }
      return;
    }
    const n = note(id), image = new Image();
    image.src = photoURL((n.detailImages || n.images)[0]);
    try {
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 804; canvas.height = 1030;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fffdff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(740 / image.width, 760 / image.height);
      const w = image.width * scale, h = image.height * scale;
      ctx.drawImage(image, (804 - w) / 2, 32 + (760 - h) / 2, w, h);
      ctx.fillStyle = "#363236"; ctx.font = '500 32px -apple-system, "PingFang SC", sans-serif';
      const chars = Array.from(n.title); let line = "", lines = [];
      for (const char of chars) {
        if (ctx.measureText(line + char).width > 740) { lines.push(line); line = char; }
        else line += char;
      }
      if (line) lines.push(line);
      lines.slice(0, 3).forEach((text, i) => ctx.fillText(text, 32, 845 + i * 42));
      ctx.font = '24px -apple-system, "PingFang SC", sans-serif'; ctx.fillStyle = "#969296";
      ctx.fillText(n.author, 32, 990);
      const a = document.createElement("a"); a.download = `${id}-分享图.png`; a.href = canvas.toDataURL("image/png"); a.click();
      closeModal(); toast("分享图已生成");
    } catch (_) { toast("图片暂未加载完成，请重试"); }
  }
  function shareConfirm(peerIds, id) {
    const n = note(id), people = peerIds.map(account);
    showModal("confirm", id, `<section class="send-dialog" role="dialog" aria-modal="true" aria-labelledby="send-heading" tabindex="-1" data-recipients="${peerIds.join(",")}"><h2 id="send-heading">发送给</h2><div class="send-recipients">${people.map(a => `<span>${avatar(a.avatar)}<b>${esc(a.name)}</b></span>`).join("")}</div><div class="send-note">${n.images[0] ? photo(n.images[0]) : icon("pencil")}<span>${esc(n.title)}</span></div><form id="share-form"><label class="sr-only" for="share-message">给好友留言</label><input id="share-message" name="message" placeholder="说点什么吧..." autocomplete="off" spellcheck="false" maxlength="500"><div class="send-actions"><button type="button" data-action="confirm-cancel">取消</button><button type="submit" class="send-primary">发送</button></div></form></section>`);
  }
  function moreFriends(id) {
    shareSelection = new Set();
    showModal("friends", id, `<section class="friends-sheet" role="dialog" aria-modal="true" aria-labelledby="friends-heading" tabindex="-1"><header>${iconButton("back", "share-back", "返回分享面板")}<h2 id="friends-heading">选择好友</h2><span></span></header><div class="friend-search">${icon("search")}<label class="sr-only" for="friend-query">搜索好友</label><input id="friend-query" type="search" placeholder="搜索好友" autocomplete="off" spellcheck="false"></div><p class="friend-section-title">最近聊天</p><div class="friend-picker-list">${accounts.filter(a => a.id !== actor && (!a.authorPeer || a.socialPeer) && knownPeer(a)).map(a => `<label class="friend-picker-row" data-name="${esc(a.name)}"><input type="checkbox" value="${a.id}"><span class="picker-check"></span>${avatar(a.avatar)}<b>${esc(a.name)}</b></label>`).join("")}<p class="friend-no-results" hidden>没有找到该好友</p></div><footer><span id="friend-selection">选择要分享的好友</span><button id="friend-next" data-action="friend-next" disabled>发送</button></footer></section>`);
  }
  function sendMessage(to, type, payload) {
    db.messages.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, from: actor, to, type, ...payload, at: Date.now() });
  }
  function switchActor(id, nextRoute = "messages") {
    if (!accounts.some(a => a.id === id)) return;
    closeModal(); scrollRemember(); actor = id; db.actor = actor; stack = []; route = nextRoute;
    save(); setHash(true); render();
  }
  const actions = {
    home: () => go("feed"),
    messages: () => go("messages"),
    back,
    note: b => go(`${note(b.dataset.id).video ? "video" : "note"}/${b.dataset.id}`),
    author: b => go(`author/${b.dataset.id}`),
    profile: b => go(`profile/${b.dataset.id}`),
    chat: b => { positions.delete(`${actor}:chat/${b.dataset.id}`); go(`chat/${b.dataset.id}`); },
    people: () => go("people"),
    search: () => { searchQuery = ""; searchDraft = ""; searchHistoryExpanded = false; searchKeyboardShift = false; searchKeyboardNumbers = false; positions.delete(`${actor}:search`); go("search"); },
    "search-term": b => submitSearch(b.dataset.value),
    "search-clear-history": () => { db.searchHistory = []; save(); render(); },
    "search-expand-history": () => { searchHistoryExpanded = !searchHistoryExpanded; render(); },
    "search-suggestion-options": () => toast("当前展示的是本地演示推荐内容"),
    "search-camera": () => $("#search-camera-file")?.click(),
    "search-voice": () => { $("#search-query")?.focus({ preventScroll: true }); toast("可使用系统键盘语音输入；问答需在小红书客户端使用"); },
    "search-key": b => searchKey(b.dataset.value),
    channel: b => { scrollRemember(); channel = b.dataset.value; category = "推荐"; positions.delete(`${actor}:feed`); render(); },
    category: b => { category = b.dataset.value; positions.delete(`${actor}:feed`); render(); },
    tag: b => submitSearch(b.dataset.value),
    like: b => { const k = markKey(b.dataset.id); db.likes[k] = !isLiked(b.dataset.id); save(); updateMarks(b.dataset.id); social.onLike(b.dataset.id); },
    "save-note": b => {
      const id = b.dataset.id, k = markKey(id);
      db.saves[k] = !isSaved(id);
      if (!db.saves[k]) for (const album of db.albums[actor] || []) album.ids = album.ids.filter(nid => nid !== id);
      save(); updateMarks(id);
      if (db.saves[k]) social.snack("收藏成功", "加入专辑", "save-album", id);
      else { social.dismissSnack(); toast("已取消收藏"); }
    },
    follow: b => social.toggleFollow(note(b.dataset.id).authorId),
    share: b => shareSheet(b.dataset.id),
    "share-friend": b => shareConfirm([b.dataset.id], modal.id),
    "share-more": () => moreFriends(modal.id),
    "share-back": () => shareSheet(modal.id),
    "close-modal": closeModal,
    "confirm-cancel": () => shareSheet(modal.id),
    "friend-next": () => { if (shareSelection.size) shareConfirm([...shareSelection], modal.id); },
    "copy-link": async () => {
      const url = new URL(location.href); url.hash = `/note/${modal.id}`;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url.href);
        else {
          const text = document.createElement("textarea"); text.value = url.href; overlay.appendChild(text); text.select();
          if (!document.execCommand("copy")) throw new Error("copy"); text.remove();
        }
        closeModal(); toast("笔记链接已复制");
      } catch (_) { toast("浏览器未允许复制，可以复制地址栏链接"); }
    },
    "external-share": b => toast(`${b.dataset.label}需要在客户端打开，此次体验站内分享`),
    "client-share-tool": b => toast(`${b.dataset.label}需要在小红书客户端打开`),
    "share-image": b => shareImage(b.dataset.id),
    dislike: () => { closeModal(); toast("将减少此类内容"); },
    report: () => { closeModal(); toast("举报入口不在本次图文分享体验范围"); },
    "download-image": () => {
      const n = note(modal.id), index = Math.round(($(".gallery-track", app)?.scrollLeft || 0) / ($(".gallery-track", app)?.clientWidth || 1));
      const images = n.detailImages || n.images;
      if (!images.length) { toast("这篇笔记没有可保存的图片"); return; }
      const a = document.createElement("a"); a.href = photoURL(images[index] || images[0]); a.download = `${n.id}-${index + 1}${a.href.endsWith(".png") ? ".png" : ".jpg"}`; a.click(); closeModal(); toast("图片已保存");
    },
    "gallery-next": () => $(".gallery-track", app)?.scrollBy({ left: $(".gallery-track", app).clientWidth, behavior: motionBehavior() }),
    "gallery-prev": () => $(".gallery-track", app)?.scrollBy({ left: -$(".gallery-track", app).clientWidth, behavior: motionBehavior() }),
    "gallery-index": b => { const g = $(".gallery-track", app); g?.scrollTo({ left: g.clientWidth * Number(b.dataset.index), behavior: motionBehavior() }); },
    "comments-scroll": b => {
      const section = $("#note-comments", app), scroller = $(".note-scroll", app);
      if (!section || !scroller) return;
      const commentsTop = section.getBoundingClientRect().top, viewport = scroller.getBoundingClientRect();
      if (commentsTop < viewport.bottom - 1) community.composer(b.dataset.id);
      else scroller.scrollBy({ top: (commentsTop - viewport.top) / (Number(getComputedStyle($("#device")).zoom) || 1), behavior: motionBehavior() });
    },
    comment: b => community.composer(b.dataset.id),
    emoji: () => { const input = $("#chat-text"); input.value += "😊"; input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); },
    "chat-attachments": () => {
      const peer = route.split("/")[1];
      showModal("attachments", peer, `<section class="attachment-sheet" role="dialog" aria-modal="true" aria-labelledby="attachment-heading" tabindex="-1"><h2 id="attachment-heading">分享笔记</h2><div>${notes.slice(0, 4).map(n => `<button data-action="chat-share-note" data-id="${n.id}">${photo(n.images[0])}<span>${esc(n.title)}</span></button>`).join("")}</div><button class="sheet-cancel" data-action="close-modal">取消</button></section>`);
    },
    "chat-share-note": b => shareConfirm([modal.id], b.dataset.id),
    "chat-info": b => {
      const a = account(b.dataset.id);
      showModal("chat-info", a.id, `<section class="info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-heading" tabindex="-1"><h2 id="info-heading">聊天信息</h2><button class="info-person" data-action="profile" data-id="${a.id}">${avatar(a.avatar)}<span>${esc(a.name)}</span>${icon("next")}</button><button class="sheet-cancel" data-action="close-modal">关闭</button></section>`);
    },
    notification: b => go(`notifications/${encodeURIComponent(b.dataset.label)}`),
    scope: b => toast(`${b.dataset.label || "此功能"}不在本次图文分享体验范围`)
  };
  community = window.createXHSCommunity({ esc, photo, photoURL, avatar, icon, iconButton, likeButton, followButton, note, notes, accounts, account, number, bottomNav, go, showModal, closeModal, save, toast, scrollRemember, render, card, genericProfile: profile, db: () => db, actor: () => actor, route: () => route, search: () => actions.search(), social: () => social });
  Object.assign(actions, community.actions);
  supplement = window.createXHSSupplement({ esc, photo, avatar, icon, iconButton, note, notes, accounts, account, number, bottomNav, go, showModal, closeModal, save, toast, scrollRemember, render, conversation, unread, readChat, timeLabel, noteMessage, sendMessage, db: () => db, actor: () => actor, route: () => route, glyph: community.glyph, social: () => social });
  Object.assign(actions, supplement.actions);
  const otherAttachments = actions["chat-attachments"];
  social = window.createXHSSocial({ esc, photo, photoURL, avatar, icon, iconButton, likeButton, note, notes, account, number, go, render, save, toast, showModal, closeModal, scrollRemember, sendMessage, conversation, card, isLiked, likeNote: id => actions.like({ dataset: { id } }), likedNotes: () => community.list("likes"), db: () => db, actor: () => actor, route: () => route, otherAttachments });
  Object.assign(actions, social.actions);
  actions["chat-attachments"] = () => {
    const peer = route.split("/")[1];
    if (social.hasPeer(peer)) social.attachments(peer); else otherAttachments();
  };
  document.addEventListener("click", event => {
    const b = event.target.closest("[data-action]");
    if (b?.closest(".route-snapshot") || b?.closest('#overlay-root[data-closing="true"]')) return;
    if (b && !b.disabled) actions[b.dataset.action]?.(b);
  });
  document.addEventListener("submit", event => {
    if (!["share-form", "chat-form", "comment-form", "search-form", "album-form", "bio-form", "ai-form", "message-search-form", "social-message-form"].includes(event.target.id)) return;
    event.preventDefault();
    const form = event.target, values = new FormData(form);
    if (social.submit(form, values)) return;
    if (supplement.submit(form, values)) return;
    if (community.submit(form, values)) return;
    if (form.id === "share-form") {
      if (form.dataset.sent) return;
      form.dataset.sent = "true"; $("button[type=submit]", form).disabled = true;
      const recipients = $(".send-dialog").dataset.recipients.split(","), id = modal.id, text = values.get("message").trim();
      for (const peer of recipients) {
        sendMessage(peer, "note", { noteId: id });
        if (text) sendMessage(peer, "text", { text });
      }
      lastRecipient = recipients[0]; save(); closeModal();
      toast("发送成功");
      if (route.startsWith("chat/")) render();
    } else if (form.id === "chat-form") {
      const text = values.get("text").trim();
      if (!text) return;
      $("#chat-text", form).value = "";
      chatDrafts.delete(`${actor}:${form.dataset.peer}`);
      sendMessage(form.dataset.peer, "text", { text }); save(); render(); $("#chat-text").focus({ preventScroll: true });
    } else if (form.id === "comment-form") {
      const text = values.get("text").trim();
      if (!text && !form.dataset.image) { $("#comment-text").focus(); return; }
      const id = modal.id;
      community.submitComment(id, form, text);
    } else {
      submitSearch(values.get("query") || searchSuggestions[0]);
    }
  });
  document.addEventListener("input", event => {
    if (event.target.id === "search-query") {
      searchDraft = event.target.value;
      if (searchQuery && !searchDraft.trim()) { searchQuery = ""; render(); }
    }
    if (event.target.id === "chat-text") {
      rememberChatDraft();
      const populated = Boolean(event.target.value.trim());
      $(".chat-send").hidden = !populated; $(".chat-plus").hidden = populated;
    }
    if (event.target.id === "friend-query") {
      let count = 0;
      overlay.querySelectorAll(".friend-picker-row").forEach(row => { row.hidden = !row.dataset.name.includes(event.target.value.trim()); if (!row.hidden) count++; });
      $(".friend-no-results").hidden = count > 0;
    }
  });
  document.addEventListener("change", event => {
    if (event.target.id === "search-camera-file" && event.target.files?.length) toast("图片已选择，图片搜索需在小红书客户端使用");
    if (event.target.matches(".friend-picker-row input")) {
      if (event.target.checked) shareSelection.add(event.target.value); else shareSelection.delete(event.target.value);
      $("#friend-next").disabled = !shareSelection.size;
      $("#friend-next").textContent = shareSelection.size ? `发送 (${shareSelection.size})` : "发送";
      $("#friend-selection").textContent = shareSelection.size ? `已选择 ${shareSelection.size} 位好友` : "选择要分享的好友";
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); if (modal) closeModal(); else if (route !== "feed") back(); }
    if (modal && event.key === "Tab") {
      const nodes = [...overlay.querySelectorAll('button:not([disabled]), input, textarea, [tabindex="0"]')].filter(n => n.tabIndex >= 0 && n.getClientRects().length);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes.at(-1), focused = document.activeElement;
      if (event.shiftKey && (focused === first || !nodes.includes(focused))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (focused === last || !nodes.includes(focused))) { event.preventDefault(); first.focus(); }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && $("#comment-text") === event.target) $("#comment-form").requestSubmit();
  });
  // Preserve the caret while interacting with the desktop screenshot keyboard.
  document.addEventListener("pointerdown", event => {
    if (event.target.closest(".search-keyboard button")) event.preventDefault();
  });
  window.addEventListener("popstate", () => {
    clearToast(); social?.dismissSnack(true); closeModal(true); scrollRemember(); route = location.hash.slice(2) || "feed"; if (stack.at(-1) === route) stack.pop(); render(-1);
  });
  window.addEventListener("hashchange", () => {
    const next = location.hash.slice(2) || "feed";
    if (next !== route) { clearToast(); social?.dismissSnack(true); closeModal(true); scrollRemember(); route = next; render(); }
  });
  function fit() {
    const viewportWidth = document.documentElement.clientWidth;
    const mobile = viewportWidth <= 520;
    const availableScale = Math.max(.35, Math.min(1, (innerHeight - 48) / DEVICE_HEIGHT, (viewportWidth - 60) / DEVICE_WIDTH));
    // Chromium rounds native scroll offsets to CSS pixels. An integral displayed
    // width keeps adjacent full-width photos aligned at every preview scale.
    const scale = mobile ? viewportWidth / DEVICE_WIDTH : Math.floor(availableScale * DEVICE_WIDTH) / DEVICE_WIDTH;
    document.documentElement.style.setProperty("--device-scale", String(scale));
    $("#device-holder").style.width = `${DEVICE_WIDTH * scale}px`;
    $("#device-holder").style.height = `${DEVICE_HEIGHT * scale}px`;
    if (mobile) document.documentElement.style.setProperty("--mobile-device-height", `${innerHeight / scale}px`);
    const keyboardInset = mobile && window.visualViewport ? Math.max(0, innerHeight - window.visualViewport.height - window.visualViewport.offsetTop) / scale : 0;
    document.documentElement.style.setProperty("--search-keyboard-inset", `${keyboardInset}px`);
  }
  window.addEventListener("resize", fit);
  window.visualViewport?.addEventListener("resize", fit);
  fit(); save(); setHash(true); render();
  requestAnimationFrame(fit);
})();
