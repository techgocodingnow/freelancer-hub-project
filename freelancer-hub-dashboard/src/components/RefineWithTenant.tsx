import React, { PropsWithChildren } from "react";
import { Refine, RefineProps } from "@refinedev/core";
import { useTenant } from "../contexts/tenant";
import {
  ProjectOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  BarChartOutlined,
  DollarOutlined,
  CreditCardOutlined,
  TransactionOutlined,
  FileTextOutlined,
  BankOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

/**
 * Wrapper component for Refine that provides tenant-aware resource definitions
 * This component has access to TenantContext and can dynamically update resources
 */
export const RefineWithTenant: React.FC<
  PropsWithChildren<Omit<RefineProps, "resources">>
> = ({ children, ...refineProps }) => {
  const { tenant } = useTenant();

  // Dynamically generate resources based on current tenant
  const resources = React.useMemo(() => {
    const slug = tenant?.slug || ":slug";

    return [
      {
        name: "projects",
        list: `/tenants/${slug}/projects`,
        create: `/tenants/${slug}/projects/create`,
        edit: `/tenants/${slug}/projects/:id/edit`,
        show: `/tenants/${slug}/projects/:id/show`,
        meta: {
          label: "Projects",
          canDelete: true,
          icon: <ProjectOutlined />,
        },
      },
      {
        name: "my-tasks",
        list: `/tenants/${slug}/my-tasks`,
        meta: {
          label: "My Tasks",
          canDelete: false,
          icon: <CheckSquareOutlined />,
        },
      },
      {
        name: "timesheets",
        list: `/tenants/${slug}/timesheets`,
        create: `/tenants/${slug}/timesheets/create`,
        edit: `/tenants/${slug}/timesheets/:id/edit`,
        show: `/tenants/${slug}/timesheets/:id`,
        meta: {
          label: "Timesheets",
          canDelete: false,
          icon: <ClockCircleOutlined />,
        },
      },
      {
        name: "time-entries",
        list: `/tenants/${slug}/time-entries`,
        create: `/tenants/${slug}/time-entries/create`,
        edit: `/tenants/${slug}/time-entries/:id/edit`,
        meta: {
          label: "Time Entries",
          canDelete: true,
          icon: <CheckSquareOutlined />,
        },
      },
      {
        name: "timesheets/approvals",
        list: `/tenants/${slug}/timesheets/approvals`,
        meta: {
          label: "Approvals",
          parent: "timesheets",
          canDelete: false,
          icon: <CheckSquareOutlined />,
        },
      },
      {
        name: "users",
        list: `/tenants/${slug}/users`,
        meta: {
          label: "Users",
          canDelete: false,
          icon: <TeamOutlined />,
        },
      },
      {
        name: "reports",
        list: `/tenants/${slug}/reports`,
        meta: {
          label: "Reports",
          canDelete: false,
          icon: <BarChartOutlined />,
        },
      },
      {
        name: "financials",
        list: `/tenants/${slug}/financials`,
        meta: {
          label: "Financials",
          canDelete: false,
          icon: <DollarOutlined />,
        },
      },
      {
        name: "payroll/batches",
        list: `/tenants/${slug}/financials/payroll`,
        meta: {
          label: "Payroll",
          parent: "financials",
          canDelete: false,
          icon: <CreditCardOutlined />,
        },
      },
      {
        name: "payroll/calculate",
        meta: {
          parent: "financials",
          canDelete: false,
        },
      },
      {
        name: "payments",
        list: `/tenants/${slug}/financials/payments/history`,
        create: `/tenants/${slug}/financials/payments/create`,
        meta: {
          label: "Payments",
          parent: "financials",
          canDelete: false,
          icon: <TransactionOutlined />,
        },
      },
      {
        name: "invoices",
        list: `/tenants/${slug}/financials/invoices`,
        meta: {
          label: "Invoices",
          parent: "financials",
          canDelete: false,
          icon: <FileTextOutlined />,
        },
      },
      {
        name: "wise-account",
        list: `/tenants/${slug}/settings/wise-account`,
        meta: {
          label: "Wise Account",
          parent: "settings",
          canDelete: false,
          icon: <BankOutlined />,
        },
      },
    ];
  }, [tenant?.slug]);

  return (
    <Refine {...refineProps} resources={resources}>
      {children}
    </Refine>
  );
};
