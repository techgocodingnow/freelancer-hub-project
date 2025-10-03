import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useParams } from "react-router";
import type { TenantMembership, Role } from "../../services/api/types";
import { Api } from "../../services/api";
import { TOKEN_KEY, TENANT_SLUG_KEY, TENANT_KEY } from "../../constants/auth";

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenants: TenantMembership[];
  currentRole: Role | null;
  setTenant: (tenant: Tenant) => void;
  setTenants: (tenants: TenantMembership[]) => void;
  setCurrentRole: (role: Role | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  switchTenant: (tenantId: number) => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  tenants: [],
  currentRole: null,
  setTenant: () => {},
  setTenants: () => {},
  setCurrentRole: () => {},
  isLoading: true,
  setIsLoading: () => {},
  switchTenant: async () => {},
});

export const TenantProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [tenant, setTenantState] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();

  const setTenant = (newTenant: Tenant) => {
    setTenantState(newTenant);
    localStorage.setItem(TENANT_KEY, JSON.stringify(newTenant));

    // Update current role based on new tenant
    const membership = tenants.find((t) => t.tenant.id === newTenant.id);
    if (membership) {
      setCurrentRole(membership.role);
    }
  };

  const switchTenant = async (tenantId: number) => {
    try {
      // Call the API to switch tenant and get new token
      const response = await Api.switchTenant({ tenantId });
      const { tenant: newTenant, role } = response.data;

      // Update token in localStorage
      localStorage.setItem(TENANT_SLUG_KEY, newTenant.slug);

      // Update tenant context
      setTenant(newTenant);
      setCurrentRole(role);
    } catch (error) {
      console.error("Failed to switch tenant:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Try to load tenant from localStorage
    const storedTenant = localStorage.getItem(TENANT_KEY);
    if (storedTenant) {
      try {
        const parsedTenant = JSON.parse(storedTenant);
        setTenantState(parsedTenant);
      } catch (e) {
        console.error("Failed to parse stored tenant", e);
      }
    }
  }, []);

  // Update tenant when route changes
  useEffect(() => {
    const tenantSlug = params.slug;
    if (tenantSlug && tenants.length > 0) {
      const matchingMembership = tenants.find(
        (t) => t.tenant.slug === tenantSlug
      );
      if (matchingMembership && matchingMembership.tenant.id !== tenant?.id) {
        setTenant(matchingMembership.tenant);
        setCurrentRole(matchingMembership.role);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, tenant?.id, tenants]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenants,
        currentRole,
        setTenant,
        setTenants,
        setCurrentRole,
        isLoading,
        setIsLoading,
        switchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};

// Hook to get current tenant slug from URL
export const useTenantSlug = (): string | undefined => {
  const params = useParams();
  return params.slug;
};

// Component to ensure tenant is loaded before rendering children
export const WithTenant: React.FC<
  PropsWithChildren<{
    fallback?: React.ReactNode;
    loadingComponent?: React.ReactNode;
  }>
> = ({ children, fallback, loadingComponent }) => {
  const { tenant, isLoading } = useTenant();
  const tenantSlug = useTenantSlug();

  if (isLoading) {
    return <>{loadingComponent || <div>Loading tenant...</div>}</>;
  }

  if (!tenant && tenantSlug) {
    return <>{fallback || <div>Tenant not found</div>}</>;
  }

  return <>{children}</>;
};
