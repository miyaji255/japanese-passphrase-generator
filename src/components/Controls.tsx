interface ToggleProps {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle(props: ToggleProps) {
  return (
    <label class="toggle-row">
      <span class="toggle-title">{props.title}</span>
      <span class="switch">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(event) => props.onChange(event.currentTarget.checked)}
        />
        <span class="switch-track" />
      </span>
    </label>
  );
}

interface LengthControlProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function LengthControl(props: LengthControlProps) {
  return (
    <div class="length-control">
      <div class="length-heading">
        <label for={props.id}>{props.label}</label>
        <span class="length-value" aria-hidden="true">
          {props.value}&nbsp;{props.unit}
        </span>
      </div>
      <input
        id={props.id}
        class="length-slider"
        type="range"
        min="1"
        max={props.max}
        step="1"
        value={props.value}
        aria-valuetext={`${props.value} ${props.unit}`}
        style={{ '--range-progress': `${((props.value - 1) / (props.max - 1)) * 100}%` }}
        onInput={(event) => props.onChange(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}
