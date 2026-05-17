import { useEffect, useRef, useState } from 'react';
import { useInView, useSpring, useTransform, motion } from 'framer-motion';

export function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString('th-TH'));
  const [text, setText] = useState('0');

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);

  useEffect(() => {
    return display.on('change', (v) => setText(v));
  }, [display]);

  return (
    <motion.span ref={ref} className="value">
      {text}
    </motion.span>
  );
}
