import "./globals.css";

export const metadata = {
  title: "Motion Demo",
  description: "Simple animation demo with Motion for React",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
