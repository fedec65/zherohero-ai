/**
 * Theme utility functions for managing theme transitions and state
 */

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  effectiveTheme: 'light' | 'dark';
}

/**
 * Get the current system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

/**
 * Apply theme with smooth transition
 */
export function applyThemeWithTransition(theme: 'light' | 'dark') {
  const root = document.documentElement;
  
  // Temporarily disable transitions to prevent flashing
  root.classList.add('theme-transition');
  
  // Apply the theme
  root.setAttribute('data-theme', theme);
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  
  // Re-enable transitions after a brief delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('theme-transition');
    });
  });
}

/**
 * Get effective theme based on user preference
 */
export function getEffectiveTheme(userTheme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (userTheme === 'system') {
    return getSystemTheme();
  }
  return userTheme;
}

/**
 * Create a system theme change listener
 */
export function createSystemThemeListener(
  onThemeChange: (theme: 'light' | 'dark') => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    onThemeChange(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * Validate theme value
 */
export function isValidTheme(theme: string): theme is 'light' | 'dark' | 'system' {
  return ['light', 'dark', 'system'].includes(theme);
}

/**
 * Get theme display name for UI
 */
export function getThemeDisplayName(theme: 'light' | 'dark' | 'system', effectiveTheme?: 'light' | 'dark'): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return effectiveTheme ? `System (${effectiveTheme})` : 'System';
    default:
      return 'Unknown';
  }
}

/**
 * Get theme icon name for UI libraries
 */
export function getThemeIconName(theme: 'light' | 'dark' | 'system', effectiveTheme?: 'light' | 'dark'): string {
  if (theme === 'system' && effectiveTheme) {
    return effectiveTheme === 'dark' ? 'moon' : 'sun';
  }
  
  switch (theme) {
    case 'light':
      return 'sun';
    case 'dark':
      return 'moon';
    case 'system':
      return 'monitor';
    default:
      return 'sun';
  }
}

/**
 * Cycle to next theme in sequence
 */
export function getNextTheme(currentTheme: 'light' | 'dark' | 'system'): 'light' | 'dark' | 'system' {
  const sequence: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
  const currentIndex = sequence.indexOf(currentTheme);
  return sequence[(currentIndex + 1) % sequence.length];
}

/**
 * Toggle between light and dark (skip system)
 */
export function toggleTheme(currentTheme: 'light' | 'dark' | 'system', effectiveTheme: 'light' | 'dark'): 'light' | 'dark' {
  // If current theme is system, toggle based on effective theme
  if (currentTheme === 'system') {
    return effectiveTheme === 'light' ? 'dark' : 'light';
  }
  
  // Simple toggle between light and dark
  return currentTheme === 'light' ? 'dark' : 'light';
}

/**
 * Get CSS custom property value for current theme
 */
export function getThemeValue(property: string): string {
  if (typeof window === 'undefined') return '';
  
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

/**
 * Check if dark theme is active
 */
export function isDarkTheme(): boolean {
  if (typeof window === 'undefined') return false;
  
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Get theme-aware color value
 */
export function getThemeColor(lightColor: string, darkColor: string): string {
  return isDarkTheme() ? darkColor : lightColor;
}