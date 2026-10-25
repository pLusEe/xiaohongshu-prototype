window.createXHSSupplement = env => {
  const { esc, photo, avatar, icon, iconButton, note, accounts, account, bottomNav, go, showModal, closeModal, save, toast, render, conversation, unread, readChat, timeLabel, noteMessage, sendMessage, glyph } = env;
  const d = window.XHS_DATA, db = env.db, actor = env.actor;
  let query = "", aiNote = "weeknd", aiExpanded = false, pendingPhoto = null;
  db().notificationLikes ||= {};
  db().followerBack ||= {};
  db().aiHistory ||= [];
  const dot = '<img class="diandian-mark" src="assets/ios/diandian-mark.png" alt="">';
  const reactions = ["棒", "笑哭了", "心心眼", "呃", "抽泣", "喜欢"];
  const header = title => `<header class="simple-header">${iconButton("back","back","返回")}<h1>${esc(title)}</h1><span></span></header>`;
  function messages() {
    const ids = [...new Set([...d.messagePeers, ...accounts.filter(a => a.id !== actor() && conversation(a.id).length).map(a => a.id)])].filter(id => id !== actor());
    const peers = ids.map(account).sort((a,b) => Number(Boolean(b.ai))-Number(Boolean(a.ai)) || (conversation(b.id).at(-1)?.at || 0)-(conversation(a.id).at(-1)?.at || 0));
    return `<div class="page messages-page">${messageHeader()}<div class="page-scroll messages-scroll"><div class="notification-shortcuts">${[["notificationLike","赞和收藏","赞和收藏"],["notificationFollow","新增关注","新增关注"],["notificationComment","评论和@","评论和@"]].map(([im,label,id])=>`<button data-action="notification" data-label="${id}">${icon(im)}<span>${label}</span></button>`).join("")}</div><div class="conversation-list">${peers.map(a => {
      const last=conversation(a.id).at(-1), count=unread(a.id), preview=last?.type==="note"?`[笔记] ${note(last.noteId).title}`:last?.text||"一起分享喜欢的日常";
      return `<button class="conversation-row" data-action="${a.ai?"open-ai":"chat"}" data-id="${a.id}"><div class="conversation-avatar">${a.ai?`<span class="ai-avatar">${dot}</span>`:avatar(a.avatar)}</div><div class="conversation-copy"><div><strong>${esc(a.name)}${a.ai?'<small class="ai-label">ai</small>':""}</strong><time>${a.ai?"刚刚":last?timeLabel(last.at):""}</time></div><p>${esc(preview)}</p>${count&&!a.ai?`<i class="message-unread-dot" aria-label="${count}条未读消息"></i>`:""}${a.group?`<span class="muted-thread">${glyph("mute")}</span>`:""}</div></button>`;
    }).join("")}</div></div>${bottomNav("messages")}</div>`;
  }
  function messageHeader() {
    return `<header class="messages-header"><span></span><h1>消息</h1><div><button data-action="message-search" aria-label="搜索消息">${glyph("message-search")}</button><button data-action="message-plus" aria-label="新消息">${glyph("message-plus")}</button></div></header>`;
  }
  function notifications(kind) {
    if(kind==="新增关注") return `<div class="page">${header(kind)}<div class="page-scroll notification-followers">${d.followers.map(f=> {
      const a=account(f.id),mutual=env.social().isFollowing(a.id);
      return `<article class="follower-row"><button data-action="profile" data-id="${a.id}">${avatar(a.avatar)}</button><div><b>${esc(a.name)}</b><small>开始关注你了 ${f.date}</small></div><button class="${mutual?"":"follow-back"}" data-action="${mutual?"chat":"follow-back"}" data-id="${a.id}">${mutual?"发私信":"回关"}</button></article>`;
    }).join("")}<button class="followers-all" data-action="followers-all">查看全部 ⌄</button><div class="suggested-followers"><p>你可能感兴趣的人 <button data-action="hide-suggestions">关闭</button></p>${accounts.filter(a=>a.id!==actor()&&env.social().hasProfile(a.id)).map(a=>`<article class="follower-row">${avatar(a.avatar)}<div><b>${esc(a.name)}</b><small>${esc(a.bio?.split("\n")[0] || "分享生活中的小事")}</small></div><button class="follow-back" data-action="social-follow" data-id="${a.id}">${env.social().isFollowing(a.id)?"已关注":"关注"}</button></article>`).join("")}</div></div></div>`;
    const events=actor()==="lin"?d.notifications.filter(e=>e.kind===kind):[];
    const local=[];
    if(kind==="赞和收藏") for(const field of ["likes","saves"]) for(const [key,v] of Object.entries(db()[field])) {
      const [from,nid]=key.split(":"),n=note(nid);
      if(v&&from!==actor()&&n.author===account(actor()).name) local.push({id:key,from,noteId:nid,text:field==="likes"?"赞了你的笔记":"收藏了你的笔记",date:"刚刚"});
    }
    if(kind==="评论和@") for(const [nid,rows] of Object.entries(db().comments)) for(const c of rows) if(c.actor!==actor()&&note(nid).author===account(actor()).name) local.push({id:c.id,from:c.actor,noteId:nid,commentId:c.id,text:c.text,date:"刚刚"});
    return `<div class="page">${header(kind==="评论和@"?"收到的评论和@":"收到的赞和收藏")}<div class="page-scroll received-notifications ${kind==="评论和@"?"received-comments":"received-likes"}">${[...local,...events].map(e=> {
      const a=account(e.from),liked=db().notificationLikes[e.id];
      return `<article class="received-event">${avatar(a.avatar)}<div><button class="notification-name" data-action="profile" data-id="${a.id}">${esc(a.name)}${e.friend?'<small>你的好友</small>':""}</button><p class="notification-description">${kind==="评论和@"?"评论了你的笔记":esc(e.text)} ${esc(e.date)}</p>${kind==="评论和@"?`<button class="notification-text" data-action="open-comment" data-note="${e.noteId}" data-id="${e.commentId}">${esc(e.text)}</button>${e.quote?`<p class="notification-quote">${esc(e.quote)}</p>`:""}<div class="notification-actions"><button data-action="notification-reply" data-note="${e.noteId}" data-id="${e.commentId}">${icon("comment")}回复</button><button data-action="notification-like" data-id="${e.id}" class="${liked?"liked":""}">${icon(liked?"liked":"like")}赞</button></div>`:e.friend?'<small class="friend-hint">🤝 互相关注</small>':""}</div><button class="notification-thumbnail" data-action="note" data-id="${e.noteId}">${photo(note(e.noteId).images[0])}</button></article>`;
    }).join("")||'<p class="profile-empty">暂无新的互动</p>'}</div></div>`;
  }
  function chat(peerId) {
    const a=account(peerId),thread=conversation(a.id);
    readChat(a.id);
    let previous=0;
    const rows=thread.map(m=> {
      const mine=m.from===actor(),time=m.at-previous>180000;previous=m.at;
      const senderName = account(m.senderId || (m.type === "note" ? "reader-yu" : "man")).name;
      const person = mine ? account(actor()) : a;
      return `${time?`<p class="chat-time">${timeLabel(m.at)}</p>`:""}<div class="message-row ${mine?"outgoing":"incoming"}" data-message-id="${esc(m.id)}"><button class="message-avatar" data-action="profile" data-id="${person.id}" aria-label="查看${esc(person.name)}的主页">${avatar(person.avatar)}</button><div class="message-content">${m.simulated?'<small class="simulated-message-label">本地模拟回复</small>':""}${a.group&&!mine?`<small class="group-sender">${esc(senderName)}</small>`:""}${m.type==="note"?noteMessage(note(m.noteId),m):m.type==="image"?photo(m.image,"message-photo","聊天图片"):m.type==="ai"?`<button class="shared-ai-result" data-action="open-shared-ai" data-id="${esc(m.id)}"><b>点点 · ${esc(m.question)}</b><p>${esc(m.text)}</p><small>查看完整结果 ›</small></button>`:`<div class="text-bubble">${esc(m.text)}</div>`}${m.type==="note"?`<div class="note-reactions">${["已阅","绝了","嘟嘟嘟嘟"].map((text,i)=>`<button data-action="note-reaction" data-id="${m.id}" data-value="${text}" class="${db().messageReactions?.[`${actor()}:${m.id}`]===text?"selected":""}"><img src="assets/ios/note-reaction-${i}.png" alt="">${text}</button>`).join("")}</div>`:""}</div></div>`;
    }).join("");
    return `<div class="page chat-page ${a.chatTheme==="blue"?"blue-chat":""}">${headerChat(a)}${env.social()?.chatContext(a.id) || ""}<div class="page-scroll chat-scroll">${rows||'<p class="chat-greeting">打个招呼，一起聊聊吧</p>'}</div><div class="quick-reactions">${reactions.map((text,i)=>`<button data-action="quick-reaction" data-id="${a.id}" data-value="${esc(text)}"><img src="assets/ios/quick-reaction-${i%5}.png" alt="">${text}</button>`).join("")}</div><form class="chat-composer" id="chat-form" data-peer="${a.id}"><button type="button" class="composer-control" data-action="chat-voice" aria-label="语音输入">${glyph("voice")}</button><label class="sr-only" for="chat-text">消息内容</label><input id="chat-text" name="text" placeholder="发消息..." autocomplete="off" maxlength="1000"><button type="button" class="composer-control smile-button" data-action="emoji" aria-label="添加表情">${glyph("smile")}</button><button type="button" class="composer-control chat-plus" data-action="chat-attachments" aria-label="更多聊天功能">${glyph("plus")}</button><button class="chat-send" type="submit" hidden>发送</button></form></div>`;
  }
  function headerChat(a) {
    return `<header class="chat-header">${iconButton("back","back","返回")}<h1>${avatar(a.avatar)}${esc(a.name)}${a.group?" (24)":""}</h1><button class="icon-button" data-action="thread-settings" data-id="${a.id}" aria-label="聊天设置">${glyph("settings")}</button></header>`;
  }
  function search() {
    const results=accounts.filter(a=>a.id!==actor()&&`${a.name} ${conversation(a.id).map(m=>m.text||note(m.noteId).title).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
    return `<div class="page"><form class="message-search-header" id="message-search-form">${icon("search")}<label class="sr-only" for="message-query">搜索消息</label><input id="message-query" name="query" value="${esc(query)}" placeholder="搜索联系人/群聊/聊天记录" autocomplete="off"><button type="button" data-action="messages">取消</button></form><div class="page-scroll message-results"><p>${query?"搜索结果":"最近搜索"}</p>${(query?results:[account("man"),account("music-group")]).map(a=>`<button class="message-search-result" data-action="chat" data-id="${a.id}">${avatar(a.avatar)}<span>${esc(a.name)}</span></button>`).join("")||'<p>没有找到相关聊天</p>'}</div></div>`;
  }
  function aiAnswer(question) {
    if(question.includes("Weeknd")||question.includes("weeknd")) return `<h3>The Weeknd</h3><p>The Weeknd（本名 Abel Tesfaye）是加拿大歌手、词曲作者。</p><h4>♫ 音乐风格</h4><p>他的音乐融合了 R&amp;B、电子与流行元素，常用合成器和复古节奏营造氛围。</p><h4>🌟 代表作</h4><p>Blinding Lights、Starboy、Save Your Tears。</p><h4>💡 听歌时可以关注</h4><p>歌曲里的人声层次与节奏变化。先听一首熟悉的，再顺着专辑慢慢听。</p>`;
    if(question.includes("专辑"))return "<h3>从一张专辑开始</h3><p>可以先听《After Hours》，再听《Dawn FM》。选一段安静的时间，按专辑顺序听，会更容易感受整张作品的连贯表达。</p>";
    return `<h3>${esc(question)}</h3><p>可以先从这篇笔记里最感兴趣的部分开始，把想了解的问题说得更具体一些。</p><p>比如：画面的构图、音乐的风格，或者你想去的地方。这里展示的是本地示例回答。</p>`;
  }
  function aiBody() {
    const history=db().aiHistory;
    return `<div class="ai-scroll"><button class="ai-note-context" data-action="note" data-id="${aiNote}">${photo(note(aiNote).images[0])}<span>${esc(note(aiNote).title)}<small>${esc(note(aiNote).author)}</small></span></button>${history.map(h=>`<div class="ai-question">${esc(h.question)}</div><article class="ai-answer">${aiAnswer(h.question)}<div class="ai-answer-tools"><button data-action="ai-copy" aria-label="复制结果">${glyph("copy")}</button><button data-action="ai-save" aria-label="收藏结果">${icon("collect")}</button><button data-action="ai-share" aria-label="分享结果">${icon("share")}</button><span></span><button data-action="ai-feedback" aria-label="评价结果">${glyph("feedback")}</button><button data-action="ai-retry" aria-label="重新生成">${glyph("retry")}</button></div></article>`).join("")}<div class="ai-suggestions">${(history.length?["The Weeknd哪张专辑值得从头听到尾？","这篇笔记的画面有什么特点？"]:["介绍一下The Weeknd","这篇笔记讲了什么？","推荐类似的音乐"]).map(q=>`<button data-action="ai-question" data-value="${esc(q)}">${esc(q)}</button>`).join("")}</div></div><form id="ai-form" class="ai-composer"><button type="button" data-action="chat-voice" aria-label="语音输入">${glyph("voice")}</button><label class="sr-only" for="ai-input">问点点</label><input name="question" id="ai-input" placeholder="发消息或按住说话..." autocomplete="off" maxlength="500"><button type="button" data-action="ai-attach" aria-label="添加图片">${glyph("camera")}</button><button type="button" data-action="ai-attach" aria-label="更多">${glyph("plus")}</button><button type="submit" class="ai-send" aria-label="发送" hidden>↑</button></form><small class="ai-disclosure">内容由 AI 生成</small>`;
  }
  function aiSheet() {
    showModal("ai",aiNote,`<section class="ai-sheet ${aiExpanded?"expanded":""}" role="dialog" aria-modal="true" aria-label="点点" tabindex="-1"><header><button data-action="close-modal" aria-label="关闭">×</button><h2>${dot}点点</h2><button data-action="ai-expand" aria-label="展开">⤢</button></header>${aiBody()}</section>`);
    requestAnimationFrame(()=>{const el=document.querySelector(".ai-scroll");if(el)el.scrollTop=el.scrollHeight;});
  }
  function aiPage() {
    return `<div class="page ai-page">${header("点点")}${aiBody()}</div>`;
  }
  function ask(question) {
    if(!question.trim())return;
    db().aiHistory.push({question:question.trim()});save();
    if(env.route().startsWith("ai-chat"))render();else aiSheet();
  }
  const actions = {
    "message-search":()=>{query="";go("message-search");},
    "message-plus":()=>showModal("message-plus","",`<section class="message-plus-sheet" role="dialog" aria-modal="true" aria-label="新消息" tabindex="-1"><label>从相册选择<input type="file" accept="image/*" id="message-photo" hidden></label><label>相机<small>拍照与直播</small><input type="file" accept="image/*" capture="environment" id="message-camera" hidden></label><button data-action="new-text-message">写文字</button><button data-action="close-modal">取消</button></section>`),
    "new-text-message":()=>go("people"),
    "follow-back":b=>env.social().toggleFollow(b.dataset.id),
    "followers-all":b=>{b.textContent="已显示全部关注";},
    "hide-suggestions":()=>document.querySelector(".suggested-followers")?.remove(),
    "notification-like":b=>{db().notificationLikes[b.dataset.id]=!db().notificationLikes[b.dataset.id];save();env.scrollRemember();render();},
    "notification-reply":b=>{go(`note/${b.dataset.note}`);requestAnimationFrame(()=>document.querySelector(`[data-comment-id="${b.dataset.id}"] .comment-text`)?.click());},
    "quick-reaction":b=>{sendMessage(b.dataset.id,"text",{text:b.dataset.value});save();render();},
    "note-reaction":b=>{db().messageReactions||={};db().messageReactions[`${actor()}:${b.dataset.id}`]=b.dataset.value;save();b.parentElement.querySelectorAll("button").forEach(e=>e.classList.toggle("selected",e===b));},
    "chat-voice":()=>{document.querySelector("#chat-text,#ai-input")?.focus();toast("可使用键盘上的语音输入");},
    "thread-settings":b=>{const a=account(b.dataset.id);showModal("thread-info",a.id,`<section class="community-info" role="dialog" aria-modal="true" aria-label="聊天设置" tabindex="-1"><header><h2>${esc(a.name)}</h2><button data-action="close-modal">×</button></header><button class="info-row" data-action="profile" data-id="${a.id}">${avatar(a.avatar)}查看主页</button><button class="info-row" data-action="message-search">搜索聊天记录</button><button class="info-row" data-action="thread-mute" data-id="${a.id}">消息免打扰 ${db().muted?.[a.id]?"已开启":"已关闭"}</button></section>`);},
    "thread-mute":b=>{db().muted||={};db().muted[b.dataset.id]=!db().muted[b.dataset.id];save();b.textContent=`消息免打扰 ${db().muted[b.dataset.id]?"已开启":"已关闭"}`;},
    "open-ai":()=>go("ai-chat"),
    "ask-ai":b=>{aiNote=b.dataset.id||"weeknd";aiExpanded=false;aiSheet();},
    "ai-expand":()=>{aiExpanded=!aiExpanded;aiSheet();},
    "ai-question":b=>ask(b.dataset.value),
    "ai-copy":async()=>{const text=document.querySelector(".ai-answer")?.innerText||"";try{await navigator.clipboard.writeText(text);toast("已复制");}catch{toast(text);}},
    "ai-save":()=>{db().aiSaved=true;save();toast("已收藏结果");},
    "ai-share":()=>showModal("ai-share","",`<section class="community-info" role="dialog" aria-modal="true" aria-label="分享结果" tabindex="-1"><header><h2>分享给</h2><button data-action="close-modal">×</button></header>${accounts.filter(a=>!a.authorPeer&&a.id!==actor()).map(a=>`<button class="info-row" data-action="send-ai-result" data-id="${a.id}">${avatar(a.avatar)}${esc(a.name)}</button>`).join("")}</section>`),
    "send-ai-result":b=>{const question=db().aiHistory.at(-1)?.question||"介绍一下The Weeknd",temp=document.createElement("div");temp.innerHTML=aiAnswer(question);sendMessage(b.dataset.id,"ai",{question,text:temp.innerText,noteId:aiNote});save();closeModal();toast("结果已发送");},
    "open-shared-ai":b=>{const m=db().messages.find(m=>m.id===b.dataset.id);if(m){aiNote=m.noteId;db().aiHistory.push({question:m.question});save();go("ai-chat");}},
    "ai-feedback":b=>{b.classList.toggle("liked");toast("已记录反馈");},
    "ai-retry":()=>{if(env.route().startsWith("ai-chat"))render();else aiSheet();},
    "ai-attach":()=>{showModal("ai-photo","",`<section class="community-info" role="dialog" aria-modal="true" aria-label="图片" tabindex="-1"><header><h2>选择笔记图片</h2><button data-action="close-modal">×</button></header>${["weeknd","siri","daily-3"].map(id=>`<button class="info-row" data-action="ai-context" data-id="${id}">${photo(note(id).images[0],"context-thumb")}${esc(note(id).title)}</button>`).join("")}</section>`);},
    "ai-context":b=>{aiNote=b.dataset.id;aiSheet();},
    "photo-recipient":b=>{if(pendingPhoto){sendMessage(b.dataset.id,"image",{image:pendingPhoto,text:"[图片]"});pendingPhoto=null;save();go(`chat/${b.dataset.id}`);}}
  };
  function afterRender(page,nid,fresh=true) {
    document.querySelector("#device").classList.toggle("blue-chat-device",page==="chat"&&account(nid).chatTheme==="blue");
    if(fresh) document.querySelectorAll("[data-note-card]").forEach(card=>{const n=note(card.dataset.noteCard);if(n.video)card.querySelector(".feed-cover")?.insertAdjacentHTML("beforeend",'<span class="video-card-badge">▶</span>');});
    if(fresh&&page==="note") {
      document.querySelector(".note-copy").insertAdjacentHTML("beforeend",`<button class="ask-ai-entry" data-action="ask-ai" data-id="${nid}">${dot}问点点</button>`);
      const area=document.querySelector(".note-scroll");
      let startX=0, galleryGesture=false;
      area?.addEventListener("touchstart",e=>{startX=e.touches[0].clientX;galleryGesture=Boolean(e.target.closest(".gallery-track"));},{passive:true});
      area?.addEventListener("touchend",e=>{if(!galleryGesture&&startX-e.changedTouches[0].clientX>110){aiNote=nid;aiSheet();}},{passive:true});
    }
    if(fresh&&page==="profile") setupProfilePull();
    if(fresh&&page==="video") {
      let startY=0,startX=0;
      const el=document.querySelector(".recorded-video");
      el.addEventListener("touchstart",e=>{startY=e.touches[0].clientY;startX=e.touches[0].clientX;},{passive:true});
      el.addEventListener("touchend",e=>{
        const delta=startY-e.changedTouches[0].clientY;
        if(Math.abs(delta)<85||Math.abs(startX-e.changedTouches[0].clientX)>70)return;
        const videos=d.notes.filter(n=>n.video),i=videos.findIndex(n=>n.id===nid);
        go(`video/${videos[(i+(delta>0?1:videos.length-1))%videos.length].id}`);
      },{passive:true});
    }
    const device=document.querySelector("#device");
    device.style.removeProperty("--profile-pull");
    if(page!=="profile")device.style.removeProperty("--profile-background-y");
  }
  function setupProfilePull() {
    const scroll=document.querySelector(".recorded-profile-scroll");
    if(!scroll)return;
    const device=document.querySelector("#device");
    const profile=scroll.parentElement;profile.insertAdjacentHTML("afterbegin",'<span class="profile-refresh" aria-hidden="true">↻</span>');
    let start=0,startX=0,amount=0,pulling=false;
    scroll.addEventListener("touchstart",e=>{start=e.touches[0].clientY;startX=e.touches[0].clientX;pulling=e.touches.length===1&&scroll.scrollTop<=0;},{passive:true});
    scroll.addEventListener("touchmove",e=>{
      if(!pulling)return;
      if(e.touches.length!==1||Math.abs(e.touches[0].clientX-startX)>Math.abs(e.touches[0].clientY-start)){end(e);return;}
      const scale=device.getBoundingClientRect().width/device.clientWidth;
      amount=Math.max(0,Math.min(110,(e.touches[0].clientY-start)*.45/scale));
      if(amount>0){e.preventDefault();scroll.style.transform=`translateY(${amount}px)`;device.style.setProperty("--profile-pull",`${amount}px`);device.style.setProperty("--profile-background-y","0px");profile.classList.toggle("refresh-visible",amount>35);}
      else {scroll.style.transform="";device.style.removeProperty("--profile-pull");profile.classList.remove("refresh-visible");}
    },{passive:false});
    const end=e=>{if(!pulling)return;pulling=false;scroll.style.transform="";device.style.removeProperty("--profile-pull");profile.classList.remove("refresh-visible");if(e.type==="touchend"&&amount>70)toast("已刷新");amount=0;};
    scroll.addEventListener("touchend",end,{passive:true});scroll.addEventListener("touchcancel",end,{passive:true});
  }
  function submit(form,values) {
    if(form.id==="ai-form"){ask(values.get("question"));return true;}
    if(form.id==="message-search-form"){query=values.get("query").trim();render();return true;}
    return false;
  }
  document.addEventListener("input",e=>{
    if(e.target.id==="ai-input") {
      const populated = Boolean(e.target.value.trim()), form = e.target.form;
      form.querySelector(".ai-send").hidden = !populated;
      form.querySelector('[aria-label="更多"]').hidden = populated;
    }
    if(e.target.id==="message-query") {
      query=e.target.value;
      const list=document.querySelector(".message-results"),matches=accounts.filter(a=>a.id!==actor()&&`${a.name} ${conversation(a.id).map(m=>m.text||note(m.noteId).title).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
      list.innerHTML=`<p>${query?"搜索结果":"最近搜索"}</p>${matches.map(a=>`<button class="message-search-result" data-action="chat" data-id="${a.id}">${avatar(a.avatar)}<span>${esc(a.name)}</span></button>`).join("")||"<p>没有找到相关聊天</p>"}`;
    }
  });
  document.addEventListener("change",e=> {
    if(!["message-photo","message-camera"].includes(e.target.id)||!e.target.files[0])return;
    const reader=new FileReader();reader.onload=()=>{pendingPhoto=reader.result;showModal("selected-photo","",`<section class="community-info" role="dialog" aria-modal="true" aria-label="图片" tabindex="-1"><header><h2>发送图片给</h2><button data-action="close-modal">×</button></header><img class="selected-chat-photo" src="${reader.result}" alt="选中的图片">${accounts.filter(a=>!a.authorPeer&&a.id!==actor()).map(a=>`<button class="info-row" data-action="photo-recipient" data-id="${a.id}">${avatar(a.avatar)}${esc(a.name)}</button>`).join("")}</section>`);};reader.readAsDataURL(e.target.files[0]);
  });
  return {messages,notifications,chat,search,aiPage,actions,afterRender,submit};
};
