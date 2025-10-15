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
  UpdateProjectMemberPayload,
  UpdateTenantPayload,
  UpdateUserRolePayload,
  SwitchTenantPayload,
  SwitchTenantResponse,
  InviteUserPayload,
  RemoveUserResponse,
  GetRolesResponse,
  GetInvitationsResponse,
  CreateInvitationPayload,
  ValidateInvitationResponse,
  SearchMembersResponse,
  MyInvitationsResponse,
  AcceptInvitationResponse,
  RejectInvitationResponse,
  NotificationListResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
  NotificationPreferencesResponse,
  UpdatePreferenceRequest,
  UpdatePreferenceResponse,
  MuteAllResponse,
  DefaultPreferencesResponse,
  Position,
  CreatePositionPayload,
  UpdatePositionPayload,
  TenantPaymentInfo,
  UpdateTenantPaymentInfoPayload,
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

  updateProjectMember(projectId: number, memberId: number, data: UpdateProjectMemberPayload) {
    return this._privateInstance.patch(
      `/projects/${projectId}/members/${memberId}`,
      data
    );
  }

  /**
   * @deprecated Use updateProjectMember instead
   */
  updateProjectMemberRate(projectId: number, memberId: number, data: { hourlyRate: number | null }) {
    return this._privateInstance.patch(
      `/projects/${projectId}/members/${memberId}`,
      data
    );
  }

  removeProjectMember(projectId: number, userId: number) {
    return this._privateInstance.delete(
      `/projects/${projectId}/members/${userId}`
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

  // Tenant Payment Info
  getTenantPaymentInfo() {
    return this._privateInstance.get<null, AxiosResponse<{ data: TenantPaymentInfo }>>(
      ENDPOINTS.tenants.paymentInfo
    );
  }

  updateTenantPaymentInfo(data: UpdateTenantPaymentInfoPayload) {
    return this._privateInstance.patch<
      UpdateTenantPaymentInfoPayload,
      AxiosResponse<{ data: TenantPaymentInfo; message: string }>
    >(ENDPOINTS.tenants.paymentInfo, data);
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

  // Invitations
  getInvitations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    project_id?: number;
  }) {
    return this._privateInstance.get<
      null,
      AxiosResponse<GetInvitationsResponse>
    >(ENDPOINTS.invitations.list, { params });
  }

  createInvitation(data: CreateInvitationPayload) {
    return this._privateInstance.post<
      CreateInvitationPayload,
      AxiosResponse<{ message: string; data: any }>
    >(ENDPOINTS.invitations.create, data);
  }

  resendInvitation(id: number) {
    return this._privateInstance.post<
      null,
      AxiosResponse<{ message: string; data: any }>
    >(ENDPOINTS.invitations.resend.replace(":invitationId", id.toString()));
  }

  cancelInvitation(id: number) {
    return this._privateInstance.delete<
      null,
      AxiosResponse<{ message: string; data: any }>
    >(ENDPOINTS.invitations.cancel.replace(":invitationId", id.toString()));
  }

  validateInvitationToken(token: string) {
    return this._publicInstance.get<
      null,
      AxiosResponse<ValidateInvitationResponse>
    >(ENDPOINTS.invitations.validate.replace(":token", token));
  }

  getMyInvitations() {
    return this._privateInstance.get<
      null,
      AxiosResponse<MyInvitationsResponse>
    >(ENDPOINTS.invitations.myInvitations);
  }

  acceptInvitation(id: number) {
    return this._privateInstance.post<
      null,
      AxiosResponse<AcceptInvitationResponse>
    >(ENDPOINTS.invitations.accept.replace(":invitationId", id.toString()));
  }

  rejectInvitation(id: number) {
    return this._privateInstance.post<
      null,
      AxiosResponse<RejectInvitationResponse>
    >(ENDPOINTS.invitations.reject.replace(":invitationId", id.toString()));
  }

  searchOrganizationMembers(query: string, limit: number = 10) {
    return this._privateInstance.get<
      null,
      AxiosResponse<SearchMembersResponse>
    >(ENDPOINTS.users.search, { params: { q: query, limit } });
  }

  // Notification methods
  getNotifications(params?: {
    page?: number;
    limit?: number;
    filter?: "all" | "unread" | "read";
    type?: string;
  }) {
    return this._privateInstance.get<
      null,
      AxiosResponse<NotificationListResponse>
    >(ENDPOINTS.notifications.list, { params });
  }

  getUnreadCount() {
    return this._privateInstance.get<null, AxiosResponse<UnreadCountResponse>>(
      ENDPOINTS.notifications.unreadCount
    );
  }

  markNotificationAsRead(id: number) {
    return this._privateInstance.patch<null, AxiosResponse<MarkAsReadResponse>>(
      ENDPOINTS.notifications.markAsRead.replace(
        ":notificationId",
        id.toString()
      )
    );
  }

  markAllNotificationsAsRead() {
    return this._privateInstance.patch<
      null,
      AxiosResponse<MarkAllAsReadResponse>
    >(ENDPOINTS.notifications.markAllAsRead);
  }

  deleteNotification(id: number) {
    return this._privateInstance.delete<
      null,
      AxiosResponse<DeleteNotificationResponse>
    >(ENDPOINTS.notifications.delete.replace(":notificationId", id.toString()));
  }

  // Notification Preferences
  getNotificationPreferences() {
    return this._privateInstance.get<
      null,
      AxiosResponse<NotificationPreferencesResponse>
    >(ENDPOINTS.notificationPreferences.list);
  }

  updateNotificationPreference(type: string, data: UpdatePreferenceRequest) {
    return this._privateInstance.patch<
      UpdatePreferenceRequest,
      AxiosResponse<UpdatePreferenceResponse>
    >(ENDPOINTS.notificationPreferences.update.replace(":type", type), data);
  }

  muteAllNotifications() {
    return this._privateInstance.patch<null, AxiosResponse<MuteAllResponse>>(
      ENDPOINTS.notificationPreferences.muteAll
    );
  }

  unmuteAllNotifications() {
    return this._privateInstance.patch<null, AxiosResponse<MuteAllResponse>>(
      ENDPOINTS.notificationPreferences.unmuteAll
    );
  }

  getDefaultNotificationPreferences() {
    return this._privateInstance.get<
      null,
      AxiosResponse<DefaultPreferencesResponse>
    >(ENDPOINTS.notificationPreferences.defaults);
  }

  // Customers
  getCustomers(params?: { search?: string; isActive?: boolean }) {
    return this._privateInstance.get(ENDPOINTS.customers.list, { params });
  }

  getCustomer(id: number) {
    return this._privateInstance.get(
      ENDPOINTS.customers.one.replace(":customerId", id.toString())
    );
  }

  createCustomer(data: any) {
    return this._privateInstance.post(ENDPOINTS.customers.create, data);
  }

  updateCustomer(id: number, data: any) {
    return this._privateInstance.patch(
      ENDPOINTS.customers.update.replace(":customerId", id.toString()),
      data
    );
  }

  deleteCustomer(id: number) {
    return this._privateInstance.delete(
      ENDPOINTS.customers.delete.replace(":customerId", id.toString())
    );
  }

  searchCustomers(q: string, limit?: number) {
    return this._privateInstance.get(ENDPOINTS.customers.search, {
      params: { q, limit },
    });
  }

  // Positions
  getPositions(params?: { showInactive?: boolean }) {
    return this._privateInstance.get<null, AxiosResponse<{ data: Position[] }>>(
      ENDPOINTS.positions.list,
      { params }
    );
  }

  getPosition(id: number) {
    return this._privateInstance.get<null, AxiosResponse<{ data: Position }>>(
      ENDPOINTS.positions.one.replace(":positionId", id.toString())
    );
  }

  createPosition(data: CreatePositionPayload) {
    return this._privateInstance.post<
      CreatePositionPayload,
      AxiosResponse<{ data: Position }>
    >(ENDPOINTS.positions.create, data);
  }

  updatePosition(id: number, data: UpdatePositionPayload) {
    return this._privateInstance.patch<
      UpdatePositionPayload,
      AxiosResponse<{ data: Position }>
    >(ENDPOINTS.positions.update.replace(":positionId", id.toString()), data);
  }

  deletePosition(id: number) {
    return this._privateInstance.delete<
      null,
      AxiosResponse<{ data: Position; message: string }>
    >(ENDPOINTS.positions.delete.replace(":positionId", id.toString()));
  }

  restorePosition(id: number) {
    return this._privateInstance.patch<
      null,
      AxiosResponse<{ data: Position; message: string }>
    >(ENDPOINTS.positions.restore.replace(":positionId", id.toString()));
  }

  // Invoices
  getInvoices(params?: any) {
    return this._privateInstance.get(ENDPOINTS.invoices.list, { params });
  }

  getInvoice(id: number) {
    return this._privateInstance.get(
      ENDPOINTS.invoices.one.replace(":invoiceId", id.toString())
    );
  }

  createInvoice(data: {
    customerId?: number;
    projectId?: number; // Backward compatibility
    duration: "1week" | "2weeks" | "1month";
    hourlyRate?: number; // Backward compatibility
    projectIds?: Array<{  // New format for multiple projects
      projectId: number;
      hourlyRate: number;
    }>;
    toEmail?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    return this._privateInstance.post(ENDPOINTS.invoices.create, data);
  }

  getProjectTimeSummary(
    projectId: number,
    params?: { startDate?: string; endDate?: string }
  ) {
    return this._privateInstance.get(
      `/projects/${projectId}/time-summary`,
      { params }
    );
  }

  generateInvoiceFromTimeEntries(data: any) {
    return this._privateInstance.post(ENDPOINTS.invoices.generate, data);
  }

  updateInvoiceStatus(id: number, status: string) {
    return this._privateInstance.patch(
      ENDPOINTS.invoices.updateStatus.replace(":invoiceId", id.toString()),
      { status }
    );
  }

  sendInvoice(id: number, email: string) {
    return this._privateInstance.post(
      ENDPOINTS.invoices.send.replace(":invoiceId", id.toString()),
      { email }
    );
  }

  generateInvoicePdf(id: number) {
    return this._privateInstance.post(
      ENDPOINTS.invoices.generatePdf.replace(":invoiceId", id.toString())
    );
  }

  deleteInvoice(id: number) {
    return this._privateInstance.delete(
      ENDPOINTS.invoices.delete.replace(":invoiceId", id.toString())
    );
  }
}

export default new Api();
