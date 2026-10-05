import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/AuthProvider";
import Provider from "../components/Provider";
import 'katex/dist/katex.min.css'

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "QMentor",
  description: "Build, simulate, and visualize quantum circuits — interactively.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a] overflow-x-hidden">
        <AuthProvider>
          <Provider>
            <div className="flex flex-1 flex-col overflow-x-clip">{children}</div>
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
