'use client'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function ParallaxBlobs() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, -200])
  const y2 = useTransform(scrollY, [0, 1000], [0, 200])

  return (
    <div className="fixed inset-0 overflow-hidden opacity-20 dark:opacity-10">
      <motion.div
        style={{ y: y1 }}
        className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-gradient-to-r from-blue-500/20 to-teal-400/20 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute top-1/2 right-1/4 w-[30vw] h-[30vw] bg-gradient-to-r from-teal-400/20 to-blue-500/20 rounded-full blur-3xl"
      />
    </div>
  )
}