"""iOS 录屏校准后的交互回归。执行：python3 verify-ios.py。"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = Path("/tmp/xhs-ios-regression")
OUT.mkdir(exist_ok=True)
URL = (ROOT / "index.html").as_uri()
TARGET = "herb-food"
checks, errors = [], []

def passed(name):
    checks.append(name)

def click(page, action, ident=None):
    selector = f'[data-action="{action}"]'
    if ident:
        selector += f'[data-id="{ident}"]'
    page.locator(selector).first.click()

def ready(page):
    page.wait_for_load_state("networkidle")
    page.evaluate("async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width":1280,"height":1050}, device_scale_factor=3)
    page = context.new_page()
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("console",lambda m:errors.append(m.text) if m.type=="error" else None)
    page.goto(URL)
    ready(page)
    assert page.locator(".feed-card").count()>=32
    assert page.locator("#device").bounding_box()["width"]==402
    assert page.locator("#device").bounding_box()["height"]==874
    assert page.locator(".main-tabs").inner_text().splitlines()==["关注","发现","杭州"]
    assert page.locator(".bottom-nav").inner_text().find("市集")>=0
    assert page.locator("#app").evaluate("(e)=>getComputedStyle(e).fontFamily").find("-apple-system")>=0
    baseline_messages=page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1')).messages.length")
    passed("iOS 画布 402×874、系统字体候选、首页示例扩充与导航标签")

    page.locator(".feed-scroll").evaluate("(e)=>e.scrollTop=300")
    page.locator(f'.feed-cover[data-id="{TARGET}"]').scroll_into_view_if_needed()
    before=page.locator(".feed-scroll").evaluate("(e)=>e.scrollTop")
    click(page,"note",TARGET)
    ready(page)
    assert page.locator(".gallery-track").bounding_box()["height"]==536
    assert page.locator(".detail-header").bounding_box()["y"]-page.locator("#device").bounding_box()["y"]==62
    assert page.locator(".gallery-counter").inner_text()=="1/18"
    assert page.locator(".capture-limit").inner_text().find("前 3 张")>=0
    page.locator('[data-action="gallery-index"][data-index="2"]').click()
    page.wait_for_function("Math.abs(document.querySelector('.gallery-track').scrollLeft-804)<.5")
    assert page.locator(".gallery-counter").inner_text()=="3/18"
    passed("实测导航/536px主图、多图翻页，保留原18张计数并披露仅采集3张")
    click(page,"back")
    page.wait_for_function(f"Math.abs(document.querySelector('.feed-scroll').scrollTop-{before})<2")
    passed("从图文返回首页保留滚动位置")

    click(page,"note",TARGET)
    click(page,"share")
    assert page.locator("#app").evaluate("(e)=>e.inert")
    page.keyboard.press("Tab")
    assert page.evaluate("document.activeElement.closest('#overlay-root')!==null")
    page.keyboard.press("Shift+Tab")
    assert page.evaluate("document.activeElement.closest('#overlay-root')!==null")
    page.keyboard.press("Escape")
    assert not page.locator("#app").evaluate("(e)=>e.inert")
    passed("分享弹层、焦点限制、Esc关闭与恢复底层")

    click(page,"share")
    click(page,"share-friend","man")
    page.locator("#share-message").fill("下周一起去吃鸡煲")
    click(page,"confirm-cancel")
    click(page,"close-modal")
    assert page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1')).messages.length")==baseline_messages
    passed("取消发送不写入消息")
    click(page,"like",TARGET)
    click(page,"save-note",TARGET)
    page.reload()
    ready(page)
    assert page.locator(f'[data-action="like"][data-id="{TARGET}"]').get_attribute("aria-pressed")=="true"
    assert page.locator(f'[data-action="save-note"][data-id="{TARGET}"]').get_attribute("aria-pressed")=="true"
    passed("赞藏正确更新，重载后保留")

    click(page,"share")
    click(page,"share-friend","man")
    page.locator("#share-message").fill("下周一起去吃鸡煲")
    page.locator("#share-form").evaluate("(f)=>{f.requestSubmit();f.requestSubmit()}")
    db=page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1'))")
    assert len([m for m in db["messages"] if m.get("noteId")==TARGET])==1
    assert len(db["messages"])==baseline_messages+2
    page.locator("#inspect-recipient").click()
    assert page.locator('[data-action="chat"][data-id="lin"] .message-unread-dot').get_attribute("aria-label")=="2条未读消息"
    click(page,"chat","lin")
    click(page,"note",TARGET)
    assert page.locator(".detail-page").get_attribute("data-note-id")==TARGET
    click(page,"back")
    assert page.url.endswith("#/chat/lin")
    page.locator("#chat-text").fill("好，下周六")
    page.locator("#chat-text").press("Enter")
    page.locator("#demo-account").select_option("lin")
    click(page,"chat","man")
    assert page.locator(".incoming .text-bubble").last.inner_text()=="好，下周六"
    page.reload()
    ready(page)
    assert page.locator(".incoming .text-bubble").last.inner_text()=="好，下周六"
    passed("图文分享+附言→接收方未读→原笔记→返回回复→双方持久化；重复提交不重复")

    page.goto(URL+f"#/note/{TARGET}")
    ready(page)
    click(page,"share")
    click(page,"share-more")
    assert page.locator("#friend-next").is_disabled()
    page.locator("#friend-query").fill("不存在")
    assert page.locator(".friend-no-results").is_visible()
    page.locator("#friend-query").fill("")
    page.locator('.friend-picker-row input[value="sen"]').check()
    page.locator('.friend-picker-row input[value="qing"]').check()
    click(page,"friend-next")
    page.locator("#share-form").evaluate("(f)=>f.requestSubmit()")
    db=page.evaluate("JSON.parse(localStorage.getItem('xhs-image-note-mvp-v1'))")
    assert sorted(m["to"] for m in db["messages"] if m.get("noteId")==TARGET)==["man","qing","sen"]
    passed("更多好友搜索、空态、多选并向两个接收方送达")
    click(page,"comment",TARGET)
    page.locator("#comment-text").fill("下次去试试")
    page.locator("#comment-form").evaluate("(f)=>f.requestSubmit()")
    assert "下次去试试" in page.locator(".comment-row").last.inner_text()
    passed("新评论写入与页面刷新")

    for route in ["note/cafe","note/food","note/sea"]:
        page.goto(URL+"#/"+route)
        ready(page)
        assert page.locator(".detail-page").get_attribute("data-note-id")==route.split("/")[1]
    passed("原演示笔记的ID与深链接保留")
    for route in ["feed",f"note/{TARGET}","note/night","messages","chat/man","profile/lin"]:
        page.goto(URL+"#/"+route)
        ready(page)
        assert page.locator("#app").evaluate("(e)=>e.scrollWidth<=e.clientWidth")
        assert not page.evaluate("[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)")
    passed("全部目标页面无坏图、无横向溢出")

    for width,height in [(390,844),(402,874),(430,932)]:
        mobile=context.new_page()
        mobile.set_viewport_size({"width":width,"height":height})
        mobile.goto(URL+f"#/note/{TARGET}")
        ready(mobile)
        assert mobile.evaluate("document.documentElement.scrollWidth<=innerWidth")
        footer=mobile.locator(".note-footer").bounding_box()
        assert footer["y"]+footer["height"]<=height+1
        assert mobile.locator(".status-bar").is_hidden()
        click(mobile,"share")
        assert mobile.locator(".share-sheet").is_visible()
        mobile.close()
    passed("390/402/430手机视口：隐藏模拟状态栏、底部互动可见、分享可打开")

    page.goto((ROOT/"reference/index.html").as_uri())
    ready(page)
    assert page.locator("#frames a").count()>=16
    page.locator("#mode").select_option("overlay")
    assert page.locator("#overlay").is_visible()
    page.locator("#opacity").fill("80")
    assert page.locator("#opacity-value").inner_text()=="80%"
    passed("关键帧查看与对照模式/透明度切换")
    assert not errors,errors
    passed("无JavaScript或控制台错误")
    browser.close()
report={"tested_at":time.strftime("%Y-%m-%d %H:%M:%S"),"method":"Playwright / headless Chromium / file://","result":"pass","checks":checks,"errors":errors,"scope":"功能回归；像素对照指标另见verification/ios/visual-results.json"}
(OUT/"results.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
