import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Lock } from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@Front-end/components/ui/field';
import { useApp } from '@Front-end/context/AppContext';

export default function RedefinirSenhaView() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useApp();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) { setError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmation) { setError('A confirmação não corresponde à nova senha.'); return; }
    setLoading(true);
    const result = await resetPassword(token, password, confirmation);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'O link é inválido ou expirou.'); return; }
    setDone(true);
  };

  return (
    <Card className="w-full max-w-md mx-auto p-8 border-border/80 shadow-lg">
      <div className="text-center mb-8">
        <Lock className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold">Criar nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha para acessar o Wormif.</p>
      </div>
      {done ? (
        <div className="space-y-4 text-center">
          <p role="status" className="text-sm text-primary">Senha redefinida com sucesso. Entre com sua nova senha.</p>
          <Button asChild className="w-full min-h-12"><Link to="/login">Ir para o login</Link></Button>
        </div>
      ) : !token ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-destructive">Link inválido. Solicite uma nova recuperação de senha.</p>
          <Button asChild variant="outline" className="w-full"><Link to="/login">Voltar ao login</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
              <Input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirmar nova senha</FieldLabel>
              <Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full min-h-12" disabled={loading}>{loading ? 'Salvando...' : 'Redefinir senha'}</Button>
          </FieldGroup>
        </form>
      )}
    </Card>
  );
}
