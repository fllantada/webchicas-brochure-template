import { Raleway, Nunito_Sans } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${raleway.variable} ${nunito.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
