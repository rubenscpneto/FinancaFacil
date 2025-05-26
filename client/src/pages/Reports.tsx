import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  PieChart,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get date range based on selected period
  const getDateRange = () => {
    const year = parseInt(selectedYear);
    switch (selectedPeriod) {
      case "current-month":
        return {
          startDate: `${year}-${currentMonth.toString().padStart(2, '0')}-01`,
          endDate: `${year}-${currentMonth.toString().padStart(2, '0')}-31`
        };
      case "last-3-months":
        const threeMonthsAgo = new Date(year, currentMonth - 4, 1);
        return {
          startDate: `${threeMonthsAgo.getFullYear()}-${(threeMonthsAgo.getMonth() + 1).toString().padStart(2, '0')}-01`,
          endDate: `${year}-${currentMonth.toString().padStart(2, '0')}-31`
        };
      case "current-year":
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        };
      default:
        return {
          startDate: `${year}-${currentMonth.toString().padStart(2, '0')}-01`,
          endDate: `${year}-${currentMonth.toString().padStart(2, '0')}-31`
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  const { data: monthlyBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/analytics/monthly-balance", { year: currentYear, month: currentMonth }],
  });

  const { data: categoryTotals, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/analytics/category-totals", { startDate, endDate }],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions/range", { startDate, endDate }],
  });

  // Process data for charts
  const expensesByCategory = categoryTotals?.filter(cat => cat.type === 'expense') || [];
  const incomeByCategory = categoryTotals?.filter(cat => cat.type === 'income') || [];

  // Doughnut chart data for expenses
  const expenseChartData = {
    labels: expensesByCategory.map(cat => cat.categoryName),
    datasets: [
      {
        data: expensesByCategory.map(cat => parseFloat(cat.total)),
        backgroundColor: [
          '#FF9500', // Orange - Alimentação
          '#FF3B30', // Red - Casa
          '#007AFF', // Blue - Transporte
          '#8A05BE', // Purple - Entretenimento
          '#34C759', // Green - Saúde
          '#8E8E93', // Gray - Outros
        ],
        borderWidth: 0,
      },
    ],
  };

  const expenseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': ' + formatCurrency(context.parsed);
          },
        },
      },
    },
  };

  // Monthly trend data (mock for demonstration)
  const monthlyTrendData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [
      {
        label: 'Receitas',
        data: [5200, 5200, 5200, 5400, 5200, 5600, 5200, 5200, 5200, 5200, 5200, 5200],
        borderColor: '#34C759',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Gastos',
        data: [3950, 4200, 3800, 4100, 3950, 4300, 3950, 3950, 3950, 3950, 3950, 3950],
        borderColor: '#FF3B30',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const monthlyTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            family: 'Inter',
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  const isLoading = balanceLoading || categoryLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">
              Análise detalhada das suas finanças
            </p>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Este mês</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="current-year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="fintech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Receitas Totais</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(
                    incomeByCategory.reduce((total, cat) => total + parseFloat(cat.total), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPeriod === 'current-month' ? 'Este mês' : 
                   selectedPeriod === 'last-3-months' ? 'Últimos 3 meses' : 'Este ano'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="fintech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Gastos Totais</h3>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(
                    expensesByCategory.reduce((total, cat) => total + parseFloat(cat.total), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPeriod === 'current-month' ? 'Este mês' : 
                   selectedPeriod === 'last-3-months' ? 'Últimos 3 meses' : 'Este ano'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="fintech-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Saldo Líquido</h3>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(
                    incomeByCategory.reduce((total, cat) => total + parseFloat(cat.total), 0) -
                    expensesByCategory.reduce((total, cat) => total + parseFloat(cat.total), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Receitas - Gastos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Expense Breakdown */}
          <Card className="fintech-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Gastos por Categoria
                </CardTitle>
                <Badge variant="secondary">
                  {expensesByCategory.length} categorias
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="h-64">
                  <Doughnut data={expenseChartData} options={expenseChartOptions} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum gasto encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card className="fintech-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Tendência Mensal
                </CardTitle>
                <Badge variant="secondary">
                  {selectedYear}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line data={monthlyTrendData} options={monthlyTrendOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Table */}
        <Card className="fintech-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTotals && categoryTotals.length > 0 ? (
              <div className="space-y-4">
                {/* Expenses */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
                    Gastos
                  </h4>
                  <div className="space-y-2">
                    {expensesByCategory.map((category, index) => (
                      <div key={`expense-${index}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <span className="font-medium">{category.categoryName}</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(parseFloat(category.total))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income */}
                {incomeByCategory.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      Receitas
                    </h4>
                    <div className="space-y-2">
                      {incomeByCategory.map((category, index) => (
                        <div key={`income-${index}`} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                          <span className="font-medium">{category.categoryName}</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(parseFloat(category.total))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                <p className="text-muted-foreground">
                  Não há transações para o período selecionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
