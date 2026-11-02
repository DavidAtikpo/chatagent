"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type NavProgressContextValue = {
  startNavigation: () => void;
};

const NavProgressContext = createContext<NavProgressContextValue | null>(null);

export function useDashboardNavigationProgress() {
  return useContext(NavProgressContext);
}

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (hideRef.current) {
      clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(12);
    tickRef.current = setInterval(() => {
      setProgress((p) => (p >= 88 ? p : p + Math.random() * 8));
    }, 220);
  }, [clearTimers]);

  const finishNavigation = useCallback(() => {
    clearTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  }, [clearTimers]);

  useEffect(() => {
    finishNavigation();
    return clearTimers;
  }, [pathname, finishNavigation, clearTimers]);

  useEffect(() => {
    const onHashChange = () => finishNavigation();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [finishNavigation]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <NavProgressContext.Provider value={{ startNavigation }}>
      {visible ? (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-0.5 bg-transparent"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full bg-brand-600 shadow-[0_0_8px_rgba(201,146,42,0.6)] transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {children}
    </NavProgressContext.Provider>
  );
}
