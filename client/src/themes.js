export const THEMES = [
  {
    id: 'classic',
    name: 'Default / Classic',
    description: 'Clean, neutral and distraction-free.',
    swatch: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
    accent: '#6366f1'
  },
  {
    id: 'space',
    name: 'Space & Astronomy',
    description: 'Deep navy skies, stars and distant planets.',
    swatch: 'radial-gradient(circle at 30% 30%, #6366f1 0 2px, transparent 3px), linear-gradient(135deg, #0b1026, #1e1b4b)',
    accent: '#818cf8'
  },
  {
    id: 'nature',
    name: 'Nature & Wildlife',
    description: 'Forest greens and fresh, leafy vibes.',
    swatch: 'linear-gradient(135deg, #14532d, #4ade80)',
    accent: '#16a34a'
  },
  {
    id: 'tech',
    name: 'Technology / Cyberpunk',
    description: 'Dark console look with neon-blue accents.',
    swatch: 'linear-gradient(135deg, #0a0e17, #0ea5e9)',
    accent: '#22d3ee'
  },
  {
    id: 'history',
    name: 'History & Heritage',
    description: 'Elegant parchment tones and classic motifs.',
    swatch: 'linear-gradient(135deg, #78350f, #d9b98c)',
    accent: '#b45309'
  },
  {
    id: 'ocean',
    name: 'Ocean & Underwater',
    description: 'Cool blue waves and bubbly depths.',
    swatch: 'linear-gradient(135deg, #0c4a6e, #38bdf8)',
    accent: '#0284c7'
  },
  {
    id: 'fantasy',
    name: 'Fantasy & Magic',
    description: 'Rich violets with subtle magical sparkles.',
    swatch: 'linear-gradient(135deg, #2e1065, #a855f7)',
    accent: '#a855f7'
  },
  {
    id: 'sports',
    name: 'Sports & Competition',
    description: 'Energetic scoreboard-style greens and orange.',
    swatch: 'linear-gradient(135deg, #14532d 55%, #f97316 55%)',
    accent: '#f97316'
  }
];

export const THEME_MAP = THEMES.reduce((m, t) => {
  m[t.id] = t;
  return m;
}, {});

export function safeTheme(id) {
  return THEME_MAP[id] ? id : 'classic';
}

export function themeName(id) {
  return THEME_MAP[safeTheme(id)].name;
}

const SUGGESTION_KEYWORDS = [
  { id: 'space', words: ['space', 'astronomy', 'planet', 'planets', 'star', 'stars', 'galaxy', 'cosmos', 'universe', 'moon', 'solar', 'orbit', 'nebula'] },
  { id: 'nature', words: ['nature', 'wildlife', 'animal', 'animals', 'plant', 'plants', 'forest', 'bird', 'birds', 'tree', 'trees', 'insect', 'flower', 'flowers'] },
  { id: 'tech', words: ['coding', 'code', 'computer', 'computers', 'programming', 'technology', 'tech', 'software', 'javascript', 'python', 'ai', 'robot', 'robots', 'internet', 'digital'] },
  { id: 'history', words: ['history', 'heritage', 'monument', 'monuments', 'ancient', 'war', 'wars', 'civilization', 'empire', 'historical', 'medieval', 'revolution'] },
  { id: 'ocean', words: ['ocean', 'sea', 'marine', 'fish', 'coral', 'underwater', 'aqua', 'aquatic', 'whale', 'shark', 'beach', 'water'] },
  { id: 'fantasy', words: ['fantasy', 'magic', 'magical', 'mythology', 'myth', 'myths', 'dragon', 'dragons', 'wizard', 'fairy', 'spell', 'spells', 'enchanted', 'superhero'] },
  { id: 'sports', words: ['sports', 'sport', 'football', 'cricket', 'basketball', 'tennis', 'athlete', 'athletes', 'olympic', 'olympics', 'match', 'matches', 'tournament', 'championship'] }
];

export function suggestTheme(text) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return null;
  for (const group of SUGGESTION_KEYWORDS) {
    if (group.words.some((w) => new RegExp(`\\b${w}\\b`).test(s))) return group.id;
  }
  return null;
}
