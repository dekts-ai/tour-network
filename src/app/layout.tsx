import '@/styles/globals.css';

export const metadata = {
  title: {
    default: 'Tour Network',
    template: '%s | Tour Network',
  },
  description: 'Discover and book curated travel tours and packages.',
  openGraph: {
    title: 'Tour Network',
    description: 'Book adventure and travel experiences online.',
    url: 'https://your-domain.com',
    siteName: 'Tour Network',
    images: [
      {
        url: 'https://your-domain.com/images/social-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Tour Network',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tour Network',
    description: 'Book your adventure with Tour Network.',
    images: ['https://your-domain.com/images/social-banner.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
