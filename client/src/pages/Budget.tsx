import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import BudgetForm from "@/components/BudgetForm";
import type { BudgetWithCategory } from "@shared/schema";

export default function Budget() {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);

  const { data: budgets, isLoading } = useQuery<BudgetWithCategory[]>({
    queryKey: ["/api/budgets"],
  });

  const getBudgetStatus = (spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 100) return { status: 'over', color: 'red', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'orange', icon: AlertTriangle };
    return { status: 'good', color: 'green', icon: CheckCircle };
  };

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (showForm) {
    return (
      <BudgetForm
        budget={editingBudget}
        onClose={() => {
          setShowForm(false);
          setEditingBudget(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Orçamento</h1>
            <p className="text-muted-foreground">
              Gerencie seus limites de gastos por categoria
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="btn-primary mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Budget Overview */}
        {budgets && budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Total Orçado</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    budgets.reduce((total, budget) => total + parseFloat(budget.amount), 0)
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium">Dentro do Limite</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {budgets.filter(budget => {
                    const spent = Math.random() * parseFloat(budget.amount); // Mock data
                    return (spent / parseFloat(budget.amount)) < 0.8;
                  }).length}
                </p>
              </CardContent>
            </Card>

            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-medium">Próximo do Limite</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {budgets.filter(budget => {
                    const spent = Math.random() * parseFloat(budget.amount); // Mock data
                    const percentage = (spent / parseFloat(budget.amount)) * 100;
                    return percentage >= 80 && percentage < 100;
                  }).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Cards */}
        {budgets && budgets.length === 0 ? (
          <Card className="fintech-card">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum orçamento criado</h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando orçamentos para suas categorias de gastos
                </p>
                <Button onClick={() => setShowForm(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets?.map((budget) => {
              // Mock spent amount - in real app this would come from transactions
              const spent = Math.random() * parseFloat(budget.amount);
              const percentage = (spent / parseFloat(budget.amount)) * 100;
              const { status, color, icon: StatusIcon } = getBudgetStatus(spent, parseFloat(budget.amount));
              
              return (
                <Card 
                  key={budget.id} 
                  className="fintech-card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEdit(budget)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {budget.category?.name || budget.name}
                      </CardTitle>
                      <Badge 
                        variant={status === 'good' ? 'default' : 'destructive'}
                        className={`
                          ${status === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}
                          ${status === 'warning' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' : ''}
                          ${status === 'over' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : ''}
                        `}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gasto</span>
                        <span className="font-medium">
                          {formatCurrency(spent)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Orçado</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(budget.amount))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Restante: {formatCurrency(Math.max(0, parseFloat(budget.amount) - spent))}</span>
                        <span className="capitalize">{budget.period}</span>
                      </div>
                    </div>

                    {percentage >= 80 && (
                      <div className={`text-xs p-2 rounded-md ${
                        percentage >= 100 
                          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' 
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                      }`}>
                        {percentage >= 100 
                          ? '⚠️ Orçamento excedido!' 
                          : '⚠️ Próximo do limite!'
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
