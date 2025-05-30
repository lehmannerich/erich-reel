import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata = {
  title: "Erich Lehmann - Reel",
  description: "A few reasons why Erich Lehmann would be great at OpenAI.",
  openGraph: {
    title: "Erich Lehmann - Reel",
    description: "A few reasons why Erich Lehmann would be great at OpenAI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erich Lehmann - Reel",
    description: "A few reasons why Erich Lehmann would be great at OpenAI.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
