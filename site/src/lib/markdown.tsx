import type { ReactNode } from "react";

/** Minimal Markdown for THESIS.md: headings, paragraphs, bullet lists, tables, blockquotes, **bold**, `code`. */
function inline(text: string, key: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**")) return <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`")) return <code key={`${key}-${i}`}>{p.slice(1, -1)}</code>;
    return p;
  });
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const key = `md-${i}`;
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]?.length ?? 2;
      const content = inline(heading[2] ?? "", key);
      out.push(level === 1 ? <h1 key={key}>{content}</h1> : level === 2 ? <h2 key={key}>{content}</h2> : <h3 key={key}>{content}</h3>);
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      out.push(<blockquote key={key}>{inline(line.replace(/^>\s?/, ""), key)}</blockquote>);
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("|")) rows.push(lines[i++] ?? "");
      const [head, , ...body] = rows;
      out.push(
        <div className="table-wrap" key={key}>
          <table>
            <thead><tr>{cells(head ?? "").map((c, j) => <th key={j}>{inline(c, `${key}h${j}`)}</th>)}</tr></thead>
            <tbody>{body.map((r, ri) => <tr key={ri}>{cells(r).map((c, j) => <td key={j}>{inline(c, `${key}${ri}${j}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("- ")) items.push((lines[i++] ?? "").slice(2));
      out.push(<ul key={key}>{items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>)}</ul>);
      continue;
    }
    out.push(<p key={key}>{inline(line, key)}</p>);
    i++;
  }
  return <div className="markdown">{out}</div>;
}
