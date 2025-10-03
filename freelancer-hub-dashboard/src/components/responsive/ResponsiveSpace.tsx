/**
 * Responsive Space Component
 * Provides responsive spacing between elements
 */

import React from "react";
import { Space } from "antd";
import type { SpaceProps } from "antd";
import { useIsMobile, useIsTablet } from "../../hooks/useMediaQuery";

interface ResponsiveSpaceProps extends Omit<SpaceProps, "size"> {
  children: React.ReactNode;
  size?:
    | {
        mobile?: SpaceProps["size"];
        tablet?: SpaceProps["size"];
        desktop?: SpaceProps["size"];
      }
    | SpaceProps["size"];
}

export const ResponsiveSpace: React.FC<ResponsiveSpaceProps> = ({
  children,
  size = { mobile: "small", tablet: "middle", desktop: "large" },
  ...spaceProps
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const getSize = (): SpaceProps["size"] => {
    if (typeof size === "object" && size !== null && "mobile" in size) {
      if (isMobile) return size.mobile || "small";
      if (isTablet) return size.tablet || "middle";
      return size.desktop || "large";
    }
    return size as SpaceProps["size"];
  };

  return (
    <Space size={getSize()} {...spaceProps}>
      {children}
    </Space>
  );
};

export default ResponsiveSpace;
