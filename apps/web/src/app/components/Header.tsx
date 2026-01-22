'use client';

import { motion } from 'framer-motion';

export default function Header() {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.5,
      },
    },
  };

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div className="flex items-center gap-3" variants={textVariants}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white">CronoStudio</h1>
        </motion.div>

        <motion.nav className="hidden md:flex items-center gap-8" variants={textVariants}>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            Canales
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            Configuración
          </a>
        </motion.nav>

        <motion.div
          className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"
          variants={textVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>
    </motion.header>
  );
}
