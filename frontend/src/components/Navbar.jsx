'use client'

import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import Link from "next/link"
import { Button } from "./ui/button"
import { motion } from "framer-motion";
import { ArrowRight, BarChart, Package, Menu, Sparkles, Users } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-gray-100 shadow-sm relative z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">MailMesh</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/dashboard">
                <BarChart className="w-4 h-4 mr-2" />
                Dashboard
              </NavLink>
              <NavLink href="/orders">
                <Package className="w-4 h-4 mr-2" />
                Orders
              </NavLink>
              <NavLink href="/dashboard/retailers">
                <Users className="w-4 h-4 mr-2" />
                Retailers
              </NavLink>
              <NavLink href="/canvas">
                Setup
              </NavLink>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isLoaded && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/dashboard/ai-insights">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <Button className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" />
                          AI Insights
                        </Button>
                      </motion.div>
                    </Link>
                    
                    <div className="relative">
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-10"></div>
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            userButtonBox: "h-10 w-10",
                            userButtonAvatarBox: "rounded-full border-2 border-indigo-100"
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-x-3">
                    <SignInButton mode="modal">
                      <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">Sign in</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Register
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </SignUpButton>
                  </div>
                )}
              </>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-b border-gray-100"
        >
          <div className="px-4 pt-2 pb-4 space-y-1">
            <MobileNavLink href="/dashboard">
              <BarChart className="w-4 h-4 mr-2" />
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/dashboard/ai-insights">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </MobileNavLink>
            <MobileNavLink href="/orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </MobileNavLink>
            <MobileNavLink href="/retailers">
              <Users className="w-4 h-4 mr-2" />
              Retailers
            </MobileNavLink>
            <MobileNavLink href="/canvas">
              Canvas
            </MobileNavLink>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

// NavLink component for desktop
const NavLink = ({ href, children }) => (
  <Link 
    href={href}
    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
  >
    {children}
  </Link>
);

// NavLink component for mobile
const MobileNavLink = ({ href, children }) => (
  <Link 
    href={href}
    className="flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-800 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
  >
    {children}
  </Link>
);