import Image from "next/image";

// We Buy Any Car's logo, from the creative WBAC supply on Rakuten Advertising
// (MID 54121, banner link ID 4; trimmed and resized). Their agreement licenses
// only the marks they designate there, so don't swap in artwork from their
// site. The wordmark is partly black, so it sits on a white chip to read on
// our dark cards. Height scales with the surrounding font-size (em).
export default function WbacLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md bg-white px-[0.4em] py-[0.25em] align-middle ${className}`}>
      <Image
        src="/wbac-logo.png"
        alt="We Buy Any Car"
        width={480}
        height={121}
        style={{ height: "1.6em", width: "auto" }}
      />
    </span>
  );
}
