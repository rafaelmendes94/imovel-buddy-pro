// Inline SVG placeholder used when a property has no uploaded photo.
// Renders a neutral box with "Sem imagem" centered — same aspect as a normal image.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
      <rect width="600" height="400" fill="#f1f5f9"/>
      <g fill="#94a3b8" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" text-anchor="middle">
        <path d="M270 170h60a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10h-60a10 10 0 0 1-10-10v-40a10 10 0 0 1 10-10zm5 15v30h50v-30h-50zm12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
        <text x="300" y="255" font-size="20" font-weight="600">Sem imagem</text>
      </g>
    </svg>`
  );
