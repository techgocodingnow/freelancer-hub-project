import axios, { AxiosInstance, AxiosResponse } from "axios";
import { TENANT_SLUG_KEY, TOKEN_KEY } from "../../constants/auth";
import {
  CreateProjectPayload,
  CreateTaskPayload,
  CreateTenantPayload,
  CreateTenantResponse,
  GetTenantBySlugResponse,
  GetTenantsResponse,
  GetUserResponse,
  GetUsersResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  UpdateProjectPayload,
  UpdateTenantPayload,
  UpdateUserRolePayload,
  SwitchTenantPayload,
  SwitchTenantResponse,
  InviteUserPayload,
  RemoveUserResponse,
  GetRolesResponse,
} from "./types";
import ENDPOINTS from "./endpoint";
class Api {
  private _privateInstance: AxiosInstance;
  private _publicInstance: AxiosInstance;

  constructor() {
    this._privateInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this._publicInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this._publicInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );

    this._privateInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers["X-Tenant-Slug"] = localStorage.getItem(TENANT_SLUG_KEY);
      }
      return config;
    });
    this._privateInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TENANT_SLUG_KEY);
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  public get privateInstance() {
    return this._privateInstance;
  }

  public get publicInstance() {
    return this._publicInstance;
  }

  // Auth
  login(data: LoginPayload) {
    return this._publicInstance.post<null, AxiosResponse<LoginResponse>>(
      ENDPOINTS.auth.login,
      data
    );
  }

  register(data: RegisterPayload) {
    return this._publicInstance.post<null, AxiosResponse<RegisterResponse>>(
      ENDPOINTS.auth.register,
      data
    );
  }

  logout() {
    return this._privateInstance.post(ENDPOINTS.auth.logout);
  }

  me() {
    return this._privateInstance.get(ENDPOINTS.auth.me);
  }

  switchTenant(data: SwitchTenantPayload) {
    return this._privateInstance.post<
      SwitchTenantPayload,
      AxiosResponse<SwitchTenantResponse>
    >(ENDPOINTS.auth.switchTenant, data);
  }

  // Projects
  getProjects() {
    return this._privateInstance.get(ENDPOINTS.projects.list);
  }

  createProject(data: CreateProjectPayload) {
    return this._privateInstance.post(ENDPOINTS.projects.create, data);
  }

  getProject(id: number) {
    return this._privateInstance.get(
      ENDPOINTS.projects.one.replace(":projectId", id.toString())
    );
  }

  updateProject(id: number, data: UpdateProjectPayload) {
    return this._privateInstance.put(
      ENDPOINTS.projects.update.replace(":projectId", id.toString()),
      data
    );
  }

  deleteProject(id: number) {
    return this._privateInstance.delete(
      ENDPOINTS.projects.delete.replace(":projectId", id.toString())
    );
  }

  // Tasks
  getTasks(projectId: number) {
    return this._privateInstance.get(
      ENDPOINTS.tasks.list.replace(":projectId", projectId.toString())
    );
  }

  createTask(projectId: number, data: CreateTaskPayload) {
    return this._privateInstance.post(
      ENDPOINTS.tasks.create.replace(":projectId", projectId.toString()),
      data
    );
  }

  getTask(projectId: number, taskId: number) {
    return this._privateInstance.get(
      ENDPOINTS.tasks.one
        .replace(":projectId", projectId.toString())
        .replace(":taskId", taskId.toString())
    );
  }

  // My Tasks
  getMyTasks(params?: {
    filter?: string;
    status?: string;
    priority?: string;
    project_id?: number;
    _sort?: string;
    _order?: string;
    _start?: number;
    _end?: number;
  }) {
    return this._privateInstance.get(ENDPOINTS.myTasks.list, { params });
  }

  getMyTasksSummary() {
    return this._privateInstance.get(ENDPOINTS.myTasks.summary);
  }

  // Tenants
  getTenants() {
    return this._privateInstance.get<null, AxiosResponse<GetTenantsResponse>>(
      ENDPOINTS.tenants.list
    );
  }

  getTenantBySlug(slug: string) {
    return this._privateInstance.get<
      null,
      AxiosResponse<GetTenantBySlugResponse>
    >(ENDPOINTS.tenants.slug.replace(":tenantSlug", slug));
  }

  createTenant(data: CreateTenantPayload) {
    return this._privateInstance.post<
      null,
      AxiosResponse<CreateTenantResponse>
    >(ENDPOINTS.tenants.create, data);
  }

  updateTenant(id: number, data: UpdateTenantPayload) {
    return this._privateInstance.put(
      ENDPOINTS.tenants.update.replace(":tenantId", id.toString()),
      data
    );
  }

  deleteTenant(id: number) {
    return this._privateInstance.delete(
      ENDPOINTS.tenants.delete.replace(":tenantId", id.toString())
    );
  }

  // Users
  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    return this._privateInstance.get<null, AxiosResponse<GetUsersResponse>>(
      ENDPOINTS.users.list,
      { params }
    );
  }

  getUser(id: number) {
    return this._privateInstance.get<null, AxiosResponse<GetUserResponse>>(
      ENDPOINTS.users.one.replace(":userId", id.toString())
    );
  }

  updateUserRole(id: number, data: UpdateUserRolePayload) {
    return this._privateInstance.patch<
      UpdateUserRolePayload,
      AxiosResponse<GetUserResponse>
    >(ENDPOINTS.users.updateRole.replace(":userId", id.toString()), data);
  }

  inviteUser(data: InviteUserPayload) {
    return this._privateInstance.post<
      InviteUserPayload,
      AxiosResponse<GetUserResponse>
    >(ENDPOINTS.users.invite, data);
  }

  removeUser(id: number) {
    return this._privateInstance.delete<
      null,
      AxiosResponse<RemoveUserResponse>
    >(ENDPOINTS.users.remove.replace(":userId", id.toString()));
  }

  // Roles
  getRoles() {
    return this._privateInstance.get<null, AxiosResponse<GetRolesResponse>>(
      ENDPOINTS.roles.list
    );
  }
}

export default new Api();
