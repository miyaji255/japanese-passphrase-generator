import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import dictionaries from './generated/dictionaries.json';
import { assetUrl } from './asset-url.mjs';
import { loadDictionary, selectDictionaryPool, getDictionaryTimings } from './dictionary-loader.mjs';
import { generateWords, decodeWord, entropyBits, wordsForEntropy, joinWords } from './generator.mjs';

function Icon(props) {
  return <svg classList={{'icon-refresh':props.name==='refresh'}} width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={props.name==='refresh'?2.25:1.7} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <Show when={props.name==='refresh'}><path d="M20 12a8 8 0 1 1-2.34-5.66L21 9M21 3v6h-6"/></Show>
    <Show when={props.name==='copy'}><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></Show>
    <Show when={props.name==='check'}><path d="m5 12 4 4L19 6"/></Show>
  </svg>;
}

function Toggle(props) {
  return <label class="toggle-row">
    <span class="toggle-title">{props.title}</span>
    <span class="switch"><input type="checkbox" checked={props.checked} onChange={props.onChange}/><span class="switch-track"/></span>
  </label>;
}

const MAX_WORDS = 20;

function LengthControl(props) {
  return <div class="length-control">
    <div class="length-heading">
      <label for={props.id}>{props.label}</label>
      <span class="length-value" aria-hidden="true">{props.value}&nbsp;{props.unit}</span>
    </div>
    <input id={props.id} class="length-slider" type="range" min="1" max={props.max} step="1" value={props.value}
      aria-valuetext={`${props.value} ${props.unit}`}
      style={{'--range-progress':`${(props.value-1)/(props.max-1)*100}%`}} onInput={e=>props.onChange(e.currentTarget.valueAsNumber)}/>
  </div>;
}

