// app/layout.tsx
import React from 'react';

export const metadata = {
  title: 'API Demo',
  description: 'api-demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}