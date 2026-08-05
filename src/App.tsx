import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { Menu, ChevronRight } from 'lucide-react';
import AccessibilityWidget from './components/AccessibilityWidget';
import DiagnosticModal from './components/onboarding/DiagnosticModal';
import { ViewType, Module } from './types';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { useBackExitGuard } from './hooks/useBackExitGuard';
import {
  clearLessonProgress,
  getLessonProgress,
  getSidebarCollapsed,
  hasCompletedOnboarding,
  loadPersonaValue,
  loadPurposeValue,
  resetDiagnosticStorage,
  saveLessonProgress,
  saveSidebarCollapsed,
} from './services/storage';
import { stopSpeaking } from './utils/a11y';

const Home = lazy(() => import('./views/Home'));
const Tutorial = lazy(() => import('./views/Tutorial'));
const QuickTools = lazy(() => import('./views/QuickTools'));
const Resources = lazy(() => import('./views/Resources'));

function ViewFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canva-bg px-4">
      <div className="flex items-center gap-3 rounded-xl border border-canva-border bg-white px-4 py-3 text-sm font-bold text-canva-gray shadow-sm">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-canva-purple/30 border-t-canva-purple" />
        화면을 불러오는 중입니다
      </div>
    </div>
  );
}

function ExitHintToast() {
  return (
    <m.div
      key="back-exit-hint"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 pointer-events-none rounded-full bg-canva-ink/90 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur"
    >
      한 번 더 누르면 종료됩니다
    </m.div>
  );
}

function hasSavedLearningPath() {
  return loadPersonaValue() !== null && loadPurposeValue() !== null;
}

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => getSidebarCollapsed());
  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      saveSidebarCollapsed(next);
      return next;
    });
  };
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('lesson') ? 'tutorial' : 'home';
  });
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(() => !hasCompletedOnboarding());
  const [isLearningPathSaved, setIsLearningPathSaved] = useState(() => hasSavedLearningPath());
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => getLessonProgress());
  const isExitHintVisible = useBackExitGuard();

  // ?lesson= 딥링크는 최초 로드에서만 의미가 있다. tutorial 밖으로 나가면 지워서
  // 새로고침·URL 복사 시 의도치 않게 레슨으로 튕기는 것을 막는다.
  useEffect(() => {
    if (currentView === 'tutorial') return;
    if (new URLSearchParams(window.location.search).has('lesson')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [currentView]);

  const refreshLearningPathStatus = () => {
    setIsLearningPathSaved(hasSavedLearningPath());
  };

  const handleViewChange = (view: ViewType) => {
    stopSpeaking();
    setCurrentView(view);
    setSelectedModule(null);
  };

  const restartDiagnosticWithProgressReset = () => {
    setCompletedLessons([]);
    clearLessonProgress();
    resetDiagnosticStorage();
    setIsLearningPathSaved(false);
    setShowDiagnostic(true);
    setIsMobileMenuOpen(false);
  };

  const toggleComplete = useCallback((lessonId: string) => {
    setCompletedLessons(prev => {
      const next = prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId];
      saveLessonProgress(next);
      return next;
    });
  }, []);

  const markComplete = useCallback((lessonId: string) => {
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      saveLessonProgress(next);
      return next;
    });
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home
            onViewChange={handleViewChange}
            onStartDiagnostic={() => setShowDiagnostic(true)}
            isLearningPathSaved={isLearningPathSaved}
          />
        );
      case 'resources':
        return <Resources />;
      case 'tools':
        return <QuickTools />;
      case 'tutorial':
        return <Tutorial
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
          completedLessons={completedLessons}
          onToggleComplete={toggleComplete}
          onMarkComplete={markComplete}
          onOpenTools={() => {
            stopSpeaking();
            setCurrentView('tools');
            setSelectedModule(null);
          }}
          onOpenResources={() => {
            stopSpeaking();
            setCurrentView('resources');
            setSelectedModule(null);
          }}
        />;
      default:
        return (
          <Home
            onViewChange={handleViewChange}
            onStartDiagnostic={() => setShowDiagnostic(true)}
            isLearningPathSaved={isLearningPathSaved}
          />
        );
    }
  };

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-canva-bg font-sans text-canva-ink">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedModule={selectedModule}
        onSelectModule={(mod) => {
          stopSpeaking();
          setCurrentView('tutorial');
          setSelectedModule(mod);
        }}
        completedLessons={completedLessons}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onRestartDiagnostic={restartDiagnosticWithProgressReset}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {isSidebarCollapsed && (
        <button
          onClick={toggleSidebarCollapsed}
          aria-label="사이드바 펼치기"
          title="사이드바 펼치기"
          className="hidden md:flex fixed top-4 left-3 z-50 w-9 h-9 items-center justify-center rounded-full border border-canva-border bg-white text-canva-gray hover:text-canva-purple hover:border-canva-purple shadow-sm transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="메뉴 열기"
          title="메뉴 열기"
          className="md:hidden fixed top-3 left-3 z-40 w-8 h-8 flex items-center justify-center rounded-full border border-canva-border bg-white/80 backdrop-blur text-canva-gray hover:text-canva-purple shadow-sm transition-colors"
        >
          <Menu size={16} />
        </button>
      )}

      <main
        className={`min-h-screen transition-[padding] duration-300 ${
          isSidebarCollapsed ? 'md:pl-0' : 'md:pl-52 lg:pl-64'
        }`}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<ViewFallback />}>
              {renderView()}
            </Suspense>
          </m.div>
        </AnimatePresence>
      </main>
      <AccessibilityWidget />
      <AnimatePresence>{isExitHintVisible && <ExitHintToast />}</AnimatePresence>
      {showDiagnostic && (
        <DiagnosticModal
          onClose={() => {
            refreshLearningPathStatus();
            setShowDiagnostic(false);
          }}
          onStartModule={(module) => {
            stopSpeaking();
            refreshLearningPathStatus();
            setCurrentView('tutorial');
            setSelectedModule(module);
          }}
          onOpenTools={() => {
            stopSpeaking();
            refreshLearningPathStatus();
            setCurrentView('tools');
            setSelectedModule(null);
          }}
          onOpenResources={() => {
            stopSpeaking();
            refreshLearningPathStatus();
            setCurrentView('resources');
            setSelectedModule(null);
          }}
        />
      )}
    </div>
    </LazyMotion>
  );
}
