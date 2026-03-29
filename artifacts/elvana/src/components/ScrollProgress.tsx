/**
 * Top reading-progress bar: mirrors StringProgress source `page` (root wrapper writes --page).
 */
export function ScrollProgress() {
  return (
    <div
      className="st-scroll-progress fixed top-0 left-0 right-0 z-[9998] h-px origin-left bg-[#DED4E6] pointer-events-none"
      data-string-copy-from="page"
      aria-hidden
    />
  );
}
