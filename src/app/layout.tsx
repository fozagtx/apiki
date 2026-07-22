import type { Metadata } from "next";
import { WorkspaceProvider } from "@/components/workspace-provider";
import "../styles.css";

export const metadata: Metadata = {
  title: "Apiki",
  description: "Live encrypted API key workspace backed by SQLite.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="mouve-light">
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
