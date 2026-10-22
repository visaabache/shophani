// Writes the sample product pictures (public/assets/sample/*.svg). Replace them with real photos in the admin.
import { writeFileSync } from 'node:fs';
const items = {
  'argan-oil': ['#f3d9a4', '#d99a3d', '🫒'],
  'black-soap': ['#e8e1d6', '#5b4a3a', '🧼'],
  'rhassoul': ['#f0d6c4', '#b5654a', '🏺'],
  'caftan': ['#dfe4fb', '#1d3fbf', '👘'],
  'babouches': ['#fbe8c8', '#c98a1c', '🥿'],
  'tajine': ['#f6d5c8', '#b8452f', '🍲'],
  'pouf': ['#efdcc8', '#8a5a33', '🟤'],
  'mint-tea': ['#dcefdc', '#2f7d4a', '🌿'],
  'teapot': ['#e9e9ee', '#7a7f8c', '🫖'],
};
for (const [name, [bg, fg, emoji]] of Object.entries(items)) {
  writeFileSync(`public/assets/sample/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<defs><pattern id="z" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 0l9 21 21 9-21 9-9 21-9-21-21-9 21-9z" fill="${fg}" opacity=".08"/></pattern>
<radialGradient id="g" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="600" height="600" fill="${bg}"/><rect width="600" height="600" fill="url(#z)"/><circle cx="300" cy="290" r="210" fill="url(#g)"/>
<ellipse cx="300" cy="455" rx="140" ry="18" fill="${fg}" opacity=".15"/>
<text x="300" y="370" font-size="220" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text>
</svg>`);
}
writeFileSync('public/assets/placeholder.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#efe9df"/><path d="M300 200l25 60 60 25-60 25-25 60-25-60-60-25 60-25z" fill="#c8b9a3"/></svg>`);
writeFileSync('public/assets/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1d3fbf"/><path d="M32 10l7 15 15 7-15 7-7 15-7-15-15-7 15-7z" fill="#f5b942"/></svg>`);
