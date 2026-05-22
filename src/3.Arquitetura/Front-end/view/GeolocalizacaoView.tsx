import { Link } from 'react-router';
import { MapPin, Navigation, History, ExternalLink, Globe2, Satellite, Route } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageStatsRow } from '@Front-end/components/layout/PageStatsRow';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { useApp } from '@Front-end/context/AppContext';
import { Card } from '@Front-end/components/ui/card';
import { Label } from '@Front-end/components/ui/label';
import { Switch } from '@Front-end/components/ui/switch';
import { Button } from '@Front-end/components/ui/button';
import { estagioVidaLabels } from '@Front-end/model/Diagnostico';

export default function GeolocalizacaoView() {
  const { settings, updateSettings, history, resolveMockLocation, showToast } = useApp();

  const located = history.filter((h) => h.localizacao);
  const mockCurrent = resolveMockLocation();

  const handleCaptureMock = () => {
    if (!settings.geolocationEnabled) {
      showToast('info', 'Ative a geolocalização para registrar posição.');
      return;
    }
    showToast('success', `Posição atual: ${mockCurrent?.label ?? 'indisponível'}`);
  };

  const handleOpenMap = () => {
    if (!mockCurrent) {
      showToast('info', 'Capture a posição antes de abrir o mapa.');
      return;
    }
    const url = `https://www.google.com/maps?q=${mockCurrent.lat},${mockCurrent.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('info', 'Mapa aberto em nova aba (simulação).');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Geolocalização em campo"
        description="Registro automático de onde cada análise foi realizada. Essencial para rastreabilidade em trabalhos de campo, mapas de infestação e relatórios técnicos."
      />

      <PageStatsRow
        items={[
          {
            icon: MapPin,
            label: 'Georreferenciadas',
            value: `${located.length} de ${history.length}`
          },
          {
            icon: Globe2,
            label: 'Status',
            value: settings.geolocationEnabled ? 'Ativa' : 'Desativada'
          },
          {
            icon: Satellite,
            label: 'Precisão',
            value: 'Simulada (~10 m)'
          },
          {
            icon: Route,
            label: 'Última coleta',
            value: located[0]
              ? new Date(located[0].createdAt).toLocaleDateString('pt-BR')
              : 'Nenhuma'
          }
        ]}
      />

      <Card className="p-6 border-border/80 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
            <div>
              <Label htmlFor="geo-main" className="text-base font-semibold">
                Registrar localização nas análises
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Quando ativo, cada identificação guarda coordenadas e cidade (simulado no protótipo).
              </p>
            </div>
          </div>
          <Switch
            id="geo-main"
            checked={settings.geolocationEnabled}
            onCheckedChange={(checked) => updateSettings({ geolocationEnabled: checked })}
            aria-label="Ativar geolocalização"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={handleCaptureMock}
          >
            <Navigation className="w-4 h-4 mr-2" aria-hidden />
            Capturar posição atual (mock)
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={handleOpenMap}
            disabled={!settings.geolocationEnabled}
          >
            <ExternalLink className="w-4 h-4 mr-2" aria-hidden />
            Abrir no mapa
          </Button>
        </div>

        {mockCurrent && settings.geolocationEnabled && (
          <p className="text-sm text-primary mt-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" aria-hidden />
            Última posição simulada: {mockCurrent.label} ({mockCurrent.lat.toFixed(4)},{' '}
            {mockCurrent.lng.toFixed(4)})
          </p>
        )}
      </Card>

      <Card className="p-6 border-border/80">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" aria-hidden />
          <h2 className="font-semibold">Análises com localização</h2>
        </div>

        {located.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise georreferenciada ainda. Ative a opção acima e faça uma nova identificação.
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {located.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border/60 last:border-0"
              >
                <div>
                  <p className="font-medium italic">{item.especie}</p>
                  <p className="text-sm text-muted-foreground">
                    {estagioVidaLabels[item.estagioVida]} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="text-sm text-primary inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                  {item.localizacao?.label}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="link" className="mt-4 px-0">
          <Link to="/historico">Ver histórico completo</Link>
        </Button>
      </Card>

      <PageInfoGrid
        className="mt-8"
        title="Por que georreferenciar?"
        subtitle="No produto final, o GPS do dispositivo alimentará mapas e alertas por região."
        items={[
          {
            icon: Route,
            title: 'Rastreio de pragas',
            description: 'Associe cada identificação ao talhão ou ponto de coleta para monitorar surtos.'
          },
          {
            icon: Satellite,
            title: 'Dados em tempo real',
            description: 'Coordenadas ajudam equipes a retornar ao mesmo local em visitas futuras.'
          },
          {
            icon: Globe2,
            title: 'Relatórios',
            description: 'Exportações futuras poderão incluir mapa e lista de ocorrências por área.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
