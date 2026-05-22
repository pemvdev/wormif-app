import { Link } from 'react-router';
import { Bell, Globe, MapPin, Moon, Sun, Monitor, ChevronRight, Palette, Smartphone } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { Card } from '@Front-end/components/ui/card';
import { useApp, type LanguagePreference, type ThemePreference } from '@Front-end/context/AppContext';
import { Label } from '@Front-end/components/ui/label';
import { Switch } from '@Front-end/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@Front-end/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@Front-end/components/ui/select';
import { Button } from '@Front-end/components/ui/button';

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor }
];

const languageOptions: { value: LanguagePreference; label: string }[] = [
  { value: 'pt', label: 'Português (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' }
];

export default function ConfiguracoesView() {
  const { settings, updateSettings } = useApp();

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        description="Altere tema, idioma e notificações. Preferências são salvas automaticamente no seu navegador. A geolocalização possui tela dedicada."
      />

      <Card className="p-5 mb-8 border-border/80 bg-card/80">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tema <strong className="text-foreground">{settings.theme === 'system' ? 'Sistema' : settings.theme === 'dark' ? 'Escuro' : 'Claro'}</strong>
          {' · '}
          Idioma <strong className="text-foreground">{settings.language.toUpperCase()}</strong>
          {' · '}
          Geo <strong className="text-foreground">{settings.geolocationEnabled ? 'Ligada' : 'Desligada'}</strong>
        </p>
      </Card>

      <Tabs defaultValue="aparencia" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="aparencia" className="min-h-10">
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="min-h-10">
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aparencia" className="mt-6 space-y-4">
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
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" aria-hidden />
              <Label htmlFor="language-select" className="font-semibold text-base">
                Idioma
              </Label>
            </div>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSettings({ language: v as LanguagePreference })}
            >
              <SelectTrigger id="language-select" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <Card className="p-6 border-border/80 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-primary" aria-hidden />
              <h2 className="font-semibold">Notificações</h2>
            </div>

            {[
              {
                id: 'email',
                label: 'E-mail',
                desc: 'Resumos e alertas importantes',
                checked: settings.notifications.email,
                key: 'email' as const
              },
              {
                id: 'analise',
                label: 'Análise concluída',
                desc: 'Aviso quando a IA terminar a identificação',
                checked: settings.notifications.analiseConcluida,
                key: 'analiseConcluida' as const
              },
              {
                id: 'promo',
                label: 'Novidades e planos',
                desc: 'Ofertas premium e atualizações',
                checked: settings.notifications.promocoes,
                key: 'promocoes' as const
              }
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-2 border-b border-border/60 last:border-0"
              >
                <div>
                  <Label htmlFor={item.id} className="text-base font-medium">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, [item.key]: checked }
                    })
                  }
                  aria-label={item.label}
                />
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 mt-6 border-border/80">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Geolocalização</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tela dedicada para registrar localização das análises em campo.
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

      <PageInfoGrid
        className="mt-8"
        title="Personalização"
        items={[
          {
            icon: Palette,
            title: 'Aparência',
            description: 'Escolha tema claro, escuro ou automático conforme o sistema do dispositivo.'
          },
          {
            icon: Smartphone,
            title: 'Uso em campo',
            description: 'Contraste alto e botões grandes facilitam o uso com luvas e sob sol forte.'
          },
          {
            icon: Bell,
            title: 'Alertas',
            description: 'Defina quais avisos deseja receber quando a IA concluir uma identificação.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
