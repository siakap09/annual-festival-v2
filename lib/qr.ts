// qrcode's package.json remaps its root entry to a browser/canvas-based
// implementation via the legacy "browser" field, which throws "You need to
// specify a canvas element" when it ends up in a server bundle. The
// "Node-safe" qrcode/lib/server entry doesn't fix this either: it
// unconditionally requires every renderer (including the PNG one) at module
// load time, and the PNG renderer depends on pngjs -> Node's zlib/stream,
// unavailable under the Edge Runtime this whole app runs on for Cloudflare
// compatibility. So we bypass qrcode/lib/server entirely and import only
// the two zero-native-dependency pieces we need directly: the QR matrix
// encoder (core/qrcode) and the SVG string renderer (renderer/svg-tag).
// @ts-expect-error -- no type declarations for this subpath
import { create as createQrData } from "qrcode/lib/core/qrcode";
// @ts-expect-error -- no type declarations for this subpath
import { render as renderQrSvg } from "qrcode/lib/renderer/svg-tag";

export function qrSvg(content: string, width = 200): string {
  const qrData = createQrData(content, {});
  // Margin is the "quiet zone" width in QR modules -- the spec recommends
  // at least 4. Too thin a margin (this was 1) makes real camera scanners
  // unreliable at detecting the code at all, even though it looks fine to
  // the eye and decodes fine from a clean digital image.
  const svg: string = renderQrSvg(qrData, { margin: 4, width });
  // Strip the fixed width/height attributes -- the viewBox alone is enough
  // for the SVG to scale responsively via CSS. Left in place, browsers use
  // these as the element's *intrinsic* size for layout purposes (e.g. flex
  // min-content calculations) even when CSS overrides the rendered size,
  // which can force a responsive container wider than its viewport.
  return svg.replace(/^(<svg\b)([^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, "$1$2");
}

export function qrSvgDataUrl(content: string, width = 200): string {
  return `data:image/svg+xml;base64,${btoa(qrSvg(content, width))}`;
}
