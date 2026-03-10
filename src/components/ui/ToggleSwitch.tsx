interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-[14px] w-[14px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out mt-[2px] ${
            checked ? 'translate-x-[16px] ml-[0px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
      <span className="text-[11px] text-gray-600 leading-tight">{label}</span>
    </label>
  );
}
