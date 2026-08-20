type LangSwitcherProps = {
  language: string;
  onSelectLanguage: (code: string) => void;
};

export default function LangSwitcher({ language, onSelectLanguage }: LangSwitcherProps) {
  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {[
        { code: "en", flag: "🇬🇧", title: "English" },
        { code: "fr", flag: "🇫🇷", title: "Français" },
      ].map(({ code, flag, title }) => (
        <button
          key={code}
          type="button"
          className={`lang-btn${language.startsWith(code) ? " active" : ""}`}
          onClick={() => onSelectLanguage(code)}
          title={title}
          aria-label={title}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}