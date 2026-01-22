'use client';

import { motion } from 'framer-motion';

interface ChannelCardProps {
  id: string;
  name: string;
  subscribers: number;
  lastVideo?: string;
  index: number;
}

export default function ChannelCard({
  id,
  name,
  subscribers,
  lastVideo,
  index,
}: ChannelCardProps) {
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
      },
    },
  };

  const badgeVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        delay: index * 0.1 + 0.3,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 cursor-pointer overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              {name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">ID: {id}</p>
          </div>
          <motion.div
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full"
            variants={badgeVariants}
          >
            <span className="text-blue-700 dark:text-blue-200 text-xs font-medium">
              Activo
            </span>
          </motion.div>
        </div>

        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Suscriptores
            </span>
            <span className="text-black dark:text-white font-semibold">
              {subscribers.toLocaleString()}
            </span>
          </div>

          {lastVideo && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Último video
              </span>
              <span className="text-black dark:text-white text-sm">{lastVideo}</span>
            </div>
          )}
        </div>

        <motion.button
          className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Ver Detalles
        </motion.button>
      </div>
    </motion.div>
  );
}
