export const SHARE_URL = "https://freeplatecheck.co.uk";

export const SHARE_TITLE = "Free Plate Check — Free UK Vehicle Check";

export const SHARE_TEXT =
  "Check any UK vehicle for free — MOT history, tax status, mileage and more. Really useful if you're buying a car.";

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  );
}

export async function triggerShare(options?: ShareOptions): Promise<boolean> {
  const shareData = {
    title: options?.title || SHARE_TITLE,
    text: options?.text || SHARE_TEXT,
    url: options?.url || SHARE_URL,
  };

  // Mobile: Use native Web Share API if available
  if (typeof navigator !== "undefined" && navigator.share && isMobileDevice()) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err: unknown) {
      // User cancelled — not an error
      if (err instanceof Error && err.name === "AbortError") return false;
      // Fall through to clipboard
    }
  }

  // Desktop fallback: Copy link to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return true;
  } catch {
    return false;
  }
}
