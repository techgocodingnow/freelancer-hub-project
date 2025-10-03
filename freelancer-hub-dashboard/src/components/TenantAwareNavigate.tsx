import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTenant } from "../contexts/tenant";

/**
 * Component that navigates to a tenant-scoped route
 * Replaces :slug parameter with the actual tenant slug from context
 */
export const TenantAwareNavigate: React.FC<{
  to?: string;
  resource?: string;
}> = ({ to, resource = "projects" }) => {
  const { tenant, isLoading } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!tenant) {
      // No tenant available, redirect to login
      navigate("/login", { replace: true });
      return;
    }

    // Construct the target URL
    let targetUrl: string;
    if (to) {
      // Use the provided URL and replace :slug with actual tenant slug
      targetUrl = to.replace(":slug", tenant.slug);
    } else {
      // Default to the resource list page
      targetUrl = `/tenants/${tenant.slug}/${resource}`;
    }

    navigate(targetUrl, { replace: true });
  }, [tenant, isLoading, to, resource, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return null;
};

