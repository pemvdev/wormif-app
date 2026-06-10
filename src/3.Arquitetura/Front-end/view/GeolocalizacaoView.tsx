import { useState } from 'react';
import { Link } from 'react-router';
import {
  MapPin,
  Navigation,
  History,
  ExternalLink,
  Globe2,
  Satellite,
  Route,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageStatsRow } from '@Front-end/components/layout/PageStatsRow';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { useApp } from '@Front-end/context/AppContext';
import { Card } from '@Front-end/components/ui/card';
import { Label } from '@Front-end/components/ui/label';
import { Switch } from '@Front-end/components/ui/switch';
import { Button } from '@Front-end/components/ui/button';
import { diagnosticoFrontLabels } from '@/3.Arquitetura/Front-end/model/Diagnostico';
import type { AnalysisHistoryItem } from '@Front-end/context/AppContext';
import { geolocationErrorMessage } from '@Front-end/utils/geolocation';

export default function GeolocalizacaoView() {
  const { settings, updateSettings, history, captureCurrentLocation, showToast } = useApp();
  const [currentPosition, setCurrentPosition] = useState<AnalysisHistoryItem['localizacao'] | null>(
    null
  );
  const [capturing, setCapturing] = useState(false);

  const located = history.filter((h) => h.localizacao);

  const handleCapture = async () => {
    if (!settings.geolocationEnabled) {
      showToast('info', 'Ative a geolocalização para registrar posição.');
      return;
    }

    setCapturing(true);
    try {
      const position = await captureCurrentLocation();
      setCurrentPosition(position);
      showToast('success', `Posição capturada: ${position.label}`);
    } catch (error) {
      showToast('error', geolocationErrorMessage(error));
    } finally {
      setCapturing(false);
    }
  };

  const handleOpenMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('info', 'Mapa aberto em nova aba.');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Geolocalização em campo"
        description="Registro automático de onde cada análise foi realizada. O navegador pedirá permissão para acessar sua localização."
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
            value: 'GPS do dispositivo'
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
                Quando ativo, cada identificação guarda coordenadas e local aproximada obtidas pelo
                GPS do seu dispositivo.
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
            onClick={handleCapture}
            disabled={!settings.geolocationEnabled || capturing}
          >
            {capturing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
            ) : (
              <Navigation className="w-4 h-4 mr-2" aria-hidden />
            )}
            {capturing ? 'Obtendo localização...' : 'Capturar posição atual'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => currentPosition && handleOpenMap(currentPosition.lat, currentPosition.lng)}
            disabled={!settings.geolocationEnabled || !currentPosition}
          >
            <ExternalLink className="w-4 h-4 mr-2" aria-hidden />
            Abrir no mapa
          </Button>
        </div>

        {currentPosition && settings.geolocationEnabled && (
          <p className="text-sm text-primary mt-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" aria-hidden />
            Posição atual: {currentPosition.label} ({currentPosition.lat.toFixed(5)},{' '}
            {currentPosition.lng.toFixed(5)})
          </p>
        )}

        {settings.geolocationEnabled && (
          <p className="text-xs text-muted-foreground mt-3">
            Na primeira captura, o navegador solicitará permissão para acessar sua localização.
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
                    {diagnosticoFrontLabels[item.diagnosticoFront]} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-primary inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                    {item.localizacao?.label}
                  </p>
                  {item.localizacao && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Abrir mapa de ${item.especie}`}
                      onClick={() =>
                        handleOpenMap(item.localizacao!.lat, item.localizacao!.lng)
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
        subtitle="O GPS do dispositivo alimenta mapas e relatórios por região de coleta."
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
