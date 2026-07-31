/* Ciphra — bilingual security & privacy toolkit UI logic (client-side, no upload) */
(function () {
  "use strict";

  const langKey = "ciphra-lang", themeKey = "ciphra-theme";
  const $ = (id) => document.getElementById(id);

  /* ---------- i18n ---------- */
  let lang = (function () {
    try { return localStorage.getItem(langKey) || "en"; } catch (e) { return "en"; }
  })();
  function t(obj) { return (lang === "zh-CN" && obj.zh) ? obj.zh : obj.en; }
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === "zh-CN" ? "zh-CN" : "en";
    document.documentElement.setAttribute("data-lang", l);
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.querySelector(":scope [data-en]")) return;
      el.textContent = l === "zh-CN" ? (el.dataset.zh || el.dataset.en) : el.dataset.en;
    });
    const seg = $("lang-seg");
    if (seg) seg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.langSet === l));
  }

  /* ---------- theme ---------- */
  function applyTheme(th) {
    document.documentElement.setAttribute("data-theme", th);
    try { localStorage.setItem(themeKey, th); } catch (e) {}
  }

  /* ---------- secure random helpers ---------- */
  function randInt(maxExcl) {
    if (maxExcl <= 0) return 0;
    const limit = Math.floor(0x100000000 / maxExcl) * maxExcl;
    let x;
    do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= limit);
    return x % maxExcl;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = randInt(i + 1); const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
    return arr;
  }
  function b64(buf) {
    const u = new Uint8Array(buf); const chunks = [];
    for (let i = 0; i < u.length; i += 0x8000) chunks.push(String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)));
    return btoa(chunks.join(""));
  }
  function unb64(s) {
    const b = atob(s); const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function copyText(text, btn) {
    const done = () => { if (!btn) return; const o = btn.textContent; btn.textContent = (lang === "zh-CN") ? "已复制" : "Copied"; setTimeout(() => { btn.textContent = o; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
  }

  /* ---------- 1. PASSWORD ---------- */
  const AMBIG = "0O1lI";
  function stripAmb(s) { return s.split("").filter((c) => !AMBIG.includes(c)).join(""); }
  function genPassword() {
    const len = Math.max(1, Math.min(64, +$("pw-length").value || 16));
    const sets = [];
    if ($("pw-upper").checked) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if ($("pw-lower").checked) sets.push("abcdefghijklmnopqrstuvwxyz");
    if ($("pw-num").checked) sets.push("0123456789");
    if ($("pw-sym").checked) sets.push("!@#$%^&*()-_=+[]{};:,.?/");
    const chosen = sets.map((s) => $("pw-amb").checked ? stripAmb(s) : s);
    const out = $("pw-out");
    if (chosen.length === 0) { out.textContent = (lang === "zh-CN") ? "请至少选择一种字符" : "Select at least one set"; return; }
    const pool = chosen.join("");
    const chars = [];
    const need = Math.min(len, chosen.length);
    for (let i = 0; i < need; i++) chars.push(chosen[i][randInt(chosen[i].length)]);
    while (chars.length < len) chars.push(pool[randInt(pool.length)]);
    out.textContent = shuffle(chars).join("");
  }

  /* ---------- 2. PASSPHRASE ---------- */
  const WORDS = ("apple amber anchor angel apron arm asteroid autumn bacon badge bamboo banana banner bayonet beacon beaver bell birch blade blaze bloom board bolt boost bottle bounce branch brass bridge bronze brook brush bubble bucket buffalo bullet bundle bunker cabin cable camel canyon cedar charm chess chest chimney circle cliff cloud clover cobalt comet copper coral cotton crane creek crystal cedar daisy delta diamond dingo dollar dove dragon drum duck eagle earth echo ember falcon feather field fire flame fleet flask flower forest fox frog galaxy garage garden garlic gecko glacier gold grain grape grass gravel hammer harbor hazel honey hornet horse hour iceberg igloo iron island jade jelly jewel jungle kettle kiwi ladder lagoon lantern lemon lighthouse llama magnet maple marble meadow metal meteor mint mocha moon mosaic moss mountain mushroom mustard navy needle nest nickel oak ocean olive onion opal orchid otter owl oxpecker panda paper parrot peach pearl pebble pencil pepper petal pine pixel plankton planet plaza plum polar pond poppy porch potato prairie pumpkin puzzle quarter quartz rabbit radar rainbow raven river robin rocket rose saddle salmon sand sandal sapphire scarf sea seal shadow shark shield silver skylark slate sloth smoke snail snow soap solar spark spectrum sphinx spider sponge spring squirrel stone sugar summit sunflower swamp swan sword table talon teal thunder tiger timber toad token tomahawk tower tractor tulip tundra turquoise turtle tundra valley vanilla vapor velvet vine violet volcano wagon walnut wasp waterfall willow wind wolf wood worm zebra zoom").split(" ");
  function genPassphrase() {
    const n = Math.max(3, Math.min(12, +$("pp-words").value || 5));
    const sep = $("pp-sep").value;
    const words = [];
    for (let i = 0; i < n; i++) {
      let w = WORDS[randInt(WORDS.length)];
      if ($("pp-cap").checked) w = w.charAt(0).toUpperCase() + w.slice(1);
      words.push(w);
    }
    let phrase = words.join(sep);
    if ($("pp-num").checked) phrase += sep + (randInt(9000) + 1000);
    $("pp-out").textContent = phrase;
  }

  /* ---------- 3. STRENGTH ---------- */
  function checkStrength(pw) {
    if (!pw) return { score: 0, label: { en: "—", zh: "—" }, color: "var(--border)", fb: [] };
    const hasLower = /[a-z]/.test(pw), hasUpper = /[A-Z]/.test(pw), hasNum = /[0-9]/.test(pw), hasSym = /[^a-zA-Z0-9]/.test(pw);
    let pool = 0;
    if (hasLower) pool += 26; if (hasUpper) pool += 26; if (hasNum) pool += 10; if (hasSym) pool += 20;
    let bits = pw.length * Math.log2(pool || 1);
    const fb = [];
    if (pw.length < 8) fb.push({ en: "Too short — use at least 12 characters.", zh: "太短——至少使用 12 个字符。" });
    if (pw.length >= 8 && pw.length < 12) fb.push({ en: "A bit short — 14+ is better.", zh: "偏短——建议 14 位以上。" });
    if (!(hasUpper && hasLower)) fb.push({ en: "Mix uppercase and lowercase letters.", zh: "混合大写与小写字母。" });
    if (!hasNum) fb.push({ en: "Add some numbers.", zh: "加入一些数字。" });
    if (!hasSym) fb.push({ en: "Add a symbol (!@#$%) for extra strength.", zh: "加入符号（!@#$%）以增强强度。" });
    if (/(.)\1\1/.test(pw)) fb.push({ en: "Avoid 3+ repeated characters in a row.", zh: "避免连续重复 3 个以上相同字符。" });
    if (/\d{4,}/.test(pw)) fb.push({ en: "Long number runs are easy to guess.", zh: "过长的连续数字容易被猜到。" });
    const common = ["password", "123456", "12345678", "qwerty", "abc123", "letmein", "welcome", "admin", "iloveyou", "monkey"];
    if (common.includes(pw.toLowerCase())) { bits = Math.min(bits, 5); fb.push({ en: "This is a very common password — do not use it.", zh: "这是非常常见的密码，请勿使用。" }); }
    let score;
    if (bits < 28) score = 0; else if (bits < 40) score = 1; else if (bits < 60) score = 2; else if (bits < 80) score = 3; else score = 4;
    const labels = [{ en: "Very weak", zh: "极弱" }, { en: "Weak", zh: "弱" }, { en: "Fair", zh: "一般" }, { en: "Strong", zh: "强" }, { en: "Very strong", zh: "极强" }];
    const colors = ["var(--danger)", "var(--danger)", "var(--warn)", "var(--ok)", "var(--ok)"];
    if (fb.length === 0) fb.push({ en: "Looks solid — keep it unique per site.", zh: "看起来不错——请在每个网站保持唯一。" });
    return { score, label: labels[score], color: colors[score], bits, fb };
  }
  function renderStrength() {
    const pw = $("st-input").value;
    const r = checkStrength(pw);
    $("st-score").textContent = pw ? (r.bits.toFixed(0) + " bits") : "—";
    $("st-label").textContent = t(r.label);
    const bar = $("st-bar");
    bar.style.width = (r.score / 4 * 100) + "%";
    bar.style.background = r.color;
    $("st-feedback").innerHTML = r.fb.map((f) => "<li>" + t(f) + "</li>").join("");
  }

  /* ---------- 4. ENCRYPT (AES-GCM + PBKDF2) ---------- */
  let encMode = "encrypt";
  async function deriveKey(pass, salt) {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function runEncrypt() {
    const out = $("enc-out");
    const pass = $("enc-pass").value;
    const text = $("enc-text").value;
    if (!pass) { out.textContent = (lang === "zh-CN") ? "请输入口令" : "Enter a passphrase"; return; }
    if (!text) { out.textContent = (lang === "zh-CN") ? "请输入文本" : "Enter some text"; return; }
    try {
      const enc = new TextEncoder();
      if (encMode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(pass, salt);
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
        out.textContent = b64(salt) + "." + b64(iv) + "." + b64(ct);
      } else {
        const parts = text.trim().split(".");
        if (parts.length !== 3) { out.textContent = (lang === "zh-CN") ? "格式无效：应为 salt.iv.ciphertext" : "Invalid format: expected salt.iv.ciphertext"; return; }
        const salt = unb64(parts[0]), iv = unb64(parts[1]), ct = unb64(parts[2]);
        const key = await deriveKey(pass, salt);
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
        out.textContent = new TextDecoder().decode(pt);
      }
    } catch (e) {
      out.textContent = (lang === "zh-CN") ? "解密失败：口令或密文不正确" : "Decryption failed: wrong passphrase or ciphertext";
    }
  }

  /* ---------- 5. HASH ---------- */
  async function shaDigest(algo, bytes) {
    if (algo.startsWith("SHA-")) return new Uint8Array(await crypto.subtle.digest(algo, bytes));
    if (algo === "SHA-1") return sha1(bytes);
    if (algo === "MD5") return md5(bytes);
    return new Uint8Array(0);
  }
  function runHash() {
    const algo = $("hash-algo").value;
    const input = $("hash-input").value;
    const bytes = new TextEncoder().encode(input);
    shaDigest(algo, bytes).then((u) => {
      let hex = "";
      for (let i = 0; i < u.length; i++) hex += u[i].toString(16).padStart(2, "0");
      $("hash-out").textContent = hex || "—";
    });
  }

  /* SHA-1 (RFC 3174) */
  function sha1(msg) {
    function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const ml = msg.length * 8;
    const withOne = msg.length + 1;
    const k = (56 - withOne % 64 + 64) % 64;
    const total = withOne + k + 8;
    const m = new Uint8Array(total);
    m.set(msg); m[msg.length] = 0x80;
    const view = new DataView(m.buffer);
    view.setUint32(total - 4, ml >>> 0, false);
    view.setUint32(total - 8, Math.floor(ml / 0x100000000), false);
    for (let i = 0; i < total; i += 64) {
      const w = new Array(80);
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
      for (let t = 16; t < 80; t++) w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let t = 0; t < 80; t++) {
        let f, kv;
        if (t < 20) { f = (b & c) | ((~b) & d); kv = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; kv = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); kv = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; kv = 0xCA62C1D6; }
        const tmp = (rotl(a, 5) + f + e + kv + w[t]) >>> 0;
        e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    return new Uint8Array([h0, h1, h2, h3, h4].flatMap((x) => [(x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255]));
  }

  /* MD5 (RFC 1321) */
  function md5(bytes) {
    const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const K = [];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
    const ml = bytes.length * 8;
    const pad = (bytes.length % 64 < 56) ? (56 - bytes.length % 64) : (120 - bytes.length % 64);
    const total = bytes.length + pad + 8;
    const m = new Uint8Array(total);
    m.set(bytes); m[bytes.length] = 0x80;
    const dv = new DataView(m.buffer);
    dv.setUint32(total - 8, ml >>> 0, true);
    dv.setUint32(total - 4, Math.floor(ml / 0x100000000), true);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    function rol(x, c) { return (x << c) | (x >>> (32 - c)); }
    for (let i = 0; i < total; i += 64) {
      const M = [];
      for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
      let A = a0, B = b0, C = c0, D = d0, F, g;
      for (let k = 0; k < 64; k++) {
        if (k < 16) { F = (B & C) | (~B & D); g = k; }
        else if (k < 32) { F = (D & B) | (~D & C); g = (5 * k + 1) % 16; }
        else if (k < 48) { F = B ^ C ^ D; g = (3 * k + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * k) % 16; }
        let t = (A + F + K[k] + M[g]) >>> 0;
        t = (rol(t, s[k]) + B) >>> 0;
        A = D; D = C; C = B; B = t;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    function leHex(x) { return (x >>> 0).toString(16).padStart(8, "0").match(/.{2}/g).reverse().join(""); }
    return new Uint8Array([a0, b0, c0, d0].flatMap((x) => leHex(x).match(/.{2}/g).map((h) => parseInt(h, 16))));
  }

  /* ---------- 6. RANDOM ---------- */
  function uuidv4() {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = []; for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, "0"));
    return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" + h.slice(6, 8).join("") + "-" + h.slice(8, 10).join("") + "-" + h.slice(10, 16).join("");
  }
  function genRandom() {
    const type = $("rnd-type").value;
    const count = Math.max(1, Math.min(50, +$("rnd-count").value || 1));
    const out = [];
    if (type === "int") {
      const mn = +$("rnd-min").value, mx = +$("rnd-max").value;
      const lo = Math.min(mn, mx), hi = Math.max(mn, mx);
      for (let i = 0; i < count; i++) out.push(randInt(hi - lo + 1) + lo);
    } else if (type === "dice") {
      for (let i = 0; i < count; i++) out.push(randInt(6) + 1);
    } else if (type === "coin") {
      for (let i = 0; i < count; i++) out.push(randInt(2) === 0 ? "Heads" : "Tails");
    } else if (type === "bytes") {
      const n = Math.max(1, Math.min(64, +$("rnd-count").value || 8));
      const b = crypto.getRandomValues(new Uint8Array(n));
      for (let i = 0; i < b.length; i++) out.push(b[i].toString(16).padStart(2, "0"));
    } else if (type === "uuid") {
      for (let i = 0; i < count; i++) out.push(uuidv4());
    }
    $("rnd-out").textContent = out.join("\n");
    $("rnd-int-opts").style.display = (type === "int") ? "" : "none";
  }

  /* ---------- 7. USERNAME ---------- */
  const ADJ = "cool quiet brave swift calm bold tiny mighty silent cosmic vivid lucky silent golden silent rapid silent silver silent hidden silent neon silent".split(" ");
  const NOUN = "tiger fox river comet storm eagle willow pixel shadowember frost crane tide quartz raven maple nova granite hawk glacier sparrow ember willow bison coral falcon pine lynx otter maple wave willow".split(" ");
  const LEET = "shadow tiger comet river eagle storm frost crane tide quartz raven maple nova granite hawk glacier sparrow ember lynx otter wave pixel".split(" ");
  function leet(w) { return w.replace(/a/gi, "4").replace(/e/gi, "3").replace(/i/gi, "1").replace(/o/gi, "0").replace(/s/gi, "5").replace(/t/gi, "7"); }
  function genUsername() {
    const style = $("un-style").value;
    const count = Math.max(1, Math.min(50, +$("un-count").value || 8));
    const out = [];
    for (let i = 0; i < count; i++) {
      if (style === "word") {
        out.push(NOUN[randInt(NOUN.length)] + (randInt(9000) + 100));
      } else if (style === "adj") {
        out.push(ADJ[randInt(ADJ.length)] + "_" + NOUN[randInt(NOUN.length)] + (randInt(90) + 10));
      } else {
        out.push(leet(LEET[randInt(LEET.length)]) + (randInt(90) + 10));
      }
    }
    $("un-out").textContent = out.join("\n");
  }

  /* ---------- 8. TOTP (RFC 6238) ---------- */
  const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function b32encode(bytes) {
    let bits = 0, value = 0, out = "";
    for (let i = 0; i < bytes.length; i++) { value = (value << 8) | bytes[i]; bits += 8; while (bits >= 5) { out += B32[(value >> (bits - 5)) & 31]; bits -= 5; } }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
  }
  function b32decode(str) {
    str = str.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
    let bits = 0, value = 0; const out = [];
    for (let i = 0; i < str.length; i++) { const idx = B32.indexOf(str[i]); if (idx < 0) continue; value = (value << 5) | idx; bits += 5; if (bits >= 8) { out.push((value >> (bits - 8)) & 0xff); bits -= 8; } }
    return new Uint8Array(out);
  }
  function hmacSha1(keyBytes, msgBytes) {
    return crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
      .then((k) => crypto.subtle.sign("HMAC", k, msgBytes))
      .then((sig) => new Uint8Array(sig));
  }
  async function totpCode(secretB32) {
    const key = b32decode(secretB32);
    if (!key || key.length === 0) return null;
    const counter = Math.floor(Date.now() / 1000 / 30);
    const buf = new ArrayBuffer(8); const dv = new DataView(buf);
    dv.setUint32(4, counter >>> 0, false);
    const hmac = await hmacSha1(key, new Uint8Array(buf));
    const off = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[off] & 0x7f) << 24 | (hmac[off + 1] & 0xff) << 16 | (hmac[off + 2] & 0xff) << 8 | (hmac[off + 3] & 0xff)) % 1000000;
    return code.toString().padStart(6, "0");
  }
  let totpTimer = null;
  function startTotp() {
    if (totpTimer) { clearInterval(totpTimer); totpTimer = null; }
    const secretEl = $("totp-secret");
    if (!secretEl.value.trim()) {
      const rb = crypto.getRandomValues(new Uint8Array(20));
      secretEl.value = b32encode(rb);
    }
    const C = 2 * Math.PI * 24;
    const tick = async () => {
      const code = await totpCode(secretEl.value.trim());
      if (code) $("totp-code").textContent = code;
      const left = 30 - (Math.floor(Date.now() / 1000) % 30);
      const fg = $("totp-ring-fg");
      if (fg) { fg.setAttribute("stroke-dasharray", C.toFixed(1)); fg.setAttribute("stroke-dashoffset", (C * (1 - left / 30)).toFixed(1)); }
    };
    tick();
    totpTimer = setInterval(tick, 1000);
  }

  /* ---------- wiring ---------- */
  function activateTool(name) {
    if (totpTimer && name !== "totp") { clearInterval(totpTimer); totpTimer = null; }
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tool === name));
    document.querySelectorAll(".tool-panel").forEach((p) => p.classList.toggle("active", p.dataset.tool === name));
    if (name === "password") genPassword();
    else if (name === "passphrase") genPassphrase();
    else if (name === "random") genRandom();
    else if (name === "totp") startTotp();
  }

  function init() {
    applyLang(lang);
    try { applyTheme(localStorage.getItem(themeKey) || "light"); } catch (e) { applyTheme("light"); }

    const seg = $("lang-seg");
    if (seg) seg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.langSet)));
    const tt = $("theme-toggle");
    if (tt) tt.addEventListener("click", () => applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));

    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => activateTool(t.dataset.tool)));

    // 1 password
    $("pw-length").addEventListener("input", (e) => { $("pw-length-val").textContent = e.target.value; genPassword(); });
    ["pw-upper", "pw-lower", "pw-num", "pw-sym", "pw-amb"].forEach((id) => $(id).addEventListener("change", genPassword));
    $("pw-gen").addEventListener("click", genPassword);
    $("pw-copy").addEventListener("click", (e) => copyText($("pw-out").textContent, e.target));

    // 2 passphrase
    ["pp-words", "pp-sep", "pp-cap", "pp-num"].forEach((id) => $(id).addEventListener("change", genPassphrase));
    $("pp-gen").addEventListener("click", genPassphrase);
    $("pp-copy").addEventListener("click", (e) => copyText($("pp-out").textContent, e.target));

    // 3 strength
    $("st-input").addEventListener("input", renderStrength);
    $("st-show").addEventListener("change", (e) => { $("st-input").type = e.target.checked ? "text" : "password"; });

    // 4 encrypt
    if ($("enc-mode")) $("enc-mode").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { encMode = b.dataset.mode; $("enc-mode").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); }));
    $("enc-run").addEventListener("click", runEncrypt);
    $("enc-copy").addEventListener("click", (e) => copyText($("enc-out").textContent, e.target));

    // 5 hash
    if (!$("hash-input").value) $("hash-input").value = "hello world";
    $("hash-algo").addEventListener("change", runHash);
    $("hash-input").addEventListener("input", runHash);
    $("hash-run").addEventListener("click", runHash);
    $("hash-copy").addEventListener("click", (e) => copyText($("hash-out").textContent, e.target));

    // 6 random
    $("rnd-type").addEventListener("change", genRandom);
    $("rnd-count").addEventListener("change", genRandom);
    $("rnd-min").addEventListener("change", genRandom);
    $("rnd-max").addEventListener("change", genRandom);
    $("rnd-gen").addEventListener("click", genRandom);
    $("rnd-copy").addEventListener("click", (e) => copyText($("rnd-out").textContent, e.target));

    // 7 username
    $("un-style").addEventListener("change", genUsername);
    $("un-count").addEventListener("change", genUsername);
    $("un-gen").addEventListener("click", genUsername);
    $("un-copy").addEventListener("click", (e) => copyText($("un-out").textContent, e.target));

    // 8 totp
    $("totp-rand").addEventListener("click", () => { const rb = crypto.getRandomValues(new Uint8Array(20)); $("totp-secret").value = b32encode(rb); startTotp(); });

    // open from hash (e.g. index.html#tool-encrypt)
    const h = location.hash.replace("#tool-", "");
    const valid = ["password", "passphrase", "strength", "encrypt", "hash", "random", "username", "totp"];
    if (valid.includes(h)) activateTool(h);
    else activateTool("password");

    runHash();
    renderStrength();
    genUsername();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // expose for verification
  window.Ciphra = { sha1, md5, b32decode, b32encode, totpCode, checkStrength, genPassword };
})();
