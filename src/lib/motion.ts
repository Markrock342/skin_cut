import type { Transition, Variants } from 'framer-motion';

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 38,
  mass: 0.7,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 32,
  mass: 0.9,
};

export const easeOut: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1 },
};
