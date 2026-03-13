import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "down" | "left" | "right" | "scale";
  duration?: number; // ms
}

export function Motion({ children, className, delay = 0, direction = "up", duration = 400 }: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const transforms: Record<string, string> = {
    up: "translateY(16px)",
    down: "translateY(-16px)",
    left: "translateX(16px)",
    right: "translateX(-16px)",
    scale: "scale(0.95)",
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

interface StaggerProps {
  children: React.ReactNode[];
  className?: string;
  stagger?: number; // ms between items
  direction?: MotionProps["direction"];
  duration?: number;
}

export function Stagger({ children, className, stagger = 60, direction = "up", duration = 400 }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Motion key={i} delay={i * stagger} direction={direction} duration={duration}>
          {child}
        </Motion>
      ))}
    </div>
  );
}
