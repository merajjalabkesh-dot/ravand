/** Glyph Portal © 2026 Christian Katzmann. MIT. */
import { useId, useLayoutEffect, useRef } from "react";

const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a, b, n) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const DEFAULT_FONT = '"Arial Black", "Arial", sans-serif';
const isRtl = (t) => /[ء-ي٠-٩ٱ-ۓݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(String(t || ''));

/** Largest opaque square, in linear time. Unlike a stem guess, it works in O, S and Ø. */
function interior(context, char, font) {
  const canvas = context.canvas;
  context.font = font;
  const m = context.measureText(char);
  const pad = 8;
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const ascent = Math.ceil(m.actualBoundingBoxAscent);
  canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
  canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
  context.font = font;
  context.fontKerning = "none";
  context.fillText(char, pad + left, pad + ascent);
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const rows = new Uint16Array(width + 1);
  let size = 0, bx = 0, by = 0;
  for (let y = 0; y < height; y++) {
    let diagonal = 0;
    for (let x = 0; x < width; x++) {
      const above = rows[x + 1];
      rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245
        ? Math.min(above, rows[x], diagonal) + 1 : 0;
      diagonal = above;
      if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
    }
  }
  if (size < 3) return null;
  return { x: (bx + 1 - size / 2 - pad - left) / 3,
    y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
}

function scrollParent(element) {
  for (let p = element.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowY) && p !== document.body && p !== document.documentElement) return p;
  }
  return null;
}

