/**
 * StringTune bootstrap (Lenis sync)
 *
 * Registered modules:
 * - StringProgress: scroll timelines → --progress / --page / section keys
 * - StringProgressPart: slice remapping → --progress-slice (insight phases)
 * - StringParallax: optional desktop-only parallax transforms (extends Progress)
 * - StringMagnetic: pointer pull → --magnetic-x / --magnetic-y (consumed in CSS)
 * - StringResponsive: string-mobile / string-tablet / string-laptop / string-desktop visibility
 * - StringSplit: kinetic type (line/word/char) + CSS vars on wrappers (string-tune.fiddle.digital–style reveals)
 * - StringGlide: scroll-energy drift on large watermarks (subtle motion while scrolling)
 *
 * Scroll: Lenis owns smooth scrolling. StringTune scroll modes are set to "disable"
 * so we only feed scrollPosition from Lenis (no second smooth-scroll engine).
 */
import StringTune, {
  StringGlide,
  StringMagnetic,
  StringParallax,
  StringProgress,
  StringProgressPart,
  StringResponsive,
  StringSplit,
} from "@fiddle-digital/string-tune";
import type Lenis from "lenis";

/** Keep StringTune scroll state aligned with Lenis every frame (call after lenis.raf). */
export function syncStringTuneFromLenis(lenis: Lenis): void {
  StringTune.getInstance().scrollPosition = lenis.scroll;
}

export function initStringTune(): () => void {
  const stringTune = StringTune.getInstance();

  stringTune.setupSettings({
    "cursor-lerp": 0.78,
    "offset-top": "0%",
    "offset-bottom": "0%",
    timeout: 900,
  });

  stringTune.scrollDesktopMode = "disable";
  stringTune.scrollMobileMode = "disable";

  stringTune.use(StringProgress);
  stringTune.use(StringProgressPart);
  stringTune.use(StringParallax);
  stringTune.use(StringMagnetic);
  stringTune.use(StringResponsive);
  stringTune.use(StringSplit);
  stringTune.use(StringGlide);

  const onWinResize = () => stringTune.onResize(true);
  window.addEventListener("resize", onWinResize);

  stringTune.start(60);
  stringTune.onResize(true);

  if (typeof window !== "undefined") {
    (window as Window & { _stringTune?: typeof stringTune })._stringTune = stringTune;
  }

  return () => {
    window.removeEventListener("resize", onWinResize);
    stringTune.destroy();
    delete (window as Window & { _stringTune?: unknown })._stringTune;
  };
}
