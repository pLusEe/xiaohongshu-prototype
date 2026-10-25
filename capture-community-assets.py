"""Additional assets from the already sampled user recording; no app/network access."""
from pathlib import Path
from PIL import Image
import sys, json
sys.path.insert(0, "/tmp/xhs-video-tools")
import numpy as np
ROOT = Path(__file__).resolve().parent
CAP = Path("/tmp/xhs-ios-capture")
OUT = ROOT / "assets/ios"
manifest = json.loads((OUT/"community-source-manifest.json").read_text())
def crop(name, frame, box):
    scaled = tuple(round(v*3) for v in box)
    Image.open(CAP/frame).convert("RGB").crop(scaled).save(OUT/f"{name}.png")
    manifest["assets"].append({"file":f"{name}.png","source_frame":frame,"box_pt":box,"treatment":"source crop"})
for name,frame,box in [
    ("participant-fufu","exact-58.png",(16,573,56,613)),
    ("participant-xiao","exact-58.png",(16,637,56,677)),
    ("participant-orange","exact-58.png",(16,701,56,741)),
    ("participant-abai","exact-58.png",(16,765,56,805)),
    ("local-art","exact-78.png",(5,152,199,411)),
    ("local-steel","exact-78.png",(204,152,398,410)),
    ("local-potion","exact-78.png",(5,480,199,739)),
    ("local-event","exact-78.png",(204,500,398,696)),
    ("local-avatar-art","exact-78.png",(15,448,33,466)),
    ("local-avatar-steel","exact-78.png",(214,469,232,487)),
    ("author-drama","frame-009.png",(5,540,199,799)),
    ("author-talk","frame-009.png",(204,540,398,799)),
    ("emoji-dada","frame-054.png",(133,444,153,467)),
    ("emoji-mumu","frame-054.png",(132,611,152,635)),
    ("emoji-offer","frame-054.png",(64,702,139,723)),
    ("avatar-super","frame-051.png",(15,297,33,315)),
    ("avatar-wood","frame-051.png",(214,410,232,428)),
    ("avatar-acid","frame-051.png",(15,646,33,664)),
    ("avatar-notion","frame-051.png",(214,759,232,777)),
    ("resonance-partial","frame-051.png",(5,678,199,795)),
]:
    crop(name,frame,box)

# Transparent white status glyphs, preserving original silhouettes.
im=Image.open(OUT/"status-dark.png").convert("RGB")
arr=np.array(im,dtype=float)
alpha=np.clip((248-arr.mean(axis=2))*1.04,0,255).astype("uint8")
rgba=np.full((*alpha.shape,4),255,dtype="uint8");rgba[:,:,3]=alpha
Image.fromarray(rgba).save(OUT/"status-white.png")

def reconstruct(frame, name, height, boxes):
    original=Image.open(CAP/frame).convert("RGB").crop((0,0,1206,height*3)).resize((402,height))
    rgb=np.array(original,dtype=float);mask=np.zeros(rgb.shape[:2],dtype=bool)
    for x0,y0,x1,y1 in boxes: mask[y0:y1,x0:x1]=True
    clean=rgb.copy();clean[mask]=rgb[~mask].mean(axis=0)
    for _ in range(1500):
        surrounding=(np.roll(clean,1,0)+np.roll(clean,-1,0)+np.roll(clean,1,1)+np.roll(clean,-1,1))/4
        clean[mask]=surrounding[mask]
    Image.fromarray(np.clip(clean,0,255).astype("uint8")).resize((1206,height*3)).save(OUT/name)
    manifest["assets"].append({"file":name,"source_frame":frame,"treatment":"visible background retained, UI-occluded background reconstructed with diffusion"})
reconstruct("frame-009.png","author-wallpaper-reconstructed.png",450,[(0,18,402,49),(10,70,40,101),(360,75,396,100),(10,118,360,207),(10,225,330,246),(10,263,395,323),(0,333,402,446)])
reconstruct("exact-50.png","video-background-reconstructed.png",429,[(0,18,402,49),(10,75,81,103),(310,75,397,103)])
manifest["assets"]=list({entry["file"]:entry for entry in manifest["assets"]}.values())
(OUT/"community-source-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
for name,frame in {
    "15-my-notes":"frame-048.png", "14-profile-comments":"frame-047.png",
    "16-profile-albums":"frame-045.png", "17-profile-music":"frame-044.png",
    "18-liked-comments":"frame-042.png", "19-kai-comments":"frame-054.png",
    "20-crab-comments":"frame-057.png", "21-crab-scroll":"frame-056.png",
    "22-liked-notes-scroll":"frame-051.png"
}.items():
    Image.open(CAP/frame).convert("RGB").resize((402,874),Image.Resampling.LANCZOS).save(ROOT/"reference/ios"/f"{name}.png")
print("Additional source assets ready.")
