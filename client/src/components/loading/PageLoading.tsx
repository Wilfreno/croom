"use client";
import { AnimatePresence, motion, Variants } from "framer-motion";
export default function PageLoading() {
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.3,
        repeat: Infinity, // infinite loop for the entire container
        repeatDelay: 0.7,
      },
    },
  };

  const letterVariants: Variants = {
    initial: { opacity: 0, scale: 1 },
    animate: {
      opacity: [0.1, 1, 0.1],
      //   scale: [1, 1.5, 1],
      transition: {
        duration: 0.7,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0.7,
      },
    },
    exit: {
      x: 50,
      opacity: 0,
    },
  };

  return (
    <AnimatePresence>
      <motion.span
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex text-6xl text-primary font-semibold"
      >
        {"Croom".split("").map((letter) => (
          <motion.p key={letter} variants={letterVariants}>
            {letter}
          </motion.p>
        ))}
      </motion.span>
    </AnimatePresence>
  );
}
