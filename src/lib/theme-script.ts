/**
 * Theme initialization script that runs before React hydration
 * This prevents flash of unstyled content (FOUC) by setting the theme
 * as early as possible in the page load process.
 */

export const THEME_SCRIPT = `
(function() {
  try {
    const STORAGE_KEY = 'minddeck-settings-store';
    const THEME_ATTR = 'data-theme';
    
    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    function applyTheme(theme) {
      // Set data-theme attribute for CSS variables
      document.documentElement.setAttribute(THEME_ATTR, theme);
      
      // Set classes for Tailwind dark: prefix
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
    
    // Get stored settings
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const themePreference = parsed.state?.settings?.theme || 'system';
        
        let effectiveTheme = themePreference;
        if (themePreference === 'system') {
          effectiveTheme = getSystemTheme();
        }
        
        applyTheme(effectiveTheme);
        
        // Listen for system theme changes if using system theme
        if (themePreference === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', function(e) {
            applyTheme(e.matches ? 'dark' : 'light');
          });
        }
        
      } catch (e) {
        console.warn('Failed to parse stored theme settings:', e);
        applyTheme(getSystemTheme());
      }
    } else {
      // No stored preference, use system theme
      applyTheme(getSystemTheme());
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function(e) {
        applyTheme(e.matches ? 'dark' : 'light');
      });
    }
  } catch (error) {
    console.warn('Theme initialization failed:', error);
    // Fallback to system theme
    const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', fallbackTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(fallbackTheme);
  }
})();
`;