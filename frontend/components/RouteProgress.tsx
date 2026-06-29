"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const start = useCallback(() => {
    setProgress(0);
    setVisible(true);
    let p = 0;
    const tick = () => {
      p += (90 - p) * 0.08;
      setProgress(p);
      if (p < 88) timer.current = setTimeout(tick, 80);
    };
    tick();
  }, []);

  const done = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      done();
      prevPath.current = pathname;
    }
  }, [pathname, done]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("/") && href !== pathname) {
        start();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      <div
        className="h-full bg-iris"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 0.3s ease-out",
        }}
      />
    </div>
  );
}
