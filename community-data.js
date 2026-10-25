/* Recorded states omitted in the first pass. Source frames listed separately. */
(() => {
  const d = window.XHS_DATA;
  const me = d.accounts.find(a => a.id === "lin");
  me.name = "伊势杏太"; me.avatar = "ios:my-avatar"; me.bio = "食厌馅饼";
  const c = (id, name, avatar, text, likes, date, extra = {}) => ({ id, name, avatar: `ios:${avatar}`, text, likes, date, ...extra });
  const kaiReplies = [
    c("kai-dada", "咕咕咕咕", "avatar-dada", "？汇总个啥呢，今年小红书都还没开始，啥叫8.8正式批启动了💩", 8, "09-05 浙江", {
      seedLiked: true, emojiImage:"ios:emoji-dada", plainText:"？汇总个啥呢，今年小红书都还没开始，啥叫8.8正式批启动了", children: [c("kai-dada-reply", "咕咕咕咕", "avatar-dada", "搬运完别人的能不能自己审核一遍", 0, "09-05 浙江")]
    }),
    c("kai-mumu", "木木", "avatar-mumu", "可以内推吗🫂", 5, "09-10 浙江", {emojiImage:"ios:emoji-mumu",plainText:"可以内推吗"}),
    c("kai-offer", "offer上岸", "avatar-offer", "🐽🐽🐽🐽", 3, "09-08 河南", {emojiImage:"ios:emoji-offer",plainText:""})
  ];
  const crabReplies = [
    c("crab-holy", "🐟看看泥得", "avatar-holy", "holy° 蟹", 59700, "10-05 江苏", {
      seedLiked: true, image: "ios:comment-blob", authorLiked: true,
      children: [c("crab-sally", "Sally能等多久", "avatar-sally", "天才", 2538, "10-05 河北", { moreReplies: 3282 })]
    }),
    c("crab-author", "小红薯628FE570", "avatar-crab", "评论区不语，只是一味的艾特🐽", 7114, "10-06 广东", {
      author: true, image: "ios:comment-fish",
      children: [c("crab-kaine", "KAINE.", "avatar-kaine", "我的天🐻甚至还有五官🐻有点吓人了", 8880, "10-06 河南")]
    })
  ];
  const base = { captured: true, detailVerified: false, profileAsset: true, category: "推荐", ratio: "3 / 4", tags: [], body: "", replies: [], comments: 0, saves: 0, location: "", date: "" };
  const newNotes = [
    { id: "kai", title: "27届各大厂秋招时间线＋开奖时间", author: "Kai科技说", avatar: "ios:avatar-kai", likes: 470, saves: 477, comments: 7, ratio: "1 / 1", images: [], detailVerified: true,
      body: "", tags: ["秋招有路子", "大厂", "互联网大厂实习", "互联网大厂", "秋招提前批", "秋招", "求职", "大厂秋招"],
      date: "编辑于 09-05", location: "四川 已声明原创", group: "群聊  大厂ai分享群 (38)", replies: kaiReplies, noGallery: true },
    { id: "crab", title: "这个螃蟹怎么了", author: "小红薯628FE570", avatar: "ios:avatar-crab", likes: 71000, saves: 7638, comments: 15000,
      ratio: "402 / 138", images: ["ios:crab-photo"], detailVerified: true,
      body: "这是什么，贴纸印出来的吗。", tags: ["梭子蟹", "实现螃蟹自由", "大闸蟹"], date: "09-30", location: "广东", replies: crabReplies },
    { id: "super", title: "像素级复刻任意手机APP/现已开源", author: "Yilin Jing", avatar: "ios:avatar-super", likes: 405, ratio: "194 / 147", images: ["ios:super-cover"] },
    { id: "wood", title: "🎬 黑泽明拍《乱》时，视力正在衰退。", author: "秋月白", avatar: "ios:avatar-wood", likes: 7085, images: ["ios:wood-cover-media"], detailRatio: "582 / 777", recordedVideoCover: true },
    { id: "acid", title: "酸性/Acid是什么？来自RolandTB303的声音", author: "电子音乐杂志", avatar: "ios:avatar-acid", likes: 2723, images: ["ios:acid-cover-media"], detailRatio: "582 / 600" },
    { id: "notion", title: "乌鲁木齐出生的他，做出了上亿人用的notion", author: "sff", avatar: "ios:avatar-notion", likes: 999, images: ["ios:notion-cover"] },
    { id: "resonance", title: "", author: "", avatar: me.avatar, likes: 0, ratio:"194 / 117", images:["ios:resonance-partial"], partialCapture:true, body:"录屏仅显示了这张笔记封面的局部，标题和详情未采集。" },
    { id: "work", title: "如何展示你的理论工作", author: "邱志杰Qiu Zhijie", avatar: "ios:avatar-work", likes: 809, images: ["ios:work-cover"] },
    { id: "momo", title: "漕河泾公寓看房日记📒", author: "momo🐣", avatar: "ios:avatar-momo", likes: 1080, images: ["ios:momo-cover"] },
    { id: "my-truck", title: "", author: me.name, avatar: me.avatar, likes: 673, images: ["ios:my-truck-media"], detailRatio: "582 / 693", recordedVideoCover: true },
    { id: "my-portrait", title: "", author: me.name, avatar: me.avatar, likes: 1770, images: ["ios:my-portrait"] }
  ].map(n => ({ ...base, ...n }));
  d.notes.push(...newNotes);
  d.myProfile = {
    name: me.name, id: "2630319539", location: "浙江", bio: me.bio,
    following: 891, followers: 135, received: 1143,
    noteIds: ["my-truck", "my-portrait"], likedIds: ["super", "wood", "acid", "notion", "resonance"],
    savedIds: ["work", "momo"],
    counts: { notes: 4, allComments: 173, publicComments: 0, savedNotes: 385, albums: 9, topics: 13, music: 1, likedNotes: 5205, likedComments: 571 },
    likedComments: [{ noteId: "kai", commentId: "kai-dada" }, { noteId: "crab", commentId: "crab-holy" }],
    ownComments: [
      { id: "my-comment-1", name: me.name, avatar: me.avatar, text: "评论区的那位", quote: "@虾仁不蘸盐：从谁家买的呢？", sourceTitle: "🎣", noteId: null, date: "10-14 浙江", public: false },
      { id: "my-comment-2", name: me.name, avatar: me.avatar, text: "还有在租吗", quote: "@bobobo：未来之光房东直租 无中介费 可长租 可短...", sourceTitle: "来自用户名已成仙", noteId: null, date: "09-25 浙江", public: false }
    ]
  };
  d.commentFixtures = { kai: kaiReplies, crab: crabReplies };
  d.notifications = [
    { id: "received-like", kind: "赞和收藏", from: "man", noteId: "my-truck", text: "赞了你的笔记", date: "昨天" },
    { id: "received-comment", kind: "评论和@", from: "man", noteId: "crab", commentId: "crab-holy", text: "holy° 蟹", date: "10-05" }
  ];
  const additional = [
    { id:"local-art",title:"大二国美图形课结课!",author:"豆汁儿丸子",avatar:"ios:local-avatar-art",likes:145,images:["ios:local-art-media"],detailRatio:"582 / 691",mediaLocation:{name:"中国美术学院（良渚校区）",distance:"373m"} },
    { id:"local-steel",title:"杭州曾经的那些大厂，现在的地标打卡地!",author:"杭行者",avatar:"ios:local-avatar-steel",likes:597,images:["ios:local-steel"] },
    { id:"local-potion",title:"感觉是杭州目前断层好喝的女巫毒药。。。",author:"",avatar:"ios:local-avatar-art",likes:0,images:["ios:local-potion"] },
    { id:"local-event",title:"自由人生 · 搞钱大会 3.0",author:"50人已报名",avatar:"ios:local-avatar-art",likes:0,images:["ios:local-event"],ratio:"194 / 196",body:"明天 周日 14:00\n智慧网谷小镇 · 拱墅区" },
    { id:"author-drama",title:"请坐！天目里首届社区戏剧节来了🎭",author:"天目里展演小助手",avatar:"ios:avatar-night",likes:34,images:["ios:author-drama-media"],pinned:true,detailRatio:"582 / 777" },
    { id:"author-talk",title:"我就说在天目里能触发奇遇吧",author:"天目里展演小助手",avatar:"ios:avatar-night",likes:39,images:["ios:author-talk-media"],pinned:true,detailRatio:"582 / 731" }
  ];
  d.notes.push(...additional.map(n=>({...base,...n})));
  d.localFeed=["local-art","local-steel","local-potion","local-event"];
  d.accounts.push({id:"night-author",name:"天目里展演小助手",avatar:"ios:avatar-night",bio:"天目里演出指南",authorPeer:true});
})();
