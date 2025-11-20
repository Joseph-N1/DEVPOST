import React from 'react';
import OfflineBanner from './OfflineBanner';
import MobileNavBar from './MobileNavBar';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function Layout({ children }) {
	return (
		<div className="min-h-screen bg-gray-50 text-gray-800">
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
			`}</style>
		</div>
	);
}
