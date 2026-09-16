// One-off script used to (re)generate the placeholder team crest SVGs
// under apps/oh-rugby/public/logos/. Run with: node apps/oh-rugby/scripts/generate-team-logos.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'logos');

const TEAMS = [
  { slug: 'bayonne', short: 'BAY', color: '#5fb3e0', text: '#0e1a2b' },
  { slug: 'toulon', short: 'RCT', color: '#161616', text: '#e8c84a' },
  { slug: 'bordeaux-begles', short: 'UBB', color: '#0d2b52', text: '#ffffff' },
  { slug: 'racing-92', short: 'R92', color: '#8fd0ef', text: '#0d2b52' },
  { slug: 'castres', short: 'CO', color: '#1f3a5f', text: '#ffffff' },
  { slug: 'vannes', short: 'RCV', color: '#d4af37', text: '#1a1a1a' },
  { slug: 'la-rochelle', short: 'LR', color: '#f2c230', text: '#1a1a1a' },
  { slug: 'toulouse', short: 'ST', color: '#d62828', text: '#1a1a1a' },
  { slug: 'lyon', short: 'LOU', color: '#8b1e2b', text: '#ffffff' },
  { slug: 'clermont', short: 'ASM', color: '#1e3a8a', text: '#f2c230' },
  { slug: 'montpellier', short: 'MHR', color: '#e8730f', text: '#0d1b2a' },
  { slug: 'pau', short: 'SP', color: '#14213d', text: '#ffffff' },
  { slug: 'stade-francais', short: 'SF', color: '#e6007e', text: '#ffffff' },
  { slug: 'perpignan', short: 'USAP', color: '#c0392b', text: '#f2c230' },
];

const SHIELD_PATH =
  'M32 2 L58 11 V33 C58 51 46 63 32 70 C18 63 6 51 6 33 V11 Z';

function fontSizeFor(short) {
  if (short.length <= 3) return 20;
  return 16;
}

function shieldSvg({ short, color, text }) {
  const fontSize = fontSizeFor(short);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72" role="img" aria-label="${short}">
  <path d="${SHIELD_PATH}" fill="${color}" stroke="#e8c84a" stroke-width="1.5"/>
  <text x="32" y="40" text-anchor="middle" dominant-baseline="middle"
    font-family="'Barlow Condensed', Arial, sans-serif" font-weight="900"
    font-size="${fontSize}" letter-spacing="0.5" fill="${text}">${short}</text>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const team of TEAMS) {
  writeFileSync(join(OUT_DIR, `${team.slug}.svg`), shieldSvg(team));
}

// Fallback badge for any team name without a dedicated crest.
writeFileSync(
  join(OUT_DIR, 'default.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72" role="img" aria-label="Équipe">
  <path d="${SHIELD_PATH}" fill="#2a2a38" stroke="#666676" stroke-width="1.5"/>
  <circle cx="32" cy="36" r="10" fill="none" stroke="#666676" stroke-width="2"/>
</svg>
`,
);

console.log(`Generated ${TEAMS.length + 1} logo SVGs in ${OUT_DIR}`);
