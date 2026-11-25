import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO';
import { estagioDiagnosticoLabels } from '@/3.Arquitetura/Front-end/model/Diagnostico';

type DiagnosticoResultado = NonNullable<DiagnosticoResponseDTO['data']>;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!);
}

function renderListSection(title: string, items: string[]): string {
  if (items.length === 0) return '';
  const listItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  return `<section><h2>${escapeHtml(title)}</h2><ul>${listItems}</ul></section>`;
}

function renderImage(imageDataUrl: string | null): string {
  const validImage = imageDataUrl && /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(imageDataUrl);
  if (!validImage) return '';
  return `<img src="${imageDataUrl}" alt="Imagem usada nesta análise">`;
}

export function buildDiagnosticoHtml(
  data: DiagnosticoResultado,
  imageDataUrl: string | null,
  locationLabel: string | null
): string {
  const stageLabel = estagioDiagnosticoLabels[data.diagnosticoBack] ?? data.diagnosticoBack;
  const locationSection = locationLabel
    ? `<section><h2>Localização</h2><p>${escapeHtml(locationLabel)}</p></section>`
    : '';
  const habitatSection = data.habitat
    ? `<section><h2>Habitat natural</h2><p>${escapeHtml(data.habitat)}</p></section>`
    : '';
  const lifeCycleSection = data.cicloDeVida
    ? `<section>
        <h2>Ciclo de vida</h2>
        <p>${escapeHtml(data.cicloDeVida)}</p>
        ${data.proximoEstagio ? `<p><strong>Próximo estágio:</strong> ${escapeHtml(data.proximoEstagio)}</p>` : ''}
      </section>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Análise Wormif — ${escapeHtml(data.especie)}</title>
    <style>
      body { max-width: 900px; margin: 32px auto; padding: 0 20px; color: #17231d; font: 16px/1.6 system-ui, sans-serif; }
      section { margin: 18px 0; padding: 24px; border: 1px solid #dce7df; border-radius: 16px; }
      img { display: block; max-width: 100%; max-height: 520px; object-fit: contain; margin: 0 auto 20px; }
      h1 { font-size: 2rem; }
      small { color: #607166; }
      .confidence { color: #168447; font-weight: 700; }
      @media print { section { break-inside: avoid; } }
    </style>
  </head>
  <body>
    <main>
      <section>
        ${renderImage(imageDataUrl)}
        <small>ESPÉCIE IDENTIFICADA · ${escapeHtml(stageLabel)}</small>
        <h1><i>${escapeHtml(data.especie)}</i></h1>
        <p>${escapeHtml(data.nomeComum)}</p>
        <p class="confidence">Nível de confiança: ${Math.round(data.nivelConfianca * 100)}%</p>
      </section>
      <section><h2>Descrição</h2><p>${escapeHtml(data.descricao)}</p></section>
      ${renderListSection('Características identificadas', data.caracteristicas)}
      ${habitatSection}
      ${lifeCycleSection}
      ${locationSection}
      <small>Relatório Wormif · ${new Date().toLocaleString('pt-BR')}</small>
    </main>
  </body>
</html>`;
}
