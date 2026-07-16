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
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MQSWGFXB');`
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google Search Console Verification Meta Tag */}
        <meta name="google-site-verification" content="MiDYoRXV5ghQ3jb9x_HdwiKW1QzTr1LBN9T4BO-pVgw" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-on-background">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-MQSWGFXB"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
