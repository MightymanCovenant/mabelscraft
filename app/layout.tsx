import "@fontsource/bricolage-grotesque/500.css";
import "@fontsource/bricolage-grotesque/800.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/600.css";
import "./globals.css";
import { ThemeProvider } from "next-themes";
export const metadata = { title: "Mabel's Craft", description: "Beads, Ankara and made-to-order fabrics, delivered within Port Harcourt" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
      </body>
    </html>
  );
}
