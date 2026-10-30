import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wedding Administration | Chathura & Gimasha',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
