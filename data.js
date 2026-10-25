/* 演示内容独立于界面；来源见 assets/images/source-manifest.json。 */
window.XHS_DATA = {
  accounts: [
    { id: "lin", name: "林间", avatar: "flowers", bio: "记录一些普通又喜欢的日子。" },
    { id: "man", name: "小满", avatar: "cat", bio: "散步、喝咖啡，偶尔看海。" },
    { id: "sen", name: "阿森", avatar: "mountain", bio: "周末去山里。" },
    { id: "qing", name: "青禾", avatar: "dog", bio: "认真吃饭，好好生活。" }
  ],
  notes: [
    {
      id: "cafe", title: "杭州｜愿意为这个窗边坐一整个下午",
      author: "山野有来信", avatar: "sea", likes: 1286, saves: 536, comments: 42,
      category: "美食", ratio: "3 / 4", images: ["cafe", "latte", "room"],
      body: "周末无意间走进这家小店，窗外都是绿意。\n点了一杯拿铁，就这样看书、发呆，时间好像也慢下来了。\n很喜欢这种不用赶路的下午。☕️",
      tags: ["杭州咖啡", "周末去哪儿", "我的日常"], date: "昨天 16:28", location: "浙江",
      replies: [{ name: "小满", avatar: "cat", text: "这个窗边也太舒服了，下次一起去！", likes: 18 }, { name: "青禾", avatar: "dog", text: "光看照片就觉得很放松 ☀️", likes: 6 }]
    },
    {
      id: "cat", title: "我家小猫：周末谁都不许早起",
      author: "橘子今天睡醒了吗", avatar: "cat", likes: 8632, saves: 261, comments: 126,
      category: "萌宠", ratio: "1 / 1", images: ["cat"],
      body: "它真的很懂周末。\n从早上八点睡到下午两点，换个姿势继续睡。今天的愿望是成为一只小猫 🐈",
      tags: ["猫咪日常", "我的养宠生活", "橘猫"], date: "今天 09:16", location: "上海",
      replies: [{ name: "林间", avatar: "flowers", text: "这才是我理想中的周末", likes: 23 }]
    },
    {
      id: "mountain", title: "去山里待两天，整个人都充满电了",
      author: "阿森的山野日记", avatar: "mountain", likes: 2394, saves: 1208, comments: 37,
      category: "旅行", ratio: "3 / 4", images: ["mountain", "sea"],
      body: "早上推开窗，山间的雾还没有散。\n手机没有信号也没关系，听听鸟叫，走走山路，原来休息可以这么简单。",
      tags: ["川西旅行", "户外", "周末逃离城市"], date: "10-22", location: "四川",
      replies: [{ name: "青禾", avatar: "dog", text: "已经在计划下一个周末了", likes: 9 }]
    },
    {
      id: "room", title: "32㎡小家，住出了自己喜欢的样子",
      author: "慢慢布置的家", avatar: "flowers", likes: 956, saves: 842, comments: 28,
      category: "家居", ratio: "1 / 1", images: ["room", "flowers"],
      body: "不大，但是每一个角落都很喜欢。\n木色和白色慢慢搭在一起，再添一点植物，普通的出租屋也可以有家的感觉。",
      tags: ["小户型", "出租屋改造", "家的样子"], date: "10-23", location: "上海",
      replies: [{ name: "小满", avatar: "cat", text: "阳光是最好的装饰", likes: 12 }]
    },
    {
      id: "food", title: "下班回家十分钟，吃上一碗热乎饭",
      author: "青禾的饭桌", avatar: "dog", likes: 721, saves: 368, comments: 19,
      category: "美食", ratio: "1 / 1", images: ["food"],
      body: "番茄炒蛋盖饭永远是我的舒适区。\n番茄炒出汁，鸡蛋嫩一点，最后拌进米饭里。忙碌的一天也要好好吃饭。",
      tags: ["一人食", "家常菜", "下班吃什么"], date: "昨天 19:12", location: "北京",
      replies: [{ name: "林间", avatar: "flowers", text: "今天晚饭就吃这个！", likes: 4 }]
    },
    {
      id: "outfit", title: "秋天最常穿的，还是蓝衬衫",
      author: "今天穿简单一点", avatar: "outfit", likes: 1652, saves: 680, comments: 31,
      category: "穿搭", ratio: "3 / 4", images: ["outfit", "flowers"],
      body: "蓝色衬衫搭米白长裤，舒服又清爽。\n出门带一个帆布包，去街角买一束花。喜欢这种轻轻松松的日常穿搭。",
      tags: ["日常穿搭", "秋季穿搭", "蓝色衬衫"], date: "今天 11:32", location: "上海",
      replies: [{ name: "小满", avatar: "cat", text: "简单干净就很好看", likes: 7 }]
    },
    {
      id: "flowers", title: "散步时遇到的花，比计划里的还好看",
      author: "林间散步", avatar: "flowers", likes: 487, saves: 92, comments: 14,
      category: "旅行", ratio: "3 / 4", images: ["flowers", "sea"],
      body: "没有目的地，沿着小路一直走。\n转过弯就遇到了这一片花。原来开心可以是一件这么小的事。",
      tags: ["随手拍", "散步日常", "发现生活"], date: "10-22", location: "江苏",
      replies: [{ name: "阿森", avatar: "mountain", text: "秋天也有很好的花", likes: 5 }]
    },
    {
      id: "sea", title: "终于看到海了，什么也不做就很快乐",
      author: "小满去看海", avatar: "cat", likes: 3128, saves: 1405, comments: 58,
      category: "旅行", ratio: "4 / 3", images: ["sea", "mountain"],
      body: "坐在海边听了一下午的浪。\n没有行程表，没有必须打卡的地方。看着蓝色慢慢变深，就这样度过一天。",
      tags: ["海边", "旅行日记", "慢生活"], date: "10-21", location: "福建",
      replies: [{ name: "林间", avatar: "flowers", text: "好想一起去看海", likes: 13 }]
    }
  ],
  icons: {
    like: "xhs_theme_icon_like_grey_20.webp",
    liked: "xhs_theme_icon_liked_red_15.webp",
    collect: "xhs_theme_icon_collect_grey_20.webp",
    collected: "xhs_theme_icon_collected_yellow_20.webp",
    comment: "xhs_theme_icon_comment_grey_20.png",
    share: "xhs_theme_icon_share_grey_25.webp",
    back: "xhs_theme_icon_backarrow_grey_25.webp",
    search: "xhs_theme_icon_search_grey_25.png",
    more: "xhs_theme_icon_more_grey_25.webp",
    plus: "xhs_theme_icon_add_grey_25.webp",
    close: "xhs_theme_icon_cancel_black_25.webp",
    notificationLike: "xhs_theme_icon_message_like_42.webp",
    notificationComment: "xhs_theme_icon_message_comment_42.webp",
    notificationFollow: "xhs_theme_icon_message_friend_42.png",
    wechat: "xhs_theme_icon_wechat_green_48.png",
    moments: "xhs_theme_icon_more_moment_55.png",
    qq: "xhs_theme_icon_qq_blue_48.png",
    weibo: "xhs_theme_icon_more_weibo_55.png",
    image: "xhs_theme_icon_more_pic_55.png",
    check: "xhs_theme_icon_selected_red_17.webp",
    next: "xhs_theme_icon_forwardarrow_grey_15.webp",
    profile: "xhs_theme_icon_profile_grey_20.webp",
    friends: "xhs_theme_icon_addfriend_grey_20.png",
    link: "xhs_theme_icon_more_link_55.png",
    report: "xhs_theme_icon_more_report_55.png"
  }
};
