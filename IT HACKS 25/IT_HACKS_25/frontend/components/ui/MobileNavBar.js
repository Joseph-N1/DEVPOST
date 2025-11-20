/**
 * Mobile Navigation Bar - Phase 9
 * Bottom navigation for mobile devices
 */

import { useRouter } from 'next/router';
import { Home, BarChart3, Upload, User } from 'lucide-react';

export default function MobileNavBar() {
  const router = useRouter();

  const navItems = [
    { 
      name: 'Dashboard', 
      icon: Home, 
      path: '/dashboard',
      active: router.pathname === '/dashboard' 
    },
    { 
      name: 'Analytics', 
      icon: BarChart3, 
      path: '/analytics',
      active: router.pathname === '/analytics' 
    },
    { 
      name: 'Upload', 
      icon: Upload, 
      path: '/upload',
      active: router.pathname === '/upload' 
    },
    { 
      name: 'Profile', 
      icon: User, 
      path: '/profile',
      active: router.pathname === '/profile' 
    },
  ];

  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex flex-col items-center justify-center
                min-w-[44px] min-h-[44px] px-3 py-1
                transition-colors duration-200
                ${item.active 
                  ? 'text-green-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
              aria-label={item.name}
              aria-current={item.active ? 'page' : undefined}
            >
              <Icon 
                size={24} 
                strokeWidth={item.active ? 2.5 : 2}
                className="mb-1"
              />
              <span className={`text-xs ${item.active ? 'font-semibold' : 'font-medium'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
