export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Manhwa Domain</title>
        <meta name="description" content="أفضل موقع للمانهوات" />
      </head>
      <body>{children}</body>
    </html>
  );
}
