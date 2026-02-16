'use client';

import { useEffect, useState } from 'react';
import type { GeneratedImage } from '@/app/page';
import { clearAllImages, deleteImage, getAllImages, toggleFavorite, type StoredImage } from '@/lib/imageStorage';
import { Icons } from './Icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ImageDisplayProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  generationProgress?: number;
}

type DisplayImage = GeneratedImage | StoredImage;

const TXT = {
  history: '\u5386\u53f2\u8bb0\u5f55',
  session: '\u5f53\u524d\u4f1a\u8bdd',
  result: '\u751f\u6210\u7ed3\u679c',
  download: '\u4e0b\u8f7d',
  close: '\u5173\u95ed',
  clear: '\u6e05\u7a7a',
  start: '\u5f00\u59cb\u521b\u4f5c',
  emptyHint: '\u914d\u7f6e API\uff0c\u8f93\u5165\u63d0\u793a\u8bcd\uff0c\u9009\u62e9\u6bd4\u4f8b\u540e\u70b9\u51fb\u201c\u751f\u6210\u56fe\u50cf\u201d\u3002',
  generating: '\u751f\u6210\u4e2d...',
  loadingHistory: '\u52a0\u8f7d\u5386\u53f2\u4e2d...',
  detail: '\u56fe\u50cf\u8be6\u60c5',
  prompt: '\u63d0\u793a\u8bcd',
  negative: '\u8d1f\u5411\u63d0\u793a\u8bcd',
  ratio: '\u6bd4\u4f8b',
  resolution: '\u5206\u8fa8\u7387',
  steps: '\u6b65\u6570',
  zoom: '\u7f29\u653e',
  copyPrompt: '\u590d\u5236\u63d0\u793a\u8bcd',
  copied: '\u5df2\u590d\u5236',
  downloadImage: '\u4e0b\u8f7d\u56fe\u50cf',
  clearConfirm: '\u786e\u5b9a\u8981\u6e05\u7a7a\u5168\u90e8\u5386\u53f2\u8bb0\u5f55\uff1f\u8be5\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\u3002',
};

