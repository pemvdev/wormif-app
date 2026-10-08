import { PalpitesList } from './PalpitesList';

export function PalpitesRecebidos({ id }: { id: number }) {
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="text-base font-semibold mb-4">Palpites recebidos</h2>
    <PalpitesList key={id} analiseId={id} />
  </section>;
}
