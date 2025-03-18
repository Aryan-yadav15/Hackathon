'use client'

import { motion } from 'framer-motion';

export default function BlobBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-50 dark:opacity-20 z-10">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          x: [0, 50, -50, 0],
          y: [0, 30, -30, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-blue-200 to-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
          x: [0, -50, 50, 0],
          y: [0, -30, 30, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-40 -right-20 w-96 h-96 bg-gradient-to-r from-teal-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
      />
    </div>
  );
} 