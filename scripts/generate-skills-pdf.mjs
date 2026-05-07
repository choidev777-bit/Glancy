import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillsDir = path.join(root, "skills");
const outPath = path.join(root, "Glancy_Skills.html");

const skillFiles = [
  "README.md",
  "main.md",
  "dashboard-spec.md",
  "sample-data.md",
  "data.md",
  "indicators.md",
  "insights.md",
  "charts.md",
  "layout.md",
  "theme.md",
  "providers/kiwoom.md",
  "acceptance.md",
];

const h = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const inline = (value) => {
  let text = h(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
};

function renderTable(lines, startIndex) {
  const rows = [];
  let i = startIndex;
  while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
    rows.push(lines[i]);
    i += 1;
  }

  const cells = (row) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => inline(cell.trim()));

  const header = cells(rows[0] ?? "");
  const separatorIndex = rows.findIndex((row) => /^\s*\|?[\s:-]+\|[\s|:-]*\|?\s*$/.test(row));
  const bodyRows = rows.slice(separatorIndex >= 0 ? separatorIndex + 1 : 1).map(cells);

  const html = [
    "<table>",
    "<thead><tr>",
    ...header.map((cell) => `<th>${cell}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`),
    "</tbody></table>",
  ].join("");

  return { html, nextIndex: i };
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push(`<pre><code>${h(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*\|?\s*$/.test(lines[i + 1])) {
      flushParagraph();
      flushList();
      const table = renderTable(lines, i);
      blocks.push(table.html);
      i = table.nextIndex - 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 6);
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    const numbered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (numbered) {
      flushParagraph();
      list.push(numbered[1]);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  if (code.length) blocks.push(`<pre><code>${h(code.join("\n"))}</code></pre>`);
  return blocks.join("\n");
}

function fileTitle(file) {
  return file.replaceAll("\\", "/");
}

const generated = new Date().toISOString().slice(0, 10);
const sections = skillFiles.map((file, index) => {
  const absolute = path.join(skillsDir, file);
  const markdown = fs.readFileSync(absolute, "utf8");
  return `
    <section class="doc-section">
      <div class="file-label">${String(index + 1).padStart(2, "0")} / ${h(fileTitle(file))}</div>
      ${renderMarkdown(markdown)}
    </section>
  `;
});

const subtitle = "\u0041\u0049 \uae30\ubc18 \ud22c\uc790 \ub370\uc774\ud130 \ub300\uc2dc\ubcf4\ub4dc \uad6c\ud604 \uba85\uc138";
const description = "\uc774 \ubb38\uc11c\ub294 Glancy\uc758 \ub370\uc774\ud130 \uac10\uc9c0, \ub300\uc2dc\ubcf4\ub4dc \uad6c\uc131, \ucc28\ud2b8, \uc9c0\ud45c, \uc778\uc0ac\uc774\ud2b8, \uac80\uc218 \uaddc\uce59\uc744 \ud558\ub098\uc758 Skills.md PDF\ub85c \uc815\ub9ac\ud569\ub2c8\ub2e4.";

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>Glancy Skills.md</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.62;
      background: #fff;
    }
    .cover {
      height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      page-break-after: always;
      border: 1px solid #d7dde8;
      padding: 34mm 26mm;
    }
    .eyebrow {
      color: #0891b2;
      font-size: 12pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 6mm 0 4mm;
      font-size: 28pt;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .rule {
      width: 100%;
      height: 1.5pt;
      margin: 0 0 10mm;
      background: #06b6d4;
    }
    .subtitle {
      margin: 0 0 14mm;
      color: #475569;
      font-size: 15pt;
      font-weight: 600;
    }
    .description {
      margin: 0 0 18mm;
      color: #334155;
      font-size: 11.5pt;
      max-width: 150mm;
    }
    .meta {
      color: #64748b;
      font-size: 10.5pt;
      line-height: 1.8;
    }
    .toc {
      page-break-after: always;
    }
    .toc h2 {
      margin-top: 0;
      font-size: 18pt;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      padding: 3mm 0;
      color: #334155;
    }
    .doc-section {
      page-break-before: always;
    }
    .doc-section:first-of-type {
      page-break-before: auto;
    }
    .file-label {
      color: #0891b2;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 3mm;
    }
    h2 {
      margin: 0 0 6mm;
      font-size: 20pt;
      line-height: 1.25;
      page-break-after: avoid;
    }
    h3 {
      margin: 8mm 0 3mm;
      font-size: 14pt;
      page-break-after: avoid;
    }
    h4, h5, h6 {
      margin: 6mm 0 2mm;
      font-size: 11.5pt;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 3.5mm;
      color: #1f2937;
    }
    ul {
      margin: 0 0 4mm 5mm;
      padding-left: 4mm;
    }
    li {
      margin: 1.5mm 0;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      background: #eef6f8;
      color: #0e7490;
      border-radius: 3px;
      padding: 0.2mm 1mm;
      font-size: 9.2pt;
    }
    pre {
      margin: 4mm 0;
      padding: 4mm;
      white-space: pre-wrap;
      word-break: break-word;
      background: #0f172a;
      color: #dbeafe;
      border-radius: 5px;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: 8.6pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4mm 0 6mm;
      page-break-inside: avoid;
      font-size: 9.4pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 2mm 2.5mm;
      vertical-align: top;
    }
    th {
      background: #e0f2fe;
      color: #0f172a;
      text-align: left;
      font-weight: 800;
    }
    strong { font-weight: 800; }
    em { color: #475569; }
  </style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">Skills.md Submission</div>
    <h1>Glancy Skills.md</h1>
    <div class="rule"></div>
    <p class="subtitle">${subtitle}</p>
    <p class="description">${description}</p>
    <div class="meta">
      <div>Generated: ${h(generated)}</div>
      <div>Project: Glancy</div>
      <div>Source: skills/*.md</div>
    </div>
  </section>
  <section class="toc">
    <h2>Contents</h2>
    ${skillFiles.map((file, index) => `<div class="toc-item"><span>${String(index + 1).padStart(2, "0")}</span><strong>${h(fileTitle(file))}</strong></div>`).join("")}
  </section>
  ${sections.join("\n")}
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log(outPath);
