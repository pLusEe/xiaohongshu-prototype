# 小红书社区互动原型

以「公开赞过 → 共同兴趣 → 主动交流」为核心的本地交互原型。使用 HTML、CSS 和原生 JavaScript，包含首页、笔记、主页、共同赞过、共同关注、分享与聊天。

## 运行

下载或克隆整个仓库后，在外部 Chrome 打开 `index.html`，无需安装依赖或构建。保留 `assets/` 与页面文件的相对位置。

也可以在仓库目录运行：

```bash
python3 -m http.server 8080
```

然后打开 `http://localhost:8080/`。

## 体验入口

- `index.html#/feed`：发现首页。
- `index.html#/profile/lin/liked/notes`：自己的赞过，支持全部/公开筛选。
- `index.html#/kindred`：找同好。
- `index.html#/profile/author-work/liked`：他人公开赞过。
- `index.html#/note/herb-food`：多图笔记。
- `index.html#/messages`：本地消息与聊天。

空心表示未点赞，红心表示私密点赞，黄心表示公开点赞。普通点击切换点赞，长按、右键或 Shift+F10 打开管理菜单。普通新点赞默认私密，公开需要主动操作。

当前包含96篇笔记及演示人物。关注、赞藏、公开状态和消息通过当前浏览器的 Local Storage 保存，当前存储键为 `xhs-community-public-likes-v1`。演示回复由用户主动触发，不连接真实账号、消息服务或推荐系统。`file://` 下的分享图片按需读取本地预制资源。

## 文件

| 文件或目录 | 用途 |
| --- | --- |
| `index.html`、`app.js` | 页面入口、导航、笔记、分享及交互状态 |
| `community-ui.js`、`supplement-ui.js`、`social-ui.js` | 主页、消息与社区互动 |
| `*-data.js`、`data.js` | 笔记、人物及演示关系 |
| `*.css` | 界面布局、状态和响应式适配 |
| `assets/` | 本地图片、视频、图标、字体、分享图及来源清单 |
| `public-likes-contract.md` | 当前行为、修订边界和验证记录 |
| `reference/`、`verification/` | 历史参考截图与验证材料 |

## 素材与验证边界

部分界面资产取自用户提供的录屏或截图；新增演示照片为生成素材。对应来源、裁切和处理信息保存在各素材目录的 `source-manifest.json` 或专项来源清单中。照片内的置顶与地点控件已分离为独立界面元素；原图遮挡区域的局部处理不代表无损恢复。

原型按402×874基线适配桌面和小屏。已完成的浏览器验证记录见 `public-likes-contract.md`；没有进行 iPhone 真机最终验收。较早的说明和截图保留作历史依据，当前行为以代码与最新契约为准。

本仓库用于设计探索与演示，不是小红书官方产品。所含第三方素材的权利归原权利人，仓库未授予额外使用许可。
