import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; // Assuming this exports Firebase auth instance
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login realizado com sucesso!" });
      navigate("/"); // Redirect to dashboard or home after login
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage =
        "Falha ao fazer login. Por favor, verifique suas credenciais.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        errorMessage = "Email ou senha inválidos.";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
      } else if (err.message) {
        // Keep Firebase specific messages if no direct translation is simple
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Falha no Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Acesse sua conta FinancaFacil
          </h1>
          <p className="mt-2 text-muted-foreground">
            Digite suas credenciais para acessar sua conta.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Endereço de e-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
          <div className="text-sm text-center">
            <p className="text-muted-foreground">
              Não tem uma conta?{" "}
              <a
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Cadastre-se
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
