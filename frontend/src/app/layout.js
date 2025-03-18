import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from '../components/Navbar'
import { Providers } from "./providers"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MailMesh - Email Automation Workflow Builder',
  description: 'Automate your email order processing with AI-powered tracking',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}