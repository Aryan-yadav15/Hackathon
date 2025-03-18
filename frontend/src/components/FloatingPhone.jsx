'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function FloatingPhone() {
  return (
    <motion.div
      className="absolute bottom-0 right-0"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="relative w-80 h-[500px] perspective-1000">
        <motion.div
          className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-2xl transform-style-preserve-3d"
          animate={{
            rotateX: -10,
            rotateY: 20,
            rotateZ: -5
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'mirror'
          }}
        >
          <div className="absolute inset-4 overflow-hidden rounded-[32px] border-8 border-gray-800">
            <Image
              src="/phone-screen.png"
              alt="App Interface"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}