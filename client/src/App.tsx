import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Budget from "@/pages/Budget";
import Goals from "@/pages/Goals";
import Reports from "@/pages/Reports";
import RegisterPage from "@/pages/Register";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to="/" /> : <RegisterPage />}
      </Route>

      {isAuthenticated ? (
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transacoes" component={Transactions} />
            <Route path="/orcamento" component={Budget} />
            <Route path="/metas" component={Goals} />
            <Route path="/relatorios" component={Reports} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route>
            <Redirect to="/" />
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
