import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update Firebase Auth profile (displayName)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // Store additional user details in Firestore
      // This aligns with your shared/schema.ts User interface
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        // profileImageUrl: null, // Or set a default if you have one
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode fazer login.",
      });
      navigate("/login"); // Redirect to login after registration
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage = "Falha ao registrar. Por favor, tente novamente.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "Este endereço de email já está em uso.";
      } else if (err.code === "auth/weak-password") {
        errorMessage =
          "A senha é muito fraca. Por favor, escolha uma senha mais forte.";
      } else if (err.message) {
        // Firebase errors can be in English, let's keep them if specific, or use a generic one.
        // For now, using the specific Firebase message if available, but ideally, map common codes to PT-BR.
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Falha no Cadastro",
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
            Crie sua conta FinancaFacil
          </h1>
          <p className="mt-2 text-muted-foreground">
            Preencha os detalhes abaixo para começar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={6} // Basic password strength
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </div>
          <div className="text-sm text-center">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <a
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Entrar
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
