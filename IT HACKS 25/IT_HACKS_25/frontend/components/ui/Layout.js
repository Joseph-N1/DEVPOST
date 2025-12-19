import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import OfflineBanner from './OfflineBanner';
import MobileNavBar from './MobileNavBar';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function Layout({ children }) {
	const { theme, currentTheme } = useTheme();

	// Get background class based on theme
	const getBackgroundClass = () => {
		const backgrounds = {
			light: 'bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20',
			dark: 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800',
			spring: 'bg-gradient-to-br from-pink-50 via-rose-50/30 to-green-50/20',
			summer: 'bg-gradient-to-br from-yellow-50 via-orange-50/30 to-amber-50/20',
			autumn: 'bg-gradient-to-br from-orange-50 via-amber-50/30 to-red-50/20',
			winter: 'bg-gradient-to-br from-cyan-50 via-sky-50/30 to-blue-50/20',
		};
		return backgrounds[currentTheme] || backgrounds.light;
	};

	const getTextClass = () => {
		return currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-800';
	};
	
	// Get seasonal accent colors for various UI elements
	const getSeasonalAccent = () => {
		const accents = {
			light: { primary: 'emerald', secondary: 'green', glow: 'emerald' },
			dark: { primary: 'purple', secondary: 'indigo', glow: 'purple' },
			spring: { primary: 'pink', secondary: 'rose', glow: 'pink' },
			summer: { primary: 'amber', secondary: 'orange', glow: 'amber' },
			autumn: { primary: 'orange', secondary: 'red', glow: 'orange' },
			winter: { primary: 'cyan', secondary: 'sky', glow: 'cyan' },
		};
		return accents[currentTheme] || accents.light;
	};
	
	const accent = getSeasonalAccent();

	return (
		<div className={`min-h-screen transition-colors duration-500 ${getBackgroundClass()} ${getTextClass()} seasonal-body`}>
			<OfflineBanner />
			{children}
			<MobileNavBar />
			<PWAInstallPrompt />
			{/* Add padding bottom on mobile to prevent content being hidden by bottom nav */}
			<style jsx global>{`
				@media (max-width: 768px) {
					body {
						padding-bottom: 4rem;
					}
				}
				
				/* Theme transition styles */
				.theme-transition {
					transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
				}
				
				/* Seasonal scrollbar colors */
				.${currentTheme} ::-webkit-scrollbar-thumb {
					background: var(--primary);
					border-radius: 4px;
				}
				
				.${currentTheme} ::-webkit-scrollbar-thumb:hover {
					background: var(--primary-dark);
				}
				
				/* Seasonal selection color */
				.${currentTheme} ::selection {
					background: var(--primary-light);
					color: var(--primary-dark);
				}
				
				/* Seasonal focus ring */
				.${currentTheme} :focus-visible {
					outline: 2px solid var(--primary);
					outline-offset: 2px;
				}
				
				/* Seasonal link hover */
				.${currentTheme} a:hover {
					color: var(--primary);
				}
				
				/* Seasonal card hover glow */
				.${currentTheme} .card:hover,
				.${currentTheme} .hover-lift:hover {
					box-shadow: 0 10px 40px var(--card-glow);
				}
				
				/* Seasonal button primary */
				.${currentTheme} .btn-primary {
					background: linear-gradient(135deg, var(--gradient-from), var(--gradient-to));
				}
				
				.${currentTheme} .btn-primary:hover {
					filter: brightness(1.1);
				}
				
				/* Seasonal progress bars */
				.${currentTheme} .progress-bar {
					background: linear-gradient(90deg, var(--gradient-from), var(--gradient-to));
				}
				
				/* Seasonal badges */
				.${currentTheme} .badge-primary {
					background: var(--primary-light);
					color: var(--primary-dark);
				}
				
				/* Seasonal table header */
				.${currentTheme} th {
					border-bottom: 2px solid var(--primary);
				}
				
				/* Seasonal active states */
				.${currentTheme} .active,
				.${currentTheme} [aria-current="page"] {
					color: var(--primary);
					border-color: var(--primary);
				}
			`}</style>
		</div>
	);
}
