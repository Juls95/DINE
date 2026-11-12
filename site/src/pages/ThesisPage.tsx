import type { Bundle } from "../lib/bundle";
import { Markdown } from "../lib/markdown";

export function ThesisPage({ bundle }: { bundle: Bundle }) {
  return (
    <article className="page thesis">
      <div className="verdict">
        <div>
          <span className="eyebrow">Estado de la hipótesis</span>
          <strong>{bundle.hypothesis_verdict ?? "sin datos"}</strong>
        </div>
        <div>
          <span className="eyebrow">Régimen de adopción</span>
          <strong>{bundle.regime ?? "sin datos"}</strong>
        </div>
      </div>
      <Markdown source={bundle.thesis_md} />
    </article>
  );
}