export default function GlyphPortal({
  word = "SUBLIME", focusChar, interactive = true, background, front, children, scrollLength = 2.4,
  fontFamily = DEFAULT_FONT, fontWeight = 900, annotations = false,
  enterLabel = "Enter section", className, style, onProgress,
}) {
  const uid = `gp-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const clipId = `${uid}-clip`;
  const sectionRef = useRef(null);
  const progressRef = useRef(onProgress);
  useLayoutEffect(() => { progressRef.current = onProgress; }, [onProgress]);
  const text = String(word).trim().normalize("NFC") || "SUBLIME";
  let characterOffset = 0;
  const characters = Array.from(text, (char) => {
    const index = characterOffset; characterOffset += char.length;
    return { char, index };
  });
  const length = Number.isFinite(scrollLength) ? clamp(scrollLength, 1, 8) : 2.4;
  const weight = Number.isFinite(fontWeight) ? clamp(fontWeight, 1, 1000) : 900;
  const hasFront = front != null;
  const q = `:where(#${uid})`;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector("[data-gp-pin]");
    const field = section.querySelector("[data-gp-field]");
    const art = section.querySelector("[data-gp-art]");
    const inkLayer = section.querySelector("[data-gp-ink]");
    const inkText = section.querySelector("[data-gp-ink-text]");
    const clip = section.querySelector(`#${clipId}`);
    const glyph = section.querySelector("[data-gp-glyph]");
    const marks = section.querySelector("[data-gp-marks]");
    const choices = section.querySelector("[data-gp-choices]");
    const buttons = Array.from(choices.querySelectorAll("button"));
    const picker = section.querySelector("[data-gp-select]");
    const root = scrollParent(section);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let disposed = false, raf = 0, dirty = true, active = true, ready = false;
    const mountedAt = performance.now();
    let browserFrameSeen = false, stalled = false;
    let W = 1, H = 1, travel = 1, startScale = 1, endScale = 1;
    let center = { x: 0, y: 0 }, target = null;
    let lastProgress = -1;
    let candidates = [], letters = [];
    let choosing = false;
    let bounds = { x: 0, y: 0, width: 1, height: 1 };
    let fontDirty = true;
    glyph.style.fontFamily = fontFamily;
    const computedFamily = getComputedStyle(glyph).fontFamily;
    const families = computedFamily.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g) ?? [];
    const checkFonts = () => families.filter((family) => {
      try { return document.fonts.check(`${weight} 100px ${family.trim()}`, text); }
      catch { return false; }
    });
    const available = checkFonts();
    glyph.style.fontFamily = [...available, DEFAULT_FONT].join(",");
    stalled = available.length < families.length;
    // Fonts can settle AFTER mount — or fail silently when their CDN is blocked
    // (common for fonts.googleapis.com without a proxy). Measurement and render
    // use the same fallback either way, so once fonts are settled, clear
    // `stalled` and re-measure if the real font did arrive. Without this the
    // scroll animation would stay permanently static on devices that can't
    // reach the font CDN.
    let fontsReconciled = !stalled;
    let fontsTimer = 0;
    const reconcileFonts = () => {
      if (disposed || fontsReconciled) return;
      fontsReconciled = true;
      const avail = checkFonts();
      glyph.style.fontFamily = [...avail, DEFAULT_FONT].join(",");
      if (avail.length >= families.length) fontDirty = true; // real font arrived → re-measure
      stalled = false;
      dirty = true;
      schedule();
    };
    if (stalled) {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(reconcileFonts);
      fontsTimer = setTimeout(reconcileFonts, 1500);
    }

    const readInk = () => {
      if (!context) return false;
      const font = getComputedStyle(glyph);
      const scanFont = `${font.fontWeight} 300px ${font.fontFamily}`;
      context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
      context.fontKerning = "none";
      const metrics = context.measureText(text);
      const advances = Array.from({ length: text.length }, (_, i) => context.measureText(text.slice(0, i)).width);
      bounds = { x: -metrics.actualBoundingBoxLeft, y: -metrics.actualBoundingBoxAscent,
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent };
      if (!bounds.width || !bounds.height) return false;
      // Text is text-anchor=middle at the origin; the camera orbits (0,0) so the
      // word is always centered on screen.
      center = { x: 0, y: 0 };
      const requested = focusChar ? text.indexOf(focusChar.normalize("NFC")) : -1;
      let offset = 0;
      candidates = []; letters = [];
      // With anchor=middle the whole word centers at 0. Compute per-letter box
      // relative to the word's midpoint by subtracting half the total width.
      const wordMid = bounds.x + bounds.width / 2;
      for (const char of Array.from(text)) {
        context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
        const m = context.measureText(char);
        const lx = advances[offset] - m.actualBoundingBoxLeft - wordMid;
        letters.push({ index: offset, x: lx,
          y: -m.actualBoundingBoxAscent, width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
          height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent });
        offset += char.length;
      }
      // Aim the scroll zoom at a real letter's ink region, never the geometric
      // center of the whole word: with text-anchor=middle, (0,0) is the
      // whitespace between glyphs. Letter boxes (from measureText at the same
      // pen as the clip-path text) always overlap a letter.
      // When focusChar is given, target the LEFT, upright stem of that letter
      // (for Latin lowercase letters the left quarter holds the vertical stroke,
      // e.g. the upright of 'n'), matching the reference: diving into the standing
      // stroke. Vertical aim uses the word's own mid-height so all letters sit on
      // the same baseline line.
      const boxCenter = (box) => ({
        x: box.x + box.width * (isRtl(text) ? 0.5 : 0.14), // deep-left stem for LTR (no white arch visible), center for RTL
        y: bounds.y + bounds.height / 2
      })
      let via = null
      const radiusOf = (box) => Math.max(18, Math.min(34, box.height / 2.4))
      const fallbackIdx = Array.from(text).length - 1
      if (requested >= 0) {
        const box = letters.find((item) => item.index === requested)
        if (box) via = { index: box.index, ...boxCenter(box), radius: radiusOf(box) }
      } else {
        let best = Infinity
        for (let i = letters.length - 1; i >= 0; i--) {
          const box = letters[i]
          const d = Math.abs(box.x + box.width / 2)
          if (d < best) { best = d; via = { index: box.index, ...boxCenter(box), radius: radiusOf(box) } }
        }
      }
      if (!via) via = { index: fallbackIdx, x: center.x, y: 0, radius: Math.max(24, bounds.height / 4) }
      target = via
      candidates = [target]
      return true
    };

    const select = (next) => {
      target = next;
      endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
      section.dataset.gpFocus = target ? Array.from(text.slice(target.index))[0] : "";
      section.dataset.gpFocusIndex = String(target ? target.index : -1);
      for (const button of buttons) {
        const selected = Number(button.dataset.gpLetter) === (target ? target.index : -1);
        button.disabled = !candidates.some((candidate) => candidate.index === Number(button.dataset.gpLetter));
        button.setAttribute("aria-checked", String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      if (picker.value !== "") picker.value = String(target ? target.index : -1);
      for (const option of Array.from(picker.options)) option.disabled = option.value === "" || !candidates.some((candidate) => candidate.index === Number(option.value));
      const u = 1 / startScale;
      const y = bounds.y + bounds.height + 25 * u;
      const x = bounds.x;
      const right = x + bounds.width;
      const cross = target ? `M${target.x - 9 * u} ${target.y}h${18 * u}M${target.x} ${target.y - 9 * u}v${18 * u}` : "";
      const annotationPath = marks.querySelector("path");
      annotationPath.setAttribute("d", `M${x} ${y}H${right}M${x} ${y - 5 * u}v${10 * u}M${right} ${y - 5 * u}v${10 * u}${cross}`);
      annotationPath.setAttribute("stroke-width", String(u));
    };

    const position = () => {
      const origin = root ? root.getBoundingClientRect().top + root.clientTop : 0;
      return clamp((origin - section.getBoundingClientRect().top) / travel);
    };

    const paint = (progress) => {
      const isStatic = motion.matches || !browserFrameSeen || stalled || !target;
      const p = isStatic ? 0 : progress;
      const t = clamp(p / 0.78);
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
      const blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
      const cx = center.x + ((target ? target.x : center.x) - center.x) * blend;
      const cy = center.y + ((target ? target.y : center.y) - center.y) * blend;
      const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
      // Baseline translate: place the word's ink center at the viewport's vertical middle.
      const inkCenterPen = bounds.y + bounds.height / 2;
      const baseY = H * 0.48 - inkCenterPen * startScale;
      const transform = `translate(${W / 2} ${baseY + H * 0.04 * eased}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;
      const radians = roll * Math.PI / 180;
      const dx = W / 2 / scale, dy = (baseY + H * .04 * eased) / scale;
      clip.setAttribute("transform", `scale(${scale}) rotate(${roll})`);
      glyph.setAttribute("transform", `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`);
      /* حروف توپر دقیقاً مثل کلیپ حرکت می‌کنند و همیشه کامل پررنگ
         می‌مانند. opacity عمداً inline نیست تا setAttribute کار کند. */
      if (inkText) {
        inkText.setAttribute("transform", glyph.getAttribute("transform"));
        inkLayer.setAttribute("transform", `scale(${scale}) rotate(${roll})`);
        inkLayer.setAttribute("opacity", "1");
      }
      marks.setAttribute("transform", transform);
      marks.style.opacity = String(1 - smooth(0.015, 0.17, p));
      choosing = interactive && !isStatic && p < .04;
      choices.inert = !choosing;
      section.dataset.gpChoosing = String(choosing);
      field.style.clipPath = t >= 1 ? "none" : `url(#${clipId})`;
      section.style.setProperty("--gp-caption", String(1 - smooth(0.01, 0.16, p)));
      section.style.setProperty("--gp-reveal", String(isStatic ? 1 : smooth(0.78, 0.9, p)));
      section.style.setProperty("--gp-field-scale", String(1 + .16 * smooth(0, .82, p)));
      section.style.setProperty("--gp-caption-hit", p < 0.08 ? "auto" : "none");
      section.dataset.gpEntered = String(p >= 0.9);
      section.dataset.gpProgress = p.toFixed(5);
      if (p !== lastProgress) { lastProgress = p; progressRef.current && progressRef.current(p); }
    };

    const layout = () => {
      if (!section.clientWidth) return;
      W = pin.clientWidth;
      const smallViewport = section.querySelector("[data-gp-viewport]").offsetHeight;
      const viewportHeight = Math.max(1, Math.min(root ? root.clientHeight : smallViewport, smallViewport));
      H = motion.matches ? Math.min(viewportHeight * 0.75, 480) : viewportHeight;
      section.style.setProperty("--gp-height", `${H}px`);
      travel = H * length;
      art.setAttribute("viewBox", `0 0 ${W} ${H}`);
      if (fontDirty) { ready = readInk(); if (ready) fontDirty = false; }
      if (!ready) return;
      const wordHeight = hasFront && H < 480 ? Math.min(H * .38, Math.max(24, H - 264)) : H * .38;
      startScale = Math.min(W * 0.84 / bounds.width, wordHeight / bounds.height);
      select(target);
      for (const button of buttons) {
        const letter = letters.find((item) => item.index === Number(button.dataset.gpLetter));
        if (!letter) continue;
        Object.assign(button.style, {
          left: `${W / 2 + (letter.x - center.x) * startScale}px`,
          top: `${H * .5 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`,
          width: `${Math.max(1, letter.width * startScale)}px`,
          height: `${Math.max(44, letter.height * startScale)}px`,
        });
      }
      section.style.setProperty("--gp-word-top", `${H * .5 - bounds.height * startScale / 2}px`);
      section.style.setProperty("--gp-word-bottom", `${H * .5 + bounds.height * startScale / 2}px`);
      section.dataset.gpReady = "true";
      section.dataset.gpMotion = !motion.matches && browserFrameSeen && !stalled && target ? "on" : "off";
    };

    const frame = (time) => {
      raf = 0;
      if (disposed) return;
      if (time !== undefined && !browserFrameSeen) {
        browserFrameSeen = true; stalled ||= fontsReconciled ? false : performance.now() - mountedAt > 2500; dirty = true;
      }
      if (dirty) { dirty = false; layout(); }
      if (ready) paint(position());
    };
    choices.inert = true; /* set on mount before first paint */
    const schedule = () => { if (!raf && active) raf = requestAnimationFrame(frame); };
    const resize = () => { cancelAnimationFrame(raf); dirty = true; frame(); };
    const scroll = () => schedule();
    const choose = (event) => {
      if (!choosing || position() >= .04) return;
      const button = event.target.closest("[data-gp-letter]");
      const next = candidates.find((candidate) => candidate.index === Number(button && button.dataset.gpLetter));
      if (!next || next === target) return;
      select(next); paint(position());
    };
    const navigate = (event) => {
      if (!choosing || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = candidates.indexOf(target);
      const index = event.key === "Home" ? 0 : event.key === "End" ? candidates.length - 1
        : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + candidates.length) % candidates.length;
      const nextBtn = buttons.find((button) => Number(button.dataset.gpLetter) === (candidates[index] ? candidates[index].index : -1));
      if (nextBtn) nextBtn.focus({ preventScroll: true });
    };
    const pick = () => {
      if (!choosing || position() >= .04) return;
      const next = candidates.find((candidate) => candidate.index === Number(picker.value));
      if (next) { select(next); paint(position()); }
    };
    choices.addEventListener("pointerover", choose);
    choices.addEventListener("click", choose);
    choices.addEventListener("focusin", choose);
    choices.addEventListener("keydown", navigate);
    picker.addEventListener("change", pick);
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    if (root) observer.observe(root);
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) { dirty = true; schedule(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { root, rootMargin: "100% 0px" });
    visibility.observe(section);
    (root || window).addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    window.visualViewport && window.visualViewport.addEventListener("resize", resize);
    motion.addEventListener("change", resize);
    frame();
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (fontsTimer) clearTimeout(fontsTimer);
      observer.disconnect();
      visibility.disconnect();
      (root || window).removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      window.visualViewport && window.visualViewport.removeEventListener("resize", resize);
      motion.removeEventListener("change", resize);
      choices.removeEventListener("pointerover", choose);
      choices.removeEventListener("click", choose);
      choices.removeEventListener("focusin", choose);
      choices.removeEventListener("keydown", navigate);
      picker.removeEventListener("change", pick);
    };
  }, [text, focusChar, interactive, fontFamily, weight, length, clipId, hasFront]);

  return (
    <section ref={sectionRef} id={uid} className={className} aria-label={text}
      style={{ "--gp-length": length, "--gp-characters": Array.from(text).length, ...style }}>
      <style>{`
        ${q}{--gp-paper:#fff;--gp-ink:#0c1212;--gp-field:#0b3b2a;--gp-foreground:#fbfbfa;position:relative;isolation:isolate;background:var(--gp-paper);color:var(--gp-ink);font-family:Arial,sans-serif;}
        ${q}>[data-gp-viewport]{position:absolute;inset:0 auto auto 0;height:100vh;height:100svh;width:0;pointer-events:none;visibility:hidden;}
        ${q} [data-gp-pin]{position:relative;height:var(--gp-height,100svh);overflow:clip;isolation:isolate;container-type:size;}
        ${q} [data-gp-field]{position:absolute;inset:0;background:var(--gp-field);opacity:0;pointer-events:none;}
        ${q}[data-gp-ready] [data-gp-field]{opacity:1;}
        ${q} [data-gp-art]{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;}
        ${q} [data-gp-marks]{fill:none;stroke:var(--gp-ink);opacity:.6;}
        ${q} [data-gp-choices]{position:absolute;inset:0;visibility:hidden;pointer-events:none;}
        ${q}[data-gp-choosing=true] [data-gp-choices]{visibility:visible;}
        ${q} [data-gp-letter]{box-sizing:border-box;position:absolute;border:0;padding:0;margin:0;background:transparent;cursor:pointer;pointer-events:auto;touch-action:pan-y;}
        ${q} [data-gp-letter]:disabled{pointer-events:none;}
        ${q} [data-gp-letter]:focus-visible{outline:2px solid var(--gp-field);outline-offset:5px;}
        ${q} [data-gp-touch-picker]{display:none;position:absolute;top:calc(var(--gp-word-bottom,50%) + 42px);left:50%;transform:translateX(-50%);font:12px/1.4 Arial,sans-serif;align-items:center;gap:12px;visibility:hidden;}
        ${q}[data-gp-choosing=true] [data-gp-touch-picker]{visibility:visible;}
        ${q} [data-gp-select]{min-height:44px;min-width:90px;border:1px solid #d8deda;border-radius:4px;background:var(--gp-paper);color:var(--gp-ink);padding:0 10px;font:inherit;}
        ${q} [data-gp-select]:focus-visible{outline:2px solid var(--gp-field);outline-offset:4px;}
        @media(any-pointer:coarse){${q} [data-gp-touch-picker]{display:flex;}}
        ${q} [data-gp-fallback]{position:absolute;inset:0;display:none;place-items:center;font-size:min(calc(100cqw / var(--gp-characters)),38cqh);line-height:1;color:var(--gp-field);}
        ${q}[data-gp-ready] [data-gp-fallback]{visibility:hidden;}
        ${q} [data-gp-caption]{position:absolute;inset:auto 8% 9%;display:flex;align-items:center;justify-content:space-between;gap:1rem;font:12px/1.4 Arial,sans-serif;opacity:var(--gp-caption,1);pointer-events:var(--gp-caption-hit,auto);}
        ${q} [data-gp-caption]{font-family:inherit;}
        ${q} [data-gp-front]{position:absolute;inset:0;opacity:var(--gp-caption,1);pointer-events:none;}
        ${q} [data-gp-front] a,${q} [data-gp-front] button{pointer-events:var(--gp-caption-hit,auto);}
        ${q} [data-gp-front]:focus-within{opacity:1;}
        ${q} [data-gp-hint]{max-width:30ch;color:var(--gp-ink);}
        ${q} [data-gp-enter]{display:inline-flex;align-items:center;gap:16px;min-height:44px;color:inherit;font:inherit;text-decoration:none;letter-spacing:inherit;}
        ${q} [data-gp-enter]:focus-visible{outline:2px solid currentColor;outline-offset:5px;}
        ${q} [data-gp-caption]:focus-within{opacity:1;pointer-events:auto;}
        ${q} [data-gp-enter]:focus-visible{background:var(--gp-paper);color:var(--gp-ink);padding:0 12px;margin:0 -12px;}
        ${q} [data-gp-content]{box-sizing:border-box;position:relative;min-height:var(--gp-height,100svh);padding:clamp(32px,7%,100px);display:grid;align-content:center;color:var(--gp-foreground);background:var(--gp-field);overflow-wrap:anywhere;}
        ${q}[data-gp-motion=on] [data-gp-pin]{position:sticky;top:0;}
        ${q}[data-gp-motion=off] [data-gp-hint]{display:none;}
        ${q}[data-gp-motion=on] [data-gp-content]{margin-top:calc((var(--gp-length) - 1) * var(--gp-height));background:transparent;opacity:var(--gp-reveal,0);pointer-events:none;}
        ${q}[data-gp-motion=on][data-gp-entered=true] [data-gp-content]{pointer-events:auto;}
        ${q}[data-gp-motion=on]:has([data-gp-content]:focus-within) [data-gp-field]{clip-path:none!important;}
        ${q}[data-gp-motion=on] [data-gp-content]:focus-within{opacity:1;pointer-events:auto;}
        ${q}:has([data-gp-content]:focus-within) [data-gp-caption],${q}:has([data-gp-content]:focus-within) [data-gp-marks]{opacity:0;}
        ${q} [data-gp-default-title]{color:inherit;font:400 clamp(32px,5vw,72px)/1.05 Georgia,serif;letter-spacing:-.035em;max-width:13ch;margin:0 0 24px;text-wrap:balance;}
        ${q} [data-gp-default-copy]{color:inherit;font:16px/1.6 Arial,sans-serif;max-width:36ch;margin:0;}
        @media(prefers-reduced-motion:reduce){${q} [data-gp-pin]{position:relative!important;} ${q} [data-gp-content]{margin-top:0!important;opacity:1!important;background:var(--gp-field)!important;min-height:0;padding-block:64px;} ${q} [data-gp-caption]{opacity:1!important;}}
        @media(prefers-reduced-motion:reduce){${q} [data-gp-hint]{display:none;}}
      `}</style>
      <noscript><style>{`${q} [data-gp-fallback]{display:grid}${q} [data-gp-hint]{display:none}`}</style></noscript>
      <div data-gp-viewport aria-hidden="true" />
      <div data-gp-pin>
        <div data-gp-field aria-hidden="true">
          {background || <div data-gp-default-field style={{ position: "absolute", inset: 0, transform: "scale(var(--gp-field-scale,1))", background: "radial-gradient(circle at 18% 8%, rgba(68,125,98,.72), transparent 34%), radial-gradient(circle at 82% 20%, rgba(251,251,250,.12), transparent 28%), radial-gradient(circle at 48% 78%, rgba(9,48,35,.5), transparent 44%), linear-gradient(135deg,#0b3b2a 0%,#14573f 48%,#082d22 100%)" }} />}
        </div>
        <svg data-gp-art aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <text data-gp-glyph textAnchor="middle" x="0" y="0" style={{ fontFamily, fontWeight: weight, fontSize: 100, fontKerning: "none", fontVariantLigatures: "none", letterSpacing: 0, direction: isRtl(text) ? "rtl" : "ltr", unicodeBidi: "isolate" }}>{text}</text>
            </clipPath>
          </defs>
          {/* رنگ توپر خود حروف (--gp-ink). زیرِ لایهٔ کلیپ‌شده می‌نشیند
              و همیشه پررنگ است — نه محو می‌شود، نه با زوم کم‌رنگ.
              بدون این لایه، حروف در ابتدا هم‌رنگ زمینه‌اند و کلمه دیده نمی‌شود. */}
          <g data-gp-ink>
            <text data-gp-ink-text textAnchor="middle" x="0" y="0" fill="var(--gp-ink)" style={{ fontFamily, fontWeight: weight, fontSize: 100, fontKerning: "none", fontVariantLigatures: "none", letterSpacing: 0, direction: isRtl(text) ? "rtl" : "ltr", unicodeBidi: "isolate" }}>{text}</text>
          </g>
          <g data-gp-marks style={{ visibility: annotations ? "visible" : "hidden" }}><path /></g>
        </svg>
        <div data-gp-choices role="radiogroup" aria-label="Choose the letter to enter through">
          {characters.map((c, i) => <button type="button" role="radio" aria-checked="false" tabIndex={-1} data-gp-letter={c.index} key={c.index} aria-label={`${c.char}, letter ${i + 1} of ${characters.length}`} />)}
        </div>
        <label data-gp-touch-picker><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>Entry letter</span><select data-gp-select defaultValue="">
          <option value="" disabled>Choose a letter</option>
          {characters.map((c, i) => <option key={c.index} value={c.index}>{i + 1} · {c.char}</option>)}
        </select></label>
        {front && <div data-gp-front>{front}</div>}
        <span data-gp-fallback aria-hidden="true" style={{ fontFamily, fontWeight: weight }}>{text}</span>
        <div data-gp-caption>
          <span data-gp-hint aria-hidden="true">{interactive ? "" : annotations ? "A passage through type" : ""}</span>
          {enterLabel ? <a data-gp-enter href={`#${uid}-content`}>{enterLabel}<span aria-hidden="true">↘</span></a> : null}
        </div>
      </div>
      <div data-gp-content id={`${uid}-content`} tabIndex={-1}>
        {children || <div><h2 data-gp-default-title>A letter becomes a place.</h2><p data-gp-default-copy>The shape opens onto whatever comes next.</p></div>}
      </div>
    </section>
  );
}
