// Tailwind v4 uses CSS-native @theme blocks (see ./globals.css) rather than
// a JS preset object for most projects, but some consuming apps still read
// a typed token map directly (e.g. to compute a color in JS, not just
// className strings). This is that same palette, as plain values, kept in
// sync with globals.css by hand -- there are only 16 colors, a generated
// build step would be more machinery than the token count justifies.
export const veridianColors = {
  "ct-cream": "#FFFDF9",
  "ct-navy": "#1C2B3A",
  "ct-navy2": "#2D3F52",
  "ct-navy3": "#3D5269",
  "ct-saffron": "#F5820A",
  "ct-saffron-hover": "#E0730A",
  "ct-teal": "#0E7C6E",
  "ct-cloud": "#F0F4F8",
  "ct-cloud2": "#E8EEF5",
  "ct-slate": "#4A5568",
  "ct-muted": "#718096",
  "ct-border": "#E2E8F0",
  "ct-border2": "#CBD5E1",
  "scope-tint": "#F4EFE2",
  "scope-tint-border": "#E6DEC9",
} as const;

export type VeridianColorToken = keyof typeof veridianColors;
