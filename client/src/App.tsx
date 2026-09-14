import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { hasSkippedSetup } from "@/lib/setupSkip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChurchSetup from "./pages/ChurchSetup";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import Offerings from "./pages/Offerings";
import NewOffering from "./pages/NewOffering";
import Expenses from "./pages/Expenses";
import NewExpense from "./pages/NewExpense";
import Funds from "./pages/Funds";
import FundDetail from "./pages/FundDetail";
import Budgets from "./pages/Budgets";
import BudgetDetail from "./pages/BudgetDetail";
import Ministries from "./pages/Ministries";
import MinistryDetail from "./pages/MinistryDetail";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import Reports from "./pages/Reports";
import Approvals from "./pages/Approvals";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Updates from "./pages/Updates";

const SETUP_EXEMPT_PATHS = ["/setup", "/login", "/register", "/404"];

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

      {/* News & Updates */}
      <Route path="/updates" component={Updates} />

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
