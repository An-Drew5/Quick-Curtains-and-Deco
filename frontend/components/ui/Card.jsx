"use client";

import { motion } from "framer-motion";

export default function Card({ children, className = "", ...props }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.article>
  );
}
