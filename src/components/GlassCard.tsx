import { motion } from "motion/react";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", delay = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className={`glass-card p-6 ${className} ${onClick ? 'cursor-pointer active:scale-95 transition-all' : ''}`}
    >
      {children}
    </motion.div>
  );
}
