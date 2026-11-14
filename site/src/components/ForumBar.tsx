import { useState, type FormEvent } from "react";
import { z } from "zod";

const VOTE_KEY = "rdc.agora.up";
const COMMENTS_KEY = "rdc.agora.comments";
const MAX = 280;

const LocalCommentSchema = z.object({ id: z.string().max(40), text: z.string().min(1).max(MAX), at: z.string().max(40) });
export type LocalComment = z.infer<typeof LocalCommentSchema>;

function readVote(): boolean {
  try {
    return localStorage.getItem(VOTE_KEY) === "1";
  } catch {
    return false;
  }
}

function readComments(): LocalComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // localStorage can be edited by anyone with the device: keep only well-formed entries.
    return parsed.flatMap((c) => {
      const ok = LocalCommentSchema.safeParse(c);
      return ok.success ? [ok.data] : [];
    });
  } catch {
    return [];
  }
}

export function ForumBar({ onComment }: { onComment?: () => void }) {
  const [up, setUp] = useState(readVote);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [comments, setComments] = useState(readComments);

  const toggle = () => {
    const next = !up;
    setUp(next);
    try {
      localStorage.setItem(VOTE_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim().slice(0, MAX);
    if (!trimmed) return;
    const item: LocalComment = { id: `${Date.now()}`, text: trimmed, at: new Date().toISOString() };
    const next = [item, ...comments].slice(0, 40);
    setComments(next);
    setText("");
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    onComment?.();
  };

  return (
    <div className="forum-bar">
      <div className="hud-actions">
        <button type="button" className={`hud-btn ${up ? "is-on" : ""}`} aria-pressed={up} onClick={toggle}>
          ▲ Back <em>{up ? "1" : "0"}</em>
        </button>
        <button type="button" className="hud-btn hud-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
          💬 Comment <em>{comments.length}</em>
        </button>
      </div>
      <p className="hud-note">Votes and comments stay in this browser. They are not NEAR data.</p>
      {open && (
        <form className="comment-form" onSubmit={submit}>
          <label htmlFor="agora-comment">Add a comment</label>
          <textarea
            id="agora-comment"
            value={text}
            maxLength={MAX}
            rows={3}
            placeholder="What do you question, or what convinces you?"
            onChange={(e) => setText(e.target.value)}
          />
          <div className="comment-form-row">
            <span>{text.length}/{MAX}</span>
            <button type="submit" className="hud-btn">Post</button>
          </div>
        </form>
      )}
      {open && comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <strong>Anonymous</strong>
              <time dateTime={c.at}>{c.at.slice(0, 10)}</time>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
