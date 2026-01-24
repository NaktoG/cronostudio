'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Variantes de animación de página
export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
};

// Contenedor con stagger para listas
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Items que aparecen con stagger
export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

// Fade in simple
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
};

// Slide desde la izquierda
export const slideInLeft = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
};

// Slide desde la derecha
export const slideInRight = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
};

// Scale up
export const scaleUp = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
};

// Hover effects para cards
export const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -4 },
};

// Tap effect
export const tapEffect = {
    tap: { scale: 0.98 },
};

// Componente wrapper para transiciones de página
interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Contenedor para listas con stagger
interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function StaggerContainer({ children, className = '', delay = 0.1 }: StaggerContainerProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={{
                initial: {},
                animate: {
                    transition: {
                        staggerChildren: 0.08,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Item para usar dentro de StaggerContainer
interface StaggerItemProps {
    children: ReactNode;
    className?: string;
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
    return (
        <motion.div
            variants={staggerItem}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Card con animación hover
interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function AnimatedCard({ children, className = '', onClick }: AnimatedCardProps) {
    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            variants={{ ...cardHover, ...tapEffect }}
            transition={{ duration: 0.2 }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
