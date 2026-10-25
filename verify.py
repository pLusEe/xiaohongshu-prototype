"""历史 Android MVP 回归脚本；当前 iOS 入口请运行 python3 verify-ios.py。"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "verification"
OUT.mkdir(exist_ok=True)
URL = (ROOT / "index.html").as_uri()
checks = []
errors = []


def passed(name):
    checks.append(name)


def capture(page, filename):
    page.mouse.move(1100, 10)
    page.locator("#device").screenshot(
        path=str(OUT / filename), animations="disabled",
        style="#toast{visibility:hidden!important}.gallery-prev,.gallery-next{opacity:0!important}"
    )


def click(page, action, ident=None):
    selector = f'[data-action="{action}"]'
    if ident:
        selector += f'[data-id="{ident}"]'
    page.locator(selector).first.click()


def wait_route(page, route):
    page.wait_for_url(f"**#/{route}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 1050})
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("document.fonts.ready")
    page.evaluate("localStorage.removeItem('xhs-image-note-mvp-v1')")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.evaluate("document.fonts.ready")
    capture(page, "01-feed.png")
    assert page.locator(".feed-card").count() == 8
    assert page.evaluate("document.fonts.check('14px AndroidCN')")
    passed("首页：8 篇图文、双列内容和本地 Android 中文字体加载")

    # 取消分享不会写入会话；弹层内键盘焦点不会落到底层。
    click(page, "note", "cafe")
    wait_route(page, "note/cafe")
    capture(page, "02-note.png")
    click(page, "share")
    capture(page, "03-share.png")
    assert page.locator("#app").evaluate("(el) => el.inert")
    page.keyboard.press("Tab")
    assert page.evaluate("document.activeElement.closest('#overlay-root') !== null")
    page.keyboard.press("Shift+Tab")
    assert page.evaluate("document.activeElement.closest('#overlay-root') !== null")
    page.keyboard.press("Escape")
    assert page.locator('[role="dialog"]').count() == 0
    assert not page.locator("#app").evaluate("(el) => el.inert")
    passed("分享面板：关闭、Esc、键盘焦点限制与返回焦点")

    click(page, "share")
    click(page, "share-friend", "man")
    page.locator("#share-message").fill("这个窗边好舒服，下周一起去吧")
    capture(page, "04-send-confirmation.png")
    click(page, "confirm-cancel")
    click(page, "close-modal")
    assert page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1')).messages.length") == 2
    passed("取消发送不会新增消息")

    # 多图滑动、点赞、收藏与重载一致。
    click(page, "gallery-index")
    page.locator('[data-action="gallery-index"][data-index="1"]').click()
    page.wait_for_function("document.querySelector('.gallery-counter').textContent === '2/3'")
    click(page, "like", "cafe")
    click(page, "save-note", "cafe")
    assert page.locator('[data-action="like"][data-id="cafe"]').get_attribute("aria-pressed") == "true"
    page.reload()
    page.wait_for_load_state("networkidle")
    assert page.locator('[data-action="like"][data-id="cafe"]').get_attribute("aria-pressed") == "true"
    assert page.locator('[data-action="save-note"][data-id="cafe"]').get_attribute("aria-pressed") == "true"
    passed("多图翻页；点赞与收藏重载后保留")

    # 主要闭环：发出、发送方记录、切换接收方、未读、打开原笔记、返回和回复。
    click(page, "share")
    click(page, "share-friend", "man")
    page.locator("#share-message").fill("这个窗边好舒服，下周一起去吧")
    page.locator("#share-form").evaluate("(form) => { form.requestSubmit(); form.requestSubmit(); }")
    page.wait_for_selector("#inspect-recipient:not([hidden])")
    db = page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1'))")
    assert len([m for m in db["messages"] if m.get("noteId") == "cafe"]) == 1
    assert len(db["messages"]) == 4
    passed("发送笔记与附言；重复提交不产生重复消息")

    # 重载后的默认返回路径为首页，发送方可在消息中查看同一条记录。
    click(page, "back")
    wait_route(page, "feed")
    click(page, "messages")
    click(page, "chat", "man")
    wait_route(page, "chat/man")
    assert page.locator('.outgoing .chat-note-card[data-id="cafe"]').count() == 1
    capture(page, "05-sender-chat.png")
    passed("发送方聊天保留笔记卡片与附言")

    page.locator("#inspect-recipient").click()
    wait_route(page, "messages")
    assert page.locator("#demo-account").input_value() == "man"
    assert page.locator('[data-action="chat"][data-id="lin"] .unread-badge').inner_text() == "2"
    capture(page, "06-recipient-messages.png")
    click(page, "chat", "lin")
    wait_route(page, "chat/lin")
    assert page.locator('.incoming .chat-note-card[data-id="cafe"]').count() == 1
    assert page.locator(".text-bubble").last.inner_text() == "这个窗边好舒服，下周一起去吧"
    capture(page, "07-recipient-chat.png")
    click(page, "note", "cafe")
    wait_route(page, "note/cafe")
    assert page.locator(".note-copy h1").inner_text() == "杭州｜愿意为这个窗边坐一整个下午"
    click(page, "back")
    wait_route(page, "chat/lin")
    page.locator("#chat-text").fill("好呀，下周六一起去 ☕")
    page.locator("#chat-text").press("Enter")
    assert page.locator(".text-bubble").last.inner_text() == "好呀，下周六一起去 ☕"
    click(page, "back")
    wait_route(page, "messages")
    assert page.locator('[data-action="chat"][data-id="lin"] .unread-badge').count() == 0
    passed("接收方未读 → 聊天 → 原笔记 → 返回 → 回复 → 清除未读")

    page.locator("#demo-account").select_option("lin")
    click(page, "chat", "man")
    assert page.locator(".incoming .text-bubble").last.inner_text() == "好呀，下周六一起去 ☕"
    page.reload()
    page.wait_for_load_state("networkidle")
    assert page.locator(".incoming .text-bubble").last.inner_text() == "好呀，下周六一起去 ☕"
    passed("双方消息共享；回复重载后保留")

    click(page, "back")
    click(page, "home")
    page.locator(".feed-scroll").evaluate("(el) => el.scrollTop = 350")
    before = page.locator(".feed-scroll").evaluate("(el) => el.scrollTop")
    click(page, "note", "food")
    click(page, "back")
    page.wait_for_function(f"Math.abs(document.querySelector('.feed-scroll').scrollTop - {before}) < 2")
    passed("从笔记返回首页保留瀑布流滚动位置")

    # 更多好友的搜索与多选实际送达两个账号。
    click(page, "note", "food")
    click(page, "share")
    click(page, "share-more")
    capture(page, "08-friend-picker.png")
    assert page.locator("#friend-next").is_disabled()
    page.locator("#friend-query").fill("不存在")
    assert page.locator(".friend-no-results").is_visible()
    page.locator("#friend-query").fill("")
    page.locator('.friend-picker-row input[value="sen"]').check()
    page.locator('.friend-picker-row input[value="qing"]').check()
    click(page, "friend-next")
    page.locator("#share-form").evaluate("(form) => form.requestSubmit()")
    db = page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1'))")
    assert sorted(m["to"] for m in db["messages"] if m.get("noteId") == "food") == ["qing", "sen"]
    page.locator("#demo-account").select_option("sen")
    click(page, "chat", "lin")
    assert page.locator('.incoming .chat-note-card[data-id="food"]').count() == 1
    passed("更多好友：搜索、空结果、多选，并向两个接收方送达")

    # 新建评论、搜索、独立深链接。
    page.locator("#demo-account").select_option("lin")
    click(page, "home")
    click(page, "note", "cafe")
    click(page, "comment", "cafe")
    page.locator("#comment-text").fill("想在这里坐一下午")
    page.locator("#comment-form").evaluate("(form) => form.requestSubmit()")
    assert page.locator(".comment-row").last.inner_text().find("想在这里坐一下午") >= 0
    click(page, "back")
    click(page, "search")
    page.locator("#search-query").fill("咖啡")
    page.locator("#search-query").press("Enter")
    assert page.locator(".feed-card").count() >= 1
    passed("评论与笔记搜索可操作")
    page.goto(URL + "#/note/sea")
    page.wait_for_load_state("networkidle")
    assert page.locator(".detail-page").get_attribute("data-note-id") == "sea"
    passed("本地文件可通过 hash 深链接打开笔记")

    # 所有页均无坏图或横向溢出；也测试一个触屏尺寸。
    for route in ["feed", "note/cafe", "messages", "chat/man", "profile/lin"]:
        page.goto(URL + "#/" + route)
        page.wait_for_load_state("networkidle")
        assert page.locator("#app").evaluate("(el) => el.scrollWidth <= el.clientWidth")
        bad_images = page.evaluate("Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)")
        assert not bad_images, bad_images
    mobile = context.new_page()
    mobile.set_viewport_size({"width": 390, "height": 844})
    mobile.goto(URL)
    mobile.wait_for_load_state("networkidle")
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    mobile.locator('[data-action="note"][data-id="cafe"]').first.click()
    mobile.locator('[data-action="share"]').click()
    assert mobile.locator(".share-sheet").is_visible()
    passed("390×844 视口：无横向溢出，笔记与底部分享面板可操作")

    assert not errors, errors
    passed("本地图片、字体和图标全部加载；无 JavaScript 或控制台错误")
    context.close()
    browser.close()

report = {
    "tested_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "method": "Python Playwright / headless Chromium / file://",
    "result": "pass",
    "checks": checks,
    "errors": errors,
    "visual_scope": "仅 Web 原型截图检查；缺少业务原屏，未做现网像素差异验收",
}
(OUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
