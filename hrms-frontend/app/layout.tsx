import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRMS - Human Resource Management System",
  description: "Enterprise Human Resource Management System",
};

// Runs before the page paints, so there is no dark -> light flash on reload.
const themeScript = `
(function () {
  try {
    var email = JSON.parse(localStorage.getItem("user") || "{}").email;
    var theme = localStorage.getItem(email ? "theme:" + email : "theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}