'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiConfig, CreativeMode, GenerationParams } from '@/app/page';
import { Icons } from './Icons';

interface GeneratorPanelProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
  mode: CreativeMode;
  onModeChange: (mode: CreativeMode) => void;
  referenceImages: string[];
  onReferenceImagesChange: (images: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
  apiConfig: ApiConfig;
  availableModels: string[];
  onOpenOptimizer: () => void;
}

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1', desc: '正方形' },
  { value: '4:3', label: '4:3', desc: '标准屏' },
  { value: '3:4', label: '3:4', desc: '竖屏' },
  { value: '16:9', label: '16:9', desc: '宽屏' },
  { value: '9:16', label: '9:16', desc: '手机' },
  { value: '2:3', label: '2:3', desc: '海报' },
  { value: '3:2', label: '3:2', desc: '摄影' },
  { value: '21:9', label: '21:9', desc: '超宽' },
  { value: '9:21', label: '9:21', desc: '长图' },
];

const IMAGE_RESOLUTIONS = [
  { value: '1024', label: '1K', desc: '标准' },
  { value: '2048', label: '2K', desc: '高清' },
  { value: '4096', label: '4K', desc: '极清' },
];

const WEBUI_RESOLUTIONS = [
  { value: '512', label: '512', desc: 'SD' },
  { value: '768', label: '768', desc: 'SD+' },
  { value: '1024', label: '1024', desc: 'HD' },
];

const STEP_PRESETS = [
  { value: 15, label: '快速' },
  { value: 30, label: '标准' },
  { value: 50, label: '精细' },
  { value: 80, label: '极致' },
];

const PRESET_PROMPTS = [
  '一只穿西装的猫坐在办公桌前，超写实风格',
  '赛博朋克城市夜景，雨夜霓虹，电影感构图',
  '中国水墨山水，留白艺术，远山薄雾',
  '未来主义空间站，星云背景，细节丰富',
];

