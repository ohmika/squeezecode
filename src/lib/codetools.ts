export type Lang = "js" | "css" | "html" | "json";
export type Opts = {
  comments: boolean;
  keepLicense: boolean;
  blankLines: boolean;
  tags: boolean;
  console: boolean;
};

function stripJsComments(src: string, keepLicense: boolean) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++;
    } else if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const e = end === -1 ? src.length : end + 2;
      const block = src.slice(i, e);
      if (keepLicense && block.startsWith("/*!")) out += block;
      i = e;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function applyStrips(code: string, lang: Lang, o: Opts) {
  let s = code;
  if (o.tags && lang === "html") {
    s = s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "");
  }
  if (o.comments) {
    if (lang === "html") s = s.replace(/<!--[\s\S]*?-->/g, "");
    if (lang === "js" || lang === "css") s = stripJsComments(s, o.keepLicense);
  }
  if (o.console && lang === "js") s = s.replace(/^\s*console\.\w+\([^;]*\);?\s*$/gm, "");
  if (o.blankLines) s = s.replace(/^\s*[\r\n]/gm, "");
  return s;
}

function minify(s: string, lang: Lang) {
  if (lang === "json") return JSON.stringify(JSON.parse(s));
  if (lang === "css") return s.replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").trim();
  if (lang === "html") return s.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  return s.split("\n").map((l) => l.trim()).filter(Boolean).join("\n")
    .replace(/[ \t]+/g, " ").replace(/\s*([{}();,=:+\-*<>!&|?])\s*/g, "$1");
}

async function prettify(s: string, lang: Lang) {
  const prettier = await import("prettier/standalone");
  if (lang === "css") {
    const p = await import("prettier/plugins/postcss");
    return prettier.format(s, { parser: "css", plugins: [p] });
  }
  if (lang === "html") {
    const [h, b, e, c] = await Promise.all([
      import("prettier/plugins/html"), import("prettier/plugins/babel"),
      import("prettier/plugins/estree"), import("prettier/plugins/postcss"),
    ]);
    return prettier.format(s, { parser: "html", plugins: [h, b, e as never, c] });
  }
  const [b, e] = await Promise.all([import("prettier/plugins/babel"), import("prettier/plugins/estree")]);
  return prettier.format(s, { parser: lang === "json" ? "json" : "babel", plugins: [b, e as never] });
}

export async function transform(code: string, lang: Lang, mode: "min" | "pretty", o: Opts) {
  const stripped = applyStrips(code, lang, o);
  if (lang === "html" && o.tags) return mode === "min" ? stripped.replace(/\s+/g, " ").trim() : stripped.trim();
  return mode === "min" ? minify(stripped, lang) : prettify(stripped, lang);
}
