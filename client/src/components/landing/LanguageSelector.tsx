import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const selected = i18n.language;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-selector" style={{ marginRight: 16 }}>
      <select
        value={selected}
        onChange={handleChange}
        className="rounded px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:ring focus:border-primary"
        aria-label="Select language"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
