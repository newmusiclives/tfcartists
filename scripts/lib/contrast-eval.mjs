/**
 * Shared contrast evaluation, run inside the page.
 *
 * Resolves the EFFECTIVE background by walking ancestors and compositing
 * translucent layers, which is the only way to catch the common real-world
 * failure: a light control inheriting a dark card, or a number whose colour
 * was chosen against a background it no longer sits on.
 *
 * Lives here so the single-page auditor and the full-site sweep cannot drift
 * apart and disagree about whether a page passes.
 */
export const EVAL = () => {
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  // Effective background: walk up until an opaque-enough layer is found,
  // compositing translucent layers on the way. This is the part a static
  // stylesheet scan cannot do.
  const effectiveBg = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      const c = parse(cs.backgroundColor);
      const hasImage = cs.backgroundImage && cs.backgroundImage !== "none";
      if (hasImage) layers.push({ gradient: true });
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    if (layers.some((l) => l.gradient)) return { gradient: true };
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };

  const sel = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = (el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    return `${el.tagName.toLowerCase()}${id}${cls ? "." + cls : ""}`;
  };

  const out = [];
  const seen = new Set();

  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;

    // Only elements rendering their own text
    const ownText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    const isField = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
    if (!ownText && !isField) continue;

    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = effectiveBg(el);
    if (bg.gradient) continue; // can't fairly judge a gradient this way

    const size = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight || 400;
    const target = size >= 24 || (size >= 19 && weight >= 600) ? 3.0 : 4.5;

    const flat = fg.a < 1 ? over(fg, bg) : fg;
    const r = ratio(flat, bg);

    if (r < target) {
      const key = sel(el) + "|" + ownText.slice(0, 24);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        selector: sel(el),
        text: (ownText || `[${el.tagName.toLowerCase()} ${el.getAttribute("placeholder") || "field"}]`).slice(0, 46),
        color: cs.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        ratio: +r.toFixed(2),
        target,
        isField,
      });
    }

    // A field whose border is invisible against its own background is
    // effectively an invisible input, even if its text would be readable.
    if (isField) {
      const bw = parseFloat(cs.borderTopWidth) || 0;
      const bc = parse(cs.borderTopColor);
      if (bw > 0 && bc && bc.a > 0) {
        const flatB = bc.a < 1 ? over(bc, bg) : bc;
        const br = ratio(flatB, bg);
        if (br < 1.5) {
          out.push({
            selector: sel(el),
            text: "[border invisible against background]",
            color: cs.borderTopColor,
            bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
            ratio: +br.toFixed(2),
            target: 1.5,
            isField: true,
          });
        }
      }
    }
  }
  return out;
};
