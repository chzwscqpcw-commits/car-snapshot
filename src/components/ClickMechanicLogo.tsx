import Image from "next/image";

// ClickMechanic's actual logo artwork (their white pin-with-wrench mark + the
// "ClickMechanic" wordmark, on their brand blue #3c93f7), extracted to a tight
// asset. Rendered as a rounded chip so it always appears exactly on-brand on our
// dark pages. Height scales with the surrounding font-size (em). This IS their
// logo — kept as the canonical brand asset for the mock-ups (and good to keep
// for launch).
export default function ClickMechanicLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/clickmechanic-logo.png"
      alt="ClickMechanic"
      width={332}
      height={79}
      className={`inline-block rounded-md align-middle ${className}`}
      style={{ height: "1.6em", width: "auto" }}
    />
  );
}
