/* 两段 iPhone 录屏用于界面结构；个人内容与聊天均替换为本地演示数据。 */
(() => {
  const d = window.XHS_DATA, p = d.myProfile, me = d.accounts.find(a => a.id === "lin");
  Object.assign(me, { name: "林间", avatar: "youth:avatar", bio: "滑板、现场，还有没听完的歌。" });
  Object.assign(p, { name: me.name, id: "2026102410", bio: me.bio });
  const themes = [
    ["youth:skate", "天黑之前，再滑最后一轮", "滑板", "说好六点回家，结果又练到路灯亮了。\n今天终于落地了一个干净的 ollie，值得记录一下。"],
    ["youth:gig", "耳鸣还没好，已经想下一场了", "音乐", "站在最后一排也能感受到鼓点。\n安可的那首大家一起唱，散场以后还在脑内循环。"],
    ["youth:street", "最近出门就这一套", "穿搭", "皮衣、宽松牛仔裤和旧球鞋。\n耳机一戴，走路也有自己的 BGM。"],
    ["youth:records", "在唱片店消失了三个小时", "音乐", "本来只想随便逛逛，结果试听了一整面唱片。\n最后带走一张完全不认识的专辑，回家慢慢听。"],
    ["youth:zine", "把最近的灵感印成了一本小刊", "设计", "只用了蓝色和荧光绿，套印偏掉的地方反而最好看。\n第一次装订，边角不齐也先保留着。"],
    ["youth:arcade", "成年人也需要放学后的游戏厅", "游戏", "路过进去打一局，出来已经十点半。\n这次终于打过了上周卡住的那首歌。"],
    ["youth:ramen", "散场之后的碳水，值得", "美食", "听完现场，拐进还亮着灯的小店。\n一碗热面、一盘煎饺，今晚圆满了。"],
    ["youth:street", "夜里拍照，闪光灯就别关了", "摄影", "试着不用夜景模式，直接开闪光灯。\n人很清楚，身后的霓虹刚好留一点糊。"]
  ];
  const replacements = { "my-truck": "youth:skate", "my-portrait": "youth:street", "resonance": "youth:gig", "ants": "youth:arcade" };
  for (const n of d.notes) {
    if (replacements[n.id]) {
      n.images = [replacements[n.id]];
      delete n.cover; delete n.partialCapture;
      n.detailVerified = true;
    }
    if (n.id.startsWith("my-")) Object.assign(n, { author: me.name, avatar: me.avatar, title: n.id === "my-truck" ? "天黑之前，再滑一轮" : "皮衣是秋天的通行证", body: n.id === "my-truck" ? themes[0][3] : themes[2][3], demo: true, captured: false });
    if (n.id === "resonance") Object.assign(n, { title: "这一场没有白来", author: "小满", avatar: "youth:records", ratio: "4 / 3", body: themes[1][3] });
    if (n.id === "ants") Object.assign(n, { title: "路过游戏厅，结果待到了关门", author: "小满", avatar: "youth:records", videoSrc: "assets/youth/arcade-loop.mp4", ratio: "1 / 1", demo: true, body: themes[5][3] });
  }
  const demoNotes = Array.from({ length: 24 }, (_, i) => {
    const [image, title, category, body] = themes[i % themes.length];
    const id = `daily-${i + 1}`, video = i === 8 || i === 13;
    const titles = ["再练一百次，总会成功吧", "散场以后还在循环副歌", "降温后的第一件皮衣", "今天买到的这张太好听了", "两种颜色，也可以很吵", "手速不够，快乐来凑", "十一点的拉面店还开着", "城市夜色是免费的布景", "练板日记：今天没白摔", "站在最后一排也很开心", "衣柜里最常穿的三件", "给朋友挑了张生日唱片", "周末做了一本只有八页的 zine", "这个谱面终于全连了", "散场后一起去吃面", "相机里舍不得删的夜晚"];
    return { id, title: i < 8 ? title : titles[i - 8], author: me.name, avatar: me.avatar, images: [image], likes: 21 + i * 13, saves: 8 + i * 7, comments: 3, category, body, tags: [category, "周末不宅家"], date: `10-${String(24 - i % 20).padStart(2, "0")}`, location: "浙江", ratio: ["3 / 4", "1 / 1", "4 / 3"][i % 3], demo: true, detailVerified: true, video, videoSrc: video ? `assets/youth/${image.slice(6)}-loop.mp4` : undefined, replies: [
      { id: `${id}-reply`, name: "小满", avatar: "youth:records", text: ["新手可以来这里练吗", "这场的灯光也太好了", "想问问耳机是什么型号", "盲买的唱片有没有踩雷", "这组蓝绿配色好漂亮", "这首我也卡了好久", "看饿了，散场后必须吃点", "闪光灯直出就有这种效果吗"][i % 8], likes: 3 + i, date: "昨天 浙江", children: [{ id: `${id}-reply-child`, name: me.name, avatar: me.avatar, text: ["可以的，旁边有一块平地适合练基础", "现场看比照片更震撼", "用了很久的一副旧耳机，主要喜欢这个颜色", "这次运气不错，第二首特别喜欢", "试了好几版，这一组印出来最好看", "多练两遍就能过了！", "真的，热汤下去整个人都活了", "对，原图只裁了一下"][i % 8], likes: 1, date: "昨天 浙江", author: true }] },
      { id: `${id}-reply-2`, name: "青禾", avatar: "youth:zine", text: ["今天的练习搭子找到了", "散场回来还在单曲循环", "宽松牛仔裤和皮衣真的很配", "能逛一下午的地方又多一个", "想看装订后的内页", "下周一起去挑战", "煎饺看起来也好香", "夜里的蓝色太好看了"][i % 8], likes: 2, date: "昨天 上海" }
    ] };
  });
  d.notes.push(...demoNotes);
  p.noteIds = ["my-truck", "my-portrait", ...demoNotes.map(n => n.id)];
  p.likedIds.push(...demoNotes.slice(0, 18).map(n => n.id));
  p.savedIds.push(...demoNotes.slice(6, 24).map(n => n.id));
  p.ownComments = [
    { id: "my-comment-1", name: me.name, avatar: me.avatar, text: "周末想去这里", quote: "@小满：下午一起去吗？", sourceTitle: "在唱片店消失了三个小时", noteId: "cafe", date: "10-23 浙江", public: false },
    { id: "my-comment-2", name: me.name, avatar: me.avatar, text: "这组套色真的好看", sourceTitle: "把最近的灵感印成一本小刊", noteId: "room", date: "10-22 浙江", public: false }
  ];
  const extraNotes = [
    { id: "siri", title: "把蓝色和荧光绿印在一起", author: "Siri", avatar: "youth:zine", images: ["youth:zine"], likes: 171, saves: 86, body: "给最近做的图形试了一次双色印刷。\n颗粒和错位都留下来，装订成一本自己的小刊。", tags: ["设计", "独立出版"], replies: [{ id: "siri-tools", name: "小满", avatar: "youth:records", text: "作品里的图案是用什么工具做的呀", likes: 0, date: "3天前 浙江", children: [{ id: "siri-tools-answer", name: "Siri", avatar: "youth:zine", text: "procreate，纯手搓", likes: 2, date: "3天前 广东", author: true }] }, { id: "siri-picture", name: "青禾", avatar: "youth:arcade", text: "蹲个过程！", likes: 0, date: "4天前 重庆", children: [{ id: "siri-picture-answer", name: "Siri", avatar: "youth:zine", text: "先放一张试印版", image: "youth:zine", likes: 0, date: "4天前 广东", author: true }] }] },
    { id: "burial", title: "去街角听一晚音乐", author: "阿森", avatar: "youth:gig", images: ["youth:gig"], likes: 40, saves: 4, body: themes[1][3], tags: ["音乐", "现场"], replies: [{ id: "burial-1", name: "小满", avatar: "youth:records", text: "最后那首全场一起唱，太值了", likes: 1, date: "10-07 浙江" }, { id: "burial-2", name: "青禾", avatar: "youth:zine", text: "下次带我一个", likes: 1, date: "10-13 上海" }] },
    { id: "schedule", title: "十月周末：滑板、唱片和现场", author: "周末记录", avatar: "youth:skate", images: ["youth:skate", "youth:records"], likes: 6, saves: 1, body: "周六下午练板，晚上去听现场。\n周日留给唱片店，不设闹钟。", tags: ["周末计划"], replies: [{ id: "schedule-1", name: "小满", avatar: "youth:records", text: "周六的现场见！", likes: 1, date: "5天前 浙江" }] },
    { id: "weeknd", title: "耳机里的 the weeknd", author: "小满", avatar: "youth:records", images: ["youth:records", "youth:gig"], likes: 8, saves: 1, body: "这周又把 After Hours 从头听了一遍。\n最适合夜里走回家的那段路。", tags: ["theweeknd", "音乐", "黑胶"], replies: [] }
  ].map(n => ({ category: "推荐", ratio: "3 / 4", comments: n.replies.length, location: "浙江", date: "3天前", demo: true, detailVerified: true, ...n }));
  d.notes.push(...extraNotes);
  d.followFeed = ["siri", "burial", "schedule", "weeknd", ...demoNotes.map(n => n.id)];
  d.iosFeed.push(...demoNotes.map(n => n.id));
  d.localFeed.push(...demoNotes.filter(n => n.category !== "旅行").map(n => n.id));
  const peers = [
    ["diandian", "点点", "youth:zine", false, true],
    ["music-group", "周末音乐小组", "youth:gig", true],
    ["walk-group", "滑板搭子集合", "youth:skate", true],
    ["book-group", "独立刊物交换", "youth:zine", true],
    ["activity", "活动消息", "youth:arcade", false],
    ["photo-group", "夜拍交换站", "youth:street", true],
    ["weekend-group", "周末去哪儿", "youth:ramen", true]
  ];
  peers.forEach(([id, name, avatar, group, ai]) => d.accounts.push({ id, name, avatar, group, ai, authorPeer: true, bio: group ? "一起分享喜欢的日常" : "发现生活里的新鲜事" }));
  d.accounts.find(a => a.id === "man").chatTheme = "blue";
  Object.assign(d.iosIcons, { notificationLike: "assets/demo/notification-like.png", notificationFollow: "assets/demo/notification-follow.png", notificationComment: "assets/demo/notification-comment.png" });
  d.messagePeers = ["diandian", "music-group", "man", "activity", "walk-group", "book-group", "sen", "qing", "photo-group", "weekend-group"];
  const at = Date.now();
  d.seedMessages = [
    { id: "demo-ai", from: "diandian", to: "lin", type: "text", text: "The Weeknd（本名 Abel Tesfaye）是加拿大歌手。", at: at - 20000 },
    { id: "demo-group-note", from: "music-group", to: "lin", type: "note", noteId: "burial", at: at - 80000 },
    { id: "demo-group-text", from: "music-group", to: "lin", type: "text", text: "今晚的小演出，一起去吗？", at: at - 70000 },
    { id: "demo-man-note", from: "man", to: "lin", type: "note", noteId: "daily-3", at: at - 3600000 },
    { id: "demo-man-text", from: "man", to: "lin", type: "text", text: "这张好喜欢，下次一起去！", at: at - 3500000 },
    ...["activity", "walk-group", "book-group", "sen", "qing", "photo-group", "weekend-group"].map((from, i) => ({ id: `demo-thread-${i}`, from, to: "lin", type: "text", text: ["周末演出开始报名啦，快来看看！", "青禾加入了群聊", "周六带上新做的小刊来交换", "演出票买好了，周六见", "分享了一家散场后还营业的面馆", "今日份夜拍，欢迎分享", "周末去哪儿，你有什么想法"][i], at: at - (i + 1) * 86400000 }))
  ];
  d.notifications = Array.from({ length: 14 }, (_, i) => ({ id: `demo-like-${i}`, kind: "赞和收藏", from: ["man", "sen", "qing"][i % 3], noteId: p.noteIds[i % p.noteIds.length], text: i % 2 ? "赞了你的笔记" : "收藏了你的笔记", date: i < 2 ? "今天" : `10-${23 - i}`, friend: i % 3 === 0 }));
  d.notifications.push(...Array.from({ length: 12 }, (_, i) => ({ id: `demo-comment-event-${i}`, kind: "评论和@", from: i % 2 ? "qing" : "man", noteId: `daily-${i + 1}`, commentId: `daily-${i + 1}-reply${i % 2 ? "-2" : ""}`, text: i % 2 ? "喜欢这种慢慢来的日子" : "这个周末一起去吧！", quote: i === 0 ? "下午一起去吗？" : "", date: `10-${23 - i}`, friend: i % 3 === 0 })));
  d.followers = [...["man", "sen", "qing", "photo-group", "book-group", "walk-group", "weekend-group"].map((id, i) => ({ id, date: `10-${24 - i}`, mutual: i % 2 === 0 }))];
  d.topics = ["周末去哪儿", "我的日常", "杭州咖啡", "生活记录", "散步日常", "一人食"];
  for (const r of p.ownComments) {
    const n = d.notes.find(n => n.id === r.noteId);
    n.replies.push({ ...r, likes: 0, actor: "lin" });
  }
  const avatars = { lin: "youth:avatar", man: "youth:records", sen: "youth:gig", qing: "youth:zine" };
  d.accounts.forEach(a => { if (avatars[a.id]) a.avatar = avatars[a.id]; });
  Object.assign(d.accounts.find(a => a.id === "man"), { bio: "翻唱片，听现场。" });
  Object.assign(d.accounts.find(a => a.id === "sen"), { bio: "周末在演出现场。" });
  Object.assign(d.accounts.find(a => a.id === "qing"), { bio: "做小刊，也拍照。" });
  const legacyThemes = { cafe: 3, mountain: 0, room: 4, food: 6, outfit: 2, flowers: 7, sea: 1 };
  for (const n of d.notes) {
    // Earlier capture defaults shared a single empty array. Every note owns its tree.
    n.replies = structuredClone(n.replies || []);
    if (Object.hasOwn(legacyThemes, n.id)) {
      const [image, title, category, body] = themes[legacyThemes[n.id]];
      const ownComments = n.replies.filter(r => r.id?.startsWith("my-comment-"));
      Object.assign(n, { images: [image], title, category, body, tags: [category, "周末不宅家"], replies: ownComments, demo: true, comments: 0 });
    }
    const albums = {
      "youth:skate": ["youth:skate", "youth:skate-board", "youth:skate-friends"],
      "youth:street": ["youth:street", "youth:street-detail", "youth:street-night"]
    };
    if (!n.video && n.images.length === 1 && albums[n.images[0]]) n.images = [...albums[n.images[0]]];
    // Feed covers may be cropped; the detail viewer uses the actual photo geometry.
    if (n.images[0]?.startsWith("youth:")) n.detailRatio = "1 / 1";
    if (["live-cat", "live-call"].includes(n.id)) {
      n.detailImages = [`ios:detail-${n.id.slice(5)}`];
      n.detailRatio = "558 / 753";
    }
    if (n.id === "herb-food") {
      n.images = ["ios:food-detail-1-media", "ios:food-detail-2-media", "ios:food-detail-3-media"];
      n.detailImages = [...n.images];
      delete n.totalImages;
    }
    if (n.id === "night") {
      n.images = ["ios:night-1-media"];
      n.detailRatio = "1206 / 541";
    }
  }
  const conversations = {
    "live-cat": ["这张 live 有种下一秒小猫就要跑出来的感觉", "拍完才发现它一直盯着镜头看", "耳朵动的那一下好可爱", "我家那只一看到相机就转身"],
    "live-call": ["这个分享有完整回放吗", "可以先看笔记里的要点，回放我找到再补", "对工具和工作流那段很有共鸣", "已经记下几个想试的方向"],
    "live-portfolio": ["想看你怎么组织项目过程的", "我会把调研、尝试和最后的方案放在一起", "比起最终稿，更想知道中间怎么取舍", "做好了记得踢我一下"],
    "live-intern": ["现在开始整理作品集还来得及吗", "先把最完整的两个项目讲清楚，再慢慢补", "投递日期真的要单独记一下", "祝大家都能收到喜欢的 offer"],
    night: ["地下现场这个空间好特别", "灯光配合音乐的那一段特别有意思", "想知道从哪个地铁口出来更近", "下次演出还想来"],
    labo: ["这家店的陈列和灯光都好舒服", "很适合慢慢逛，香味可以一款款试", "先收藏，下次去厦门安排上", "门口那一小块也很好拍"],
    ants: ["这台机子周末要排队吗", "晚饭前来人会少一点", "我也在练这首，最后一段真的难", "打完出来天都黑了"],
    "herb-food": ["两个人点一锅够吃吗", "我们点了鸡煲再加两份配菜，刚刚好", "看起来汤底很浓，想拌饭", "我喜欢最后再下一点青菜"],
    weeknd: ["夜里走路听 After Hours 太对了", "尤其是最后几首，连着听感觉不一样", "最近一直循环 Save Your Tears", "这张封套也想收一份"],
    super: ["想试试把自己的小项目也还原一遍", "先量字号和间距，最后再看叠图", "交互闭环比单张截图难很多", "希望后面能补更多状态的示例"],
    wood: ["大银幕看这一部真的很震撼", "画面里的颜色和人物站位都值得细看", "看完还想找幕后再看一遍", "这几帧的构图太有力量了"],
    acid: ["第一次知道这个声音来自 303", "听的时候可以留意滤波器开合的变化", "收藏了，晚上戴耳机再听一遍", "低频出来的那一下太上头"],
    notion: ["从自己的需求开始做工具，这点很有启发", "能一直把一个细节做下去很难得", "最常用的还是笔记和简单数据库", "想看早期版本是什么样的"],
    "my-truck": ["新手也可以来这个场地吗", "可以，旁边有平地，先练推行和刹车", "这个光线拍板好好看", "下次来一起练！"],
    "my-portrait": ["这一套的比例好舒服", "裤脚稍微堆一点，走起来也方便", "银色耳机是点睛之笔", "想问问皮衣的尺码"]
  };
  const categoryComments = {
    设计: ["这个图形是怎么从草稿变出来的", "我先做了几版小样，再慢慢缩减颜色", "想看看过程图", "这一版的层次很舒服"],
    音乐: ["最近也在反复听这一段", "现场和耳机里听是两种感觉", "周末听歌计划有了", "下次一起去"],
    穿搭: ["整套搭在一起很舒服", "最常穿的还是宽松的这几件", "想参考一下这个配色", "鞋子和裤脚的比例刚刚好"],
    美食: ["想问问这个分量够两个人吗", "看饭量，我们还加了一份小吃", "已经开始饿了", "下次路过一定试试"]
  };
  const demoTopics = {
    "live-cat": ["猫咪", "日常"], "live-call": ["设计", "分享"],
    "live-portfolio": ["作品集", "设计"], "live-intern": ["秋招", "设计实习"],
    labo: ["香水", "厦门"], "herb-food": ["上海美食", "鸡煲"]
  };
  for (const n of d.notes) {
    // Missing capture metadata uses explicitly marked demo values, never an
    // asserted publication date or IP from the original post.
    if (!n.date || !n.location) {
      n.metadataDemo = true;
      n.date ||= "2天前";
      n.location ||= "浙江";
    }
    if (!n.tags.length && demoTopics[n.id]) {
      n.tags = [...demoTopics[n.id]];
      n.metadataDemo = true;
    }
    if (!n.replies.length || n.replies.every(r => r.id?.startsWith("my-comment-"))) {
      const lines = conversations[n.id] || categoryComments[n.category] || [
        `看完「${n.title}」，想知道你最喜欢哪个细节`,
        "最喜欢的是亲自去试的过程，照片只记录了一部分",
        "先记下来，下个周末去试试",
        "这个角度看很有意思"
      ];
      n.replies.unshift(
        { id: `${n.id}-seed-1`, name: "小满", avatar: avatars.man, text: lines[0], likes: 12, date: "昨天 浙江", children: [
          { id: `${n.id}-seed-1-author`, name: n.author, avatar: n.avatar, author: true, text: lines[1], likes: 3, date: "昨天 浙江" }
        ] },
        { id: `${n.id}-seed-2`, name: "青禾", avatar: avatars.qing, text: lines[2], likes: 6, date: "昨天 上海" },
        { id: `${n.id}-seed-3`, name: "阿森", avatar: avatars.sen, text: lines[3], likes: 2, date: "今天 浙江" }
      );
      // A subset includes image replies, mirroring the supplied comment-flow recording.
      if (["live-portfolio", "night", "my-truck", "weeknd"].includes(n.id)) n.replies[1].image = n.id === "live-portfolio" ? "youth:zine" : n.id === "my-truck" ? "youth:skate" : "youth:gig";
    }
    const normalize = (rows, path) => rows.map((r, i) => {
      r.id ||= `${path}-${i}`;
      r.avatar = r.name === me.name ? me.avatar : ({ flowers: "youth:avatar", mountain: "youth:gig", sea: "youth:records", dog: "youth:zine", outfit: "youth:street" }[r.avatar] || r.avatar);
      r.date ||= "昨天 浙江";
      if (r.children) normalize(r.children, r.id);
      return r;
    });
    normalize(n.replies, `${n.id}-seed`);
    const count = rows => rows.reduce((sum, r) => sum + 1 + count(r.children || []), 0);
    if (!["crab", "kai"].includes(n.id)) n.comments = count(n.replies);
    if (n.avatar === "flowers") n.avatar = me.avatar;
  }
  d.notifications.filter(e => e.kind === "评论和@").forEach(e => {
    const n = d.notes.find(n => n.id === e.noteId);
    e.text = n.replies.find(r => r.id === e.commentId)?.text || e.text;
  });
  d.topics = ["周末去哪儿", "街头摄影", "黑胶唱片", "独立出版", "滑板日常", "深夜食堂"];
  // Discovery uses the real cover assets supplied in the recordings. Keep
  // existing note IDs for saved notes, local messages and other tabs.
  const discoveryCopy = {
    "local-art": { category: "设计", tags: ["图形设计", "国美", "纸上练习"], body: "把字、线条和色块放在纸上反复试。\n比起电脑里的预览，更喜欢这些作业摊开在桌上的样子。" },
    "author-talk": { category: "城市", tags: ["天目里", "周末散步", "杭州"], body: "走进天目里，才发现一块木板和几张椅子也能成为活动现场。\n留一点空白给路过的人，也留一点给临时发生的事。" },
    wood: { category: "电影", tags: ["电影", "黑泽明", "画面笔记"], body: "重新翻到《乱》的画面。\n人物、衣服和环境里的颜色放在一起，安静看一会儿也很有意思。" },
    acid: { category: "音乐", tags: ["电子音乐", "Acid", "声音笔记"], body: "今天从一个声音开始听：TB-303。\n旋钮慢慢转，声音也跟着变化。把这页留下，听歌时再回头对照。" },
    work: { category: "艺术", tags: ["艺术", "讲座", "创作过程"], body: "记下一场关于创作过程的分享。\n作品最后长成什么样之外，也想看看那些草稿、图表和还没整理完的想法。" },
    "author-drama": { category: "城市", tags: ["天目里", "戏剧", "周末计划"], body: "周末留一个下午给社区戏剧节。\n在熟悉的地方坐一会儿，看看演出，也看看身边的人。" }
  };
  for (const [id, copy] of Object.entries(discoveryCopy)) {
    const n = d.notes.find(n => n.id === id);
    Object.assign(n, copy, { copyDemo: true });
    const lines = {
      "local-art": ["纸上排开来看好舒服", "实物的颜色和屏幕里确实不一样"],
      "author-talk": ["喜欢这种临时发生的小活动", "周末散步时可以顺路看看"],
      wood: ["这些颜色真的很耐看", "想把这几帧留下来慢慢看"],
      acid: ["边听边看这页，清楚多了", "声音一点点变的那段很有意思"],
      work: ["比起成品更想看中间的草稿", "能看到思路怎么慢慢变化很有帮助"],
      "author-drama": ["想去坐一下午", "这种社区活动挺舒服的"]
    }[id];
    n.replies = n.replies.map((r, i) => ({
      ...r, text: lines[i % lines.length],
      children: r.children?.map(c => ({ ...c, text: "有空就慢慢看，不用赶着看完。" }))
    }));
  }
  d.iosFeed = ["labo", "live-cat", "night", "local-art", "author-talk", "wood", "herb-food", "acid", "work", "author-drama"];
  d.discoveryRevision = "recorded-curation-light-20261025";
})();
