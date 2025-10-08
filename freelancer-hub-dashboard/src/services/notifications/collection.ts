import { createCollection } from "@tanstack/react-db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { notificationSchema } from "./schema";
import Api from "../api/api";
import { TOKEN_KEY, TENANT_SLUG_KEY } from "../../constants/auth";

/**
 * Create Electric collection for notifications
 * This provides real-time sync from Postgres via Electric
 */
export const createNotificationCollection = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);

  if (!token || !tenantSlug) {
    return null;
  }

  // Get the base URL from environment or construct from window.location
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  return createCollection(
    electricCollectionOptions({
      id: "notifications",
      schema: notificationSchema,
      getKey: (row) => row.id,
      shapeOptions: {
        // Proxy through our backend for authentication and tenant isolation
        // Must be an absolute URL for Electric to work properly
        url: `${baseUrl}/electric/notifications`,
        fetchClient: async (input, init) => {
          // Add authentication headers
          const headers = new Headers(init?.headers);
          headers.set("Authorization", `Bearer ${token}`);
          headers.set("X-Tenant-Slug", tenantSlug);

          return fetch(input, {
            ...init,
            headers,
          });
        },
        parser: {
          // Parse timestamp fields to ISO strings (Electric expects strings, not Date objects)
          timestamptz: (date: string) => date,
        },
        // Add error handler for better debugging
        onError: (error) => {
          console.error(
            "Electric sync error for notifications collection:",
            error
          );
          console.error("URL:", `${baseUrl}/electric/notifications`);
          console.error("Token present:", !!token);
          console.error("Tenant slug:", tenantSlug);
        },
      },
      // Write path: mark as read
      onUpdate: async ({ transaction }) => {
        const updated = transaction.mutations[0].modified;
        if (updated.isRead) {
          const response = await Api.markNotificationAsRead(updated.id);
          // Convert string txid to number as expected by Electric
          return { txid: parseInt(response.data.txid, 10) };
        }
        return { txid: 0 };
      },
      // Write path: delete notification
      onDelete: async ({ transaction }) => {
        const deleted = transaction.mutations[0].original;
        const response = await Api.deleteNotification(deleted.id);
        // Convert string txid to number as expected by Electric
        return { txid: parseInt(response.data.txid, 10) };
      },
    })
  );
};

export const getNotificationCollection = () => createNotificationCollection();
