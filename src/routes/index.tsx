import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { transform, type Lang, type Opts } from "@/lib/codetools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Squeeze — code minify & prettify" },
      { name: "description", content: "Plak code, kies minify of prettify en bepaal wat er weg moet." },
      { property: "og:title", content: "Squeeze — code minify & prettify" },
      { property: "og:description", content: "Plak code, kies minify of prettify en bepaal wat er weg moet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const LANGS: { id: Lang; label: string }[] = [
  { id: "js", label: "JS" }, { id: "css", label: "CSS" }, { id: "html", label: "HTML" }, { id: "json", label: "JSON" },
];
const OPTS: { k: keyof Opts; label: string; langs?: Lang[] }[] = [
  { k: "comments", label: "Comments", langs: ["js", "css", "html"] },
  { k: "keepLicense", label: "Keep /*! license */", langs: ["js", "css"] },
  { k: "blankLines", label: "Blank lines" },
  { k: "tags", label: "HTML tags", langs: ["html"] },
  { k: "console", label: "console.*", langs: ["js"] },
];

function Index() {
  const [code, setCode] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [lang, setLang] = useState<Lang>("js");
  const [mode, setMode] = useState<"min" | "pretty">("pretty");
  const [copied, setCopied] = useState(false);
  const [o, setO] = useState<Opts>({ comments: true, keepLicense: true, blankLines: true, tags: false, console: false });

  const run = async () => {
    setErr("");
    try { setOut((await transform(code, lang, mode, o)) ?? ""); }
    catch (e) { setErr(e instanceof Error ? e.message.split("\n")[0] : "Kon code niet verwerken"); setOut(""); }
  };
  const paste = async () => { try { setCode(await navigator.clipboard.readText()); } catch { /* ignore */ } };
  const copy = async () => { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 pb-28 pt-6">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl tracking-tight">squeeze<span className="text-primary">.</span></h1>
        <span className="font-mono text-xs text-muted-foreground">minify · prettify</span>
      </header>

      <div className="seg">
        {LANGS.map((l) => (
          <button key={l.id} data-on={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-bar">
          <span>input</span>
          <div className="flex gap-3">
            <button onClick={paste} className="text-primary">Plakken</button>
            <button onClick={() => { setCode(""); setOut(""); }}>Wissen</button>
          </div>
        </div>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
          placeholder="// plak hier je code" className="code-area h-48" />
      </section>

      <div className="seg">
        <button data-on={mode === "pretty"} onClick={() => setMode("pretty")}>Prettify</button>
        <button data-on={mode === "min"} onClick={() => setMode("min")}>Minify</button>
      </div>

      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Strip</p>
        <div className="flex flex-wrap gap-2">
          {OPTS.filter((x) => !x.langs || x.langs.includes(lang)).map((x) => (
            <button key={x.k} className="chip" data-on={o[x.k]} onClick={() => setO({ ...o, [x.k]: !o[x.k] })}>
              {x.label}
            </button>
          ))}
        </div>
      </section>

      {(out || err) && (
        <section className="panel">
          <div className="panel-bar">
            <span>output {out && `· ${out.length} tekens (${code.length ? Math.round((out.length / code.length) * 100) : 0}%)`}</span>
            {out && <button onClick={copy} className="text-primary">{copied ? "Gekopieerd ✓" : "Kopiëren"}</button>}
          </div>
          {err ? <p className="p-4 font-mono text-sm text-destructive">{err}</p>
            : <textarea readOnly value={out} className="code-area h-56" />}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-8">
        <button onClick={run} disabled={!code.trim()} className="go mx-auto block w-full max-w-xl">
          {mode === "min" ? "Minify" : "Prettify"} →
        </button>
      </div>
    </main>
  );
}
