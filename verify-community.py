"""Recorded profile/comment/video states plus linked user journeys."""
from pathlib import Path
import json, time
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
OUT=ROOT/"verification/community"
OUT.mkdir(parents=True,exist_ok=True)
URL=(ROOT/"index.html").as_uri()
checks=[];errors=[];visual=[]
def click(page,action,ident=None):
    selector=f'[data-action="{action}"]'+(f'[data-id="{ident}"]' if ident else "")
    page.locator(selector).first.click()
def ready(page):
    page.wait_for_load_state("networkidle")
    page.evaluate("async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}")
def screenshot(page,name,frame=None):
    ready(page)
    page.locator("#device").screenshot(path=str(OUT/f"{name}-web.png"),animations="disabled")
    if frame:
        ref=Image.open(Path("/tmp/xhs-ios-capture")/frame).convert("RGB").resize((402,874),Image.Resampling.LANCZOS)
        web=Image.open(OUT/f"{name}-web.png").convert("RGB")
        ref.save(OUT/f"{name}-ref.png")
        Image.blend(ref,web,.5).save(OUT/f"{name}-overlay.png")
        diff=ImageChops.difference(ref,web);diff.save(OUT/f"{name}-diff.png")
        bands={"top":(0,62,402,111),"tabs":(0,111,402,150),"content":(0,150,402,796)} if name=="profile-liked-scroll" else {"top":(0,62,402,395),"tabs":(0,395,402,474),"content":(0,474,402,796)} if name.startswith("profile") else {"app":(0,62,402,840)}
        results={}
        for label,box in bands.items():
            region=diff.crop(box); values=list(region.getdata());results[label]=round(sum(sum(p) for p in values)/(len(values)*3),2)
        visual.append({"state":name,"source_frame":frame,"mean_absolute_RGB_difference":results,"acceptance":"measured, not pixel-perfect certification"})
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={"width":1280,"height":1050},device_scale_factor=1,reduced_motion="reduce")
    page=context.new_page()
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("console",lambda m:errors.append(m.text) if m.type=="error" else None)
    page.goto(URL);ready(page)
    for path,name,frame in [
        ("profile/lin","profile-notes","frame-048.png"),
        ("profile/lin/comments","profile-comments","frame-047.png"),
        ("profile/lin/saved","profile-saved","frame-046.png"),
        ("profile/lin/saved/albums","profile-albums","frame-045.png"),
        ("profile/lin/saved/music","profile-music","frame-044.png"),
        ("profile/lin/liked","profile-liked","frame-040.png"),
        ("profile/lin/liked/comments","profile-liked-comments","frame-042.png"),
        ("note/kai","kai-comments","frame-054.png"),
        ("note/crab","crab-comments","frame-057.png"),
        ("author/night","author-profile","frame-009.png"),
    ]:
        page.goto(URL+"#/"+path);ready(page)
        assert not page.evaluate("[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)"),path
        assert page.locator("#app").evaluate("(e)=>e.scrollWidth<=e.clientWidth"),path
        screenshot(page,name,frame)
    checks.append("10个录屏状态实现DOM并生成同尺寸并排、叠图与差异图")
    page.goto(URL+"#/profile/lin/liked");ready(page)
    page.locator(".recorded-profile-scroll").evaluate("(e)=>e.scrollTop=e.scrollHeight")
    page.wait_for_selector(".profile-collapsed")
    assert page.locator(".collapsed-profile-toolbar").is_visible()
    screenshot(page,"profile-liked-scroll","frame-051.png")
    page.goto(URL+"#/note/crab");ready(page)
    page.locator(".note-scroll").evaluate("(e)=>{const r=document.querySelector('[data-comment-id=\"crab-holy\"]');e.scrollTop=r.getBoundingClientRect().top-e.getBoundingClientRect().top}")
    screenshot(page,"crab-comments-scroll","frame-056.png")
    click(page,"comment","crab")
    screenshot(page,"comment-composer")
    click(page,"close-modal")
    checks.append("滚动主页固定菜单和标签、螃蟹图片回复、评论输入状态截图")
    page.goto(URL+"#/profile/lin");ready(page)
    assert page.locator(".my-profile-hero").bounding_box()["height"]==333
    assert page.locator(".recorded-profile-tabs").bounding_box()["y"]-page.locator("#device").bounding_box()["y"]==395
    assert page.locator(".bottom-nav").bounding_box()["y"]-page.locator("#device").bounding_box()["y"]==796
    page.locator('[data-action="profile-tab"][data-tab="comments"]').click()
    assert page.locator(".profile-comment").count()==2
    click(page,"public-comment","my-comment-1")
    page.locator('[data-action="profile-subtab"][data-sub="public"]').click()
    assert page.locator(".profile-comment").count()==1
    page.reload();ready(page)
    assert page.locator(".profile-comment").count()==1
    checks.append("个人页395px标签/796px底部；评论全部与公开切换、公开操作持久化")
    page.goto(URL+"#/profile/lin/liked/comments");ready(page)
    click(page,"open-comment","kai-dada")
    page.wait_for_selector('[data-comment-id="kai-dada"]')
    assert page.url.endswith("#/note/kai")
    click(page,"expand-replies","kai-dada")
    assert page.locator('[data-comment-id="kai-dada-reply"]').count()==0
    click(page,"expand-replies","kai-dada")
    assert page.locator('[data-comment-id="kai-dada-reply"]').count()==1
    click(page,"reply-comment","kai-dada")
    page.locator("#comment-text").fill("我也想知道准确时间")
    page.locator("#comment-form").evaluate("(f)=>f.requestSubmit()")
    assert page.locator(".nested-comment").filter(has_text="我也想知道准确时间").count()==1
    page.reload();ready(page)
    assert page.locator(".nested-comment").filter(has_text="我也想知道准确时间").count()==1
    checks.append("赞过评论打开原帖定位、展开/收起、回复进入正确父评论并持久化")
    page.goto(URL+"#/profile/lin/liked/comments");ready(page)
    click(page,"open-comment","crab-holy")
    assert page.locator('[data-comment-id="crab-holy"] .comment-image').count()==1
    click(page,"back")
    assert page.url.endswith("#/profile/lin/liked/comments")
    click(page,"comment-like","crab-holy")
    assert page.locator(".profile-comment").filter(has_text="holy").count()==0
    checks.append("图片评论可见、原帖返回保留原赞过评论标签；取消赞从列表移除")
    page.goto(URL+"#/note/herb-food");ready(page)
    click(page,"like","herb-food");click(page,"save-note","herb-food")
    page.goto(URL+"#/profile/lin/liked");ready(page)
    assert page.locator('[data-note-card="herb-food"]').count()==1
    page.goto(URL+"#/profile/lin/saved");ready(page)
    assert page.locator('[data-note-card="herb-food"]').count()==1
    page.locator('[data-action="profile-subtab"][data-sub="albums"]').click()
    click(page,"create-album")
    page.locator("#album-name").fill("周末想去")
    page.locator('[name="note"][value="herb-food"]').check()
    page.locator("#album-form").evaluate("(f)=>f.requestSubmit()")
    assert page.locator(".local-album").inner_text().find("周末想去")>=0
    click(page,"open-album","0")
    assert page.locator(".community-note-list").inner_text().find("草本鸡煲")>=0
    click(page,"note","herb-food")
    checks.append("点赞/收藏同步对应主页列表；创建专辑收纳已收藏笔记、进入专辑开原帖")
    click(page,"comment","herb-food")
    page.locator("#comment-text").fill("周六来吃")
    page.locator("#comment-form").evaluate("(f)=>f.requestSubmit()")
    page.goto(URL+"#/profile/lin/comments");ready(page)
    assert page.locator(".profile-comment").filter(has_text="周六来吃").count()==1
    checks.append("发表评论后同步我的评论记录")
    page.goto(URL+"#/note/crab");ready(page)
    click(page,"comment","crab")
    page.locator("#comment-text").fill("图片回复")
    page.locator("#comment-image-file").set_input_files(str(ROOT/"assets/ios/comment-blob.png"))
    page.wait_for_selector("#comment-image-preview img")
    page.locator("#comment-form").evaluate("(f)=>f.requestSubmit()")
    assert page.locator(".comment-row").filter(has_text="图片回复").locator(".comment-image img").count()==1
    page.reload();ready(page)
    assert page.locator(".comment-row").filter(has_text="图片回复").locator(".comment-image img").count()==1
    checks.append("新图片评论发送、原帖显示、重载保留")
    page.goto(URL+"#/messages");ready(page)
    page.locator('[data-action="notification"][data-label="评论和@"]').click()
    assert page.locator(".notification-event").count()==1
    click(page,"open-comment","crab-holy")
    assert page.url.endswith("#/note/crab")
    checks.append("消息评论通知可进入原帖目标评论")
    page.goto(URL);ready(page)
    page.locator('[data-action="channel"][data-value="杭州"]').click()
    assert page.locator('[data-note-card="local-art"]').count()==1
    assert page.locator('[data-note-card="live-cat"]').count()==0
    screenshot(page,"local-feed","exact-78.png")
    checks.append("杭州同城使用录屏卡片、真实素材")
    page.goto(URL+"#/video/ants");ready(page)
    page.wait_for_function("document.querySelector('video').readyState>=2",timeout=15000)
    click(page,"video-menu","ants")
    screenshot(page,"video-options","exact-50.png")
    click(page,"recommend","ants")
    assert page.locator(".participant-row").count()==5
    screenshot(page,"video-participants","exact-58.png")
    click(page,"recommend","ants")
    assert page.locator(".participant-row").count()==4
    click(page,"close-modal")
    click(page,"video-menu","ants")
    page.locator('[data-action="video-speed"][data-value="1.5"]').click()
    assert page.locator("video").evaluate("(v)=>v.playbackRate")==1.5
    click(page,"video-clean")
    assert page.locator(".recorded-video").get_attribute("class").find("clean-video")>=0
    page.locator('[data-action="video-menu"][data-id="ants"]:visible').first.click()
    click(page,"video-clean")
    click(page,"share","ants")
    click(page,"share-friend","man")
    page.locator("#share-form").evaluate("(f)=>f.requestSubmit()")
    page.locator("#inspect-recipient").click();click(page,"chat","lin");click(page,"note","ants")
    assert page.url.endswith("#/video/ants")
    click(page,"back");assert page.url.endswith("#/chat/lin")
    checks.append("录屏视频可播、觉得好/撤销与人数联动；视频站内分享→接收→原视频→返回聊天")
    page.locator("#demo-account").select_option("lin")
    for width,height in [(390,844),(430,932)]:
        page.set_viewport_size({"width":width,"height":height})
        page.goto(URL+"#/profile/lin/liked/comments");ready(page)
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
        footer=page.locator(".bottom-nav").bounding_box()
        assert footer["y"]+footer["height"]<=height+1
        click(page,"open-comment","kai-dada")
        click(page,"reply-comment","kai-dada")
        assert page.locator(".recorded-composer").is_visible()
    checks.append("390/430移动视口个人页导航、评论回复可达且无横向溢出")
    page.set_viewport_size({"width":1280,"height":1050})
    page.goto((ROOT/"reference/index.html").as_uri());ready(page)
    for state in ["profile-notes","profile-comments","profile-albums","profile-liked-comments","kai-comments","crab-comments","video-options","video-participants"]:
        page.locator("#state").select_option(state);ready(page)
        assert not page.evaluate("[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)"),state
    checks.append("扩展录屏对照页全部新增状态可切换且无坏图")
    assert not errors,errors
    browser.close()
report={"time":time.strftime("%Y-%m-%d %H:%M:%S"),"result":"pass","checks":checks,"errors":errors}
(OUT/"interaction-results.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
(OUT/"visual-results.json").write_text(json.dumps(visual,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
