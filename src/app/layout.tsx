import "./globals.css";

export const metadata = {
  title: "CarScans - UK Vehicle Lookup",
  description: "Instant DVLA data, MOT status, tax dates & buying checklist for car owners, buyers & sellers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}