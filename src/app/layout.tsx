import "./globals.css";

export const metadata = {
  title: "UK Car Snapshot",
  description: "DVLA basics + buying checklist",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
