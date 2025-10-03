import React from "react";
import { Select, Space, Tag } from "antd";
import { ShopOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { useTenant } from "../../contexts/tenant";
import { TENANT_SLUG_KEY } from "../../constants/auth";

export const TenantSelector: React.FC = () => {
  const { tenant, tenants, currentRole, switchTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTenantChange = async (tenantSlug: string) => {
    const selectedMembership = tenants.find(
      (m) => m.tenant.slug === tenantSlug
    );
    if (selectedMembership) {
      // Switch tenant context
      await switchTenant(selectedMembership.tenant.id);

      // Update localStorage
      localStorage.setItem(TENANT_SLUG_KEY, selectedMembership.tenant.slug);

      // Update the URL to use the new tenant slug
      const pathParts = location.pathname.split("/").filter(Boolean);
      // Replace the tenant slug segment (should be at index 1 after 'tenants')
      if (pathParts[0] === "tenants") {
        pathParts[1] = tenantSlug;
      }
      const newPath = "/" + pathParts.join("/");
      navigate(newPath);
    }
  };

  if (!tenant || tenants.length === 0) {
    return null;
  }

  return (
    <Space>
      <ShopOutlined style={{ fontSize: "16px" }} />
      <Select
        value={tenant.slug}
        onChange={handleTenantChange}
        style={{ minWidth: 200 }}
        optionRender={(option) => {
          const membership = tenants.find(
            (m) => m.tenant.slug === option.value
          );
          return (
            <Space>
              <span>{option.label}</span>
              {membership?.role && (
                <Tag
                  color={
                    membership.role.name === "owner"
                      ? "gold"
                      : membership.role.name === "admin"
                      ? "blue"
                      : "default"
                  }
                  icon={
                    membership.role.name === "owner" ? (
                      <CrownOutlined />
                    ) : undefined
                  }
                >
                  {membership.role.name}
                </Tag>
              )}
            </Space>
          );
        }}
        options={tenants.map((m) => ({
          label: m.tenant.name,
          value: m.tenant.slug,
        }))}
      />
      {currentRole && (
        <Tag
          color={
            currentRole.name === "owner"
              ? "gold"
              : currentRole.name === "admin"
              ? "blue"
              : "default"
          }
        >
          {currentRole.name}
        </Tag>
      )}
    </Space>
  );
};
