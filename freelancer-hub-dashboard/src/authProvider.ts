import type { AuthProvider } from "@refinedev/core";
import { TENANT_SLUG_KEY, TOKEN_KEY, USER_KEY } from "./constants/auth";
import { Api } from "./services/api";

export const authProvider: AuthProvider = {
  register: async ({
    email,
    password,
    fullName,
    tenantId,
    tenantName,
    tenantSlug,
  }) => {
    try {
      const { data } = await Api.register({
        email,
        password,
        fullName,
        tenantId,
        tenantName,
        tenantSlug,
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Store tenant slug from response or default tenant
      const currentTenantSlug = data.user.defaultTenant?.slug;
      if (currentTenantSlug) {
        localStorage.setItem(TENANT_SLUG_KEY, currentTenantSlug);
        return {
          success: true,
          redirectTo: `/tenants/${currentTenantSlug}/projects`,
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response.status === 409) {
        return {
          success: false,
          error: {
            name: "RegistrationError",
            message: error.response.error || "User or tenant already exists",
          },
        };
      }

      if (error.response?.status === 400) {
        return {
          success: false,
          error: {
            name: "ValidationError",
            message: error.response.error || "Invalid registration data",
          },
        };
      }
      return {
        success: false,
        error: {
          name: "RegistrationError",
          message: "An error occurred during registration",
        },
      };
    }
  },
  login: async ({ email, password }) => {
    try {
      const { data } = await Api.login({ email, password });

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Store tenant slug from response or default tenant
      const currentTenantSlug = data.user.defaultTenant?.slug;
      if (currentTenantSlug) {
        localStorage.setItem(TENANT_SLUG_KEY, currentTenantSlug);
        return {
          success: true,
          redirectTo: `/tenants/${currentTenantSlug}/projects`,
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid email or password",
        },
      };
    }
  },
  logout: async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      try {
        await Api.logout();
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_SLUG_KEY);

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);

        // Find current tenant membership
        const currentTenantMembership = user.tenants?.find(
          (t: any) => t.tenant.slug === tenantSlug
        );

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: currentTenantMembership?.role?.name,
          avatar: "https://i.pravatar.cc/300",
          tenants: user.tenants,
          currentTenant: currentTenantMembership?.tenant,
        };
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    return null;
  },
  onError: async (error) => {
    if (error?.statusCode === 401) {
      return {
        logout: true,
        redirectTo: "/login",
        error,
      };
    }

    return { error };
  },
};
