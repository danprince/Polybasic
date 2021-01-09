import "./LanguageSelector.css";
import { FunctionComponent, h } from "preact";

export let LanguageSelector: FunctionComponent<{
  onSelect: (languageId: string) => any,
  languages: any[],
}> = ({
  onSelect,
  languages,
}) => {
  return (
    <div class="language-selector">
      {languages.map(language => {
        return (
          <button
            class="language-selector-item"
            onClick={() => onSelect(language.id)}
          >
            <img
              class="language-selector-flag"
              width={80}
              height={80}
              src={`flags/${language.id}.svg`}
            />
            <div>
              {language.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
