import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = true,
  glow = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -5 } : undefined}
      className={clsx(
        'bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6',
        glow && 'shadow-2xl shadow-purple-500/10',
        hover && 'hover:border-purple-500/50 transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  );
};