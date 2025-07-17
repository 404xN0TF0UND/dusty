import React, { Suspense, lazy } from 'react';

// Lazy load heavy components
export const LazyChoreStats = lazy(() => import('./ChoreStats').then(module => ({ default: module.ChoreStats })));
export const LazyChoreTemplates = lazy(() => import('./ChoreTemplates').then(module => ({ default: module.ChoreTemplates })));
export const LazyPerformanceDashboard = lazy(() => import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard })));
export const LazyAchievementDisplay = lazy(() => import('./AchievementDisplay').then(module => ({ default: module.AchievementDisplay })));
export const LazyDustyChat = lazy(() => import('./DustyChat').then(module => ({ default: module.DustyChat })));
// LazySMSSettings removed
export const LazyNotificationSettingsPanel = lazy(() => import('./NotificationSettings').then(module => ({ default: module.NotificationSettingsPanel })));

// Loading components
const LoadingSpinner: React.FC = () => (
  <div className="lazy-loading">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Lazy component error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-boundary">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>Failed to load component. Please refresh the page.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// Lazy component wrapper
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType
) => {
  const LazyComponent: React.FC<P> = (props) => (
    <ErrorBoundary>
      <Suspense fallback={FallbackComponent ? <FallbackComponent /> : <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
  
  return LazyComponent;
};

// Preload components for better UX
export const preloadComponent = (componentName: string) => {
  switch (componentName) {
    case 'ChoreStats':
      import('./ChoreStats');
      break;
    case 'ChoreTemplates':
      import('./ChoreTemplates');
      break;
    case 'PerformanceDashboard':
      import('./PerformanceDashboard');
      break;
    case 'AchievementDisplay':
      import('./AchievementDisplay');
      break;
    case 'DustyChat':
      import('./DustyChat');
      break;
    case 'NotificationSettings':
      import('./NotificationSettings');
      break;
  }
}; 