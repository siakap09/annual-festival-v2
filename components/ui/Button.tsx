import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "green"
  | "red"
  | "purple"
  | "indigo"
  | "teal"
  | "blue"
  | "amber"
  | "outline"
  | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-orange-600 text-white hover:bg-orange-700",
  green: "bg-green-600 text-white hover:bg-green-700",
  red: "bg-red-600 text-white hover:bg-red-700",
  purple: "bg-purple-600 text-white hover:bg-purple-700",
  indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
  teal: "bg-teal-600 text-white hover:bg-teal-700",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  amber: "bg-amber-500 text-white hover:bg-amber-600",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    VARIANT_CLASSES[variant],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
