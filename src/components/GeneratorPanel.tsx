'use client';

import { useEffect, useState } from 'react';
import type { GenerationParams, ApiConfig } from '@/app/page';
import { Icons } from './Icons';

interface GeneratorPanelProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
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

const RESOLUTIONS = [
  { value: '1024', label: '1K', desc: '标准' },
  { value: '2048', label: '2K', desc: '高清' },
  { value: '4096', label: '4K', desc: '极致' },
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

export default function GeneratorPanel({
  params,
  onChange,
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

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

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

  const currentRatio = ASPECT_RATIOS.find((r) => r.value === localParams.aspectRatio)?.desc ?? '';
  const currentResolution = RESOLUTIONS.find((r) => r.value === localParams.resolution)?.desc ?? '';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] space-y-8 p-5 pb-8 lg:p-7">
        <section className="space-y-6 animate-fade-scale stagger-1">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-banana-light)] to-[var(--color-banana-medium)] shadow-[var(--shadow-banana)] flex items-center justify-center">
              <div className="h-5 w-5 text-[var(--color-banana-dark)]">{Icons.pencil}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">提示词</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">描述你想生成的图像内容</p>
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

        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(42,36,32,0.12)] to-transparent" />

        <section className="space-y-6 animate-fade-scale stagger-2">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-coral-light)] to-[var(--color-coral)] shadow-lg flex items-center justify-center">
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

        <section className="space-y-6 animate-fade-scale stagger-3">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] shadow-lg flex items-center justify-center">
              <div className="h-5 w-5 text-white">{Icons.resolution}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">分辨率</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">分辨率越高，生成耗时越长</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {RESOLUTIONS.map((res) => (
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

        <section className="space-y-6 animate-fade-scale stagger-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--color-banana-peel)] to-[var(--color-banana-dark)] shadow-lg flex items-center justify-center">
              <div className="h-5 w-5 text-white">{Icons.robot}</div>
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide">模型</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">选择图像生成模型</p>
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
              <>
                <input
                  type="text"
                  className="input-brutal"
                  placeholder={apiConfig.model || '例如：nano-banana-pro'}
                  value={localParams.model}
                  onChange={(e) => updateParam('model', e.target.value)}
                />
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">配置 API 后可自动拉取可用模型。</p>
              </>
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
            disabled={isGenerating || !localParams.prompt.trim()}
            className={`btn-brutal btn-brutal--primary flex w-full items-center justify-center gap-3 py-4 text-base animate-fade-scale stagger-5 ${
              isGenerating ? 'animate-pulse cursor-wait' : ''
            } ${!localParams.prompt.trim() ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isGenerating ? (
              <>
                <div className="h-5 w-5 animate-spin">{Icons.hourglass}</div>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🍌</span>
                <span>生成图像</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
