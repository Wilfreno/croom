"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function loading() {
  return (
    <AnimatePresence>
      <motion.div
        key="loading"
        initial={{ width: 0 }}
        animate={{ width: "90vw" }}
        exit={{ width: 100 }}
        transition={{ duration: 0.3 }}
        className="h-1 bg-primary fixed top-0 left-0 rounded-full"
      ></motion.div>
    </AnimatePresence>
  );
}
