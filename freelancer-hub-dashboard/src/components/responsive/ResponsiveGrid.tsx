/**
 * Responsive Grid Component
 * Provides responsive grid layouts with automatic column adjustments
 */

import React from "react";
import { Row, Col } from "antd";
import type { RowProps, ColProps } from "antd";

interface ResponsiveGridProps extends RowProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  gap?: number | [number, number];
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 16,
  ...rowProps
}) => {
  const gutter: [number, number] = Array.isArray(gap)
    ? [gap[0], gap[1]]
    : [gap, gap];

  return (
    <Row gutter={gutter} {...rowProps}>
      {React.Children.map(children, (child) => (
        <Col
          xs={cols.xs ? 24 / cols.xs : 24}
          sm={cols.sm ? 24 / cols.sm : 12}
          md={cols.md ? 24 / cols.md : 12}
          lg={cols.lg ? 24 / cols.lg : 8}
          xl={cols.xl ? 24 / cols.xl : 6}
          xxl={cols.xxl ? 24 / cols.xxl : 6}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

export default ResponsiveGrid;
