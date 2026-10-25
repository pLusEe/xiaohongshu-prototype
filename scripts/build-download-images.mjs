// Build lazy file://-compatible download payloads from the original media bytes.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { window: {}, structuredClone };
vm.createContext(context);
for (const file of ["data.js", "ios-data.js", "community-data.js", "supplement-data.js", "community-expansion-data.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}
const mediaPath = name => name.startsWith("community:") ? `assets/community/${name.slice(10)}.jpg`
  : name.startsWith("youth:") ? `assets/youth/${name.slice(6)}.jpg`
  : name.startsWith("ios:") ? `assets/ios/${name.slice(4)}.png` : `assets/images/${name}.jpg`;
const names = new Set(context.window.XHS_DATA.notes.flatMap(n => n.detailImages || n.images).filter(Boolean));
const directory = path.join(root, "assets", "downloads");
fs.mkdirSync(directory, { recursive: true });
const manifest = {}, checksums = {};
for (const name of names) {
  if (name.startsWith("data:image/")) continue;
  const relative = mediaPath(name), bytes = fs.readFileSync(path.join(root, relative));
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  const filename = `${hash.slice(0, 20)}.js`;
  manifest[relative] = `assets/downloads/${filename}`;
  checksums[relative] = { sha256: hash, bytes: bytes.length };
  const mime = relative.endsWith(".png") ? "image/png" : "image/jpeg";
  fs.writeFileSync(path.join(directory, filename), `(window.XHS_IMAGE_DOWNLOADS ||= {})[${JSON.stringify(relative)}] = ${JSON.stringify(`data:${mime};base64,${bytes.toString("base64")}`)};\n`);
}
fs.writeFileSync(path.join(directory, "manifest.js"), `window.XHS_IMAGE_DOWNLOAD_FILES = ${JSON.stringify(manifest)};\n`);
fs.writeFileSync(path.join(directory, "source-checksums.json"), `${JSON.stringify(checksums, null, 2)}\n`);
console.log(`Prepared ${Object.keys(manifest).length} original image downloads; payloads load only when saving.`);
