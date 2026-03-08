interface LanguageTabProps {
  onChange: (lang: string) => void;
  currentLang: string;
}

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
];

export default function LanguageTab({ onChange, currentLang }: LanguageTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">语言设置</h3>
      <div className="space-y-2">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`w-full text-left px-4 py-3 rounded-lg border ${
              currentLang === lang.code
                ? 'border-blue-500 bg-blue-500/10 text-white'
                : 'border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
