"""Extract original iPhone glyph silhouettes from the user-supplied frames."""
from pathlib import Path
import json, sys
from PIL import Image
sys.path.insert(0,"/tmp/xhs-video-tools")
import numpy as np
ROOT=Path(__file__).resolve().parent
CAP=Path("/tmp/xhs-ios-capture")
OUT=ROOT/"assets/ios"
entries=[]
for name,frame,box,bright in [
    ("menu","frame-048.png",(19,76,38,93),True),
    ("scan","frame-048.png",(330,75,351,94),True),
    ("lock","frame-042.png",(86,410,98,425),False),
    ("mic","frame-054.png",(326,351,341,369),False),
    ("image","frame-054.png",(356,353,372,369),False),
    ("minus","frame-054.png",(368,470,386,488),False),
    ("good","exact-50.png",(142,462,163,486),False),
    ("download","exact-50.png",(49,463,69,485),False),
    ("report","exact-50.png",(332,462,354,485),False),
    ("clock","frame-048.png",(154,342,172,356),True),
    ("people","frame-054.png",(24,218,38,232),False),
]:
    original=Image.open(CAP/frame).convert("RGB").crop(tuple(round(v*3) for v in box))
    arr=np.array(original,dtype=float)
    if bright:
        mask=np.clip((arr.min(axis=2)-145)/100,0,1)
        color=(255,255,255)
    else:
        background=np.percentile(arr,95,axis=(0,1))
        mask=np.clip(np.max(background-arr,axis=2)/220,0,1)
        color=(54,50,54)
    rgba=np.zeros((*mask.shape,4),dtype="uint8")
    rgba[:,:,:3]=color;rgba[:,:,3]=(mask*255).astype("uint8")
    Image.fromarray(rgba).save(OUT/f"glyph-{name}.png")
    entries.append({"name":name,"frame":frame,"box_pt":box,"treatment":"original raster contour; background removed, tint normalized"})
(OUT/"community-icon-manifest.json").write_text(json.dumps(entries,ensure_ascii=False,indent=2))
print("Extracted",len(entries),"recorded glyphs")
