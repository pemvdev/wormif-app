import { useState, type FormEvent } from 'react';
import { Save, User, Lock, Mail, Shield, Trash2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@Front-end/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@Front-end/components/ui/radio-group';
import { Switch } from '@Front-end/components/ui/switch';
import type { IntuitoUsoAplicacao } from '@Front-end/dto/AuthDTO';
import { readProfilePhoto } from '@Front-end/utils/profilePhoto';

export default function PerfilView() {
  const { user, updateProfile, changePassword, history, activePlanId } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profissao, setProfissao] = useState(user?.profissao ?? '');
  const [linkedin, setLinkedin] = useState(user?.linkedin ?? '');
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState(user?.fotoPerfilUrl ?? '');
  const [intuitoUso, setIntuitoUso] = useState<IntuitoUsoAplicacao>(user?.intuitoUso ?? 'CURIOSIDADE');
  const [permiteAnalisePorTerceiros, setPermiteAnalisePorTerceiros] = useState(user?.permiteAnalisePorTerceiros ?? false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoInputKey, setPhotoInputKey] = useState(0);
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

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setProfileError(null);
    setPhotoLoading(true);
    try {
      setFotoPerfilUrl(await readProfilePhoto(file));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Não foi possível carregar a foto.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || photoLoading) return;
    setProfileError(null);
    setSaving(true);
    try {
      const result = await updateProfile({
        name: name.trim(), email: email.trim().toLowerCase(), profissao: profissao.trim(),
        linkedin: linkedin.trim(), fotoPerfilUrl: fotoPerfilUrl || null,
        intuitoUso, permiteAnalisePorTerceiros
      });
      if (!result.ok) setProfileError(result.error ?? 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
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
          <Avatar key={fotoPerfilUrl ? 'photo' : 'initials'} className="h-16 w-16 shrink-0">
            {fotoPerfilUrl && <AvatarImage src={fotoPerfilUrl} alt="Foto de perfil" />}
            <AvatarFallback className="text-lg bg-primary/15 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 break-words">
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground break-all">{user?.email}</p>
            {user?.profissao && (
              <p className="text-sm text-muted-foreground">{user.profissao}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <fieldset disabled={saving || photoLoading} className="min-w-0 space-y-6">
              <Field>
                <FieldLabel htmlFor="edit-profile-photo">Foto de perfil (opcional)</FieldLabel>
                <Input key={photoInputKey} id="edit-profile-photo" type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void handlePhotoChange(event.target.files?.[0])} />
                <FieldDescription>PNG, JPG ou WebP até 240 KB.</FieldDescription>
                {fotoPerfilUrl && (
                  <Button type="button" variant="outline" className="w-fit" onClick={() => {
                    setFotoPerfilUrl('');
                    setPhotoInputKey((key) => key + 1);
                  }}>
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden />Remover foto
                  </Button>
                )}
              </Field>
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

              <Field>
                <FieldLabel htmlFor="edit-profissao">{intuitoUso === 'CURIOSIDADE' ? 'Profissão (opcional)' : 'Profissão'}</FieldLabel>
                <Input id="edit-profissao" value={profissao} onChange={(event) => setProfissao(event.target.value)} required={intuitoUso === 'ANALISAR_OUTRAS_PESSOAS'} />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-linkedin">{intuitoUso === 'CURIOSIDADE' ? 'LinkedIn (opcional)' : 'LinkedIn'}</FieldLabel>
                <Input id="edit-linkedin" type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} required={intuitoUso === 'ANALISAR_OUTRAS_PESSOAS'} />
              </Field>
              <Field>
                <FieldLabel id="edit-intuito-label">Intuito de uso</FieldLabel>
                <RadioGroup value={intuitoUso} aria-labelledby="edit-intuito-label" onValueChange={(value) => {
                  if (value === 'CURIOSIDADE' || value === 'ANALISAR_OUTRAS_PESSOAS') setIntuitoUso(value);
                }}>
                  <label className="flex items-center gap-3 text-sm">
                    <RadioGroupItem value="ANALISAR_OUTRAS_PESSOAS" />Ajudar a analisar resultados de outras pessoas
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <RadioGroupItem value="CURIOSIDADE" />Usar a aplicação por curiosidade
                  </label>
                </RadioGroup>
              </Field>
              <Field>
                <div className="flex items-center justify-between gap-4">
                  <FieldLabel htmlFor="edit-peer-review">Permitir que outras pessoas revisem minhas análises</FieldLabel>
                  <Switch id="edit-peer-review" checked={permiteAnalisePorTerceiros} onCheckedChange={setPermiteAnalisePorTerceiros} />
                </div>
              </Field>
            </fieldset>
            {profileError && <FieldError role="alert">{profileError}</FieldError>}
            <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto" disabled={saving || photoLoading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : photoLoading ? 'Carregando foto...' : 'Salvar alterações'}
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
