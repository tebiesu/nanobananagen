'use client';

import { useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Icons } from './Icons';

interface ThemeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const T = {
  title: '\u4e3b\u9898\u8bbe\u7f6e',
  mode: '\u5916\u89c2\u6a21\u5f0f',
  light: '\u6d45\u8272\u6a21\u5f0f',
  dark: '\u6df1\u8272\u6a21\u5f0f',
  switchDark: '\u5207\u6362\u6df1\u8272',
  switchLight: '\u5207\u6362\u6d45\u8272',
  bg: '\u80cc\u666f\u56fe\u7247',
  upload: '\u70b9\u51fb\u4e0a\u4f20\u80cc\u666f\u56fe\u7247',
  choose: '\u9009\u62e9\u56fe\u7247',
  replace: '\u66f4\u6362\u80cc\u666f\u56fe',
  blur: '\u80cc\u666f\u6a21\u7cca',
  transparency: '\u754c\u9762\u900f\u660e\u5ea6',
  glass: '\u6bdb\u73bb\u7483\u6548\u679c',
  glassDesc: '\u8ba9\u9762\u677f\u5c42\u6b21\u66f4\u67d4\u548c\u3002',
  done: '\u5b8c\u6210',
  pickImageFile: '\u8bf7\u9009\u62e9\u56fe\u7247\u6587\u4ef6\u3002',
  tooLarge: '\u56fe\u7247\u5927\u5c0f\u4e0d\u80fd\u8d85\u8fc7 5MB\u3002',
};

export default function ThemeSettingsPanel({ isOpen, onClose }: ThemeSettingsPanelProps) {
  const { theme, toggleTheme, settings, updateSettings } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(T.pickImageFile);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(T.tooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateSettings({ backgroundImage: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/34 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="card-brutal relative flex h-[min(92vh,780px)] w-full max-w-xl flex-col overflow-hidden animate-fade-scale">
        <div className="flex shrink-0 items-center justify-between border-b border-[rgba(42,36,32,0.08)] bg-[rgba(var(--color-bg-primary-rgb),0.9)] px-5 py-4 backdrop-blur-md">
          <h2 className="text-lg font-semibold">{T.title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-black/5" aria-label="close">
            <div className="h-5 w-5">{Icons.close}</div>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 lg:p-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{T.mode}</div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">{theme === 'light' ? T.light : T.dark}</div>
              </div>
              <button onClick={toggleTheme} className="btn-brutal btn-brutal--secondary px-4 py-2">
                <div className="h-4 w-4">{theme === 'light' ? Icons.moon : Icons.sun}</div>
                {theme === 'light' ? T.switchDark : T.switchLight}
              </button>
            </div>
          </section>

          <section className="space-y-3 border-t border-[rgba(42,36,32,0.08)] pt-4">
            <div className="font-medium">{T.bg}</div>
            {settings.backgroundImage ? (
              <div className="group relative overflow-hidden rounded-xl border border-[rgba(42,36,32,0.12)]">
                <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${settings.backgroundImage})` }} />
                <button onClick={() => updateSettings({ backgroundImage: '' })} className="absolute right-2 top-2 rounded-lg bg-black/55 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100" title="remove">
                  <div className="h-4 w-4">{Icons.trash}</div>
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-[rgba(42,36,32,0.2)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent-highlight)]">
                {T.upload}
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="btn-brutal btn-brutal--secondary w-full">{settings.backgroundImage ? T.replace : T.choose}</button>
          </section>

          <section className="space-y-4 border-t border-[rgba(42,36,32,0.08)] pt-4">
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="font-medium">{T.blur}</span><span className="text-sm text-[var(--color-accent-highlight)]">{settings.backgroundBlur}px</span></div>
              <input type="range" min={0} max={20} value={settings.backgroundBlur} onChange={(e) => updateSettings({ backgroundBlur: parseInt(e.target.value, 10) })} className="h-2 w-full cursor-pointer rounded-full accent-[var(--color-accent-highlight)]" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="font-medium">{T.transparency}</span><span className="text-sm text-[var(--color-accent-highlight)]">{settings.transparency}%</span></div>
              <input type="range" min={0} max={100} value={settings.transparency} onChange={(e) => updateSettings({ transparency: parseInt(e.target.value, 10) })} className="h-2 w-full cursor-pointer rounded-full accent-[var(--color-accent-highlight)]" />
            </div>
            {!settings.backgroundImage && (
              <p className="text-xs text-[var(--color-text-muted)]">\u672a\u8bbe\u7f6e\u80cc\u666f\u56fe\u65f6\uff0c\u6a21\u7cca\u4e0e\u900f\u660e\u5ea6\u6548\u679c\u4e3b\u8981\u5f71\u54cd\u754c\u9762\u5c42\u6b21\u3002</p>
            )}
          </section>

          <section className="border-t border-[rgba(42,36,32,0.08)] pt-4">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">{T.glass}</div><div className="mt-1 text-sm text-[var(--color-text-muted)]">{T.glassDesc}</div></div>
              <button onClick={() => updateSettings({ glassEffect: !settings.glassEffect })} className={`relative h-8 w-14 rounded-full transition-colors ${settings.glassEffect ? 'bg-[var(--color-accent-highlight)]' : 'bg-[var(--color-bg-tertiary)]'}`}>
                <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${settings.glassEffect ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-[rgba(42,36,32,0.08)] bg-[rgba(var(--color-bg-primary-rgb),0.9)] p-4 backdrop-blur-md">
          <button onClick={onClose} className="btn-brutal btn-brutal--primary w-full py-3">{T.done}</button>
        </div>
      </div>
    </div>
  );
}
