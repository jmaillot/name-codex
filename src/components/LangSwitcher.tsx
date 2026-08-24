type LangSwitcherProps = {
  language: string;
  onSelectLanguage: (code: string) => void;
};

function FlagEn() {
  return (
    <svg viewBox="0 0 60 30" width="16" height="12" aria-hidden="true" className="lang-flag">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function FlagFr() {
  return (
    <svg viewBox="0 0 3 2" width="16" height="12" aria-hidden="true" className="lang-flag">
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  );
}

export default function LangSwitcher({ language, onSelectLanguage }: LangSwitcherProps) {
  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-btn${language.startsWith("en") ? " active" : ""}`}
        onClick={() => onSelectLanguage("en")}
        title="English"
        aria-label="English"
      >
        <FlagEn />
        EN
      </button>
      <button
        type="button"
        className={`lang-btn${language.startsWith("fr") ? " active" : ""}`}
        onClick={() => onSelectLanguage("fr")}
        title="Français"
        aria-label="Français"
      >
        <FlagFr />
        FR
      </button>
    </div>
  );
}
