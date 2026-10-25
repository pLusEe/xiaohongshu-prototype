/* Interactive reconstruction of the states visible in the user's recording. */
window.createXHSCommunity = env => {
  const { esc, photo, avatar, icon, iconButton, note, accounts, notes, account, number, bottomNav, go, showModal, closeModal, save, toast, scrollRemember, render } = env;
  const d = window.XHS_DATA, p = d.myProfile;
  const db = () => env.db(), actor = () => env.actor(), route = () => env.route();
  const key = id => `${actor()}:${id}`;
  const own = () => actor() === "lin";
  const glyph = name => {
    const controls = { menu: "menu", scan: "scan", voice: "chat-voice", smile: "chat-smile", plus: "chat-plus", settings: "chat-settings", "comment-heart": "comment-heart", minus: "comment-minus", mic: "comment-mic", image: "comment-image", sort: "comment-sort", "message-search": "message-search", "message-plus": "message-plus", camera: "ai-camera", copy: "ai-copy", feedback: "ai-dislike", retry: "ai-retry", mute: "mute" };
    if (controls[name]) return `<img class="ui-glyph recorded-glyph control-${name}" src="assets/ios/control-${controls[name]}.png" alt="" aria-hidden="true">`;
    if (["menu","scan","lock","mic","image","minus","good","download","report","clock","people"].includes(name)) return `<img class="ui-glyph recorded-glyph" src="assets/ios/glyph-${name}.png" alt="" aria-hidden="true">`;
    const shapes = {
      lock: '<rect x="6" y="10" width="12" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
      mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
      smile: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 15q4 4 8 0"/>',
      minus: '<circle cx="12" cy="12" r="9"/><path d="M8 9h2M14 9h2M8 16h8"/>',
      menu: '<path d="M4 5h16M4 12h16M4 19h16"/>',
      scan: '<path d="M8 3H4v5M16 3h4v5M20 16v5h-4M8 21H4v-5M3 12h18"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
      people: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M19 15a5 5 0 0 1 3 5"/>',
      arrow: '<path d="m9 5 7 7-7 7"/>',
      download: '<path d="M12 2v12m-5-5 5 5 5-5M3 14v6h18v-6"/>',
      good: '<path d="m7 3 4 2 3-3 3 4 5 1-1 5 2 4-5 2-1 4-5-1-4 2-2-5-4-2 2-5-1-4 4-1Z"/>',
      speed: '<circle cx="12" cy="12" r="9"/><path d="m12 12 6-7"/>',
      play: '<path d="m8 4 12 8-12 8Z"/>',
      plus: '<circle cx="12" cy="12" r="9"/><path d="M6 12h12M12 6v12"/>',
      eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="M3 21 21 3"/>'
    };
    return `<svg class="ui-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
  };
  const init = () => {
    for (const field of ["commentLikes", "publicComments", "expanded", "recommendations", "albums", "viewed"]) db()[field] ||= {};
    Object.entries(db().comments).forEach(([nid, rows]) => rows.forEach((r, i) => {
      r.id ||= `local-${nid}-${i}`; r.actor ||= accounts.find(a => a.avatar === r.avatar)?.id || "lin";
      r.date ||= "刚刚"; r.public ??= false;
    }));
  };
  const seeded = (field, id, seeds) => Object.hasOwn(db()[field], key(id)) ? Boolean(db()[field][key(id)]) : own() && seeds.includes(id);
  const liked = id => seeded("likes", id, p.likedIds);
  const saved = id => seeded("saves", id, p.savedIds);
  const list = field => {
    const seeds = own() ? p[field === "likes" ? "likedIds" : "savedIds"] : [];
    const added = notes.filter(n => db()[field][key(n.id)] && !seeds.includes(n.id)).map(n => n.id).reverse();
    return [...added, ...seeds.filter(id => field === "likes" ? liked(id) : saved(id))].map(note);
  };
  const allComments = nid => [...(note(nid).replies || []), ...(db().comments[nid] || [])];
  function findComment(nid, cid) {
    const find = rows => { for (const r of rows) { if (r.id === cid) return r; const c = find(r.children || []); if (c) return c; } };
    return find(allComments(nid));
  }
  const commentLiked = r => Object.hasOwn(db().commentLikes, key(r.id)) ? db().commentLikes[key(r.id)] : own() && Boolean(r.seedLiked);
  const commentCount = r => (r.likes || 0) + (commentLiked(r) ? 1 : 0) - (own() && r.seedLiked ? 1 : 0);
  const commentText = r => r.emojiImage ? `${esc(r.plainText)}${photo(r.emojiImage,"inline-comment-emoji",r.text)}` : esc(r.text);
  function likeCommentButton(r, nid) {
    return `<button class="comment-like ${commentLiked(r) ? "liked" : ""}" data-action="comment-like" data-note="${nid}" data-id="${r.id}" aria-label="${commentLiked(r) ? "取消评论点赞" : "点赞评论"}" aria-pressed="${Boolean(commentLiked(r))}">${commentLiked(r) ? icon("liked") : glyph("comment-heart")}<small>${commentCount(r) ? number(commentCount(r)) : ""}</small></button>`;
  }
  function commentRow(r, nid, child = false) {
    const localChildren = (db().comments[nid] || []).filter(c => c.replyTo === r.id);
    const children = [...(r.children || []), ...localChildren];
    const canExpand = children.length > 2;
    const expanded = canExpand && db().expanded[key(r.id)] === true;
    const visibleChildren = expanded ? children : children.slice(0, 2);
    return `<article class="comment-row ${child ? "nested-comment" : ""}" data-comment-id="${esc(r.id)}">
      ${avatar(r.avatar)}<div class="comment-main"><span class="comment-name">${esc(r.name)}${r.author ? '<b class="author-label">作者</b>' : ""}</span>
      <button class="comment-text" data-action="reply-comment" data-note="${nid}" data-id="${r.id}">${commentText(r)}</button>
      ${r.image ? `<button class="comment-image" data-action="view-comment-image" data-note="${nid}" data-id="${r.id}">${photo(r.image, "", "评论图片")}</button>` : ""}
      <div class="comment-metadata"><span>${esc(r.date || "刚刚")}</span><button data-action="reply-comment" data-note="${nid}" data-id="${r.id}">回复</button>${r.authorLiked ? '<span class="author-liked">作者赞过</span>' : ""}${likeCommentButton(r, nid)}<button class="comment-dislike" data-action="comment-dislike" data-note="${nid}" data-id="${r.id}" aria-label="不喜欢这条评论">${glyph("minus")}</button></div>
      ${visibleChildren.map(c => commentRow(c, nid, true)).join("")}${canExpand ? `<button class="expand-replies ${expanded ? "is-expanded" : ""}" data-action="expand-replies" data-id="${r.id}" aria-expanded="${expanded}">${expanded ? "收起回复" : `展开 ${children.length - 2} 条回复`} ${expanded ? "⌃" : "⌄"}</button>` : ""}
      ${r.moreReplies ? `<button class="expand-replies" data-action="recorded-reply-limit" data-id="${r.id}">展开 ${r.moreReplies} 条回复 ⌄</button>` : ""}</div></article>`;
  }
  function comments(nid) {
    const n = note(nid), count = n.comments + (db().comments[nid] || []).length;
    return `<section class="note-comments" id="note-comments"><h2>共 ${number(count)} 条评论 ${glyph("sort")}</h2><button class="comment-invite" data-action="comment" data-id="${nid}">${avatar(account(actor()).avatar)}<span>让大家听到你的声音 ${glyph("mic")}${glyph("image")}</span></button>${allComments(nid).filter(r => !r.replyTo).map(r => commentRow(r, nid)).join("")}${n.id === "kai" ? `<button class="folded-comments" data-action="folded-comments">${glyph("eye")}查看被折叠的评论</button>` : ""}${!allComments(nid).length ? '<p class="comments-end">还没有评论，来说两句吧</p>' : !["kai","crab"].includes(nid) ? '<p class="comments-end">- 到底了 -</p>' : ""}</section>`;
  }
  function masonry(pool) {
    return `<div class="masonry"><div class="feed-column">${pool.filter((_, i) => i % 2 === 0).map((n, i) => env.card(n, i < 2)).join("")}</div><div class="feed-column">${pool.filter((_, i) => i % 2).map((n, i) => env.card(n, i < 2)).join("")}</div></div>`;
  }
  function ownRecords() {
    const recorded = own() ? p.ownComments.map(r => ({ ...r, public: Boolean(db().publicComments[key(r.id)]) })) : [];
    return [...Object.entries(db().comments).flatMap(([nid, rows]) => rows.filter(r => r.actor === actor()).map(r => ({ ...r, noteId: nid, sourceTitle: note(nid).title, public: Boolean(db().publicComments[key(r.id)]) }))).reverse(), ...recorded];
  }
  function profileComment(r, mine = false, nid = r.noteId) {
    const missing = !nid;
    return `<article class="profile-comment">${avatar(r.avatar)}<div><span class="comment-name">${esc(r.name)}</span><button class="profile-comment-open" data-action="${missing ? "unrecorded-source" : "open-comment"}" data-note="${nid || ""}" data-id="${r.id}">${commentText(r)}</button>${r.quote ? `<p class="comment-quote">${esc(r.quote)}</p>` : ""}${r.image ? `<button class="profile-comment-image" data-action="open-comment" data-note="${nid}" data-id="${r.id}">${photo(r.image)}</button>` : ""}<div class="profile-comment-source"><button data-action="${missing ? "unrecorded-source" : "open-comment"}" data-note="${nid || ""}" data-id="${r.id}">来自笔记 · ${esc(r.sourceTitle || note(nid).title)}</button>${!mine ? likeCommentButton(r, nid) : ""}</div>${mine ? `<div class="own-comment-footer"><span>${esc(r.date)}</span><button data-action="public-comment" data-id="${r.id}">${r.public ? "设为私密" : "设为公开"}</button>${likeCommentButton(r, nid)}</div>` : ""}</div></article>`;
  }
  function profileContent(tab, sub) {
    if (tab === "comments") {
      const rows = ownRecords().filter(r => sub !== "public" || r.public);
      return rows.length ? `<div class="profile-comment-list">${rows.map(r => profileComment(r, true)).join("")}</div>` : '<p class="profile-empty">还没有公开的评论</p>';
    }
    if (tab === "liked" && sub === "comments") {
      const seeds = own() ? p.likedComments : [];
      const selected = [...seeds, ...Object.entries(db().commentLikes).filter(([k, v]) => k.startsWith(`${actor()}:`) && v).flatMap(([k]) => {
        const cid = k.slice(actor().length + 1); return notes.flatMap(n => findComment(n.id, cid) ? [{ noteId: n.id, commentId: cid }] : []);
      })].filter((v, i, arr) => arr.findIndex(x => x.commentId === v.commentId) === i);
      const rows = selected.map(x => ({ ...findComment(x.noteId, x.commentId), noteId: x.noteId })).filter(r => r.id && commentLiked(r));
      return rows.length ? `<div class="profile-comment-list liked-comment-list">${rows.map(r => profileComment(r)).join("")}</div>` : '<p class="profile-empty">还没有赞过的评论</p>';
    }
    if (tab === "saved" && sub === "albums") {
      const albums = db().albums[actor()] || [];
      return `<button class="create-album-row" data-action="create-album">${photo("ios:album-create")}<span>创建新专辑</span>${glyph("arrow")}</button>${albums.map((a, i) => `<button class="local-album" data-action="open-album" data-id="${i}"><span class="album-cover">${a.ids.length ? photo(note(a.ids[0]).images[0]) : glyph("plus")}</span><span>${esc(a.name)}<small>${a.ids.length} 篇笔记</small></span>${glyph("arrow")}</button>`).join("")}`;
    }
    if (tab === "saved" && sub === "topics") return `<div class="saved-topics">${d.topics.map(t => `<button class="info-row" data-action="tag" data-value="${esc(t)}"># ${esc(t)}</button>`).join("")}</div>`;
    if (tab === "saved" && sub === "music") return `<button class="saved-music" data-action="open-music">${photo("ios:music-cover")}<div><b>老虎上树唱片店的原声</b><small>03:17 · 中国</small></div></button>`;
    if (tab === "liked") return env.social() ? env.social().ownLikes() : masonry(list("likes"));
    if (tab === "saved") return masonry(list("saves"));
    return `<button class="private-notes" data-action="private-notes"><span>${avatar("youth:zine")}${glyph("lock")} 私密笔记</span><small>4 ${glyph("arrow")}</small></button>${!db().hideInspiration ? `<div class="inspiration">${photo("youth:skate")}<div><b>分享你有车之后的生活</b><small>快发篇笔记来记录</small></div><button data-action="more-inspiration">更多灵感</button><button class="red" data-action="share-inspiration">去发布</button><button class="dismiss" data-action="hide-inspiration" aria-label="关闭灵感">×</button></div>` : ""}${masonry(own() ? p.noteIds.map(note) : notes.filter(n => n.author === account(actor()).name))}`;
  }
  function profile(tab = "notes", sub) {
    const tabNames = [["notes", "笔记"], ["comments", "评论"], ["saved", "收藏"], ["liked", "赞过"]];
    if (!tabNames.some(([id]) => id === tab)) tab = "notes";
    sub ||= tab === "comments" ? "all" : "notes";
    const subNames = tab === "comments" ? [["all", `全部 ${p.counts.allComments + ownRecords().filter(r => r.noteId).length}`], ["public", `公开 ${ownRecords().filter(r => r.public).length}`]] : tab === "saved" ? [["notes", `笔记 ${p.counts.savedNotes + list("saves").length - p.savedIds.length}`], ["albums", `专辑 ${p.counts.albums + (db().albums[actor()] || []).length}`], ["topics", "话题 13"], ["music", "音乐 1"]] : tab === "liked" ? [["notes", `笔记 ${list("likes").length}`], ["comments", `评论 ${p.counts.likedComments + Object.entries(db().commentLikes).filter(([k,v]) => k.startsWith(`${actor()}:`) && v && !p.likedComments.some(c => k === key(c.commentId))).length}`]] : [];
    const me = account(actor());
    return `<div class="page recorded-profile" data-profile-tab="${tab}" data-profile-sub="${sub}"><div class="page-scroll recorded-profile-scroll"><div class="my-profile-hero"><header class="my-profile-toolbar"><button data-action="profile-menu" aria-label="个人菜单">${glyph("menu")}</button><div><button class="edit-profile" data-action="edit-profile">${icon("pencil")}编辑主页</button><button data-action="profile-scan" aria-label="扫一扫">${glyph("scan")}</button>${iconButton("share", "profile-share", "分享主页")}</div></header><div class="my-profile-person">${avatar(me.avatar)}<div><h1>${esc(me.name)} <small>⌄</small></h1><p>小红书号：${own() ? p.id : "本地演示账号"} ▦</p><p>IP：${own() ? p.location : "浙江"}</p></div></div><div class="my-profile-stats"><button data-action="following-list"><b>${(own() ? p.following : 128) + (env.social()?.followingIds().length || 0)}</b> 关注</button><button data-action="followers-list"><b>${own() ? p.followers : 256}</b> 粉丝</button><button data-action="received-stats"><b>${own() ? p.received : 1200}</b> 获赞与收藏</button></div><p class="my-profile-bio">${esc(db().profileBio?.[actor()] || me.bio)}</p><div class="profile-badges"><span>♂</span><span>生产工人</span><span>裁判</span></div><div class="profile-tools"><button data-action="personal-sale">${glyph("people")}个人售卖<small>出闲置搞副业</small></button><button data-action="browse-history">${glyph("clock")}浏览记录<small>看过的笔记</small></button><button data-action="profile-groups">${glyph("people")}群聊<small>查看详情</small></button></div></div><div class="profile-tab-header"><div class="recorded-profile-tabs" role="tablist" aria-label="个人主页">${tabNames.map(([id, name]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? "selected" : ""}" data-action="profile-tab" data-tab="${id}">${["comments", "saved"].includes(id) ? glyph("lock") : ""}${name}</button>`).join("")}${iconButton("search", "profile-search", "搜索个人笔记")}</div>${subNames.length ? `<div class="profile-subtabs" role="tablist">${subNames.map(([id, name]) => `<button role="tab" aria-selected="${sub === id}" class="${sub === id ? "selected" : ""}" data-action="profile-subtab" data-tab="${tab}" data-sub="${id}">${name}</button>`).join("")}</div>` : ""}</div><div class="recorded-profile-content ${tab}-${sub}">${profileContent(tab, sub)}</div></div>${bottomNav("profile")}</div>`;
  }
  function info(title, html) {
    showModal("community-info", "", `<section class="community-info" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1"><header><h2>${esc(title)}</h2><button data-action="close-modal" aria-label="关闭">×</button></header>${html}</section>`);
  }
  function composer(nid, replyTo) {
    const r = replyTo ? findComment(nid, replyTo) : null;
    showModal("comment", nid, `<section class="recorded-composer" role="dialog" aria-modal="true" aria-label="${r ? `回复${esc(r.name)}` : "发表评论"}" tabindex="-1"><form id="comment-form" data-reply="${esc(replyTo || "")}"><label class="sr-only" for="comment-text">评论内容</label><textarea id="comment-text" name="text" rows="2" maxlength="500" placeholder="${r ? `回复 ${esc(r.name)}：` : "说点什么，万一火了呢"}"></textarea><div class="recorded-composer-controls"><button type="button" data-action="composer-voice" aria-label="语音输入">${glyph("mic")}</button><label class="comment-file-control" aria-label="添加图片">${glyph("image")}<input type="file" accept="image/*" id="comment-image-file" hidden></label><button type="button" data-action="composer-at" aria-label="提及用户">@</button><button type="button" data-action="composer-emoji" aria-label="添加表情">${glyph("smile")}</button><button type="button" data-action="composer-more" aria-label="更多输入">${glyph("plus")}</button><button type="submit">发送</button></div><div class="comment-emoji-strip">${["😊","🥰","😋","🤔","🙂","😭","😘","😂"].map(e => `<button type="button" data-action="composer-emoji" data-emoji="${e}">${e}</button>`).join("")}</div><div id="comment-image-preview"></div></form></section>`);
    document.querySelector("#comment-text").focus({ preventScroll: true });
  }
  function notifications(kind) {
    const events = actor() === "lin" ? d.notifications.filter(x => x.kind === kind) : [];
    const local = Object.entries(db().comments).flatMap(([nid, rows]) => rows.filter(c => c.actor !== actor() && notes.find(n => n.id === nid)?.author === account(actor()).name).map(c => ({ id:c.id, from:c.actor, kind:"评论和@", noteId:nid, commentId:c.id, text:c.text, date:"刚刚" }))).filter(x => x.kind === kind);
    if(kind==="赞和收藏") for(const field of ["likes","saves"]) for(const [k,v] of Object.entries(db()[field])) {
      const separator=k.indexOf(":"),from=k.slice(0,separator),nid=k.slice(separator+1),n=notes.find(n=>n.id===nid);
      if(v&&from!==actor()&&n?.author===account(actor()).name) local.push({id:k,from,noteId:nid,text:field==="likes"?"赞了你的笔记":"收藏了你的笔记",date:"本地互动"});
    }
    return `<div class="page"><header class="simple-header">${iconButton("back", "back", "返回")}<h1>${esc(kind)}</h1><span></span></header><div class="page-scroll notifications-content">${kind === "新增关注" ? accounts.filter(a => a.id !== actor()).map(a => `<div class="notification-event">${avatar(a.avatar)}<div><b>${esc(a.name)}</b><p>本地演示好友</p></div><button data-action="profile" data-id="${a.id}">查看</button></div>`).join("") : [...local, ...events].map(x => `<button class="notification-event" data-action="${x.commentId ? "open-comment" : "note"}" data-note="${x.noteId}" data-id="${x.commentId || x.noteId}">${avatar(account(x.from).avatar)}<div><b>${esc(account(x.from).name)}</b><p>${esc(x.text)}</p><small>${esc(x.date)}</small></div>${photo(note(x.noteId).images[0] || "ios:super-cover")}</button>`).join("") || '<p class="profile-empty">暂无新的互动</p>'}<p class="local-events-caption">此页互动为本地演示记录，录屏未展示消息通知原屏。</p></div></div>`;
  }
  const recommendation = nid => Object.hasOwn(db().recommendations, key(nid)) ? db().recommendations[key(nid)] : false;
  function video(nid) {
    const n = note(nid);
    const poster = env.photoURL(n.cover || n.images[0]);
    return `<div class="page recorded-video" data-note-id="${nid}"><video class="video-media" src="${esc(n.videoSrc || "assets/youth/skate-loop.mp4")}" poster="${esc(poster)}" muted playsinline loop autoplay aria-label="${esc(n.title)}"></video><header class="video-toolbar">${iconButton("back", "back", "返回")}<button data-action="video-menu" data-id="${nid}" aria-label="播放设置">${glyph("scan")}</button><span></span>${iconButton("search", "search", "搜索")}${iconButton("share", "share", "分享视频", `data-id="${nid}"`)}</header><div class="video-side">${avatar(n.avatar)}${env.followButton(nid, "", true)}${env.likeButton(nid, "", "like", "small")}<button data-action="video-comments" data-id="${nid}">${icon("comment")}<small>${n.comments + (db().comments[nid] || []).length}</small></button><button class="${saved(nid) ? "saved" : ""}" data-action="save-note" data-id="${nid}" aria-label="${saved(nid) ? "取消收藏" : "收藏"}" aria-pressed="${saved(nid)}">${icon(saved(nid) ? "collected" : "collect")}<small>收藏</small></button><button data-action="participants" data-id="${nid}">${glyph("good")}<small>${recommendation(nid) ? "5" : "4"}人觉得好</small></button></div><div class="video-copy"><button data-action="author" data-id="${nid}">@${esc(n.author)}</button><p>${esc(n.title)}</p><button data-action="video-menu" data-id="${nid}">长按视频进入播放设置</button></div><footer class="video-footer"><button data-action="comment" data-id="${nid}">说点什么...</button><button data-action="video-menu" data-id="${nid}">•••</button></footer></div>`;
  }
  function videoMenu(nid) {
    showModal("video-menu", nid, `<section class="video-menu-sheet" role="dialog" aria-modal="true" aria-label="播放设置" tabindex="-1"><div class="sheet-handle"></div><div class="video-menu-actions">${[["download","保存","video-save"],["good","觉得好","recommend"],["minus","不喜欢","dislike"],["report","举报","report"]].map(([g, label, action]) => `<button data-action="${action}" data-id="${nid}" class="${action === "recommend" && recommendation(nid) ? "liked" : ""}">${glyph(g)}<span>${action === "recommend" && recommendation(nid) ? "撤销觉得好" : label}</span></button>`).join("")}</div><div class="video-menu-list"><div class="playback-speeds">${glyph("speed")}<span>倍速</span>${[.75,1,1.25,1.5,2,3].map(speed => `<button data-action="video-speed" data-value="${speed}" class="${(db().videoSpeed || 1) === speed ? "liked" : ""}">${speed === 1 ? "1.0" : speed}</button>`).join("")}</div><button data-action="video-clean">${glyph("scan")}清屏播放</button><button data-action="video-auto">${glyph("play")}自动连播<span class="video-switch ${db().videoAuto ? "enabled" : ""}"></span></button><button disabled class="unavailable">${glyph("image")}字幕<small>无自动生成字幕 ›</small></button><button data-action="video-cast">${glyph("image")}投屏 <small>›</small></button><button data-action="open-music">${glyph("image")}使用原声 <small>›</small></button><button data-action="video-settings">${glyph("scan")}更多播放设置 <small>›</small></button></div></section>`);
  }
  function participants(nid) {
    const included = recommendation(nid), rows = [{name:"fufu💙",avatar:"ios:participant-fufu",followers:1991}, {name:"肖十亿郎",avatar:"ios:participant-xiao",followers:473}, {name:"🍊",avatar:"ios:participant-orange",followers:189}, {name:"阿白",avatar:"ios:participant-abai",followers:18}];
    showModal("participants", nid, `<section class="participants-sheet" role="dialog" aria-modal="true" aria-label="觉得好的人" tabindex="-1"><header><h2>${included ? 5 : 4} 人觉得好</h2><button data-action="close-modal" aria-label="关闭">×</button></header>${included ? `<div class="participant-row">${avatar(account(actor()).avatar)}<div><b>${esc(account(actor()).name)}</b></div><button class="undo-recommend" data-action="recommend" data-id="${nid}">撤销</button></div>` : ""}${rows.map((r,i) => `<button class="participant-row" data-action="participant-profile" data-id="${i}">${avatar(r.avatar)}<div><b>${esc(r.name)}</b><small>粉丝 · ${r.followers}</small></div></button>`).join("")}</section>`);
  }
  function author(nid) {
    const n = note(nid);
    if (n.id !== "night") return env.genericProfile(nid, true);
    return `<div class="page recorded-author"><div class="page-scroll"><div class="author-hero"><header>${iconButton("back","back","返回")}<button data-action="profile-share" aria-label="分享主页">•••</button></header><div class="author-person">${avatar(n.avatar)}<div><h1>天目里展演小助手</h1><p>🔵 杭州目里娱乐管理有限公司</p><p>小红书号：24118881</p></div></div><div class="author-stats"><b>211</b> 关注　 <b>3709</b> 粉丝　 <b>9062</b> 获赞与收藏</div><p class="author-bio">天目里演出指南｜戏剧 · 音乐 · 喜剧 · 舞蹈 · 展览<br>@天目里 · 候场<br>@天目里情报官里里</p><div class="author-tools"><button data-action="author-tickets">点这里买票<small>票务店铺</small></button><button data-action="profile-groups">群聊<small>查看详情</small></button><button data-action="author-store">线下门店<small>查看详情</small></button></div><div class="author-actions"><button class="${db().following[key(nid)] ? "is-following" : ""}" data-action="follow" data-id="${nid}">${db().following[key(nid)] ? "已关注" : "关注"}</button><button data-action="author-message" data-id="${nid}">发私信</button></div></div><div class="author-tabs"><button class="selected" data-action="author-notes">笔记</button><button data-action="author-store">店铺</button><button data-action="author-saves">收藏</button>${iconButton("search","author-search","搜索作者笔记")}</div><div class="author-collections"><button data-action="collection-notes">请坐｜演出</button><button data-action="collection-notes">请加入｜工作坊</button><button data-action="collection-notes">请别见外｜展览巡游</button></div>${masonry([note("author-drama"),note("author-talk"),n])}</div></div>`;
  }
  function jumpComment(nid, cid) {
    const pathTo = (rows, parents = []) => {
      for (const row of rows) {
        if (row.id === cid) return row.replyTo ? [...parents, row.replyTo] : parents;
        const path = pathTo(row.children || [], [...parents, row.id]);
        if (path) return path;
      }
      return null;
    };
    const parents = pathTo(allComments(nid)) || [];
    if (parents.length) {
      parents.forEach(id => { db().expanded[key(id)] = true; });
      save();
    }
    const target = `note/${nid}`;
    if (route() !== target) go(target); else render();
    requestAnimationFrame(() => {
      const row = [...document.querySelectorAll("[data-comment-id]")].find(e => e.dataset.commentId === cid);
      row?.scrollIntoView({ block: "center" });
      row?.classList.add("target-comment");
      if (row) setTimeout(() => row.classList.remove("target-comment"), 1600);
    });
  }
  function listInfo(title, pool) { info(title, `<div class="community-note-list">${pool.map(n => `<button data-action="note" data-id="${n.id}">${photo(n.images[0] || "ios:super-cover")}<span>${esc(n.title || "笔记")}</span></button>`).join("") || '<p>暂无本地记录</p>'}</div>`); }
  function createAlbum(nid = "") {
    info("创建新专辑", `<form id="album-form" data-saved-note="${esc(nid)}"><label for="album-name">专辑名称</label><input id="album-name" name="name" maxlength="30" placeholder="为收藏取个名字" required><div class="album-note-picker">${list("saves").map(n => `<label><input type="checkbox" name="note" value="${n.id}" ${n.id === nid ? "checked" : ""}>${photo(n.cover || n.images[0])}<span>${esc(n.title || "生活片刻")}</span></label>`).join("")}</div><button class="form-primary" type="submit">创建</button></form>`);
    document.querySelector("#album-name").focus({ preventScroll: true });
  }
  function chooseAlbum(nid) {
    env.social()?.dismissSnack(true);
    if (!saved(nid)) { toast("这篇笔记已取消收藏"); return; }
    const albums = db().albums[actor()] || [];
    info("加入专辑", `<div class="save-album-picker"><button class="create-album-row" data-action="save-create-album" data-id="${nid}">${photo("ios:album-create")}<span>创建新专辑</span>${glyph("arrow")}</button>${albums.map((a, i) => `<button class="local-album" data-action="save-add-album" data-id="${nid}" data-album="${i}"><span class="album-cover">${a.ids.length ? photo(note(a.ids[0]).cover || note(a.ids[0]).images[0]) : glyph("plus")}</span><span>${esc(a.name)}<small>${a.ids.length} 篇笔记${a.ids.includes(nid) ? " · 已加入" : ""}</small></span>${glyph("arrow")}</button>`).join("")}</div>`);
  }
  const actions = {
    "profile-tab": b => go(`profile/${actor()}/${b.dataset.tab}`, true, { preserveScroll: true, animate: false }),
    "profile-subtab": b => go(`profile/${actor()}/${b.dataset.tab}/${b.dataset.sub}`, true, { preserveScroll: true, animate: false }),
    "open-comment": b => jumpComment(b.dataset.note, b.dataset.id),
    "comment-like": b => {
      const r = findComment(b.dataset.note, b.dataset.id) || ownRecords().find(r => r.id === b.dataset.id);
      if (!r) return;
      db().commentLikes[key(r.id)] = !commentLiked(r); save(); scrollRemember(); render();
    },
    "reply-comment": b => composer(b.dataset.note, b.dataset.id),
    "expand-replies": b => { db().expanded[key(b.dataset.id)] = !db().expanded[key(b.dataset.id)]; save(); scrollRemember(); render(); },
    "public-comment": b => { db().publicComments[key(b.dataset.id)] = !db().publicComments[key(b.dataset.id)]; save(); scrollRemember(); render(); },
    "view-comment-image": b => { const r = findComment(b.dataset.note,b.dataset.id); info("评论图片", photo(r.image,"full-comment-image")); },
    "unrecorded-source": () => info("原笔记未采集", "<p>录屏展示了这条评论记录，未打开它的原笔记；保留原文与记录。</p>"),
    "recorded-reply-limit": () => info("回复内容", "<p>录屏只展开了可见的回复，其余回复正文未采集。</p>"),
    "folded-comments": () => info("被折叠的评论", "<p>录屏未打开折叠列表，暂无可复原正文。</p>"),
    "comment-dislike": b => { db().commentDislikes ||= {}; db().commentDislikes[key(b.dataset.id)] = !db().commentDislikes[key(b.dataset.id)]; save(); b.classList.toggle("liked",db().commentDislikes[key(b.dataset.id)]); },
    "create-album": () => createAlbum(),
    "save-album": b => chooseAlbum(b.dataset.id),
    "save-create-album": b => createAlbum(b.dataset.id),
    "save-add-album": b => {
      const nid = b.dataset.id, album = db().albums[actor()]?.[b.dataset.album];
      if (!album || !saved(nid)) return;
      if (!album.ids.includes(nid)) album.ids.push(nid);
      save(); closeModal();
      env.social().snack("已加入专辑", "查看专辑", "open-album", b.dataset.album);
    },
    "open-album": b => { const album = db().albums[actor()][b.dataset.id]; listInfo(album.name,album.ids.map(note)); },
    "open-music": () => { const videoContext=route().startsWith("video/"), n=videoContext?note(route().split("/")[1]):null;info(videoContext?`${n.author}的原声`:"老虎上树唱片店的原声",`${photo(videoContext?n.avatar:"ios:music-cover","music-large")}${videoContext?"":"<p>03:17 · 中国</p>"}<p class="capture-note">录屏没有提供这段完整原声，保留卡片与入口。</p>`); },
    "private-notes": () => listInfo("私密笔记",own() ? p.noteIds.map(note) : []),
    "hide-inspiration": () => {db().hideInspiration=true;save();scrollRemember();render();},
    "more-inspiration": () => listInfo("更多灵感",p.noteIds.slice(2,8).map(note)),
    "share-inspiration": () => info("分享生活",`${photo("cafe","music-large")}<p>分享你有声之后的生活</p><p>快发篇笔记来记录</p>`),
    "browse-history": () => listInfo("浏览记录",Object.keys(db().viewed).filter(k=>k.startsWith(`${actor()}:`)).reverse().map(k=>note(k.slice(actor().length+1)))),
    "profile-search": () => env.search(),
    "profile-menu": () => toast("本次暂不演示"),
    "edit-profile": () => toast("本次暂不演示"),
    "profile-scan": () => toast("本次暂不演示"),
    "profile-share": () => toast("本次暂不演示"),
    "copy-profile-link": async () => { try {await navigator.clipboard.writeText(new URL(`index.html#/profile/${actor()}`,location.href).href);toast("主页链接已复制");}catch{toast("可以复制地址栏链接");} },
    "following-list": () => go("people"),
    "followers-list": () => go("people"),
    "received-stats": () => info("获赞与收藏",`<p>${p.received} 次获赞与收藏</p>`),
    "personal-sale": () => listInfo("个人售卖",[]),
    "profile-groups": () => info("群聊",'<p>录屏没有进入群聊详情。</p>'),
    "composer-emoji": b => {const input=document.querySelector("#comment-text"); input.value+=b.dataset.emoji||"😊";input.focus();},
    "composer-at": () => {const input=document.querySelector("#comment-text");input.value+="@";input.focus();},
    "composer-more": () => document.querySelector("#comment-image-file").click(),
    "composer-voice": () => toast("可使用手机键盘的语音输入"),
    "video-menu": b => videoMenu(b.dataset.id),
    "participants": b => participants(b.dataset.id),
    "recommend": b => {db().recommendations[key(b.dataset.id)]=!recommendation(b.dataset.id);save();participants(b.dataset.id);},
    "video-speed": b => {db().videoSpeed=Number(b.dataset.value);save();const v=document.querySelector("video");if(v)v.playbackRate=db().videoSpeed;videoMenu(route().split("/")[1]);},
    "video-auto": () => {db().videoAuto=!db().videoAuto;save();videoMenu(route().split("/")[1]);},
    "video-clean": () => {closeModal();document.querySelector(".recorded-video").classList.toggle("clean-video");},
    "video-save": () => {const a=document.createElement("a");a.href=note(route().split("/")[1]).videoSrc||"assets/demo/cat-loop.mp4";a.download="演示视频.mp4";a.click();closeModal();},
    "video-comments": b => info("视频评论",comments(b.dataset.id)),
    "video-cast": () => info("投屏","<p>此入口需原生客户端与投屏设备。</p>"),
    "video-settings": () => info("播放设置",'<button class="info-row" data-action="video-auto">自动连播</button><p>视频使用本地演示素材。</p>'),
    "participant-profile": b => {const names=["fufu💙","肖十亿郎","🍊","阿白"];info(names[b.dataset.id],`<p>录屏展示了参与者列表，没有进入该用户主页。</p>`);},
    "author-tickets": () => listInfo("票务店铺",[note("author-drama")]),
    "author-store": () => info("店铺与门店",'<p>天目里</p><p>录屏没有打开店铺内部页面。</p>'),
    "author-saves": () => info("收藏",'<p>作者的收藏未公开。</p>'),
    "author-message": () => { if(!accounts.some(a=>a.id==="night-author"))accounts.push({id:"night-author",name:"天目里展演小助手",avatar:"ios:avatar-night",bio:"天目里演出指南"});go("chat/night-author");},
    "author-notes": () => {},
    "author-search": () => env.search(),
    "collection-notes": () => listInfo("请坐｜演出",[note("author-drama"),note("author-talk"),note("night")])
  };
  function afterRender(page, nid, fresh = true) {
    const device=document.querySelector("#device");
    const isHero=page==="profile" && nid===actor(), isVideo=page==="video", isAuthor=page==="author"&&nid==="night";
    device.classList.toggle("profile-device",isHero);device.classList.toggle("video-device",isVideo);device.classList.toggle("author-device",isAuthor);
    device.classList.remove("profile-collapsed");
    const isPeer = page === "author" || (page === "profile" && env.social()?.hasProfile(nid));
    document.documentElement.dataset.statusTheme = isHero || isVideo || isAuthor || isPeer ? "white" : page === "note" && !["kai","crab"].includes(nid) ? "detail" : "dark";
    if(page==="note"||page==="video"){db().viewed[key(nid)]=Date.now();save();}
    const scroll=document.querySelector(".recorded-profile-scroll");
    if(scroll) {
      if (fresh && document.querySelector(".recorded-profile").dataset.profileTab === "liked" && document.querySelector(".recorded-profile").dataset.profileSub === "notes") {
        document.querySelector(".profile-tab-header").insertAdjacentHTML("beforeend", env.social()?.ownTools() || "");
      }
      const syncProfile = () => {
        if (!scroll.isConnected) return;
        const profile = scroll.parentElement;
        const toolbar = profile.querySelector(".my-profile-toolbar");
        const person = profile.querySelector(".my-profile-person");
        const top = Math.max(0, scroll.scrollTop);
        const fadeEnd = person.offsetTop + person.querySelector(".avatar").offsetHeight - toolbar.offsetHeight;
        const clamp = value => Math.max(0, Math.min(1, value));
        // Tint and compact avatar share this progress as content passes under
        // the fixed toolbar; the avatar has no later collapse threshold.
        const opacity = clamp(top / Math.max(1, fadeEnd));
        device.style.setProperty("--profile-header-opacity", String(opacity));
        device.style.setProperty("--profile-edit-opacity", String(1 - opacity));
        toolbar.querySelector(".edit-profile").style.visibility = opacity === 1 ? "hidden" : "";
        device.style.setProperty("--profile-background-y", `${-top}px`);
      };
      if (fresh) {
        const profile = scroll.parentElement, toolbar = profile.querySelector(".my-profile-toolbar");
        profile.prepend(toolbar);
        toolbar.insertAdjacentHTML("beforeend", avatar(account(actor()).avatar, "profile-toolbar-avatar"));
        scroll.addEventListener("scroll",syncProfile,{passive:true});
      }
      syncProfile();
    }
    const v=document.querySelector("video");
    if(v){v.playbackRate=db().videoSpeed||1;let timer;v.addEventListener("pointerdown",()=>{timer=setTimeout(()=>videoMenu(nid),480);});["pointerup","pointerleave","pointercancel"].forEach(e=>v.addEventListener(e,()=>clearTimeout(timer)));v.addEventListener("contextmenu",e=>{e.preventDefault();videoMenu(nid);});}
  }
  function keyboardPosition() {
    const vv=window.visualViewport;
    const scale=Number(getComputedStyle(document.documentElement).getPropertyValue("--device-scale")) || 1;
    document.documentElement.style.setProperty("--keyboard-offset",`${vv && innerWidth<=520 ? Math.max(0,innerHeight-vv.height-vv.offsetTop)/scale : 0}px`);
  }
  window.visualViewport?.addEventListener("resize",keyboardPosition);
  window.visualViewport?.addEventListener("scroll",keyboardPosition);
  function submitComment(nid, form, text) {
    const replyTo=form.dataset.reply || "", r=replyTo?findComment(nid,replyTo):null;
    const comment={id:`comment-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,actor:actor(),name:account(actor()).name,avatar:account(actor()).avatar,text,likes:0,date:"刚刚 浙江",replyTo,quote:r?`@${r.name}：${r.text}`:"",image:form.dataset.image||undefined};
    if (replyTo) db().expanded[key(replyTo)] = true;
    db().comments[nid] ||= [];db().comments[nid].push(comment);save();closeModal();scrollRemember();render();toast(r?"回复成功":"评论成功");
    requestAnimationFrame(()=>document.querySelector(`[data-comment-id="${comment.id}"]`)?.scrollIntoView({block:"center"}));
  }
  function submit(form, values) {
    if(form.id==="album-form"){
      const name = String(values.get("name") || "").trim();
      if (!name) { document.querySelector("#album-name").focus(); return true; }
      db().albums[actor()] ||= [];
      db().albums[actor()].push({name,ids:values.getAll("note").filter(saved)});
      save();closeModal();scrollRemember();render();
      env.social().snack("专辑已创建", "查看专辑", "open-album", String(db().albums[actor()].length - 1));
      return true;
    }
    if(form.id==="bio-form"){db().profileBio ||= {};db().profileBio[actor()]=values.get("bio").trim();save();closeModal();scrollRemember();render();return true;}
    return false;
  }
  document.addEventListener("change",e=>{
    if(e.target.id!=="comment-image-file"||!e.target.files[0])return;
    const reader=new FileReader();reader.onload=()=>{const f=document.querySelector("#comment-form");if(!f)return;f.dataset.image=reader.result;document.querySelector("#comment-image-preview").innerHTML=`<img src="${reader.result}" alt="待发送图片">`;};reader.readAsDataURL(e.target.files[0]);
  });
  init();
  return { liked,saved,list,profile,comments,commentRow,composer,notifications,video,author,actions,afterRender,submitComment,submit,glyph };
};
