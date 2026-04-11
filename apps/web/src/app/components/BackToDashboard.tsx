'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/app/contexts/LocaleContext';

export default function BackToDashboard() {
  const { t } = useLocale();

  return (
    <motion.div
      className="inline-flex mb-3"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -2 }}
    >
      <Link
        href="/dashboard"
        className="group inline-flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400 transition-colors"
      >
        <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">←</span>
        <span>{t('navigation.backToDashboard')}</span>
      </Link>
    </motion.div>
  );
}
