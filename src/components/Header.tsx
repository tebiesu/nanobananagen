'use client';

import { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onApiClick: () => void;
  isApiConfigured: boolean;
  onThemeClick: () => void;
}

const SLOGANS = [
  '构建你的世界',
  '描绘你的梦境',
  '让灵感即时显形',
  '把想法变成作品',
  '每次点击都在创作',
  '生成属于你的风格',
];

type TypingPhase = 'typing' | 'deleting' | 'switching';

export default function Header({ onApiClick, isApiConfigured, onThemeClick }: HeaderProps) {
  const [currentSlogan, setCurrentSlogan] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<TypingPhase>('typing');
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme, settings } = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const slogan = SLOGANS[currentSlogan];

    const runAnimation = () => {
      if (phase === 'typing') {
        if (displayText.length < slogan.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(slogan.slice(0, displayText.length + 1));
          }, 65);
        } else {
          timeoutRef.current = setTimeout(() => {
            setPhase('deleting');
          }, 2200);
        }
        return;
      }

      if (phase === 'deleting') {
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(slogan.slice(0, displayText.length - 1));
          }, 32);
        } else {
          setPhase('switching');
        }
        return;
      }

      setCurrentSlogan((prev) => (prev + 1) % SLOGANS.length);
      setPhase('typing');
    };

    runAnimation();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, phase, currentSlogan]);

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{
        backgroundColor: scrolled
          ? 'rgba(var(--color-bg-primary-rgb, 246, 242, 234), 0.86)'
          : 'rgba(var(--color-bg-primary-rgb, 246, 242, 234), 0.64)',
        backdropFilter: settings.glassEffect ? 'blur(18px)' : 'none',
        borderColor: 'rgba(42, 36, 32, 0.08)',
      }}
    >
      <div className="mx-auto flex w-full items-center justify-between px-4 py-3.5 lg:px-6 lg:py-4">
        <div className="flex items-center gap-3.5 lg:gap-4">
          <div className="relative group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--color-banana-light) 0%, var(--color-banana-medium) 100%)',
                boxShadow: '0 4px 16px rgba(207, 173, 77, 0.34)',
              }}
            >
              <span className="text-xl">🍌</span>
            </div>
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight lg:text-[1.34rem]" style={{ color: 'var(--color-text-primary)' }}>
              香蕉皮
            </h1>
            <div className="h-4.5 flex items-center">
              <span className="overflow-hidden whitespace-nowrap text-[11px] font-mono lg:text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {displayText}
                <span
                  className={`ml-0.5 inline-block h-3.5 w-0.5 ${phase === 'typing' ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: 'var(--color-accent-highlight)' }}
                />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-2.5">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-[rgba(42,36,32,0.08)] bg-white/55 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:bg-[rgba(37,33,31,0.58)]"
            title={theme === 'light' ? '切换到夜间模式' : '切换到日间模式'}
          >
            <div className="h-5 w-5" style={{ color: 'var(--color-accent-highlight)' }}>
              {theme === 'light' ? Icons.moon : Icons.sun}
            </div>
          </button>

          <button
            onClick={onThemeClick}
            className="rounded-xl border border-[rgba(42,36,32,0.08)] bg-white/55 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:bg-[rgba(37,33,31,0.58)]"
            title="主题设置"
          >
            <div className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }}>
              {Icons.cog}
            </div>
          </button>

          <button
            onClick={onApiClick}
            className="group flex items-center gap-2 rounded-xl border border-[rgba(42,36,32,0.1)] bg-white/65 px-3.5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white dark:bg-[rgba(37,33,31,0.58)]"
          >
            <div className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }}>
              {Icons.settings}
            </div>
            <span className="hidden text-sm font-medium text-[var(--color-text-secondary)] sm:inline">API 设置</span>
            {isApiConfigured && <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/30" />}
          </button>
        </div>
      </div>
    </header>
  );
}
