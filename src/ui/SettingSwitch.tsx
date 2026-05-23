interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  badge?: string;
  id?: string;
}

export function SettingSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  badge,
  id,
}: Props) {
  const switchId = id ?? `blink-switch-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="blink-setting-switch">
      <div className="blink-setting-switch__copy">
        <div className="blink-setting-switch__title-row">
          <span className="blink-setting-switch__label" id={`${switchId}-label`}>
            {label}
          </span>
          {badge ? <span className="blink-setting-switch__badge">{badge}</span> : null}
        </div>
        {description ? (
          <p className="blink-setting-switch__desc" id={`${switchId}-desc`}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        id={switchId}
        className="blink-switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="blink-switch__thumb" aria-hidden />
      </button>
    </div>
  );
}
