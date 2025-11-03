import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is a mobile device
 * Uses both screen width and user agent for accurate detection
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Initial check - avoid SSR issues
    if (typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/i.test(userAgent);
    const isSmallScreen = width < 768; // Tailwind's md breakpoint
    
    return isMobileDevice || isSmallScreen;
  });

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = width < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
};

