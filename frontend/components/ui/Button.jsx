"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const baseClasses =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite2 disabled:cursor-not-allowed disabled:opacity-55";

const variantClasses = {
  primary:
    "border-navy bg-navy text-offwhite hover:bg-transparent hover:text-navy",
  secondary:
    "border-beige bg-beige text-navy hover:bg-transparent hover:text-navy",
  outline:
    "border-navy bg-transparent text-navy hover:bg-navy hover:text-offwhite",
};

const sizeClasses = {
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

const MotionLink = motion.create(Link);

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const styleClasses =
    `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`.trim();

  if (href) {
    return (
      <MotionLink
        href={href}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className={styleClasses}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : undefined}
        {...props}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={styleClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
