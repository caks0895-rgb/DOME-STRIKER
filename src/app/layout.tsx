import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dome Striker",
  description: "1v1 Soccer Brawl with NFT Skins on Base",
  other: {
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: `${process.env.NEXT_PUBLIC_URL}/hero.png`,
      button: {
        title: "⚽ Play Now",
        action: {
          type: "launch_frame",
          url: process.env.NEXT_PUBLIC_URL,
          name: "Dome Striker",
          splashImageUrl: `${process.env.NEXT_PUBLIC_URL}/splash.png`,
          splashBackgroundColor: "#0d0b1e"
        }
      }
    })
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
