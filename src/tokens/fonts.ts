// VERIDIAN's exact typography: DM Serif Display for headings, Inter for
// body -- matches compliance-tracker/veridian-scope-selector-in-home.html's
// <head> font import precisely. next/font/google's SWC transform runs on
// the import specifier regardless of which package the call site lives in,
// so re-exporting these instances from here works the same as declaring
// them directly in a consuming app's own layout.tsx.
//
// Usage in a consuming app's root layout.tsx:
//   import { veridianHeadingFont, veridianSansFont } from "@fchecklist/veridian-ui-kit/tokens/fonts";
//   <html className={`${veridianSansFont.variable} ${veridianHeadingFont.variable}`}>
// Then globals.css's --font-heading/--font-sans (see ./globals.css) pick up
// these CSS variables automatically -- no per-product font config needed.
import { DM_Serif_Display, Inter } from "next/font/google";

export const veridianHeadingFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--veridian-font-heading",
  display: "swap",
});

export const veridianSansFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--veridian-font-sans",
  display: "swap",
});
