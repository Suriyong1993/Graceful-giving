/**
 * The product name set as type. There is no official logo file yet, so the
 * app uses this wordmark instead of a symbol. When a logo file exists, render
 * it here and every placement updates together.
 */
const SIZES = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl sm:text-4xl",
} as const;

export function Wordmark({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={`font-display font-semibold tracking-tight text-ink ${SIZES[size]} ${className}`}
    >
      Grace-giving
    </span>
  );
}
