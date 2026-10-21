"use client";

import { useRef, useState } from "react";

const EXTENSIONS: Record<string, string> = {
  typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx",
  python: "py", py: "py", html: "html", css: "css", json: "json", sql: "sql",
  bash: "sh", sh: "sh", java: "java", go: "go", rust: "rs", php: "php", csharp: "cs",
};

export function CodeBlock({ language, children }: { language?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const text = () => ref.current?.innerText ?? "";

  async function copy() {
    await navigator.clipboard.writeText(text());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const ext = (language && EXTENSIONS[language]) || "txt";
    const url = URL.createObjectURL(new Blob([text()], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghoul.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between bg-panel px-3 py-1.5 text-xs text-muted">
        <span>{language ?? "código"}</span>
        <div className="flex gap-3">
          <button onClick={copy} className="hover:text-foreground">{copied ? "Copiado" : "Copiar"}</button>
          <button onClick={download} className="hover:text-foreground">Descargar</button>
        </div>
      </div>
      <pre ref={ref} className="overflow-x-auto bg-[#0d1117] p-3 text-sm">{children}</pre>
    </div>
  );
}
