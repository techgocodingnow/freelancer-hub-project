import React, { useEffect, type PropsWithChildren } from "react";
import { useTenant } from "../../contexts/tenant";
import { TOKEN_KEY, USER_KEY } from "../../constants/auth";
import type { User } from "../../services/api/types";

/**
 * Component that loads user's tenant memberships from stored user data
 * and sets them in the tenant context
 */
export const TenantLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { setTenants, setIsLoading, setTenant, setCurrentRole, tenant } =
    useTenant();

  useEffect(() => {
    const loadTenants = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      if (!token || !userStr) {
        setIsLoading(false);
        return;
      }

      try {
        // Parse user data which includes tenants array
        const user: User = JSON.parse(userStr);

        if (user.tenants && user.tenants.length > 0) {
          setTenants(user.tenants);

          // If no current tenant is set, use the default tenant or first one
          if (!tenant) {
            const defaultMembership =
              user.tenants.find(
                (m) => m.tenant.id === user.defaultTenant?.id
              ) ||
              user.tenants.find((m) => m.isActive) ||
              user.tenants[0];

            if (defaultMembership) {
              setTenant(defaultMembership.tenant);
              setCurrentRole(defaultMembership.role);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load tenant memberships:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};
