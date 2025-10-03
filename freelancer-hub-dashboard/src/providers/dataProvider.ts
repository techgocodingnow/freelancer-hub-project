import {
  DataProvider,
  HttpError,
  CrudFilters,
  CrudSorting,
} from "@refinedev/core";
import { AxiosError, AxiosInstance } from "axios";
import { stringify } from "query-string";

/**
 * Custom data provider for AdonisJS backend.
 * Handles pagination data from response body instead of headers.
{{ ... }}
 * Tenant context is handled via X-Tenant-Slug header in the API service.
 *
 * AdonisJS Response Format:
 * {
 *   "data": [...],
 *   "meta": {
        currentPage: 1,
        firstPage: 1,
        firstPageUrl: "/?page=1",
        lastPage: 1
        lastPageUrl: "/?page=1",
        nextPageUrl: null,
        perPage: 100,
        previousPageUrl: null,
        total: 2
 *   }
 * }
 */

/**
 * Maps Refine's filter operators to query parameters
 */
const generateFilter = (filters?: CrudFilters) => {
  const queryFilters: Record<string, string | number | boolean | string[]> = {};

  if (!filters) {
    return queryFilters;
  }

  filters.forEach((filter) => {
    if (filter.operator === "or" || filter.operator === "and") {
      throw new Error(
        `[@refinedev/custom-rest]: \`operator: ${filter.operator}\` is not supported. You can create custom data provider. https://refine.dev/docs/api-reference/core/providers/data-provider/#creating-a-data-provider`
      );
    }

    if ("field" in filter) {
      const { field, operator, value } = filter;

      if (operator === "eq") {
        queryFilters[field] = value;
      } else if (operator === "ne") {
        queryFilters[`${field}_ne`] = value;
      } else if (operator === "lt") {
        queryFilters[`${field}_lt`] = value;
      } else if (operator === "gt") {
        queryFilters[`${field}_gt`] = value;
      } else if (operator === "lte") {
        queryFilters[`${field}_lte`] = value;
      } else if (operator === "gte") {
        queryFilters[`${field}_gte`] = value;
      } else if (operator === "in") {
        queryFilters[`${field}_in`] = value;
      } else if (operator === "nin") {
        queryFilters[`${field}_nin`] = value;
      } else if (operator === "contains") {
        queryFilters[`${field}_contains`] = value;
      } else if (operator === "ncontains") {
        queryFilters[`${field}_ncontains`] = value;
      } else if (operator === "containss") {
        queryFilters[`${field}_containss`] = value;
      } else if (operator === "ncontainss") {
        queryFilters[`${field}_ncontainss`] = value;
      } else if (operator === "null") {
        queryFilters[`${field}_null`] = value;
      } else if (operator === "nnull") {
        queryFilters[`${field}_nnull`] = value;
      } else if (operator === "between") {
        queryFilters[`${field}_between`] = value;
      } else if (operator === "nbetween") {
        queryFilters[`${field}_nbetween`] = value;
      } else if (operator === "startswith") {
        queryFilters[`${field}_startswith`] = value;
      } else if (operator === "nstartswith") {
        queryFilters[`${field}_nstartswith`] = value;
      } else if (operator === "endswith") {
        queryFilters[`${field}_endswith`] = value;
      } else if (operator === "nendswith") {
        queryFilters[`${field}_nendswith`] = value;
      }
    }
  });

  return queryFilters;
};

/**
 * Maps Refine's sorting to query parameters
 */
const generateSort = (sorters?: CrudSorting) => {
  if (!sorters || sorters.length === 0) {
    return {};
  }

  const _sort: string[] = [];
  const _order: string[] = [];

  sorters.forEach((sorter) => {
    _sort.push(sorter.field);
    _order.push(sorter.order);
  });

  return {
    _sort: _sort.join(","),
    _order: _order.join(","),
  };
};

/**
 * Creates a custom data provider for AdonisJS backend
 */
export const createTenantAwareDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance
): DataProvider => {
  return {
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
      const url = `${apiUrl}/${resource}`;

      // Extract pagination parameters with proper typing
      const current = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;
      const mode = pagination?.mode ?? "server";

      const queryFilters = generateFilter(filters);
      const generatedSort = generateSort(sorters);

      const query: Record<
        string,
        string | number | boolean | string[] | undefined
      > = {
        ...queryFilters,
        ...generatedSort,
      };

      if (mode === "server") {
        query._start = (current - 1) * pageSize;
        query._end = current * pageSize;
      }

      try {
        const { data } = await httpClient.get(
          `${url}?${stringify(query, { arrayFormat: "bracket" })}`,
          {
            headers: meta?.headers,
          }
        );

        return {
          data: data.data,
          total: data.meta?.total || 0,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    getOne: async ({ resource, id, meta }) => {
      const url = `${apiUrl}/${resource}/${id}`;

      try {
        const { data } = await httpClient.get(url, {
          headers: meta?.headers,
        });
        return {
          data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    getMany: async ({ resource, ids, meta }) => {
      const url = `${apiUrl}/${resource}`;

      try {
        const { data } = await httpClient.get(
          `${url}?${stringify({ id: ids }, { arrayFormat: "bracket" })}`,
          {
            headers: meta?.headers,
          }
        );

        return {
          data: data.data || data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    create: async ({ resource, variables, meta }) => {
      const url = `${apiUrl}/${resource}`;

      try {
        const { data } = await httpClient.post(url, variables, {
          headers: meta?.headers,
        });

        return {
          data: data.data || data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    update: async ({ resource, id, variables, meta }) => {
      const url = `${apiUrl}/${resource}/${id}`;

      try {
        const { data } = await httpClient.put(url, variables, {
          headers: meta?.headers,
        });

        return {
          data: data.data || data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    deleteOne: async ({ resource, id, meta }) => {
      const url = `${apiUrl}/${resource}/${id}`;

      try {
        const { data } = await httpClient.delete(url, {
          headers: meta?.headers,
        });

        return {
          data: data.data || data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },

    getApiUrl: () => {
      return apiUrl;
    },

    custom: async ({
      url,
      method,
      filters,
      sorters,
      payload,
      query,
      headers,
    }) => {
      let requestUrl = `${url}?`;

      if (sorters && sorters.length > 0) {
        const generatedSort = generateSort(sorters);
        requestUrl = `${requestUrl}&${stringify(generatedSort)}`;
      }

      if (filters) {
        const filterQuery = generateFilter(filters);
        requestUrl = `${requestUrl}&${stringify(filterQuery, {
          arrayFormat: "bracket",
        })}`;
      }

      if (query) {
        requestUrl = `${requestUrl}&${stringify(query)}`;
      }

      try {
        let axiosResponse;
        switch (method) {
          case "put":
          case "post":
          case "patch":
            axiosResponse = await httpClient[method](url, payload, {
              headers,
            });
            break;
          case "delete":
            axiosResponse = await httpClient.delete(url, {
              data: payload,
              headers,
            });
            break;
          default:
            axiosResponse = await httpClient.get(requestUrl, {
              headers,
            });
            break;
        }

        const { data } = axiosResponse;

        return {
          data: data.data || data,
        };
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }> & {
          response?: { status?: number };
        };
        const customError: HttpError = {
          ...axiosError,
          message: axiosError.response?.data?.message || axiosError.message,
          statusCode: axiosError.response?.status || 500,
        };
        return Promise.reject(customError);
      }
    },
  };
};
