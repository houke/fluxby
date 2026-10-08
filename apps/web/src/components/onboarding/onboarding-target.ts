// Prefer a visible instance on responsive pages, then the feature's owner when
// the control is conditional (for example, column mapping before file upload).
export function findOnboardingTarget(
  selector?: string,
  fallbackSelector?: string
) {
  for (const candidate of [selector, fallbackSelector]) {
    if (!candidate) continue;
    const element = Array.from(
      document.querySelectorAll<HTMLElement>(candidate)
    ).find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (element) return element;
  }
  return null;
}
