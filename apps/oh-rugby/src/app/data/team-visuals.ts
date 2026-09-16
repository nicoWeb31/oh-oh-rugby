const TEAM_SLUGS: Record<string, string> = {
  Bayonne: 'bayonne',
  Toulon: 'toulon',
  'Bordeaux-Bègles': 'bordeaux-begles',
  'Racing 92': 'racing-92',
  Castres: 'castres',
  Vannes: 'vannes',
  'La Rochelle': 'la-rochelle',
  Toulouse: 'toulouse',
  Lyon: 'lyon',
  Clermont: 'clermont',
  Montpellier: 'montpellier',
  Pau: 'pau',
  'Stade Français': 'stade-francais',
  Perpignan: 'perpignan',
};

export function teamLogoUrl(teamName: string): string {
  const slug = TEAM_SLUGS[teamName];
  return `/logos/${slug ?? 'default'}.svg`;
}
