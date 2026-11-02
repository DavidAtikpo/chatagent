import fs from "fs";

const path = new URL("../public/widget.js", import.meta.url);
let s = fs.readFileSync(path, "utf8");

const singleFetch =
  'let n=localStorage.getItem(De);try{let _q=[];n&&_q.push(`lang=${encodeURIComponent(v(n))}`);d&&_q.push(`traffic_slug=${encodeURIComponent(d)}`);let i=await fetch(`${ce}${_q.length?"?"+_q.join("&"):""}`,{cache:"no-store"});if(!i.ok)throw new Error("Config not found");let c=await i.json();U=v(c.language),c.language=U,r=Mn(c)';

if (s.includes(singleFetch)) {
  console.log("widget.js already optimized (single config fetch + traffic_slug)");
  process.exit(0);
}

const legacyDual =
  /let n=localStorage\.getItem\(De\);try\{if\(n\)U=v\(n\);else\{let l=await fetch\([^}]+\}let i=await fetch\(`\$\{ce\}\?lang=\$\{encodeURIComponent\(U\)\}[^`]+`,\{cache:"no-store"\}\);if\(!i\.ok\)throw new Error\("Config not found"\);let c=await i\.json\(\);c\.language=U,r=Mn\(c\)/;

if (!legacyDual.test(s)) {
  console.error("widget.js: expected fetch pattern not found — patch manually");
  process.exit(1);
}

s = s.replace(legacyDual, singleFetch);
fs.writeFileSync(path, s);
console.log("widget.js patched (single config fetch + traffic_slug)");
