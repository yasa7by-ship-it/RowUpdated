import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is a mobile device
 * Uses both screen width and user agent for accurate detection
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to check if device is mobile
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      const width = window.innerWidth;
      const userAgent = window.navigator.userAgent.toLowerCase();
      
      // Check for mobile devices
      const isMobileDevice = /iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      
      // Check screen size (more strict for mobile)
      const isSmallScreen = width < 768;
      
      // Check touch capability
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // More aggressive detection for mobile
      return (isMobileDevice && isSmallScreen) || (isSmallScreen && hasTouchScreen);
    };

    // Initial check
    setIsMobile(checkMobile());

    // Listen for resize events
    window.addEventListener('resize', () => setIsMobile(checkMobile()));
    
    // Also check on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => setIsMobile(checkMobile()), 100);
    });
    
    return () => {
      window.removeEventListener('resize', () => setIsMobile(checkMobile()));
      window.removeEventListener('orientationchange', () => setIsMobile(checkMobile()));
    };
  }, []);

  return isMobile;
};

