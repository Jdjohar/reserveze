import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reserveze | Professional Scheduling SaaS",
    template: "%s | Reserveze"
  },
  description: "Reserveze is an all-in-one online scheduling platform helping businesses manage calendars, service types, availability, notifications, and customer bookings seamlessly.",
  metadataBase: new URL("https://reserveze.com"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Reserveze | Professional Scheduling SaaS",
    description: "The ultimate command center for managing bookings, availability, services, and client communications efficiently.",
    url: "https://reserveze.com",
    siteName: "Reserveze",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reserveze Appointment Booking Platform"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Reserveze | Professional Scheduling SaaS",
    description: "All-in-one online scheduling platform for service businesses.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-on-background">
        {children}
        
        {/* Schema.org Organization Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Reserveze",
              "url": "https://reserveze.com",
              "logo": "https://reserveze.com/logo.png",
              "description": "Professional multi-tenant appointment booking and merchant scheduling platform.",
              "sameAs": [
                "https://twitter.com/reserveze",
                "https://facebook.com/reserveze"
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
