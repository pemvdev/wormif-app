import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@Front-end/components/ui/field';
import { useApp } from '@Front-end/context/AppContext';

export default function CadastroView() {
  const { register } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/upload';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password });
    setLoading(false);

    if (result.ok) {
      navigate(redirectTo);
    } else {
      setError(result.error ?? 'Não foi possível cadastrar.');
    }
  };

  return (
    <Card className="p-8 border-border/80 shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Cadastre-se com nome, e-mail e senha para usar o Wormif
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nome completo</FieldLabel>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="name"
                autoComplete="name"
                required
                placeholder="Seu nome"
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </Field>

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
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm">Confirmar senha</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="pl-10"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <FieldDescription>Use pelo menos 6 caracteres.</FieldDescription>
          </Field>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" size="lg" className="w-full min-h-12" disabled={loading}>
            <UserPlus className="w-5 h-5 mr-2" />
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Fazer login
        </Link>
      </p>

      <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed lg:hidden">
        Ao cadastrar, você concorda com o uso educacional do protótipo. Seus dados ficam apenas neste
        dispositivo até integrarmos o backend.
      </p>
    </Card>
  );
}
