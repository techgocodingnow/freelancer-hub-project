import { Authenticated } from "@refinedev/core";
// import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { App as AntdApp } from "antd";
import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes, Navigate } from "react-router";
import { authProvider } from "./authProvider";
import { Header } from "./components/header";
import { TenantLoader } from "./components/tenant-loader";
import { TenantAwareNavigate } from "./components/TenantAwareNavigate";
import { RefineWithTenant } from "./components/RefineWithTenant";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { TenantProvider, WithTenant } from "./contexts/tenant";
import { createTenantAwareDataProvider } from "./providers/dataProvider";
import {
  ProjectList,
  ProjectCreate,
  ProjectEdit,
  ProjectShow,
} from "./pages/projects";
import { TaskList, TaskKanban, TaskCreate, TaskEdit } from "./pages/tasks";
import { TaskCalendar } from "./pages/tasks/calendar";
import { TaskTimeline } from "./pages/tasks/timeline";
import { MyTasksList, MyTasksKanban, MyTasksCalendar } from "./pages/my-tasks";
import {
  TimesheetsList,
  TimesheetsCreate,
  TimesheetsEdit,
  TimesheetsShow,
  TimesheetsApprovals,
} from "./pages/timesheets";
import {
  TimeEntriesList,
  TimeEntryCreate,
  TimeEntryEdit,
} from "./pages/time-entries";
import { UserList } from "./pages/users";
import { CustomerList } from "./pages/customers";
import {
  ReportsIndex,
  TimeActivityReport,
  DailyTotalsReport,
  PaymentsReport,
  InvoicesPaymentsReport,
  ProjectBudgetReport,
  TeamUtilizationReport,
} from "./pages/reports";
import {
  PayrollManagement,
  PaymentHistory,
  PaymentCreate,
  InvoiceManagement,
  InvoiceCreate,
  InvoiceEdit,
  InvoiceShow,
  FinancialDashboard,
} from "./pages/financials";
import {
  WiseAccountSetup,
  PositionList,
  PaymentInfoSettings,
} from "./pages/settings";
import NotificationPreferences from "./pages/settings/NotificationPreferences";
import { TimerWidget } from "./components/timer/TimerWidget";
import { ForgotPassword } from "./pages/forgotPassword";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { InvitationRegister } from "./pages/register/invitation";
import { CommandPalette } from "./components/CommandPalette";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { MobileBottomNav } from "./components/mobile/MobileBottomNav";
import { MobileFAB } from "./components/mobile/MobileFAB";
import { Api } from "./services/api";
import { ProjectInvitationBanner } from "./components/invitations";
import { NotificationProvider } from "./providers/NotificationProvider";

