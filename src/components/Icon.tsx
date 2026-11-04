import { Show } from 'solid-js';

interface IconProps {
  name: 'refresh' | 'copy' | 'check';
  size?: number;
}

export function Icon(props: IconProps) {
  return (
    <svg
      classList={{ 'icon-refresh': props.name === 'refresh' }}
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.name === 'refresh' ? 2.25 : 1.7}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <Show when={props.name === 'refresh'}>
        <path d="M20 12a8 8 0 1 1-2.34-5.66L21 9M21 3v6h-6" />
      </Show>
      <Show when={props.name === 'copy'}>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </Show>
      <Show when={props.name === 'check'}>
        <path d="m5 12 4 4L19 6" />
      </Show>
    </svg>
  );
}
