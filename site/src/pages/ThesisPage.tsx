import type { Bundle } from "../lib/bundle";
import { Markdown } from "../lib/markdown";

export function ThesisPage({ bundle }: { bundle: Bundle }) {
  return (
    <article className="page thesis">
      <div className="verdict">
        <div>
          <span className="eyebrow">Hypothesis status</span>
          <strong>{bundle.hypothesis_verdict ?? "no data"}</strong>
        </div>
        <div>
          <span className="eyebrow">Stance</span>
          <strong>{bundle.stance ?? "no data"}</strong>
        </div>
        <div>
          <span className="eyebrow">Technical bias</span>
          <strong>{bundle.technical_bias ?? "no data"}</strong>
        </div>
        <div>
          <span className="eyebrow">Adoption regime</span>
          <strong>{bundle.regime ?? "no data"}</strong>
        </div>
      </div>
      <Markdown source={bundle.thesis_md} />
    </article>
  );
}
