import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartLine,
  Shield,
  Smartphone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="ml-2 text-xl font-bold text-primary">
                FinanceApp
              </span>
            </div>
            <Button
              onClick={handleLoginClick}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            Controle suas{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              finanças
            </span>{" "}
            com inteligência
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A plataforma completa para gerenciar suas receitas, gastos e metas
            financeiras. Simples, segura e feita para brasileiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleLoginClick}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3"
            >
              Começar Gratuitamente
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary"
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para suas finanças
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas e intuitivas para você ter controle total do
              seu dinheiro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Dashboard Inteligente</CardTitle>
                <CardDescription>
                  Visualize suas finanças em tempo real com gráficos e
                  relatórios detalhados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Metas e Objetivos</CardTitle>
                <CardDescription>
                  Defina e acompanhe suas metas de economia e investimento de
                  forma visual
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <ChartLine className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Controle de Orçamento</CardTitle>
                <CardDescription>
                  Gerencie seus gastos por categoria e receba alertas quando
                  necessário
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Totalmente Responsivo</CardTitle>
                <CardDescription>
                  Acesse suas finanças de qualquer dispositivo, a qualquer hora
                  e lugar
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>Segurança Total</CardTitle>
                <CardDescription>
                  Seus dados protegidos com criptografia de ponta e autenticação
                  segura
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <CardTitle>Feito para Brasileiros</CardTitle>
                <CardDescription>
                  Interface em português, moeda em Real e formatos de data
                  brasileiros
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-card border-0 shadow-xl">
            <CardContent className="p-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                Pronto para transformar suas finanças?
              </h2>
              <p className="text-xl mb-8 text-muted-foreground">
                Junte-se a milhares de brasileiros que já estão no controle do
                seu dinheiro
              </p>
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3"
              >
                Começar Agora - É Grátis
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <ChartLine className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="ml-2 text-lg font-bold text-primary">
              FinanceApp
            </span>
          </div>
          <p className="text-muted-foreground">
            © 2024 FinanceApp. Feito com ❤️ para brasileiros.
          </p>
        </div>
      </footer>
    </div>
  );
}