export default function ImageDisplay({ images, isGenerating, generationProgress = 0 }: ImageDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<DisplayImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { settings } = useTheme();

  useEffect(() => {
    void loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getAllImages();
      setStoredImages(history);
    } catch {
      // Ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const downloadImage = async (image: DisplayImage) => {
    try {
      if (image.url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = image.url;
        a.download = `nanobanana-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nanobanana-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(image.url, '_blank');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(TXT.clearConfirm)) return;
    await clearAllImages();
    setStoredImages([]);
  };

  const visibleImages = showHistory ? storedImages : images;

  return (
    <div className="flex h-full flex-col">
      <div
        className="border-b border-[rgba(42,36,32,0.08)] bg-white/60 px-4 py-3.5 lg:px-6"
        style={{ backdropFilter: settings.glassEffect ? 'blur(12px)' : 'none' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 text-[var(--color-accent-highlight)]">{Icons.image}</div>
            <span className="text-sm font-medium tracking-wide text-[var(--color-text-primary)]">{showHistory ? TXT.history : TXT.result}</span>
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-3 py-1 text-xs font-mono text-[var(--color-text-muted)]">{visibleImages.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`rounded-xl px-3.5 py-2 text-sm transition-all ${
                showHistory
                  ? 'bg-gradient-to-br from-[var(--color-accent-highlight)] to-[#f19467] text-white shadow-sm'
                  : 'border border-[rgba(42,36,32,0.1)] bg-white/65 text-[var(--color-text-secondary)] hover:bg-white'
              }`}
            >
              {showHistory ? TXT.session : TXT.history}
            </button>

            {selectedImage && (
              <>
                <button onClick={() => void downloadImage(selectedImage)} className="rounded-xl border border-[rgba(42,36,32,0.1)] bg-white/65 px-3.5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-white">{TXT.download}</button>
                <button onClick={() => setSelectedImage(null)} className="rounded-xl border border-[rgba(42,36,32,0.1)] bg-white/65 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-white">{TXT.close}</button>
              </>
            )}

            {showHistory && storedImages.length > 0 && (
              <button onClick={() => void handleClearHistory()} className="rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-500 hover:bg-red-100">{TXT.clear}</button>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-[var(--color-bg-primary)] via-white/35 to-[var(--color-bg-secondary)]">
        {visibleImages.length === 0 && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center p-8 animate-fade-in">
            <div className="max-w-lg text-center">
              <div className="relative mb-8 inline-block">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-[var(--color-banana-light)] to-transparent opacity-45 blur-3xl" />
                <span className="relative text-8xl animate-float">{'\u{1F34C}'}</span>
              </div>
              <h3 className="mb-4 text-3xl">{TXT.start}</h3>
              <p className="mx-auto max-w-md rounded-2xl border border-[rgba(42,36,32,0.08)] bg-white/65 p-5 text-sm text-[var(--color-text-secondary)]">{TXT.emptyHint}</p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/86 backdrop-blur-sm animate-fade-in dark:bg-black/50">
            <div className="px-8 text-center">
              <div className="relative mb-6 inline-block">
                <div className="absolute -inset-14 rounded-full bg-gradient-to-br from-[var(--color-banana-light)] via-[var(--color-accent-highlight)] to-[var(--color-coral)] opacity-30 blur-3xl" />
                <span className="relative inline-block text-7xl animate-spin" style={{ animationDuration: '3s' }}>{'\u{1F34C}'}</span>
              </div>
              <div className="mx-auto mb-4 w-72">
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-banana-medium)] via-[var(--color-accent-highlight)] to-[var(--color-coral)] transition-all duration-300" style={{ width: `${Math.min(generationProgress, 95)}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-[var(--color-text-muted)]"><span>{TXT.generating}</span><span>{Math.round(generationProgress)}%</span></div>
              </div>
            </div>
          </div>
        )}

        {showHistory && isLoadingHistory && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm animate-fade-in">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-[var(--color-banana-medium)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--color-text-muted)]">{TXT.loadingHistory}</p>
            </div>
          </div>
        )}

        {visibleImages.length > 0 && !selectedImage && (
          <div className="h-full overflow-y-auto p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleImages.map((image, index) => {
                const isStored = 'id' in image;
                const imageId = isStored ? (image as StoredImage).id : `session-${index}`;
                return (
                  <div key={imageId} className="group relative cursor-pointer overflow-hidden rounded-2xl animate-fade-scale" style={{ animationDelay: `${index * 0.04}s` }} onClick={() => setSelectedImage(image)}>
                    <div className="aspect-square overflow-hidden rounded-2xl bg-[var(--color-bg-tertiary)] shadow-md transition-all duration-500 group-hover:shadow-xl">
                      <img src={image.url} alt={image.prompt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/78 via-black/15 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="line-clamp-2 text-sm">{image.prompt}</p>
                        <div className="mt-2 flex gap-2 text-xs text-white/80">
                          <span className="rounded-full bg-white/20 px-2 py-1">{image.params.aspectRatio}</span>
                          <span className="rounded-full bg-white/20 px-2 py-1">{image.params.resolution}px</span>
                        </div>
                      </div>
                    </div>
                    {isStored && (
                      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); void toggleFavorite((image as StoredImage).id); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/28 text-white backdrop-blur-sm"><div className="h-4 w-4">{(image as StoredImage).favorite ? Icons.star : Icons.starOutline}</div></button>
                        <button onClick={(e) => { e.stopPropagation(); void deleteImage((image as StoredImage).id); setStoredImages((prev) => prev.filter((it) => it.id !== (image as StoredImage).id)); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/65 text-white"><div className="h-4 w-4">{Icons.trash}</div></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="h-full overflow-y-auto animate-fade-in">
            <div className="mx-auto w-full max-w-[1200px] space-y-[clamp(10px,1.6vh,18px)] p-4 lg:p-6">
              <div className="relative rounded-3xl border border-[rgba(42,36,32,0.08)] bg-[radial-gradient(circle_at_20%_12%,rgba(235,215,121,0.2),transparent_38%),radial-gradient(circle_at_82%_28%,rgba(235,186,169,0.18),transparent_40%),linear-gradient(145deg,var(--color-bg-primary),var(--color-bg-secondary))] p-3 lg:p-4">
                <div className="flex justify-center">
                  <div
                    className="relative flex max-w-full items-center justify-center rounded-3xl border border-white/50 bg-white/45 p-3 shadow-[0_28px_60px_rgba(42,36,32,0.16)] backdrop-blur-sm transition-transform duration-500 dark:border-white/10 dark:bg-black/15"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.prompt}
                      className="max-h-[min(68vh,920px)] max-w-[min(100%,980px)] rounded-2xl object-contain"
                    />
                  </div>
                </div>
              </div>

              <div
                className="w-full rounded-3xl border border-[rgba(42,36,32,0.08)] bg-white/92 p-5 lg:p-6"
                style={{ backdropFilter: settings.glassEffect ? 'blur(8px)' : 'none' }}
              >
                <h3 className="mb-5 text-lg">{TXT.detail}</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="label-brutal">{TXT.prompt}</label>
                    <p className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-4 text-[var(--color-text-secondary)]">{selectedImage.prompt}</p>
                  </div>

                  {selectedImage.negativePrompt && (
                    <div>
                      <label className="label-brutal">{TXT.negative}</label>
                      <p className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-4 text-[var(--color-text-secondary)]">{selectedImage.negativePrompt}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-3">
                      <div className="text-xs text-[var(--color-text-muted)]">{TXT.ratio}</div>
                      <div className="mt-1 font-medium">{selectedImage.params.aspectRatio}</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-3">
                      <div className="text-xs text-[var(--color-text-muted)]">{TXT.resolution}</div>
                      <div className="mt-1 font-medium">{selectedImage.params.resolution}px</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-3">
                      <div className="text-xs text-[var(--color-text-muted)]">{TXT.steps}</div>
                      <div className="mt-1 font-medium">{selectedImage.params.steps}</div>
                    </div>
                    <div className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 p-3">
                      <div className="text-xs text-[var(--color-text-muted)]">CFG</div>
                      <div className="mt-1 font-medium">{selectedImage.params.guidance.toFixed(1)}</div>
                    </div>
                  </div>

                  <div>
                    <label className="label-brutal">{TXT.zoom}</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))} className="btn-brutal btn-brutal--secondary px-3 py-2">
                        <div className="h-4 w-4">{Icons.minus}</div>
                      </button>
                      <div className="min-w-16 rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/75 px-3 py-2 text-center font-mono text-xs">{Math.round(zoomLevel * 100)}%</div>
                      <button onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))} className="btn-brutal btn-brutal--secondary px-3 py-2">
                        <div className="h-4 w-4">{Icons.plus}</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button onClick={() => void downloadImage(selectedImage)} className="btn-brutal btn-brutal--primary py-3">{TXT.downloadImage}</button>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedImage.prompt);
                        setCopyStatus('copied');
                        setTimeout(() => setCopyStatus('idle'), 1200);
                      }}
                      className="btn-brutal btn-brutal--secondary py-3"
                    >
                      {copyStatus === 'copied' ? TXT.copied : TXT.copyPrompt}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
