import { createMemo, For } from 'solid-js';

const GUIDES = [
  {
    bits: 50,
    label: '50\u00a0bit',
    description: '試行制限などの追加対策がある認証の最低値。',
    source: 'CNIL（2024）',
    url: 'https://www.cnil.fr/fr/securite-authentifier-les-utilisateurs',
  },
  {
    bits: 80,
    label: '80\u00a0bit',
    description: '上記の追加対策がない認証の最低値。',
    source: 'CNIL（2024）',
    url: 'https://www.cnil.fr/fr/securite-authentifier-les-utilisateurs',
  },
  {
    bits: 100,
    label: '100\u00a0bit以上',
    description: '機微性が高い〜非常に高い用途の目安。多要素認証も推奨。',
    source: 'ANSSI（2021）',
    url: 'https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-authentification_multifacteur_et_mots_de_passe.pdf#page=30',
  },
] as const;

export function EntropyGuide(props: { bits: number; ready: boolean }) {
  return (
    <section class="entropy-guide" aria-labelledby="entropy-guide-title">
      <h3 id="entropy-guide-title">エントロピーの目安</h3>
      <dl>
        <For each={GUIDES}>
          {(guide) => {
            const met = createMemo(() => props.ready && props.bits >= guide.bits);
            return (
              <div classList={{ 'threshold-met': met(), 'threshold-unmet': props.ready && !met() }}>
                <dt>
                  <span>{guide.label}</span>
                </dt>
                <dd>
                  {guide.description}
                  <a href={guide.url} target="_blank" rel="noopener noreferrer">
                    {guide.source}
                  </a>
                </dd>
              </div>
            );
          }}
        </For>
      </dl>
    </section>
  );
}
