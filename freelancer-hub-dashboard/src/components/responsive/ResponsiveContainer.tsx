/**
 * Responsive Container Component
 * Provides consistent padding and max-width across breakpoints
 */

import React from "react";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";
import { tokens } from "../../theme";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const maxWidthMap = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  full: "100%",
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = "xl",
  padding = true,
  style,
  className,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const getPadding = () => {
    if (!padding) return 0;
    if (isMobile) return tokens.spacing[4]; // 16px
    if (isTablet) return tokens.spacing[6]; // 24px
    return tokens.spacing[8]; // 32px
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: maxWidthMap[maxWidth],
    margin: "0 auto",
    padding: getPadding(),
    ...style,
  };

  return (
    <div style={containerStyle} className={className}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
