import Header from '../shared/widget/header';
import './global.css';

export const metadata = {
  title: 'Eshop',
  description: 'One place to buy everything!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      
      <body>
        <Header/>
        {children}</body>
    </html>
  )
}
