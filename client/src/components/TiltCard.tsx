import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { playTapSound } from '../services/sound';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  onClick,
  glowColor = 'rgba(56, 189, 248, 0.15)'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates relative to card center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Exact mouse pixel position inside card for specular spotlight
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);

  // Smooth physics springs (zero lag, 120 FPS)
  const springConfig = { damping: 22, stiffness: 280, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Convert normalized mouse coordinates (-0.5 to 0.5) to subtle 3D tilt angles
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    // Pixel coordinates inside card
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;
    spotlightX.set(xPos);
    spotlightY.set(yPos);

    // Normalized coordinates (-0.5 to 0.5)
    const normX = xPos / rect.width - 0.5;
    const normY = yPos / rect.height - 0.5;
    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = () => {
    playTapSound();
    if (onClick) onClick();
  };

  return (
    <div style={{ perspective: '1000px' }} className="w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        whileTap={{ scale: 0.985 }}
        className={`relative overflow-hidden cursor-pointer select-none transition-shadow ${className}`}
      >
        {/* Dynamic Specular Spotlight Sheen Following Cursor */}
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{
              background: useTransform(
                [spotlightX, spotlightY],
                ([x, y]) => `radial-gradient(350px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`
              )
            }}
          />
        )}

        {/* Content with subtle Z-depth */}
        <div style={{ transform: 'translateZ(15px)' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
