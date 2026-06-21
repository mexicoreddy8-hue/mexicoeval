"use client";
import { icons } from "lucide-react";

// Convert kebab-case (lucide html name) to PascalCase (lucide-react export)
function toPascal(name: string) {
  return name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

export default function Icon({
  name, size = 18, className, style,
}: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Cmp = (icons as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[toPascal(name)];
  if (!Cmp) return null;
  return <Cmp size={size} className={`lucide ${className || ""}`} style={style} />;
}
