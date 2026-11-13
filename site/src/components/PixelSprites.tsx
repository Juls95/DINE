/** Original 16×16 philosopher sprites. Scaled with image-rendering: pixelated. */
function Px({ d, fill }: { d: string; fill: string }) {
  return <path d={d} fill={fill} />;
}

export function SpriteBeary() {
  return (
    <svg className="sprite" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
      <Px fill="#c9a227" d="M5 0h6v1H5zM3 1h2v1H3zm8 0h2v1h-2zM2 2h1v2H2zm11 0h1v2h-1z" />
      <Px fill="#3a2416" d="M3 2h3v2H3zm7 0h3v2h-3z" />
      <Px fill="#c27a12" d="M4 3h8v6H4zM3 5h1v3H3zm9 0h1v3h-1z" />
      <Px fill="#e8a23a" d="M7 7h2v1H7z" />
      <Px fill="#1c120a" d="M6 5h1v1H6zm3 0h1v1H9z" />
      <Px fill="#f4efe4" d="M3 9h10v4H3zM4 13h3v3H4zm5 0h3v3H9z" />
      <Px fill="#c45c3a" d="M5 10h6v1H5z" />
      <Px fill="#efe6d4" d="M12 8h3v5h-3z" />
      <Px fill="#6b3a1a" d="M12 8h3v1h-3z" />
    </svg>
  );
}

export function SpriteBison() {
  return (
    <svg className="sprite" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
      <Px fill="#2a2118" d="M2 1h2v3H2zm10 0h2v3h-2z" />
      <Px fill="#c9a227" d="M5 1h6v1H5z" />
      <Px fill="#5a3a22" d="M4 3h8v2H4z" />
      <Px fill="#3dcfb6" d="M5 4h6v3H5z" />
      <Px fill="#1c120a" d="M6 5h2v1H6zm3 0h1v1H9z" />
      <Px fill="#f4efe4" d="M3 8h10v5H3zM4 13h3v3H4zm5 0h3v3H9z" />
      <Px fill="#3dcfb6" d="M4 9h8v1H4z" />
      <Px fill="#efe6d4" d="M1 8h3v6H1z" />
      <Px fill="#2a2118" d="M2 9h1v4H2z" />
    </svg>
  );
}

export function SpriteBul() {
  return (
    <svg className="sprite" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
      <Px fill="#c9a227" d="M5 0h6v1H5zM3 1h2v1H3zm8 0h2v1h-2z" />
      <Px fill="#2a2d6e" d="M4 2h8v5H4zM3 4h1v3H3zm9 0h1v3h-1z" />
      <Px fill="#8b90ff" d="M5 3h6v4H5z" />
      <Px fill="#1c120a" d="M6 4h2v2H6zm3 0h2v2H9z" />
      <Px fill="#f4efe4" d="M7 7h2v1H7zM3 8h10v5H3zM4 13h3v3H4zm5 0h3v3H9z" />
      <Px fill="#8b90ff" d="M5 10h6v1H5z" />
      <Px fill="#d8cbb4" d="M12 7h3v7h-3z" />
      <Px fill="#2a2118" d="M13 8h1v1h-1zm0 2h1v1h-1z" />
    </svg>
  );
}

export function SpriteTablet() {
  return (
    <svg className="sprite sprite-tablet" viewBox="0 0 20 16" aria-hidden="true" shapeRendering="crispEdges">
      <Px fill="#8a6a42" d="M3 0h14v16H3z" />
      <Px fill="#efe6d4" d="M4 1h12v14H4z" />
      <Px fill="#c9a227" d="M6 1h8v1H6z" />
      <Px fill="#2a2118" d="M6 4h8v1H6zm0 3h8v1H6zm0 3h6v1H6z" />
      <Px fill="#c45c3a" d="M6 12h4v1H6z" />
    </svg>
  );
}
