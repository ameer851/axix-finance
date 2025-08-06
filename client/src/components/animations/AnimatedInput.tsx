import { motion } from "framer-motion";
import React from "react";

interface AnimatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({ error, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileFocus={{ scale: 1.02 }}
      className="relative"
    >
      <motion.input
        {...props}
        className={`
          w-full px-3 py-2 border rounded-md transition-colors duration-200
          ${
            error
              ? "border-red-500 focus:border-red-600 focus:ring-red-600"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          }
          dark:border-gray-600 dark:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-opacity-50
        `}
      />
      {error && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute right-0 top-0 h-full flex items-center pr-3"
        >
          <svg
            className="h-5 w-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedInput;
