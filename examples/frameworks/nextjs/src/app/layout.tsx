import Link from "next/link";
import "./globals.css";

export default function Layout ({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Link href="/">Home</Link>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
