import { useEffect } from 'react';
import { Languages } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          autoDisplay: true,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        'google_translate_element'
      );
    };

    if (document.querySelector('script[data-google-translate="true"]')) return;

    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.dataset.googleTranslate = 'true';
    document.body.appendChild(script);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0C0C0E] px-3 py-2 shadow-xl">
      <Languages className="h-4 w-4 text-amber-500" />
      <div id="google_translate_element" className="min-w-24 text-xs" />
    </div>
  );
}
