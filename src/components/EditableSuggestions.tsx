import { tl } from "../lib/i18n-utils";
import { optionLabel, optionValue } from "../lib/segments";
import type { BuilderSegment } from "../lib/segments";
import type { NamingField, NamingFieldOption } from "../types/Rule";

type EditableSuggestionsProps = {
  segment: BuilderSegment;
  field: NamingField;
  options: NamingFieldOption[];
  onUpdate: (key: string, value: string) => void;
};

export default function EditableSuggestions({ segment, field, options, onUpdate }: EditableSuggestionsProps) {
  const availableValues = options.map(optionValue);

  const isCustomValue =
    segment.value === "" ||
    !availableValues.includes(segment.value);

  return (
    <div
      className={`custom-dropdown-editor ${
        isCustomValue ? "custom-mode" : "preset-mode"
      }`}
    >
      <select
        value={isCustomValue ? "__CUSTOM__" : segment.value}
        onChange={(e) => {
          const value = e.target.value;

          if (value === "__CUSTOM__") {
            onUpdate(segment.key, "");
          } else {
            onUpdate(segment.key, value);
          }
        }}
      >
        {options.map((v) => (
          <option
            key={optionValue(v)}
            value={optionValue(v)}
          >
            {optionLabel(v, field)}
          </option>
        ))}

        <option value="__CUSTOM__">
          {tl("ui.customOption", "Custom...")}
        </option>
      </select>

      <div className="custom-input-wrapper">
        <input
          value={segment.value}
          onChange={(e) =>
            onUpdate(segment.key, e.target.value)
          }
          placeholder={
            isCustomValue && field.examples?.length
              ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 2).join(", ")}...`, { examples: field.examples.slice(0, 2).join(", ") })
              : field.placeholder ?? segment.label
          }
          disabled={!isCustomValue}
        />
      </div>
    </div>
  );
}
