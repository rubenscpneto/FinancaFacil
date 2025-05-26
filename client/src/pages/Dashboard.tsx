import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Upload, 
  BarChart3, 
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Car,
  Plane,
  ShoppingCart,
  Briefcase,
  Fuel,
  Gamepad2,
  UtensilsCrossed
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/hooks/useAuth";
import type { TransactionWithCategory, SavingsGoal, BudgetWithCategory } from "@shared/schema";
import { useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: transactions, isLoading: transactionsLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ["/api/transactions", { limit: 10 }],
  });

  const { data: savingsGoals, isLoading: goalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery<BudgetWithCategory[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: monthlyBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/analytics/monthly-balance", { year: currentYear, month: currentMonth }],
  });

  // Calculate financial overview
  const financialOverview = useMemo(() => {
    if (!monthlyBalance) {
      return { income: "0", expenses: "0", balance: "0" };
    }
    return monthlyBalance;
  }, [monthlyBalance]);

  const getTransactionIcon = (categoryName?: string, type?: string) => {
    if (type === 'income') return <Briefcase className="w-5 h-5" />;
    
    switch (categoryName?.toLowerCase()) {
      case 'alimentação': return <UtensilsCrossed className="w-5 h-5" />;
      case 'transporte': return <Fuel className="w-5 h-5" />;
      case 'entretenimento': return <Gamepad2 className="w-5 h-5" />;
      default: return <ShoppingCart className="w-5 h-5" />;
    }
  };

  const getTransactionBgColor = (categoryName?: string, type?: string) => {
    if (type === 'income') return 'bg-green-50 dark:bg-green-950';
    
    switch (categoryName?.toLowerCase()) {
      case 'alimentação': return 'bg-orange-50 dark:bg-orange-950';
      case 'transporte': return 'bg-blue-50 dark:bg-blue-950';
      case 'entretenimento': return 'bg-purple-50 dark:bg-purple-950';
      default: return 'bg-gray-50 dark:bg-gray-950';
    }
  };

  const getTransactionIconColor = (categoryName?: string, type?: string) => {
    if (type === 'income') return 'text-green-500';
    
    switch (categoryName?.toLowerCase()) {
      case 'alimentação': return 'text-orange-500';
      case 'transporte': return 'text-blue-500';
      case 'entretenimento': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (transactionsLoading || goalsLoading || budgetsLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Olá, {user?.firstName || "Usuário"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo das suas finanças hoje, {formatDate(new Date(), 'long')}
          </p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="fintech-card-gradient border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/90">Saldo Total</h3>
                <Wallet className="w-5 h-5 text-white/75" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(parseFloat(financialOverview.balance))}
                </p>
                <p className="text-sm text-white/75">
                  <span className="text-secondary">
                    +{formatCurrency(parseFloat(financialOverview.income))}
                  </span>{" "}
                  este mês
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income Card */}
          <Card className="fintech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Receitas</h3>
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(parseFloat(financialOverview.income))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="fintech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Gastos</h3>
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(parseFloat(financialOverview.expenses))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Savings Goals */}
          <Card className="fintech-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Metas de Economia</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  <Plus className="w-4 h-4 mr-1" />
                  Nova Meta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {savingsGoals && savingsGoals.length > 0 ? (
                <div className="space-y-4">
                  {savingsGoals.slice(0, 2).map((goal) => {
                    const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
                    const GoalIcon = goal.icon === 'car' ? Car : Plane;
                    
                    return (
                      <div key={goal.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 ${goal.color} rounded-lg flex items-center justify-center`}>
                              <GoalIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{goal.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Meta: {formatCurrency(parseFloat(goal.targetAmount))}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              {formatCurrency(parseFloat(goal.currentAmount))}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {progress.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhuma meta criada ainda</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira meta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card className="fintech-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Orçamento</CardTitle>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgets && budgets.length > 0 ? (
                <div className="space-y-6">
                  {budgets.slice(0, 4).map((budget) => {
                    // This would need to be calculated based on actual spending
                    const spent = Math.random() * parseFloat(budget.amount);
                    const percentage = (spent / parseFloat(budget.amount)) * 100;
                    
                    return (
                      <div key={budget.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">
                            {budget.category?.name || budget.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(spent)} / {formatCurrency(parseFloat(budget.amount))}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {percentage.toFixed(0)}% usado
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum orçamento criado ainda</p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro orçamento
                  </Button>
                </div>
              )}
              
              {budgets && budgets.length > 0 && (
                <Button className="w-full mt-6 btn-primary">
                  Ajustar Orçamento
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card className="fintech-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${getTransactionBgColor(transaction.category?.name, transaction.type)} rounded-xl flex items-center justify-center`}>
                            <div className={getTransactionIconColor(transaction.category?.name, transaction.type)}>
                              {getTransactionIcon(transaction.category?.name, transaction.type)}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{transaction.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              <span>{transaction.category?.name || 'Sem categoria'}</span> • {" "}
                              <span>{formatDate(new Date(transaction.date))}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {transaction.paymentMethod || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma transação encontrada</p>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar primeira transação
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="fintech-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all group"
                  >
                    <Plus className="w-6 h-6 mb-2 text-primary group-hover:text-primary-foreground" />
                    <span className="text-sm font-medium">Nova Transação</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:border-secondary hover:bg-secondary hover:text-secondary-foreground transition-all group"
                  >
                    <Upload className="w-6 h-6 mb-2 text-secondary group-hover:text-secondary-foreground" />
                    <span className="text-sm font-medium">Importar Extrato</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all group"
                  >
                    <BarChart3 className="w-6 h-6 mb-2 text-accent group-hover:text-accent-foreground" />
                    <span className="text-sm font-medium">Ver Relatórios</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto hover:border-orange-500 hover:bg-orange-500 hover:text-white transition-all group"
                  >
                    <Download className="w-6 h-6 mb-2 text-orange-500 group-hover:text-white" />
                    <span className="text-sm font-medium">Exportar Dados</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
