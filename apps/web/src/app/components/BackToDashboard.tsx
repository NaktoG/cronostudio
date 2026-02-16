'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BackToDashboard() {
  return (
    <motion.div
      className="inline-flex"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors"
      >
        <span aria-hidden>←</span>
        <span>Volver al dashboard</span>
      </Link>
    </motion.div>
  );
}
