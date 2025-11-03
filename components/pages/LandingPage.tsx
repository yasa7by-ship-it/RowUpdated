import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
// FIX: Replaced missing MsftIcon with SearchChartIcon for consistency with the header logo.
import { SearchChartIcon } from '../icons';

const DynamicIcon: React.FC<{ svgString: string | undefined }> = ({ svgString }) => {
    if (!svgString) return <SearchChartIcon className="w-12 h-12 text-gray-500" />;
    return <span className="inline-block w-12 h-12" dangerouslySetInnerHTML={{ __html: svgString }} />;
};

const LandingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useAppSettings();
  const { session } = useAuth();

  const { articleTitle, articleBody } = useMemo(() => {
    let titleEn = '', titleAr = '', bodyEn = '', bodyAr = '';

    // --- Title Loading Logic with backward compatibility ---
    if (settings.landing_article_title) { // Prefer new JSON format
        try {
            const titleContent = JSON.parse(settings.landing_article_title);
            titleEn = titleContent.en || '';
            titleAr = titleContent.ar || '';
        } catch (e) { 
            console.error("Could not parse landing page title JSON", e); 
            // Fallback in case JSON is malformed, check for old keys
            titleEn = settings.landing_article_title_en || '';
            titleAr = settings.landing_article_title_ar || '';
        }
    } else { // Fallback to old separate keys if new key doesn't exist
        titleEn = settings.landing_article_title_en || '';
        titleAr = settings.landing_article_title_ar || '';
    }

    // --- Body Loading Logic with backward compatibility ---
    if (settings.landing_article_body) { // Prefer new JSON format
        try {
            const bodyContent = JSON.parse(settings.landing_article_body);
            bodyEn = bodyContent.en || '';
            bodyAr = bodyContent.ar || '';
        } catch (e) { 
            console.error("Could not parse landing page body JSON", e); 
            // Fallback in case JSON is malformed
            bodyEn = settings.landing_article_body_en || '';
            bodyAr = settings.landing_article_body_ar || '';
        }
    } else { // Fallback to old separate keys
        bodyEn = settings.landing_article_body_en || '';
        bodyAr = settings.landing_article_body_ar || '';
    }
    
    // Select the correct language for display
    const finalTitle = language === 'ar' ? (titleAr || titleEn) : titleEn;
    const finalBody = language === 'ar' ? (bodyAr || bodyEn) : bodyEn;

    return { articleTitle: finalTitle, articleBody: finalBody };
  }, [settings, language]);
  
  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center py-8">
        <div className="w-full max-w-3xl mx-auto text-center bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
            <div className="inline-block mb-6">
                <DynamicIcon svgString={settings.site_logo} />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-800 dark:text-white">
                {t('site_title')}
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 px-4">
                {session ? t('welcome_message') : t('landing_page_description')}
            </p>
            {articleTitle && articleBody && (
                <div className="text-left rtl:text-right p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 mx-4 md:mx-0">
                   <h2 className="text-xl md:text-2xl font-semibold mb-3 text-gray-800 dark:text-white">
                      {articleTitle}
                   </h2>
                   <div className="prose dark:prose-invert text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-none">
                      {articleBody.split('\n').map((line: string, index: number) => <p key={index}>{line}</p>)}
                   </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default LandingPage;