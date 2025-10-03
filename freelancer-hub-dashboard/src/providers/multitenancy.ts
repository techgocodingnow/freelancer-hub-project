/**
 * Custom multitenancy adapter for extracting tenant from route
 */
export const useRouterAdapter = () => {
  return {
    get: () => {
      // Extract tenant slug from current URL path
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      // Second segment should be the tenant slug (e.g., /tenants/acme-corp/projects)
      if (pathParts[0] === "tenants" && pathParts[1]) {
        return pathParts[1];
      }
      return null;
    },
  };
};
