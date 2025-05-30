import "./globals.css";

export const metadata = {
  title: "You should hire Erich",
  description: "At least invite him for an interview.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
