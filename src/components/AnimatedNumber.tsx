import { useState, useEffect } from "react";
import { animate } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  className?: string;
  decimals?: number;
}

export default function AnimatedNumber({ 
  value, 
  prefix = "₱ ", 
  className = "", 
  decimals = 2 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}
    </span>
  );
}
