/* 本轮资产均裁自用户的 iPhone 录屏，坐标与时间见 assets/ios/source-manifest.json。 */
(() => {
  const data = window.XHS_DATA;
  const common = {
    captured: true, category: "推荐", location: "", date: "",
    body: "", tags: [], replies: [], saves: 0, comments: 0,
    ratio: "3 / 4", detailVerified: false
  };
  const captured = [
    { id: "live-cat", title: "感受到了live 的生命力", author: "七个鱼丸", avatar: "ios:avatar-cat", likes: 296, images: ["ios:cover-cat"] },
    { id: "live-call", title: "给姚顺雨打call", author: "Liu yang🍒", avatar: "ios:avatar-call", likes: 50, images: ["ios:cover-call"] },
    { id: "live-portfolio", title: "我想开源我的作品集🤔", author: "日常的萝卜的日常", avatar: "ios:avatar-portfolio", likes: 113, images: ["ios:cover-portfolio"] },
    { id: "live-intern", title: "7月末就开始投秋招了", author: "零音音.", avatar: "ios:avatar-intern", likes: 7, images: ["ios:cover-intern"] },
    {
      id: "night", title: "地下声场加载中⚡️⚡️⚡️", author: "天目里展演小助手",
      avatar: "ios:avatar-night", likes: 11, saves: 2, comments: 0,
      ratio: "402 / 182", images: ["ios:night-1"], cover: "ios:cover-night",
      detailVerified: true, audio: "天目里展演小助手的原声",
      body: "DRAMA，正在地下发生。\n\n测试进行中，剧透一下。\n\n《丢包城市2：DRAMA!》\n10.24  21:00—24:00\n杭州地铁古墩路站 · 天目里60米超级大屏\n\n明晚，地下见。",
      tags: ["天目里", "电子音乐", "候场社区戏剧节", "电子音乐", "audiovisual", "丢包城市2", "音乐不停歇"],
      collection: "合集  请坐 | 演出", venue: "天目里", venueInfo: "4.8分  商场  西溪 11.8km"
    },
    { id: "labo", title: "LE LABO in 厦门！！", author: "immeilin", avatar: "ios:avatar-labo", likes: 295, images: ["ios:cover-labo"] },
    { id: "ants", title: "堆肥一天螃蟹就熟了，鱼肠不见踪影", author: "市民李先生", avatar: "ios:avatar-ants", likes: 1428, images: ["ios:cover-ants"], video: true },
    {
      id: "herb-food", title: "上海养生局天花板✨草本鸡煲直接封神！！",
      author: "野生小丸", avatar: "ios:avatar-food", likes: 57, saves: 47, comments: 20,
      images: ["ios:food-1", "ios:food-2", "ios:food-3"], cover: "ios:cover-food",
      body: "世纪大道新开的！ 跟男朋友随便 walk in 的这家草本\n鸡煲 直接原地大补🔥\n现切吊龙、 生蚝、 鸡腰、 牛鞭全给对象安排上",
      detailVerified: true, totalImages: 18
    }
  ].map(n => ({ ...common, ...n }));
  // 保留原演示笔记和已保存消息的 noteId；默认首页展示录屏中的内容。
  data.notes = [...captured, ...data.notes.map(n => ({ ...n, legacy: true }))];
  data.iosFeed = captured.map(n => n.id);
  data.iosIcons = Object.fromEntries(["back", "share", "search", "like", "collect", "comment", "pencil"].map(n => [n, `assets/ios/${n}.png`]));
  Object.assign(data.iosIcons, {
    friends: "assets/ios/feed-menu.png", liked: "assets/ios/like-red.png",
    "liked-public": "assets/community/like-public.png",
    collected: "assets/ios/collect-yellow.png", "like-small": "assets/ios/like-small.png"
  });
  // Exact source PNG bytes; no extra image request for filled state icons.
  data.iosIcons["liked"] = "data:image/png;base64,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";
  data.iosIcons["liked-public"] = "data:image/png;base64,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";
})();
