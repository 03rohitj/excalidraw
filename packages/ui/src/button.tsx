"use client";

import { ReactNode } from "react";

interface ButtonProps {
  variant: "primary" | "outline" | "secondary";
  className?: string;
  size: string;
  onClick: () => void;
  children: ReactNode;      //It could be a text or any component
}

export const Button = ({ variant, className, size, onClick, children }: ButtonProps) => {
  return (
    <button
      className={`${className} ${variant === "primary" ? "bg-blue-500" : "bg-green-500"} ${size === "lg" ? "px-4 py-2" : "px-2 py-1"}`}
      onClick={ onClick }
    >
      {children}
    </button>
  );
};
