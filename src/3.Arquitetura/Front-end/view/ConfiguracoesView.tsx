import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ChevronRight, KeyRound, MapPin, Moon, Monitor, Sun } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { Card } from '@Front-end/components/ui/card';
import { useApp, type ThemePreference } from '@Front-end/context/AppContext';
import { Label } from '@Front-end/components/ui/label';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor }
];

export default function ConfiguracoesView() {
  const { settings, updateSettings, changePassword, showToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword, confirmation);
      if (!result.ok) {
        showToast('error', result.error ?? 'Não foi possível alterar a senha.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        description="Personalize a aparência, a geolocalização e a segurança da sua conta."
      />

      <div className="space-y-6">
        <Card className="p-6 border-border/80">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-primary" aria-hidden />
            <h2 className="font-semibold">Tema</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ theme: value })}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 min-h-[5.5rem] transition-colors ${
                  settings.theme === value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50'
                }`}
                aria-pressed={settings.theme === value}
              >
                <Icon className="w-6 h-6" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden />
              <div>
                <h2 className="font-semibold">Geolocalização</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {settings.geolocationEnabled ? 'Ativada' : 'Desativada'} · Configure e registre a localização das análises.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="min-h-11 shrink-0">
              <Link to="/geolocalizacao">
                Abrir
                <ChevronRight className="w-4 h-4 ml-1" aria-hidden />
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-border/80">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-primary" aria-hidden />
            <h2 className="font-semibold">Alterar senha</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Informe sua senha atual e confirme a nova senha para atualizar sua conta.
          </p>
          <form onSubmit={(event) => void handlePasswordSubmit(event)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="settings-current-password">Senha atual</Label>
              <Input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                disabled={savingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-new-password">Nova senha</Label>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                disabled={savingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-confirm-password">Confirmar nova senha</Label>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                disabled={savingPassword}
              />
            </div>
            <Button type="submit" className="min-h-11" disabled={savingPassword}>
              {savingPassword ? 'Salvando...' : 'Atualizar senha'}
            </Button>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
