import React from "react";

export interface IllustrationProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

/**
 * Reusable Illustration component optimized for Vite/React
 * Ensures proper aspect ratio, responsive loading, and smooth image rendering
 */
export const Illustration: React.FC<IllustrationProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover select-none pointer-events-none ${className}`}
      {...props}
    />
  );
};

export default Illustration;
