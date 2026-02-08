declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPartnerClick(partnerId: string, context: string): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "partner_click", {
      partner_id: partnerId,
      click_context: context,
    });
  }
}