const API_URL = import.meta.env.VITE_API_BASE_URL;
function App() {
  const commandPalette = useCommandPalette();

  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <TenantProvider>
            <TenantLoader>
              <AntdApp>
                <NotificationProvider>
                  {/* <DevtoolsProvider> */}
                  <RefineWithTenant
                    dataProvider={createTenantAwareDataProvider(
                      API_URL,
                      Api.privateInstance
                    )}
                    notificationProvider={useNotificationProvider}
                    routerProvider={routerProvider}
                    authProvider={authProvider}
                    options={{
                      syncWithLocation: true,
                      warnWhenUnsavedChanges: true,
                      projectId: "Wj6Xr1-DrlqBM-QNXrUn",
                    }}
                  >
                    <Routes>
                      {/* Root route - redirect to login or tenant projects */}
                      <Route
                        index
                        element={
                          <Authenticated
                            key="authenticated-root"
                            fallback={<Navigate to="/login" replace />}
                          >
                            <TenantAwareNavigate resource="projects" />
                          </Authenticated>
                        }
                      />

                      {/* Auth routes (no tenant required) */}
                      <Route
                        element={
                          <Authenticated
                            key="authenticated-outer"
                            fallback={<Outlet />}
                          >
                            <TenantAwareNavigate resource="projects" />
                          </Authenticated>
                        }
                      >
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                          path="/register/invitation/:token"
                          element={<InvitationRegister />}
                        />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPassword />}
                        />
                      </Route>

                      {/* Tenant-scoped routes */}
                      <Route
                        path="/tenants/:slug"
                        element={
                          <Authenticated
                            key="authenticated-inner"
                            fallback={<CatchAllNavigate to="/login" />}
                          >
                            <WithTenant
                              fallback={<div>Tenant not found</div>}
                              loadingComponent={<div>Loading tenant...</div>}
                            >
                              <ThemedLayout
                                Title={() => (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src="/logo.png"
                                      alt="Freelancer Hub"
                                      className="h-12 w-12"
                                    />
                                    <a className="text-sm font-bold" href="/">
                                      Freelancer Hub
                                    </a>
                                  </div>
                                )}
                                Header={Header}
                                Sider={(props) => (
                                  <ThemedSider {...props} fixed />
                                )}
                              >
                                <ProjectInvitationBanner />
                                <Outlet />
                                <TimerWidget />
                              </ThemedLayout>
                            </WithTenant>
                          </Authenticated>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="projects" replace />}
                        />
                        <Route path="projects">
                          <Route index element={<ProjectList />} />
                          <Route path="create" element={<ProjectCreate />} />
                          <Route path=":id/edit" element={<ProjectEdit />} />
                          <Route path=":id/show" element={<ProjectShow />} />
                          <Route path=":projectId/tasks">
                            <Route index element={<TaskList />} />
                            <Route path="kanban" element={<TaskKanban />} />
                            <Route path="calendar" element={<TaskCalendar />} />
                            <Route path="timeline" element={<TaskTimeline />} />
                            <Route path="create" element={<TaskCreate />} />
                            <Route path=":id/edit" element={<TaskEdit />} />
                          </Route>
                        </Route>
                        <Route path="my-tasks">
                          <Route index element={<MyTasksList />} />
                          <Route path="kanban" element={<MyTasksKanban />} />
                          <Route
                            path="calendar"
                            element={<MyTasksCalendar />}
                          />
                        </Route>
                        <Route path="timesheets">
                          <Route index element={<TimesheetsList />} />
                          <Route
                            path="approvals"
                            element={<TimesheetsApprovals />}
                          />
                          <Route path="create" element={<TimesheetsCreate />} />
                          <Route path=":id" element={<TimesheetsShow />} />
                          <Route path=":id/edit" element={<TimesheetsEdit />} />
                        </Route>
                        <Route path="time-entries">
                          <Route index element={<TimeEntriesList />} />
                          <Route path="create" element={<TimeEntryCreate />} />
                          <Route path=":id/edit" element={<TimeEntryEdit />} />
                        </Route>
                        <Route path="users">
                          <Route index element={<UserList />} />
                        </Route>
                        <Route path="customers">
                          <Route index element={<CustomerList />} />
                        </Route>
                        <Route path="reports">
                          <Route index element={<ReportsIndex />} />
                          <Route
                            path="time-activity"
                            element={<TimeActivityReport />}
                          />
                          <Route
                            path="daily-totals"
                            element={<DailyTotalsReport />}
                          />
                          <Route path="payments" element={<PaymentsReport />} />
                          <Route
                            path="invoices-payments"
                            element={<InvoicesPaymentsReport />}
                          />
                          <Route
                            path="project-budget"
                            element={<ProjectBudgetReport />}
                          />
                          <Route
                            path="team-utilization"
                            element={<TeamUtilizationReport />}
                          />
                        </Route>
                        <Route path="financials">
                          <Route index element={<FinancialDashboard />} />
                          <Route
                            path="payroll"
                            element={<PayrollManagement />}
                          />
                          <Route
                            path="payments/create"
                            element={<PaymentCreate />}
                          />
                          <Route
                            path="payments/history"
                            element={<PaymentHistory />}
                          />
                          <Route
                            path="invoices"
                            element={<InvoiceManagement />}
                          />
                          <Route
                            path="invoices/create"
                            element={<InvoiceCreate />}
                          />
                          <Route
                            path="invoices/:id/edit"
                            element={<InvoiceEdit />}
                          />
                          <Route
                            path="invoices/:id/show"
                            element={<InvoiceShow />}
                          />
                        </Route>
                        <Route path="settings">
                          <Route
                            path="wise-account"
                            element={<WiseAccountSetup />}
                          />
                          <Route
                            path="notifications"
                            element={<NotificationPreferences />}
                          />
                          <Route path="positions" element={<PositionList />} />
                          <Route
                            path="payment-info"
                            element={<PaymentInfoSettings />}
                          />
                        </Route>
                        <Route path="*" element={<ErrorComponent />} />
                      </Route>
                    </Routes>

                    <RefineKbar />
                    <UnsavedChangesNotifier />
                    <DocumentTitleHandler />
                  </RefineWithTenant>
                  {/* <DevtoolsPanel /> */}
                  {/* </DevtoolsProvider> */}

                  {/* Command Palette */}
                  <CommandPalette
                    open={commandPalette.isOpen}
                    onClose={commandPalette.close}
                  />

                  {/* Mobile Components */}
                  <MobileBottomNav />
                  <MobileFAB />
                </NotificationProvider>
              </AntdApp>
            </TenantLoader>
          </TenantProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
