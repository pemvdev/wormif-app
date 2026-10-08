import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import type { AnaliseExternaDetalhesDTO } from '@Front-end/dto/AnaliseExternaDTO';
import { diagnosticoFrontLabels, type DiagnosticoFront } from '@Front-end/model/Diagnostico';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import { Field, FieldLabel, FieldError, FieldGroup } from '@Front-end/components/ui/field';
import { Input } from '@Front-end/components/ui/input';
import { Button } from '@Front-end/components/ui/button';
import { useApp } from '@Front-end/context/AppContext';

const service = new DiagnosticoService();

function isStage(value: string): value is DiagnosticoFront {
  return Object.prototype.hasOwnProperty.call(diagnosticoFrontLabels, value);
}

export function PalpiteForm({ data, onSaved }: { data: AnaliseExternaDetalhesDTO; onSaved: () => void }) {
  const { showToast } = useApp();
  const [especie, setEspecie] = useState(data.meuPalpite?.especie ?? data.especie);
  const [estagio, setEstagio] = useState(data.meuPalpite?.estagio ?? data.diagnosticoBack);
  const [comentario, setComentario] = useState(data.meuPalpite?.comentario ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError(null);
    if (!especie.trim()) { setError('Informe a espécie do seu palpite.'); return; }
    setSaving(true);
    try {
      await service.salvarPalpite(data.id, { especie: especie.trim(), estagio, comentario: comentario.trim() });
      showToast('success', 'Palpite salvo.');
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar seu palpite.');
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={handleSubmit}>
    <h2 className="text-base font-semibold mb-4">Seu palpite</h2>
    <FieldGroup>
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <Field><FieldLabel htmlFor="palpite-especie">Espécie</FieldLabel>
          <Input id="palpite-especie" value={especie} onChange={(event) => setEspecie(event.target.value)} required maxLength={200} />
        </Field>
        <Field><FieldLabel htmlFor="palpite-estagio">Estágio de vida</FieldLabel>
          <select id="palpite-estagio" value={estagio} onChange={(event) => {
            if (isStage(event.target.value)) setEstagio(event.target.value);
          }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {Object.entries(diagnosticoFrontLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field><FieldLabel htmlFor="palpite-comentario">Comentário (opcional)</FieldLabel>
          <textarea id="palpite-comentario" value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={2000} rows={4}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </Field>
      </fieldset>
      {error && <FieldError role="alert">{error}</FieldError>}
      <Button type="submit" disabled={saving} className="w-full sm:w-fit">
        <Save className="mr-2 h-4 w-4" aria-hidden />{saving ? 'Salvando...' : data.meuPalpite ? 'Atualizar palpite' : 'Salvar palpite'}
      </Button>
    </FieldGroup>
  </form>;
}
