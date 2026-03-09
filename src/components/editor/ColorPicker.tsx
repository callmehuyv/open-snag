interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

const PRESET_COLORS = [
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0066ff',
  '#9933ff', '#ff0099', '#000000', '#ffffff', '#666666',
];

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="grid grid-cols-5 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              value === color ? 'border-blue-400' : 'border-zinc-600'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <input
        type="color"
        value={value === 'transparent' ? '#000000' : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-6 rounded cursor-pointer bg-zinc-700 border border-zinc-600"
      />
    </div>
  );
}
