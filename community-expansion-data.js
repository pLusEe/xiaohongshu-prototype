/* Fictional demo community. Image prompts and generation sources are recorded
   in assets/community/source-manifest.json. Existing note IDs stay stable. */
(() => {
  const d = window.XHS_DATA;
  const people = [
    ["lin", "ee", "lin", "拍到什么就发什么", "浙江"],
    ["man", "Kyo.", "man", "唱片买了，柜子还没买。", "上海"],
    ["sen", "404号台灯", "sen", "出没于小场地 / 偶尔发糊图", "浙江"],
    ["qing", "pomi", "qing", "纸、油墨、一些没做完的东西", "上海"],
    ["reader-yu", "momo（耳鸣版）", "yu", "这周的耳塞又忘带了", "浙江"],
    ["reader-xia", "夹心海苔", "xia", "存图很多，动手很慢", "上海"],
    ["reader-zhi", "pp不吃香菜", "zhi", "走到哪算哪 / 咖啡不加糖", "浙江"],
    ["reader-bai", "一颗饭粒", "bai", "猫的照片比我的多", "江苏"],
    ["creator-record", "B面放完了", "record", "二手唱片 / 家庭试听\n有空就翻一翻箱子", "上海"],
    ["creator-print", "套印有点歪", "print", "纸上实验，偶尔接点小活。", "浙江"],
    ["creator-walk", "楼下还没关门", "walk", "杭州步行记录\n有些店只想自己知道", "浙江"],
    ["creator-photo", "Rui_29", "photo", "小相机直出，拍糊了也发。", "福建"]
  ];
  const previous = new Map(d.accounts.map(a => [a.name, a.id]));
  for (const [id, name, image, bio, location] of people) {
    let a = d.accounts.find(a => a.id === id);
    if (!a) { a = { id }; d.accounts.push(a); }
    Object.assign(a, {
      name, avatar: `community:avatar-${image}`, bio, location,
      socialPeer: id !== "lin", creator: id.startsWith("creator-"),
      redId: String(671803920 + people.findIndex(p => p[0] === id) * 37019),
      followers: [135, 327, 89, 641, 208, 916, 183, 74, 4602, 1376, 2901, 863][people.findIndex(p => p[0] === id)]
    });
  }
  // [stable note ID, title, topic, author ID, matching photo subject, body]
  const entries = [
    ["daily-1","终于在天黑前滑完了","滑板","lin","a scuffed skateboard lying on an empty concrete skatepark at dusk, navy sky, one street lamp","今天没练新动作，只把老动作重新做了一遍。收板的时候天刚好黑了。"],
    ["daily-2","站最后一排，照样听爽","音乐","reader-yu","back row view of an intimate live music venue, silhouettes of audience, red stage lights and a small drummer, candid grainy concert photograph","离舞台远一点，鼓和贝斯反而听得更清楚。最后一首所有人都没急着走。"],
    ["daily-3","降温后把这双鞋翻出来了","穿搭","lin","worn silver running sneakers and dark indigo baggy jeans seen from above on a wet pavement, casual outfit detail","鞋是真的旧，穿着也是真的舒服。最近出门基本都靠它。"],
    ["daily-4","十块钱区也能翻出好东西","音乐","man","hands flipping used vinyl records in a narrow secondhand record shop, cream paper sleeves with abstract photographs, no readable lettering","在最下面那格蹲了半小时。回家听，B面比A面更喜欢。"],
    ["daily-5","试印废纸先别扔","设计","qing","blue and fluorescent orange risograph offcuts on a messy studio worktable, abstract geometric ink shapes and scissors","边角拼一拼，居然比认真做的那版顺眼。先夹进本子里留着。"],
    ["daily-6","投了三个币，快乐一晚上","游戏","reader-bai","closeup of illuminated arcade cabinet controls with red and blue buttons in an old small game arcade, no people","手速跟不上脑子，但这台机子的按键手感太好了。"],
    ["daily-7","散场还开着的面馆就是好面馆","美食","reader-zhi","a steaming bowl of ramen noodles with scallions on a narrow stainless steel counter late at night, candid diner photograph","进去的时候老板已经在收椅子，还是给我们煮了两碗。热汤真的救命。"],
    ["daily-8","这张糊得刚刚好","摄影","lin","rainy city intersection at night seen through bus window, blue reflections and warm street lamps, intentionally slightly out of focus","车一动就拍糊了。回来翻相册，反而最喜欢这一张。"],
    ["daily-9","轮子比人先到","滑板","sen","closeup of scratched skateboard trucks and cream wheels on rough grey concrete, small leaves nearby","轮子转得很快，人还在原地。今天主要练的是耐心。"],
    ["daily-10","鼓手今晚也太忙了","音乐","reader-yu","side view of drum kit and cymbals in a tiny dark club with dim amber light, musician blurred in background","第一次站在侧面听，才发现好多细碎的声音都是现场打出来的。"],
    ["daily-11","今天不想背大包","穿搭","reader-xia","black small nylon shoulder bag with a silver keychain laid on faded grey sweater, casual room photograph","只装钥匙、耳机和一小包纸。轻一点出门真的会多走两步。"],
    ["daily-12","给朋友挑唱片比自己买还纠结","音乐","man","two vinyl album sleeves with abstract monochrome artwork on a wooden record store listening desk next to headphones, no readable text","试听了四张，最后还是选了最开始拿起来的那张。"],
    ["daily-13","八页，折完刚好","设计","qing","tiny handmade zine with black abstract line drawings partly unfolded on a wooden desk next to a metal ruler","一张纸就能折出来。印歪的地方暂时就当作它自己的脾气。"],
    ["daily-14","留一张通关纪念","游戏","reader-bai","closeup of a hand resting beside colorful rhythm game buttons in a dim arcade, pink blue monitor glow, cropped screen with no readable text","最后一段终于没断，手都不敢乱动。拍完这张才想起来要呼吸。"],
    ["daily-15","两个人点了一桌碳水","美食","reader-zhi","dumplings on a white plate and two small noodle bowls on a red laminate table, overhead casual food photograph","说好随便吃点，菜单一翻开谁也没忍住。面和饺子都得趁热吃。"],
    ["daily-16","便利店的灯把夜晚接住了","摄影","lin","small illuminated neighborhood convenience store window at midnight, parked bicycle and empty pavement, realistic compact camera grain, no legible logos","走了很久回来，路口这家还亮着。买了一罐气泡水再上楼。"],
    ["daily-17","人不在，板占个座","滑板","sen","two scratched skateboards leaning against a low tiled wall with a half finished canned drink, evening outdoor snapshot","休息五分钟，坐下就起不来了。"],
    ["daily-18","返场的时候把手机收起来了","音乐","reader-yu","small empty microphone stand and electric guitar under deep blue stage light, intimate concert venue after show","只拍了开场。返场那首歌想认真听完，就没再拿手机。"],
    ["daily-19","衣服不多，洗衣服很勤","穿搭","reader-xia","white cotton t shirt and dark denim trousers drying by an open apartment window, afternoon sunlight and green curtain","常穿的就这几件，洗完晾干又穿上。窗边的风比烘干机好用。"],
    ["daily-20","雨天适合把B面也听完","音乐","man","black turntable spinning a vinyl record beside a rain streaked window, warm lamp and modest living room","之前总跳过的两首，今天突然听进去了。雨没停，唱片也没停。"],
    ["daily-21","装订线留长一点也行","设计","qing","hand stitched handmade booklet spine with long red thread on grey cutting mat, closeup analog photograph","第一次手工锁线，结打得不太好看。但书能平摊开，很满意了。"],
    ["daily-22","抓不到，就拍一张带走","游戏","reader-bai","a slightly wonky cream plush toy behind glass in a claw machine, reflections of fluorescent arcade lights","这个表情真的很像周一的我。抓了两次没抓到，算了，拍照也是拥有。"],
    ["daily-23","夜里十点的葱油拌面","美食","reader-zhi","simple bowl of scallion oil noodles with fried egg on a small home kitchen table at night, direct flash food snapshot","冰箱只剩一个蛋，刚好够。面拌开的时候觉得今天也没那么糟。"],
    ["daily-24","桥下这一段风很大","摄影","lin","concrete riverside walkway beneath a city bridge, one bicycle and late afternoon water reflections, candid urban photography","从桥上走到桥下，声音一下子安静很多。适合没事走一圈。"],
    ["extra-01","猫先替我试了新椅子","萌宠","reader-bai","grey tabby cat curled asleep on a faded navy fabric chair beside a bright window","椅子刚装好两分钟，已经变成猫窝。我坐地上也行。"],
    ["extra-02","这家窗边只放得下一张桌子","咖啡","reader-zhi","tiny cafe window seat with a half finished espresso and silver spoon, green trees reflected in glass","位置只有一个，刚好没人。坐着把没读完的几页看完了。"],
    ["extra-03","一本没有急着买的书","阅读","reader-xia","open art photography book on a used bookstore shelf, paper edges and stacked colorful books, warm low light","在店里翻完了一半，决定下次再来。书店里待着本身就很舒服。"],
    ["extra-04","接下来一小时不用选歌了","音乐","creator-record","a vintage silver cassette deck with a clear cassette inserted, warm wooden shelf and black headphones","录满一面，顺序就不改了。听到哪首算哪首，省得一直切歌。"],
    ["extra-05","蓝色多叠一层会怎样","设计","creator-print","cyan blue abstract ink prints in three ink densities drying clipped on a studio wire, natural window light","同一块版印了三遍。第三遍有点脏，但纸的颗粒都出来了。"],
    ["extra-06","这个路口我绕了回来","城市","creator-walk","old Hangzhou neighborhood lane with tiled walls, a parked blue bicycle and leafy tree shadows","第一遍走过没注意，回头才看到这面墙。太阳再挪一点，影子就不在了。"],
    ["extra-07","相机没电之前的最后一张","摄影","creator-photo","empty seaside basketball court with faded green floor and rusted hoop, overcast coastal sky","还有一格电的时候开始舍不得拍。结果这张是随手按的。"],
    ["extra-08","旧唱片的内袋也很好看","音乐","creator-record","closeup of yellowed paper vinyl record inner sleeves with abstract blue circular designs on a dark table, no readable text","封套有点破，内袋倒是保存得很好。擦干净再慢慢听。"],
    ["extra-09","折一下就不是平面了","设计","creator-print","folded sculptural yellow paper with dramatic shadows on a plain grey studio table, experimental student paper model","原来一直纠结的线条，折起来反而找到了位置。"],
    ["extra-10","还没营业的菜市场","城市","creator-walk","quiet covered neighborhood vegetable market before opening, green plastic crates and rolled shutters, soft dawn light","起早只是因为睡不着。走到市场才发现卖菜的人比我更早。"],
    ["extra-11","雨停之后，颜色自己出来了","摄影","creator-photo","red brick wall and a single orange traffic cone reflected in a shallow puddle after rain, candid compact camera photograph","没调饱和度。湿掉的地面比墙本身还亮。"],
    ["extra-12","收到了一个很怪的杯子","日常","reader-xia","small irregular handmade ceramic mug with cobalt blue glaze on a white kitchen shelf, natural light","把手看起来不太聪明，握着还挺舒服。现在是每天早上的固定杯子。"],
    ["extra-13","猫：这个纸箱我全款拿下","萌宠","reader-bai","orange cat peeking over edge of a plain brown cardboard box in a cluttered real apartment, direct flash","新窝不睡，快递盒倒是住得明明白白。"],
    ["extra-14","耳塞这次真的放包里了","音乐","reader-yu","pair of translucent concert earplugs in an open small case on a black fabric bag, concert wristband nearby","上次散场耳朵嗡了一天。这次提前放好，希望出门能想起来。"],
    ["extra-15","试音时就知道今晚稳了","音乐","sen","closeup of small venue mixing desk with glowing amber knobs and cables, dim realistic backstage photograph","坐在调音台后面一小会儿。低频一出来，大家都抬头了。"],
    ["extra-16","一张票根舍不得扔","音乐","man","creased concert ticket stub with abstract unreadable print tucked inside a paperback book on a bed","收拾书的时候翻出来的。已经忘了那天回家坐的是哪班车，还记得安可。"],
    ["extra-17","把周末的一小时留给河边","城市","reader-zhi","riverside stone steps with fallen yellow leaves and a takeaway coffee cup, quiet autumn afternoon","从家走过去不用很久。坐一会儿再原路走回去，今天就算出过门了。"],
    ["extra-18","开着台灯印到最后一张","设计","qing","messy home printing desk under a green task lamp with abstract red ink stamps and offcut paper, evening photo","最后一张纸最舍不得下手。结果印完发现第一张最好看。"],
    ["extra-19","没带相机也可以拍","摄影","lin","closeup of rippling sunlight reflected onto a white apartment wall from a glass of water on a windowsill","端杯水经过的时候看到的。拍完太阳刚好被云挡住。"],
    ["extra-20","新鞋第一次出门就踩水了","穿搭","reader-xia","brown suede sneakers with small rain spots on wet square pavement tiles, overhead casual phone photograph","出门前还擦了一遍。现在好了，不用再小心翼翼了。"],
    ["extra-21","周日早饭可以吃到中午","美食","reader-bai","two pieces of toasted bread with soft scrambled eggs on a white plate, coffee and rumpled tablecloth, late breakfast","起得太晚，早饭和午饭合并。炒蛋放了一点牛奶，今天居然没炒老。"],
    ["extra-22","唱片机旁边不放水杯了","音乐","creator-record","overhead view of vinyl cleaning brush and record on a grey felt mat, home audio equipment corner","上次差点手滑。今天顺便把积灰的几张都擦了一遍。"],
    ["extra-23","换一张纸，像换了个文件","设计","creator-print","same abstract black shape printed on three different paper textures ivory kraft and grey, flat lay in daylight","纸张的颜色比预想影响大。牛皮纸这张先留下，其他再想想。"],
    ["extra-24","没走主路，碰到了这棵树","城市","creator-walk","large camphor tree growing beside an old grey apartment building, small alley and scattered fallen leaves","导航让我直走，我往右拐了一下。多走八分钟也挺值。"],
    ["extra-25","海边最喜欢的是阴天","摄影","creator-photo","quiet empty grey blue sea and a pale concrete breakwater on a cloudy day, subtle 35mm film grain","不用等日落，也不用找角度。一直看着水面就好了。"],
    ["extra-26","左边刚好能看到调音台","音乐","reader-yu","small live venue stage photographed from left side, mixing desk in foreground and purple light","这边能看到调音台。平时没注意到的小调整，这次都看见了。"],
    ["extra-27","周末从一碗热汤开始","美食","reader-zhi","small bowl of wonton soup with seaweed and scallions at an old neighborhood breakfast shop, wooden stool","店里就三张桌子，大家都低头吃。汤喝完再开始想今天去哪儿。"],
    ["extra-28","这张猫照没有对上焦","萌宠","reader-bai","slightly motion blurred black and white cat reaching toward camera on a home sofa, playful candid snapshot","但它这个表情值得留一张。后面清楚的十张反而都一个样。"],
    ["extra-29","两块布也能拿来夹书","设计","reader-xia","blue and red fabric scraps tucked into a paperback, close up natural light","手工剩下两块布料，先夹在书里。下次再做个正式的书签。"],
    ["extra-30","低音出来的时候杯子都在动","音乐","sen","half full clear plastic water cup on a small club speaker case, dark red stage glow in background","没拍台上，拍了桌上的水。坐这里确实离音箱太近，下次换个位置。"],
    ["extra-31","这一页不改了","设计","qing","open sketchbook showing blue pencil abstract shapes and taped paper samples on a home desk","改来改去又改回第一版。合上本子，先吃饭。"],
    ["extra-32","走到这里耳机刚好没电","城市","lin","empty pedestrian overpass with green metal handrails at blue hour, sparse car lights below","摘了耳机才听见下面车的声音。剩下这段路就这样走了。"],
    ["extra-33","这两张适合连着放","音乐","man","two vinyl records with muted burgundy and cream abstract labels beside a black turntable, evening room","前一张最后的鼓点接后一张开头，刚好不想按暂停。"],
    ["extra-34","窗帘一拉，家里像换了季节","家居","reader-zhi","sunlit small apartment with sheer green curtain and a wooden stool, lived in modest room, no people","只是换了块布，下午的光都变绿了。猫还在研究它能不能爬。"],
    ["extra-35","这卷拍完等了两个星期","摄影","creator-photo","contact sheet of small analogue coastal photographs beside a compact silver film camera on a desk, no legible text","冲洗之前已经忘了拍过什么。拿到照片像收到了两周前自己的消息。"],
    ["my-truck","板上的伤比我的多","滑板","lin","well worn skateboard deck with scratched colorful abstract graphics propped by a grey apartment doorway, direct flash","拍一张现在的样子。再过一个月估计又认不出来了。"],
    ["my-portrait","出门前的五分钟","日常","lin","silver wired headphones, dark green cap and house keys on a faded denim jacket on a chair, candid phone photograph","钥匙找了三分钟，耳机找了两分钟。最后还是踩点出的门。"]
  ];
  d.communityMedia = entries.map(([id, , , , subject]) => ({
    id, prompt: `Natural candid everyday photography, ${subject}. Realistic lived-in textures, restrained colors, imperfect personal snapshot, subtle grain. No watermark, no UI, no collage, no oversized text.`,
    image_size: "portrait_4_3"
  }));
  const themes = {
    音乐: ["这场我也在！", "你站哪边？我在调音台后面。"],
    设计: ["想看看另一面的样子", "下次翻出来再拍一张。"],
    摄影: ["用什么拍的呀", "随身那台小相机，基本没调色。"],
    美食: ["看完决定现在去吃饭", "趁热吃，比拍出来好吃。"],
    萌宠: ["表情像被迫加班的我", "它刚睡醒就是这个表情。"],
    城市: ["这种地方真的要靠走路才能遇到", "对，拐个弯才看见的。"]
  };
  for (const [i, [id, title, category, authorId, , body]] of entries.entries()) {
    const a = d.accounts.find(a => a.id === authorId);
    const existing = d.notes.find(n => n.id === id);
    const lines = themes[category] || ["这张好喜欢", "刚好那天看到了就拍下来。"];
    const commenter = d.accounts.find(a => a.id === (authorId === "man" ? "qing" : "man"));
    const n = {
      id, title, category, authorId, author: a.name, avatar: a.avatar,
      images: [`community:${id}`], cover: `community:${id}`, detailImages: [`community:${id}`],
      ratio: "3 / 4", detailRatio: "3 / 4", body, tags: [category, category === "音乐" ? "听歌日常" : "生活记录"],
      date: `${i < 6 ? "1天前" : `10-${String(24 - i % 21).padStart(2, "0")}`}`, location: a.location,
      likes: 17 + ((i * 137) % 2300), saves: 3 + ((i * 53) % 430), comments: 2,
      demo: true, captured: false, detailVerified: false, mediaDemo: true, video: false,
      replies: [{ id: `${id}-reply`, actor: commenter.id, name: commenter.name, avatar: commenter.avatar,
        text: lines[0], likes: 3 + i % 18, date: "昨天 浙江",
        children: [{ id: `${id}-reply-child`, name: a.name, avatar: a.avatar, actor: a.id, text: lines[1], likes: 1, date: "昨天 浙江", author: true }] }]
    };
    if (existing) Object.assign(existing, n); else d.notes.push(n);
    if (existing) delete existing.recordedVideoCover;
  }
  const legacyAuthors = {
    cafe: "creator-record", mountain: "sen", room: "creator-print", food: "reader-zhi",
    outfit: "reader-xia", flowers: "creator-photo", sea: "reader-yu", resonance: "reader-yu",
    ants: "reader-bai", siri: "creator-print", burial: "sen", schedule: "reader-yu", weeknd: "man"
  };
  for (const n of d.notes) {
    if (Object.hasOwn(legacyAuthors, n.id)) {
      const image = `community:legacy-${n.id}`;
      n.cover = image;
      n.images = [image, ...n.images.slice(1)];
      n.detailImages = [...n.images];
      n.detailRatio = "1 / 1";
      n.mediaDemo = true;
      n.captured = false;
    }
    n.authorId ||= legacyAuthors[n.id] || previous.get(n.author);
    if (n.authorId && d.accounts.some(a => a.id === n.authorId)) {
      const a = d.accounts.find(a => a.id === n.authorId);
      n.author = a.name; n.avatar = a.avatar;
    }
  }
  // Every note author resolves to their own profile, never to the current user.
  for (const n of d.notes) {
    if (n.authorId) continue;
    let a = d.accounts.find(a => a.name === n.author && !a.group);
    if (!a) {
      a = { id: `author-${n.id}`, name: n.author || "mo_o", avatar: n.avatar, bio: "", location: n.location || "浙江",
        redId: String(891005300 + d.accounts.length * 73), followers: 168 + n.likes % 3000, creator: true, socialPeer: true };
      d.accounts.push(a);
    }
    n.authorId = a.id;
  }
  const rename = { "林间": "ee", "林间散步": "Rui_29", "小满": "Kyo.", "青禾": "pomi", "阿森": "404号台灯", "阿屿": "momo（耳鸣版）", "夏末": "夹心海苔", "小枝": "pp不吃香菜", "白白": "一颗饭粒" };
  function fixRows(rows, n) {
    for (const r of rows || []) {
      if (r.author && n) { r.name = n.author; r.avatar = n.avatar; r.actor = n.authorId; }
      else if (rename[r.name]) {
        r.name = rename[r.name];
        const a = d.accounts.find(a => a.name === r.name);
        if (a) { r.avatar = a.avatar; r.actor = a.id; }
      }
      if (r.quote) for (const [oldName, name] of Object.entries(rename)) r.quote = r.quote.replaceAll(oldName, name);
      fixRows(r.children, n);
    }
  }
  d.notes.forEach(n => fixRows(n.replies, n));
  fixRows(d.myProfile.ownComments);
  d.seedMessages.forEach(m => { if (m.text) for (const [oldName, name] of Object.entries(rename)) m.text = m.text.replaceAll(oldName, name); });
  const me = d.accounts.find(a => a.id === "lin");
  Object.assign(d.myProfile, {
    name: me.name, bio: me.bio, id: me.redId, following: 0,
    noteIds: d.notes.filter(n => n.authorId === "lin").map(n => n.id),
    likedIds: ["night","labo","wood","acid","work","local-art","author-talk","author-drama","herb-food",
      "daily-2","daily-4","daily-5","daily-7","daily-10","daily-12","daily-13","daily-15","daily-18","daily-20",
      "extra-01","extra-02","extra-03","extra-04","extra-05","extra-06",
      "extra-07","extra-08","extra-09","extra-10","extra-11","extra-12","extra-13","extra-14","extra-15","extra-16","extra-17"]
  });
  d.demoPublicLikeIds = d.myProfile.likedIds.slice(0, 25);
  d.peerFollowingSeeds = {
    lin: ["man","sen","qing","creator-record","creator-print","creator-walk","creator-photo","night-author"],
    man: ["creator-record","creator-photo","night-author"],
    sen: ["creator-record","night-author"],
    qing: ["creator-print","creator-photo"],
    "reader-yu": ["creator-record","night-author","creator-photo","author-acid","author-wood"],
    "reader-xia": ["creator-print","creator-photo","author-work","author-local-art"],
    "reader-zhi": ["creator-walk","creator-record","author-labo","author-herb-food"],
    "reader-bai": ["creator-walk","author-cat","author-live-cat"],
    "creator-record": ["night-author","creator-photo"],
    "creator-print": ["creator-photo","creator-walk"],
    "creator-walk": ["creator-photo"],
    "creator-photo": ["creator-print","creator-record"]
  };
  const walls = {lin:"daily-8",man:"daily-20",sen:"extra-15",qing:"extra-18","reader-yu":"daily-18","reader-xia":"extra-03","reader-zhi":"extra-34","reader-bai":"extra-01","creator-record":"extra-04","creator-print":"extra-05","creator-walk":"extra-06","creator-photo":"extra-25"};
  const authorWalls = {
    "author-work": "extra-18", "author-local-art": "extra-05", "author-wood": "extra-24",
    "author-acid": "daily-20", "author-labo": "extra-34", "author-herb-food": "extra-19"
  };
  d.accounts.forEach(a => {
    a.wallpaper = walls[a.id] ? `community:${walls[a.id]}` : a.id === "night-author" ? "ios:author-wallpaper-reconstructed" : `community:${authorWalls[a.id] || "daily-8"}`;
    if (a.id === "author-work") a.profileAvatar = "ios:avatar-work-profile";
    a.redId ||= String(891005300 + d.accounts.indexOf(a) * 73);
    a.received = d.notes.filter(n => n.authorId === a.id).reduce((sum, n) => sum + n.likes + n.saves, 0);
  });
  d.myProfile.received = me.received;
  d.iosFeed = [...new Set([...d.iosFeed.slice(0, 6), ...entries.filter(([id]) => !id.startsWith("my-")).map(([id]) => id), ...d.iosFeed.slice(6)])];
  d.localFeed = [...new Set([...d.localFeed.slice(0, 4), ...d.notes.filter(n => n.location === "浙江" && n.id.startsWith("extra-")).map(n => n.id)])];
})();
