import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@Front-end/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@Front-end/components/ui/dialog';
import { useApp } from '@Front-end/context/AppContext';

export default function LoginView() {
  const { login, requestPasswordReset } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/upload';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate(redirectTo);
    } else {
      setError(result.error ?? 'Não foi possível entrar.');
    }
  };

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    requestPasswordReset(resetEmail.trim() || email.trim());
    setResetOpen(false);
    setResetEmail('');
  };

  return (
    <>
      <Card className="p-8 border-border/80 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Entrar no Wormif</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Acesse suas análises e histórico em campo
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <button
                  type="button"
                  className="text-sm text-primary font-medium hover:underline"
                  onClick={() => {
                    setResetEmail(email);
                    setResetOpen(true);
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <FieldDescription>Mínimo de 6 caracteres (protótipo mockado).</FieldDescription>
            </Field>

            {error && <FieldError>{error}</FieldError>}

            <Button type="submit" size="lg" className="w-full min-h-12" disabled={loading}>
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </FieldGroup>
        </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="text-primary font-medium hover:underline">
          Criar cadastro
        </Link>
      </p>

      <ul className="mt-8 pt-6 border-t border-border/80 space-y-2 text-xs text-muted-foreground lg:hidden">
        <li>· Upload e identificação por IA em 3 etapas</li>
        <li>· Histórico e geolocalização simulados no navegador</li>
        <li>· Qualquer e-mail válido e senha com 6+ caracteres</li>
      </ul>
    </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Informe seu e-mail. Enviaremos um link de recuperação (simulação local).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit}>
            <Field>
              <FieldLabel htmlFor="reset-email">E-mail</FieldLabel>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </Field>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Enviar link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