export default function App() {
  const [length,setLength]=createSignal({words:6});
  const [english,setEnglish]=createSignal(true);
  const [long,setLong]=createSignal(true);
  const [romanization,setRomanization]=createSignal('short');
  const [vowelHelpOpen,setVowelHelpOpen]=createSignal(false);
  const [words,setWords]=createSignal([]);
  const [error,setError]=createSignal('');
  const [loaded,setLoaded]=createSignal(null);
  const [loadError,setLoadError]=createSignal('');
  const [loadAttempt,setLoadAttempt]=createSignal(0);
  const [copied,setCopied]=createSignal(false);
  const [copyError,setCopyError]=createSignal('');
  const [revision,setRevision]=createSignal(0);
  const [phraseScale,setPhraseScale]=createSignal(1);
  let wordStage;
  let wordList;
  let fitFrame;
  let copyTimeout;
  let readyFrame;
  let firstPhraseMeasured=false;
  const dictionaryInfo=createMemo(()=>dictionaries.settings[`${Number(english())}-${Number(long())}-${romanization()}`]);
  const pool=createMemo(()=>loaded() ? selectDictionaryPool(loaded(),dictionaryInfo().mask) : null);
  const loading=()=>!pool() && !loadError();
  const maximumBits=createMemo(()=>Math.floor(entropyBits(dictionaryInfo().count,MAX_WORDS)));
  createEffect(()=>{
    loadAttempt();
    let active=true;
    setLoadError('');
    loadDictionary(assetUrl(dictionaries.url),dictionaries.count,dictionaries.settings).then(dictionary=>{
      if(active)setLoaded(dictionary);
    }).catch(()=>{
      if(active)setLoadError('単語リストを読み込めませんでした。再生成で再試行してください。');
    });
    onCleanup(()=>{active=false});
  });
  const bitTarget=createMemo(()=>Math.min(length().minimumBits ?? maximumBits(),maximumBits()));
  const count=createMemo(()=>length().words ?? wordsForEntropy(dictionaryInfo().count,bitTarget()));
  const bits=createMemo(()=>entropyBits(dictionaryInfo().count,count()));
  const minimumBits=createMemo(()=>length().words ? Math.floor(bits()) : bitTarget());
  const phrase=createMemo(()=>joinWords(words()));
  function regenerate(available=pool(),length=count()) {
    clearTimeout(copyTimeout);setCopied(false);setCopyError('');
    if(!available){setLoadAttempt(n=>n+1);return;}
    try {
      const selectionStarted=performance.now();
      const selected=generateWords(available,length).map(decodeWord);
      const selectionMs=performance.now()-selectionStarted;
      setWords(selected);setError('');
      setRevision(r=>r+1);
      if(!firstPhraseMeasured){
        firstPhraseMeasured=true;
        const dictionaryUrl=assetUrl(dictionaries.url);
        const dictionaryTiming=getDictionaryTimings(available);
        // Record the first painted result, independently of the static page's LCP.
        readyFrame=requestAnimationFrame(()=>{
          readyFrame=requestAnimationFrame(()=>{
            performance.mark('passphrase-ready');
            wordStage.dataset.readyMs=String(Math.round(performance.now()));
            const navigation=performance.getEntriesByType('navigation')[0];
            const fcp=performance.getEntriesByName('first-contentful-paint')[0];
            if(navigation)wordStage.dataset.documentMs=String(Math.round(navigation.responseEnd));
            if(fcp)wordStage.dataset.fcpMs=String(Math.round(fcp.startTime));
            if(dictionaryTiming){
              const resource=performance.getEntriesByName(new URL(dictionaryUrl,document.baseURI).href)
                .filter(entry=>entry.entryType==='resource').at(-1);
              wordStage.dataset.phaseMs=JSON.stringify({
                // Resource Timing includes any download performed by the HTML preload.
                downloadMs:resource?.duration ?? dictionaryTiming.received-dictionaryTiming.requested,
                fetchWaitMs:dictionaryTiming.received-dictionaryTiming.requested,
                validationMs:dictionaryTiming.validationMs,
                selectionMs,
              });
            }
          });
        });
      }
    } catch {
      setWords([]);setError('暗号学的な乱数を利用できません。HTTPSで、対応ブラウザーから開いてください。');
    }
  }
  createEffect(()=>{
    const available=pool();
    const wordCount=count();
    setWords([]);setCopied(false);setCopyError('');
    if(available)regenerate(available,wordCount);
  });
  function fitPhrase() {
    if (!wordList || count()>6) {
      setPhraseScale(1);
      return;
    }
    const style=getComputedStyle(wordStage);
    const availableWidth=wordStage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const naturalWidth=wordList.scrollWidth;
    setPhraseScale(availableWidth>1 && naturalWidth>0 ? Math.min(1,(availableWidth-1)/naturalWidth) : 1);
  }
  function scheduleFit() {
    cancelAnimationFrame(fitFrame);
    fitFrame=requestAnimationFrame(fitPhrase);
  }
  createEffect(()=>{
    words();
    count();
    scheduleFit();
  });
  onMount(()=>{
    const observer=new ResizeObserver(scheduleFit);
    observer.observe(wordStage);
    
    onCleanup(()=>{
      observer.disconnect();
      cancelAnimationFrame(fitFrame);
      cancelAnimationFrame(readyFrame);
      clearTimeout(copyTimeout);
    });
  });
  async function copyPhrase() {
    try {
      const copiedPhrase=phrase();
      if(!copiedPhrase)return;
      await navigator.clipboard.writeText(copiedPhrase);
      if(phrase()!==copiedPhrase)return;
      setCopied(true);setCopyError('');
      copyTimeout=setTimeout(()=>setCopied(false),2400);
    } catch {
      setCopied(false);setCopyError('コピーできませんでした。下の文字列を選択してコピーしてください。');
    }
  }
  return <>
    <main>
      <h1 class="page-title">日本語パスフレーズジェネレーター</h1>

      <div class="workspace">
        <section class="result-card" aria-labelledby="result-title">
          <div class="result-heading">
            <h2 id="result-title">パスフレーズ</h2>
            <div class="result-entropy">エントロピー <strong>{bits().toFixed(1)}&nbsp;bit</strong>
            </div>
          </div>
          <div ref={wordStage} class="word-stage" classList={{'many-words':count()>10}} data-revision={revision()} aria-busy={loading()}>
            <Show when={!error() && !loadError()} fallback={<div class="error-box" role="alert">{loadError() || error()}</div>}>
              <Show when={!loading()} fallback={<span class="loading-status" role="status">読み込み中…</span>}>
              <div ref={wordList} class="word-list" classList={{'single-line':count()<=6}} style={{'--phrase-scale':phraseScale()}}>
                <For each={words()}>{(word,index)=><div class="word-with-divider">
                  <div class="word-unit">
                    <span class="word-token">{word.token}</span>
                    <span class="word-hint">{word.hint}</span>
                  </div>
                  <Show when={index()<words().length-1}><span class="word-hyphen" aria-hidden="true">-</span></Show>
                </div>}</For>
              </div>
              </Show>
            </Show>
          </div>
          <div class="result-actions">
            <button type="button" class="button button-secondary" disabled={loading()} onClick={()=>regenerate()}><Icon name="refresh"/>再生成</button>
            <button type="button" class="button button-primary" classList={{copied:copied()}} disabled={!words().length} onClick={copyPhrase}><Icon name={copied()?'check':'copy'}/>{copied()?'コピーしました':'コピー'}</button>
          </div>
          <div class="screen-reader-status" role="status">{copied()?'コピーしました。':''}</div>
          <Show when={copyError()}>
            <p class="copy-feedback" role="alert">{copyError()}</p>
            <textarea class="manual-copy" aria-label="手動コピー用パスフレーズ" readOnly value={phrase()} onFocus={e=>e.currentTarget.select()}/>
          </Show>
          <section class="entropy-guide" aria-labelledby="entropy-guide-title">
            <h3 id="entropy-guide-title">エントロピーの目安</h3>
            <dl>
              <For each={[
                {bits:50,label:'50\u00a0bit',description:'試行制限などの追加対策がある認証の最低値。',source:'CNIL（2024）',url:'https://www.cnil.fr/fr/securite-authentifier-les-utilisateurs'},
                {bits:80,label:'80\u00a0bit',description:'上記の追加対策がない認証の最低値。',source:'CNIL（2024）',url:'https://www.cnil.fr/fr/securite-authentifier-les-utilisateurs'},
                {bits:100,label:'100\u00a0bit以上',description:'機微性が高い〜非常に高い用途の目安。多要素認証も推奨。',source:'ANSSI（2021）',url:'https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-authentification_multifacteur_et_mots_de_passe.pdf#page=30'},
              ]}>{guide=>{
                const met=createMemo(()=>words().length>0 && bits()>=guide.bits);
                return <div classList={{'threshold-met':met(),'threshold-unmet':words().length>0 && !met()}}>
                  <dt><span>{guide.label}</span></dt>
                  <dd>{guide.description}<a href={guide.url} target="_blank" rel="noopener noreferrer">{guide.source}</a></dd>
                </div>;
              }}</For>
            </dl>
          </section>
        </section>

        <aside class="settings-card" aria-labelledby="settings-title">
          <h2 id="settings-title" class="settings-heading">生成設定</h2>
          <LengthControl id="word-count" label="単語数" unit="語" value={count()} max={MAX_WORDS}
            onChange={words=>setLength({words})}/>
          <LengthControl id="minimum-bits" label="最低エントロピー" unit="bit" value={minimumBits()} max={maximumBits()}
            onChange={minimumBits=>setLength({minimumBits})}/>
          <div class="settings-divider"/>
          <div class="dictionary-controls">
            <Toggle title="英単語も含める" checked={english()} onChange={e=>setEnglish(e.currentTarget.checked)}/>
            <Toggle title="長い単語も含める" checked={long()} onChange={e=>setLong(e.currentTarget.checked)}/>
            <div class="toggle-with-help">
              <Toggle title="長音を短くする" checked={romanization()==='short'} onChange={e=>setRomanization(e.currentTarget.checked?'short':'kana')}/>
              <span class="vowel-help" onMouseEnter={()=>setVowelHelpOpen(true)} onMouseLeave={()=>setVowelHelpOpen(false)}>
                <button type="button" class="help-button" aria-label="長音の短縮について" aria-describedby="vowel-help-text"
                  onFocus={()=>setVowelHelpOpen(true)} onBlur={()=>setVowelHelpOpen(false)} onClick={()=>setVowelHelpOpen(true)}
                  onKeyDown={e=>{if(e.key==='Escape')setVowelHelpOpen(false)}}>?</button>
                <span id="vowel-help-text" class="help-tooltip" role="tooltip" hidden={!vowelHelpOpen()}>
                  東京の <code>toukyou → tokyo</code>、社長の <code>shachou → shacho</code> のような短い表記にします。
                </span>
              </span>
            </div>
          </div>
        </aside>
      </div>

    </main>
    <footer class="site-footer" aria-label="出典・ライセンス">
      <p><a href={assetUrl(`/wordlists/words-${Number(english())}-${Number(long())}-${romanization()}.zip`)} download>単語リストをダウンロード</a> · <a href="https://github.com/miyaji255/japanese-passphrase-generator" target="_blank" rel="noopener noreferrer">GitHub</a><Show when={import.meta.env.VITE_COMMIT_SHA}> · <a href={`https://github.com/miyaji255/japanese-passphrase-generator/tree/${import.meta.env.VITE_COMMIT_SHA}`} target="_blank" rel="noopener noreferrer">この版のソース</a></Show></p>
      <p>日本語 — <a href="https://github.com/tsuchm/diceware-ja" target="_blank" rel="noopener noreferrer">diceware-ja</a> / JUMAN&nbsp;7.0 ©&nbsp;2012 Kyoto&nbsp;University（<a href={assetUrl('/licenses/JUMAN-BSD.txt')} target="_blank" rel="noopener noreferrer">BSD</a>）</p>
      <p>日本語追加 — <a href="https://mmsrv.ninjal.ac.jp/brfvep/" target="_blank" rel="noopener noreferrer">国立国語研究所</a> / <a href="https://github.com/WorksApplications/SudachiDict" target="_blank" rel="noopener noreferrer">SudachiDict</a> / <a href="https://www.edrdg.org/pub/Nihongo/enamdict_doc.html" target="_blank" rel="noopener noreferrer">JMnedict</a>（<a href={assetUrl('/licenses/ADDITIONS-NOTICE.txt')} target="_blank" rel="noopener noreferrer">利用条件</a>）</p>
      <p>英語 — <a href="https://www.newgeneralservicelist.com/new-general-service-list" target="_blank" rel="noopener noreferrer">NGSL&nbsp;1.2</a> / Browne,&nbsp;C., Culligan,&nbsp;B., and Phillips,&nbsp;J.（<a href={assetUrl('/licenses/CC-BY-SA-4.0.txt')} target="_blank" rel="noopener noreferrer">CC&nbsp;BY-SA&nbsp;4.0</a>）。独自追加語とその注釈（<a href={assetUrl('/licenses/CC0-NOTICE.txt')} target="_blank" rel="noopener noreferrer">CC0</a>）</p>
      <p>変更点 — 単語の選別、読み・意味の補助、長音短縮、同じ表記の重複整理。</p>
    </footer>
  </>;
}

