import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpOnSquareIcon, PlusIcon, XMarkIcon } from './icons';

const AddToHomeScreenPrompt: React.FC = () => {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const dismissed = sessionStorage.getItem('dismissedA2HSPrompt');
        
        if (isStandalone || dismissed) {
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        
        if (isIOS) {
            setPlatform('ios');
            setIsVisible(true);
        } else if (isAndroid) {
            setPlatform('android');
            setIsVisible(true);
        }

    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem('dismissedA2HSPrompt', 'true');
        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    const iosInstructions = (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <span className="text-base">{t('a2hs_ios_prompt_1')}</span>
            <ArrowUpOnSquareIcon className="w-6 h-6 shrink-0" />
            <span className="text-base">{t('a2hs_ios_prompt_2')}</span>
            <PlusIcon className="w-6 h-6 shrink-0" />
            <span className="font-semibold text-base">{`"${t('add_to_home_screen')}"`}</span>
        </div>
    );

    const androidInstructions = (
        <div className="flex items-center gap-3">
             <span className="text-base">{t('a2hs_android_prompt')}</span>
        </div>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up" dir={t('direction')}>
            <div className="container mx-auto">
                <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 rounded-lg shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex-grow">
                        {platform === 'ios' ? iosInstructions : androidInstructions}
                    </div>
                    <button 
                        onClick={handleDismiss} 
                        className="p-2 rounded-full hover:bg-white/10 shrink-0"
                        aria-label={t('close')}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AddToHomeScreenPrompt;
