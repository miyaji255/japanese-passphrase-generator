import { Show } from 'solid-js';
import { assetUrl } from '../asset-url.ts';
import { dictionaryKey } from '../dictionary-settings.ts';
import type { DictionaryOptions } from '../types.ts';

const REPOSITORY = 'https://github.com/miyaji255/japanese-passphrase-generator';

export function SourceFooter(props: { options: DictionaryOptions }) {
  return (
    <footer class="site-footer" aria-label="出典・ライセンス">
      <p>
        <a href={assetUrl(`/wordlists/words-${dictionaryKey(props.options)}.zip`)} download="">
          単語リストをダウンロード
        </a>{' '}
        ·{' '}
        <a href={REPOSITORY} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <Show when={import.meta.env.PUBLIC_COMMIT_SHA}>
          {' '}
          ·{' '}
          <a
            href={`${REPOSITORY}/tree/${import.meta.env.PUBLIC_COMMIT_SHA}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            この版のソース
          </a>
        </Show>
      </p>
      <p>
        日本語 —{' '}
        <a href="https://github.com/tsuchm/diceware-ja" target="_blank" rel="noopener noreferrer">
          diceware-ja
        </a>{' '}
        / JUMAN&nbsp;7.0 ©&nbsp;2012 Kyoto&nbsp;University（
        <a href={assetUrl('/licenses/JUMAN-BSD.txt')} target="_blank" rel="noopener noreferrer">
          BSD
        </a>
        ）
      </p>
      <p>
        日本語追加 —{' '}
        <a href="https://mmsrv.ninjal.ac.jp/brfvep/" target="_blank" rel="noopener noreferrer">
          国立国語研究所
        </a>{' '}
        /{' '}
        <a
          href="https://github.com/WorksApplications/SudachiDict"
          target="_blank"
          rel="noopener noreferrer"
        >
          SudachiDict
        </a>{' '}
        /{' '}
        <a
          href="https://www.edrdg.org/pub/Nihongo/enamdict_doc.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          JMnedict
        </a>
        （
        <a
          href={assetUrl('/licenses/ADDITIONS-NOTICE.txt')}
          target="_blank"
          rel="noopener noreferrer"
        >
          利用条件
        </a>
        ）
      </p>
      <p>
        英語 —{' '}
        <a
          href="https://www.newgeneralservicelist.com/new-general-service-list"
          target="_blank"
          rel="noopener noreferrer"
        >
          NGSL&nbsp;1.2
        </a>{' '}
        / Browne,&nbsp;C., Culligan,&nbsp;B., and Phillips,&nbsp;J.（
        <a href={assetUrl('/licenses/CC-BY-SA-4.0.txt')} target="_blank" rel="noopener noreferrer">
          CC&nbsp;BY-SA&nbsp;4.0
        </a>
        ）。独自追加語とその注釈（
        <a href={assetUrl('/licenses/CC0-NOTICE.txt')} target="_blank" rel="noopener noreferrer">
          CC0
        </a>
        ）
      </p>
      <p>変更点 — 単語の選別、読み・意味の補助、長音短縮、同じ表記の重複整理。</p>
    </footer>
  );
}
