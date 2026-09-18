import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { hasSkippedSetup } from "@/lib/setupSkip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages are loaded on demand so the initial bundle contains only the app shell
// and the route chunk the user actually opens.
const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ChurchSetup = lazy(() => import("./pages/ChurchSetup"));
const Transactions = lazy(() => import("./pages/Transactions"));
const TransactionDetail = lazy(() => import("./pages/TransactionDetail"));
const Counting = lazy(() => import("./pages/Counting"));
const CountingDetail = lazy(() => import("./pages/CountingDetail"));
const Offerings = lazy(() => import("./pages/Offerings"));
const NewOffering = lazy(() => import("./pages/NewOffering"));
const Expenses = lazy(() => import("./pages/Expenses"));
const NewExpense = lazy(() => import("./pages/NewExpense"));
const Funds = lazy(() => import("./pages/Funds"));
const FundDetail = lazy(() => import("./pages/FundDetail"));
const Budgets = lazy(() => import("./pages/Budgets"));
const BudgetDetail = lazy(() => import("./pages/BudgetDetail"));
const Ministries = lazy(() => import("./pages/Ministries"));
const MinistryDetail = lazy(() => import("./pages/MinistryDetail"));
const Members = lazy(() => import("./pages/Members"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Updates = lazy(() => import("./pages/Updates"));
const ComponentShowcase = lazy(() => import("./pages/ComponentShowcase"));

/** Routes reachable without a session. Everything else needs one. */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/404",
  ...(import.meta.env.DEV ? ["/ui-showcase"] : []),
];

function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Sends signed-out visitors to /login. Without this the app shell renders for
 * anyone and every query fails with UNAUTHORIZED, which reads as a broken page
 * rather than as "please sign in".
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(normalizePath(location));

  useEffect(() => {
    if (loading || isPublic || isAuthenticated) return;
    setLocation("/login");
  }, [loading, isPublic, isAuthenticated, setLocation]);

  if (isPublic) return <>{children}</>;
  if (loading) return <RouteLoading />;
  if (!isAuthenticated) return <RouteLoading />;
  return <>{children}</>;
}

const SETUP_EXEMPT_PATHS = [
  "/setup",
  "/login",
  "/register",
  "/404",
  // Dev-only UI gallery; the route itself is also unmounted in prod (see Router).
  ...(import.meta.env.DEV ? ["/ui-showcase"] : []),
];

// Hybrid onboarding gate: logged-in users whose church profile is missing or
// not yet set up are nudged to the wizard — unless they skipped it in this
// tab, are already on an exempt page, or the profile query failed
// (offline-safe: never trap the user when the DB is unreachable).
function SetupGate() {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const profileQuery = trpc.church.getProfile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (loading || !user) return;
    // Normalize trailing slashes so e.g. "/setup/" still matches the exempt list.
    const normalizedLocation =
      location.length > 1 ? location.replace(/\/+$/, "") : location;
    if (SETUP_EXEMPT_PATHS.includes(normalizedLocation)) return;
    if (hasSkippedSetup()) return;
    if (profileQuery.isLoading || profileQuery.isError) return;
    const profile = profileQuery.data;
    if (!profile || !profile.setupCompleted) setLocation("/setup");
  }, [
    loading,
    user,
    location,
    profileQuery.isLoading,
    profileQuery.isError,
    profileQuery.data,
    setLocation,
  ]);

  return null;
}

function RouteLoading() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md space-y-3">
        <div className="h-8 w-40 rounded-xl bg-[#E9D9BF]/60 animate-pulse" />
        <div className="h-24 w-full rounded-2xl bg-[#E9D9BF]/40 animate-pulse" />
        <p className="text-center text-sm text-[#927D6D]">กำลังโหลดหน้า…</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Core & Auth */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/setup" component={ChurchSetup} />

      {/* Transactions & Ledgers */}
      <Route path="/transactions" component={Transactions} />
      <Route path="/transactions/:id" component={TransactionDetail} />

      {/* Offerings */}
      {/* Weekly offering count */}
      <Route path="/counting" component={Counting} />
      <Route path="/counting/:id" component={CountingDetail} />

      <Route path="/offerings" component={Offerings} />
      <Route path="/offerings/new" component={NewOffering} />

      {/* Expenses */}
      <Route path="/expenses" component={Expenses} />
      <Route path="/expenses/new" component={NewExpense} />

      {/* Funds & Accounts */}
      <Route path="/funds" component={Funds} />
      <Route path="/funds/:id" component={FundDetail} />

      {/* Budgets */}
      <Route path="/budgets" component={Budgets} />
      <Route path="/budgets/:id" component={BudgetDetail} />

      {/* Ministries & Team */}
      <Route path="/ministries" component={Ministries} />
      <Route path="/ministries/:id" component={MinistryDetail} />

      {/* Members Directory */}
      <Route path="/members" component={Members} />
      <Route path="/members/:id" component={MemberDetail} />

      {/* Reports & Analytics */}
      <Route path="/reports" component={Reports} />

      {/* Approvals & Workflows */}
      <Route path="/approvals" component={Approvals} />

      {/* Notifications */}
      <Route path="/notifications" component={Notifications} />

      {/* Church & System Settings */}
      <Route path="/settings" component={Settings} />

      {/* User Profile */}
      <Route path="/profile" component={Profile} />

      {/* News & Updates */}
      <Route path="/updates" component={Updates} />

      {/* Dev UI showcase (incl. adapted ObsidianUI components) — dev builds
          only; statically stripped from production bundles. */}
      {import.meta.env.DEV && (
        <Route path="/ui-showcase" component={ComponentShowcase} />
      )}

      {/* 404 Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <SetupGate />
          <Suspense fallback={<RouteLoading />}>
            <AuthGate>
              <Router />
            </AuthGate>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
