// Minimal, dependency-light .xlsx reader: an .xlsx file is just a zip of
// XML parts. We use fflate (pure JS, zero Node built-ins -- verified
// edge-safe, unlike a full SheetJS/exceljs install) to unzip, then hand-roll
// the small amount of XML extraction we actually need (shared strings +
// cell values) via regex rather than pulling in a full XML parser. Same
// "avoid a heavy/Node-only dependency" reasoning as lib/csv.ts and lib/qr.ts.
import { unzipSync, strFromU8 } from "fflate";

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function colLetterToIndex(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) {
    n = n * 26 + (col.charCodeAt(i) - 64);
  }
  return n - 1;
}

function parseSharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  const strings: string[] = [];
  // Each <si> entry is one shared string; it may contain a single <t> or
  // multiple <r><t>...</t></r> "rich text" runs that need concatenating.
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let siMatch: RegExpExecArray | null;
  while ((siMatch = siRe.exec(xml))) {
    const inner = siMatch[1];
    const texts: string[] = [];
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRe.exec(inner))) {
      texts.push(unescapeXml(tMatch[1]));
    }
    strings.push(texts.join(""));
  }
  return strings;
}

function firstWorksheetXml(files: Record<string, Uint8Array>): string {
  const sheetPaths = Object.keys(files)
    .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
    .sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
      return na - nb;
    });
  if (sheetPaths.length === 0) {
    throw new Error("Couldn't find a worksheet inside this .xlsx file.");
  }
  return strFromU8(files[sheetPaths[0]]);
}

/** Parses the first worksheet of an .xlsx file into the same string[][]
 * shape parseCsv() produces, so callers can treat both formats identically. */
export function parseXlsx(buffer: ArrayBuffer): string[][] {
  const files = unzipSync(new Uint8Array(buffer));
  const sharedStrings = parseSharedStrings(
    files["xl/sharedStrings.xml"] ? strFromU8(files["xl/sharedStrings.xml"]) : undefined
  );
  const sheetXml = firstWorksheetXml(files);

  const rows: string[][] = [];
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(sheetXml))) {
    const rowAttrs = rowMatch[1];
    const rowContent = rowMatch[2];
    const rowNum = Number(rowAttrs.match(/\br="(\d+)"/)?.[1] ?? rows.length + 1);

    const row: string[] = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowContent))) {
      const cellAttrs = cellMatch[1];
      const cellContent = cellMatch[2] ?? "";
      const ref = cellAttrs.match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!ref) continue;
      const colIndex = colLetterToIndex(ref);
      const type = cellAttrs.match(/\bt="([^"]+)"/)?.[1];

      let value = "";
      if (type === "inlineStr") {
        value = unescapeXml(cellContent.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "");
      } else {
        const raw = cellContent.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        if (type === "s") {
          value = sharedStrings[Number(raw)] ?? "";
        } else {
          value = unescapeXml(raw);
        }
      }
      row[colIndex] = value;
    }

    rows[rowNum - 1] = row;
  }

  // Fill any entirely-skipped row indices (rare, but keeps row numbers
  // aligned) and normalize holes within each row to "".
  const maxCols = rows.reduce((max, r) => Math.max(max, r?.length ?? 0), 0);
  return rows.map((row) => {
    const filled = row ?? [];
    return Array.from({ length: maxCols }, (_, i) => filled[i] ?? "");
  });
}