const MODE_OPTIONS: Array<{ value: CreativeMode; title: string; desc: string }> = [
  { value: 'generate', title: '图片生成', desc: '仅用提示词生成新图' },
  { value: 'edit', title: '图片编辑', desc: '上传 1 张参考图后编辑' },
  { value: 'compose', title: '图片合成', desc: '上传 2-4 张图进行合成' },
  { value: 'video', title: '视频生成', desc: '支持文生视频与图生视频' },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

export default function GeneratorPanel({
  params,
  onChange,
  mode,
  onModeChange,
  referenceImages,
  onReferenceImagesChange,
  onGenerate,
  isGenerating,
  error,
  apiConfig,
  availableModels,
  onOpenOptimizer,
}: GeneratorPanelProps) {
  const [localParams, setLocalParams] = useState(params);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeSizeInPrompt, setIncludeSizeInPrompt] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  const availableModes = useMemo(() => {
    return MODE_OPTIONS.filter((option) => {
      if (apiConfig.apiFormat === 'webui') return option.value === 'generate';
      if (apiConfig.apiFormat === 'grokVideo') return option.value === 'generate' || option.value === 'video';
      return true;
    });
  }, [apiConfig.apiFormat]);

  useEffect(() => {
    if (!availableModes.some((it) => it.value === mode)) {
      onModeChange('generate');
      onReferenceImagesChange([]);
    }
  }, [availableModes, mode, onModeChange, onReferenceImagesChange]);

  const resolutionOptions = apiConfig.apiFormat === 'webui' ? WEBUI_RESOLUTIONS : IMAGE_RESOLUTIONS;

  useEffect(() => {
    const valid = resolutionOptions.some((it) => it.value === localParams.resolution);
    if (!valid) {
      updateParam('resolution', apiConfig.apiFormat === 'webui' ? '1024' : '1024');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConfig.apiFormat]);

  const updateParam = <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
    const next = { ...localParams, [key]: value };
    setLocalParams(next);
    onChange(next);
  };

  const generateRandomSeed = () => {
    updateParam('seed', Math.floor(Math.random() * 2147483647));
  };

  const clearSeed = () => {
    updateParam('seed', null);
  };

  const handleModeChange = (nextMode: CreativeMode) => {
    onModeChange(nextMode);
    onReferenceImagesChange([]);
  };

  const handlePickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const dataUrls = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
    if (mode === 'edit' || mode === 'video') {
      onReferenceImagesChange([dataUrls[0]]);
      return;
    }
    onReferenceImagesChange([...referenceImages, ...dataUrls].slice(0, 4));
  };

  const currentRatio = ASPECT_RATIOS.find((r) => r.value === localParams.aspectRatio)?.desc ?? '';
  const currentResolution = resolutionOptions.find((r) => r.value === localParams.resolution)?.desc ?? '';

  const canGenerate =
    !!localParams.prompt.trim() &&
    (mode === 'generate' || mode === 'video' || (mode === 'edit' && referenceImages.length >= 1) || (mode === 'compose' && referenceImages.length >= 2));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] space-y-8 p-5 pb-8 lg:p-7">
        <section className="space-y-4 animate-fade-scale stagger-1">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-banana-light)] to-[var(--color-banana-medium)] shadow-[var(--shadow-banana)]">
              <div className="h-5 w-5 text-[var(--color-banana-dark)]">{Icons.wand}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">创作模式</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">根据当前 API 自动过滤可用模式</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {availableModes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleModeChange(option.value)}
                className={`rounded-2xl border p-3 text-left transition-all duration-300 ${
                  mode === option.value
                    ? 'border-transparent bg-gradient-to-br from-[var(--color-accent-highlight)] to-[#ff8a5c] text-white shadow-md'
                    : 'border-[rgba(42,36,32,0.1)] bg-white/70 hover:border-[rgba(42,36,32,0.2)]'
                }`}
              >
                <div className="text-sm font-semibold">{option.title}</div>
                <div className={`mt-1 text-xs ${mode === option.value ? 'text-white/85' : 'text-[var(--color-text-muted)]'}`}>{option.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {mode !== 'generate' && (
          <section className="space-y-4 animate-fade-scale stagger-2">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-coral-light)] to-[var(--color-coral)] shadow-lg">
                <div className="h-5 w-5 text-white">{Icons.image}</div>
              </div>
              <div>
                <h2 className="font-display text-xl tracking-wide">参考图片</h2>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {mode === 'edit' ? '编辑模式需上传 1 张图片' : mode === 'compose' ? '合成模式支持 2-4 张图片' : '可选上传 1 张图片用于图生视频'}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={mode === 'compose'}
              className="hidden"
              onChange={(e) => {
                void handlePickImages(e.target.files);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(42,36,32,0.2)] bg-white/55 px-4 py-6 text-sm text-[var(--color-text-secondary)] transition-all hover:bg-white/80"
            >
              <div className="h-4 w-4">{Icons.plus}</div>
              <span>{mode === 'compose' ? '添加参考图（最多 4 张）' : '选择参考图（可选）'}</span>
            </button>

            {referenceImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {referenceImages.map((url, index) => (
                  <div key={`${url.slice(0, 18)}-${index}`} className="group relative overflow-hidden rounded-xl border border-[rgba(42,36,32,0.1)] bg-white/70">
                    <img src={url} alt={`参考图${index + 1}`} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onReferenceImagesChange(referenceImages.filter((_, i) => i !== index))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="移除"
                    >
                      <div className="h-3.5 w-3.5">{Icons.close}</div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(42,36,32,0.12)] to-transparent" />

        <section className="space-y-6 animate-fade-scale stagger-3">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-banana-light)] to-[var(--color-banana-medium)] shadow-[var(--shadow-banana)]">
              <div className="h-5 w-5 text-[var(--color-banana-dark)]">{Icons.pencil}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">提示词</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">描述你想生成的内容</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="label-brutal mb-0">正向提示词</label>
                <button type="button" onClick={onOpenOptimizer} className="btn-brutal btn-brutal--secondary px-4 py-2 text-xs">
                  <div className="h-4 w-4">{Icons.sparkle}</div>
                  AI 优化
                </button>
              </div>
              <textarea
                className="input-brutal min-h-[130px] resize-y"
                placeholder="例如：柔和阳光下的印象派花园，莫奈笔触，电影感构图"
                value={localParams.prompt}
                onChange={(e) => updateParam('prompt', e.target.value)}
              />

              {includeSizeInPrompt && localParams.prompt && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="rounded-xl bg-[var(--color-banana-light)]/30 px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
                    {currentRatio} {currentResolution} ({localParams.aspectRatio} / {localParams.resolution}px)
                  </span>
                  <button type="button" className="text-xs text-[var(--color-text-muted)]" onClick={() => setIncludeSizeInPrompt(false)}>
                    隐藏
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {PRESET_PROMPTS.map((prompt, i) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => updateParam('prompt', prompt)}
                  className="rounded-xl border border-[rgba(42,36,32,0.12)] bg-white/70 px-4 py-2 text-xs font-mono transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-banana-medium)] hover:bg-[var(--color-banana-light)]"
                >
                  示例 {i + 1}
                </button>
              ))}
            </div>

            <div>
              <label className="label-brutal">负向提示词</label>
              <textarea
                className="input-brutal min-h-[82px] resize-y"
                placeholder="可选：不希望出现的元素"
                value={localParams.negativePrompt}
                onChange={(e) => updateParam('negativePrompt', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 animate-fade-scale stagger-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-coral-light)] to-[var(--color-coral)] shadow-lg">
              <div className="h-5 w-5 text-white">{Icons.aspectRatio}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">比例</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">选择画幅比例</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                type="button"
                onClick={() => updateParam('aspectRatio', ratio.value)}
                className={`rounded-2xl border p-3.5 text-sm font-mono transition-all duration-300 sm:p-4 ${
                  localParams.aspectRatio === ratio.value
                    ? 'scale-[1.02] border-[var(--color-banana-medium)] bg-[var(--color-banana-light)] shadow-md'
                    : 'border-[rgba(42,36,32,0.08)] bg-white/60 hover:border-[rgba(42,36,32,0.16)] hover:bg-white'
                }`}
              >
                <div className="font-bold">{ratio.label}</div>
                <div className="mt-1 text-xs opacity-65">{ratio.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-fade-scale stagger-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] shadow-lg">
              <div className="h-5 w-5 text-white">{Icons.resolution}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">分辨率</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {apiConfig.apiFormat === 'webui' ? 'WebUI 使用 SD 分辨率规格，不支持 4K' : '分辨率越高，生成耗时越长'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {resolutionOptions.map((res) => (
              <button
                key={res.value}
                type="button"
                onClick={() => updateParam('resolution', res.value)}
                className={`rounded-2xl border p-4 text-sm font-mono transition-all duration-300 ${
                  localParams.resolution === res.value
                    ? 'scale-[1.02] border-transparent bg-gradient-to-br from-[var(--color-accent-highlight)] to-[#ff8a5c] text-white shadow-md'
                    : 'border-[rgba(42,36,32,0.08)] bg-white/60 hover:border-[rgba(42,36,32,0.16)] hover:bg-white'
                }`}
              >
                <div className="text-lg font-bold">{res.label}</div>
                <div className="mt-1 text-xs opacity-75">{res.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-fade-scale stagger-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-banana-peel)] to-[var(--color-banana-dark)] shadow-lg">
              <div className="h-5 w-5 text-white">{Icons.robot}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">模型</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">选择生成模型</p>
            </div>
          </div>

          <div>
            <label className="label-brutal">生成模型</label>
            {availableModels.length > 0 ? (
              <select className="select-brutal" value={localParams.model} onChange={(e) => updateParam('model', e.target.value)}>
                <option value="">使用默认模型</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="input-brutal"
                placeholder={apiConfig.model || '例如：nano-banana-pro'}
                value={localParams.model}
                onChange={(e) => updateParam('model', e.target.value)}
              />
            )}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-[rgba(42,36,32,0.12)] bg-white/65 p-4 transition-all duration-300 hover:bg-white hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 text-[var(--color-text-secondary)]">{Icons.cog}</div>
            <span className="text-sm font-medium tracking-wide">高级设置</span>
          </div>
          <svg
            className="h-5 w-5 text-[var(--color-text-muted)] transition-transform duration-500"
            style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-700 ${showAdvanced ? 'max-h-[620px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-6 rounded-2xl border border-[rgba(42,36,32,0.08)] bg-white/75 p-5 backdrop-blur-sm shadow-sm">
            <div>
              <label className="label-brutal">采样步数</label>
              <div className="mb-3 grid grid-cols-4 gap-2">
                {STEP_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateParam('steps', preset.value)}
                    className={`rounded-xl border px-2.5 py-2 text-xs transition-all ${
                      localParams.steps === preset.value
                        ? 'border-transparent bg-[var(--color-text-primary)] text-white'
                        : 'border-[rgba(42,36,32,0.12)] bg-white/70'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={10}
                max={150}
                value={localParams.steps}
                onChange={(e) => updateParam('steps', parseInt(e.target.value, 10))}
                className="h-2 w-full cursor-pointer rounded-full accent-[var(--color-accent-highlight)]"
              />
              <div className="mt-1.5 text-right text-xs text-[var(--color-text-muted)]">{localParams.steps} steps</div>
            </div>

            <div>
              <label className="label-brutal">引导强度 (CFG)</label>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={localParams.guidance}
                onChange={(e) => updateParam('guidance', parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer rounded-full accent-[var(--color-accent-highlight)]"
              />
              <div className="mt-1.5 text-right text-xs text-[var(--color-text-muted)]">{localParams.guidance.toFixed(1)}</div>
            </div>

            <div>
              <label className="label-brutal">随机种子</label>
              <div className="flex gap-2.5">
                <input
                  type="number"
                  className="input-brutal min-w-0 flex-1"
                  placeholder="随机"
                  value={localParams.seed ?? ''}
                  onChange={(e) => updateParam('seed', e.target.value ? parseInt(e.target.value, 10) : null)}
                />
                <button type="button" onClick={generateRandomSeed} className="btn-brutal btn-brutal--secondary px-3.5" title="随机种子">
                  <div className="h-4 w-4">{Icons.dice}</div>
                </button>
                <button type="button" onClick={clearSeed} className="btn-brutal btn-brutal--outline px-3.5" title="清空种子">
                  <div className="h-4 w-4">{Icons.close}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-4 w-4">{Icons.warning}</div>
              <div className="whitespace-pre-wrap">{error}</div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-[rgba(42,36,32,0.08)] bg-[rgba(var(--color-bg-primary-rgb),0.92)] px-5 pb-2 pt-4 backdrop-blur-md lg:-mx-7 lg:px-7">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !canGenerate}
            className={`btn-brutal btn-brutal--primary flex w-full items-center justify-center gap-3 py-4 text-base animate-fade-scale stagger-7 ${
              isGenerating ? 'animate-pulse cursor-wait' : ''
            } ${!canGenerate ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isGenerating ? (
              <>
                <div className="h-5 w-5 animate-spin">{Icons.hourglass}</div>
                <span>处理中...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🍌</span>
                <span>{mode === 'generate' ? '生成图像' : mode === 'edit' ? '编辑图像' : mode === 'compose' ? '合成图像' : '生成视频'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
