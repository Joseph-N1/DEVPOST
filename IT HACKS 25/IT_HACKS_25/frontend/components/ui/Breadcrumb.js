import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = () => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const pathSegments = router.asPath.split('/').filter(Boolean);
  
  // Special cases for dynamic routes
  const formattedSegments = pathSegments.map(segment => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      // Handle dynamic route parameters
      const paramName = segment.slice(1, -1);
      const value = router.query[paramName];
      return { path: segment, label: value || segment };
    }
    return { path: segment, label: t(segment) || segment };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link 
        href="/"
        className="flex items-center hover:text-green-600 transition-colors"
      >
        <Home size={16} className="mr-1" />
        {t('navigation.home')}
      </Link>

      {formattedSegments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          <ChevronRight size={16} className="text-gray-400" />
          {index === formattedSegments.length - 1 ? (
            <span className="text-green-600 font-medium">
              {segment.label}
            </span>
          ) : (
            <Link
              href={`/${formattedSegments.slice(0, index + 1).map(s => s.path).join('/')}`}
              className="hover:text-green-600 transition-colors"
            >
              {segment.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;