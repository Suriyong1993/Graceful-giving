import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
