import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  /** ล็อก scroll พื้นหลังขณะเปิด modal */
  lockScroll?: boolean;
}

/**
 * เรนเดอร์ modal ที่ document.body — หลีกเลี่ยง bug ที่ position:fixed
 * ถูก trap ใต้ ancestor ที่มี transform (เช่น framer-motion)
 */
export function ModalPortal({ children, lockScroll = true }: ModalPortalProps) {
  useEffect(() => {
    if (!lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lockScroll]);

  return createPortal(children, document.body);
}
