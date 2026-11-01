'use client';

import { motion } from 'framer-motion';

interface CardFloralDecorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export default function CardFloralDecor({
  position = 'top-right',
  className = '',
}: CardFloralDecorProps) {
  const isRight = position.includes('right');
  const isTop = position.includes('top');

  return (
    <motion.div
      className={`card-floral-decor ${position} ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: isTop ? -8 : 8 }}
      whileInView={{ opacity: 0.95, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden="true"
    >
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          rotate: isRight ? [-2.5, 2.5, -2.5] : [2.5, -2.5, 2.5],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 6.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          transformOrigin: isRight
            ? isTop
              ? 'top right'
              : 'bottom right'
            : isTop
            ? 'top left'
            : 'bottom left',
        }}
      >
        <g transform={isRight ? 'scale(1, 1)' : 'scale(-1, 1) translate(-64, 0)'}>
          {/* Main Eucalyptus Stem */}
          <path
            d="M58 6 C42 16 26 32 14 54"
            stroke="#3b6e4b"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Sage Leaves */}
          <motion.path
            d="M48 14 C54 8 58 12 54 18 C50 24 44 20 48 14 Z"
            fill="#4a7c59"
            opacity="0.8"
            animate={{ rotate: [-2, 3, -2] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '48px 14px' }}
          />
          <motion.path
            d="M36 24 C44 18 48 24 42 30 C36 36 30 30 36 24 Z"
            fill="#5b8f6a"
            opacity="0.75"
            animate={{ rotate: [3, -2, 3] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '36px 24px' }}
          />
          <path
            d="M24 38 C30 32 34 38 28 44 C22 50 18 44 24 38 Z"
            fill="#4a7c59"
            opacity="0.7"
          />

          {/* Golden Berries & Buds */}
          <circle cx="53" cy="10" r="2.2" fill="#d4af37" />
          <circle cx="53" cy="10" r="3.8" stroke="#c59b43" strokeWidth="0.7" opacity="0.5" />
          <circle cx="43" cy="22" r="1.8" fill="#d4af37" />
          <circle cx="31" cy="34" r="1.8" fill="#c59b43" />

          {/* Delicate Dusty Blue Blooming Rose Flower */}
          <motion.g
            animate={{ scale: [1, 1.05, 1], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '28px 28px' }}
          >
            {/* Outer Petals */}
            <path
              d="M28 16 C35 15 40 21 38 27 C36 33 29 35 24 33 C19 31 17 24 20 19 C22 16 25 16 28 16 Z"
              fill="#9bb8cc"
              opacity="0.9"
            />
            {/* Mid Petals */}
            <path
              d="M33 22 C37 25 36 30 32 32 C28 34 23 32 23 28 C23 24 28 21 33 22 Z"
              fill="#7b9eb5"
              opacity="0.85"
            />
            {/* Inner Petal Swirl */}
            <path
              d="M27 23 C31 22 34 25 32 28 C30 31 26 30 25 27 C24 25 26 23 27 23 Z"
              fill="#5d8299"
              opacity="0.9"
            />
            {/* Center Rose Core */}
            <circle cx="28" cy="26" r="2.8" fill="#4a6e84" />
            <circle cx="28" cy="26" r="1.4" fill="#fcf9f2" />

            {/* Ivory White Accent Petal */}
            <path
              d="M20 22 C18 18 23 15 26 18 C28 20 26 24 22 24 Z"
              fill="#fffdf8"
              stroke="#c59b43"
              strokeWidth="0.6"
              opacity="0.85"
            />
          </motion.g>

          {/* Soft Baby's Breath Little White Florets */}
          <circle cx="48" cy="28" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="51" cy="32" r="1.2" fill="#f7eedb" opacity="0.8" />
          <circle cx="46" cy="34" r="1.3" fill="#ffffff" opacity="0.85" />
        </g>
      </motion.svg>
    </motion.div>
  );
}
