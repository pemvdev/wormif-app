import { useState, type FormEvent } from 'react';
import { Save, User, Lock, Mail, Shield } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { useApp } from '@Front-end/context/AppContext';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@Front-end/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@Front-end/components/ui/field';
import { Avatar, AvatarFallback } from '@Front-end/components/ui/avatar';

export default function PerfilView() {
  const { user, updateProfile, changePassword, history, activePlanId } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    const result = changePassword(newPassword, confirmPassword);
    if (result.ok) {
      setPasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error ?? 'Não foi possível alterar a senha.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Meu perfil"
        description="Visualize e edite suas informações pessoais. Mantemos poucos campos para facilitar o uso em campo, com segurança e histórico vinculados à sua conta."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Análises salvas', value: String(history.length) },
          { label: 'Plano atual', value: activePlanId === 'pro' ? 'Campo Pro' : activePlanId === 'enterprise' ? 'Equipes' : 'Essencial' },
          { label: 'Conta', value: 'Ativa (mock)' }
        ].map((stat) => (
          <Card key={stat.label} className="p-4 border-border/80">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className="text-lg font-semibold mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 md:p-8 border-border/80">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg bg-primary/15 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FieldDescription>Usado para login e notificações.</FieldDescription>
            </Field>

            <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Salvar alterações
            </Button>
          </FieldGroup>
        </form>
      </Card>

      <Card className="p-6 mt-6 border-border/80">
        <h2 className="text-lg font-semibold mb-2">Segurança</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Troque sua senha periodicamente para manter a conta protegida.
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => setPasswordOpen(true)}
        >
          <Lock className="w-4 h-4 mr-2" />
          Alterar senha
        </Button>
      </Card>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha com pelo menos 6 caracteres (simulação local).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirmar senha</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>
              {passwordError && <FieldError>{passwordError}</FieldError>}
            </FieldGroup>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PageInfoGrid
        className="mt-8"
        title="Sua conta no Wormif"
        items={[
          {
            icon: Mail,
            title: 'E-mail de acesso',
            description: 'Usado para login e, no futuro, recuperação de senha e alertas de análise concluída.'
          },
          {
            icon: Shield,
            title: 'Senha',
            description: 'Altere periodicamente. Neste protótipo a troca é apenas simulada no navegador.'
          },
          {
            icon: User,
            title: 'Nome exibido',
            description: 'Aparece no menu lateral e em relatórios exportados.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
