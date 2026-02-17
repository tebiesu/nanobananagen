'use client';

import { useEffect, useState } from 'react';
import type { ApiFormat } from '@/app/page';

const WEBUI_ENDPOINT = 'https://sd.exacg.cc';

const WEBUI_MODELS = [
  { value: '0', label: '0 - Miaomiao Harem vPred Dogma 1.1' },
  { value: '1', label: '1 - MiaoMiao Pixel 像素 1.0' },
  { value: '2', label: '2 - NoobAIXL V1.1' },
  { value: '3', label: '3 - NoobAIXL V1.0' },
  { value: '4', label: '4 - illustrious_pencil 融合' },
  { value: '5', label: '5 - Z-Image' },
  { value: '6', label: '6 - MiaoMiao RealSkin EPS 1.3' },
  { value: '7', label: '7 - Newbie exp 0.1' },
  { value: '8', label: '8 - Newbie exp 0.1 (Server)' },
  { value: '9', label: '9 - MiaoMiao RealSkin vPred 1.1' },
  { value: '10', label: '10 - MiaoMiao RealSkin vPred 1.0' },
  { value: '11', label: '11 - Wainsfw illustrious v16' },
  { value: '12', label: '12 - Wainsfw illustrious v15' },
  { value: '13', label: '13 - MiaoMiao Harem 1.75' },
  { value: '14', label: '14 - MiaoMiao Harem 1.6G' },
  { value: '15', label: '15 - Wainsfw Illustrious v13 (A)' },
  { value: '16', label: '16 - Wainsfw Illustrious v13 (B)' },
  { value: '17', label: '17 - Wainsfw Illustrious v11' },
  { value: '18', label: '18 - 真人模型 Nsfw-Real' },
];

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  apiFormat: ApiFormat;
}

export interface AiAssistantConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

interface ApiConfigPanelProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onFormatChange: (format: ApiFormat) => void;
  availableModels: string[];
  aiConfig: AiAssistantConfig;
  onAiConfigChange: (config: AiAssistantConfig) => void;
  aiAvailableModels: string[];
}

const API_FORMATS: Array<{ value: ApiFormat; label: string; desc: string }> = [
  { value: 'chat', label: '聊天补全', desc: '/v1/chat/completions' },
  { value: 'images', label: '图像生成', desc: '/v1/images/generations' },
  { value: 'webui', label: 'WebUI 云算力', desc: '/api/v1/generate_image' },
  { value: 'grokVideo', label: 'Grok 视频', desc: '/v1/chat/completions' },
];

export default function ApiConfigPanel({
  config,
  onChange,
  onFormatChange,
  availableModels,
  aiConfig,
  onAiConfigChange,
  aiAvailableModels,
}: ApiConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [localAiConfig, setLocalAiConfig] = useState(aiConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAiTesting, setIsAiTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [aiTestResult, setAiTestResult] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'ai'>('image');
  const [useSameApi, setUseSameApi] = useState(false);

  useEffect(() => setLocalConfig(config), [config]);
  useEffect(() => setLocalAiConfig(aiConfig), [aiConfig]);

  useEffect(() => {
    const same = aiConfig.endpoint === config.endpoint && aiConfig.apiKey === config.apiKey && !!config.endpoint && !!config.apiKey;
    setUseSameApi(same);
  }, [aiConfig.endpoint, aiConfig.apiKey, config.endpoint, config.apiKey]);

  useEffect(() => {
    if (!useSameApi) return;
    setLocalAiConfig((prev) => ({
      ...prev,
      endpoint: localConfig.endpoint,
      apiKey: localConfig.apiKey,
    }));
    setAiTestResult(null);
  }, [useSameApi, localConfig.endpoint, localConfig.apiKey]);

  const updateConfig = <K extends keyof ApiConfig>(key: K, value: ApiConfig[K]) => {
    setLocalConfig((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'apiFormat' && value === 'webui') {
        next.endpoint = WEBUI_ENDPOINT;
        if (!next.model) next.model = '0';
      }
      if (key === 'apiFormat' && value === 'grokVideo' && !next.model) {
        next.model = 'grok-imagine-0.9';
      }
      return next;
    });
    setTestResult(null);
  };

  const updateAiConfig = <K extends keyof AiAssistantConfig>(key: K, value: AiAssistantConfig[K]) => {
    setLocalAiConfig((prev) => ({ ...prev, [key]: value }));
    setAiTestResult(null);
  };

  const persistImageConfig = () => {
    onChange(localConfig);
    onAiConfigChange(
      useSameApi
        ? { ...localAiConfig, endpoint: localConfig.endpoint, apiKey: localConfig.apiKey }
        : localAiConfig,
    );
  };

  const handleImageTest = async () => {
    const requiresEndpoint = localConfig.apiFormat !== 'webui';
    if ((requiresEndpoint && !localConfig.endpoint) || !localConfig.apiKey) {
      setTestResult('error');
      return;
    }

    if (localConfig.apiFormat === 'webui') {
      persistImageConfig();
      setTestResult('success');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(localConfig.endpoint)}&apiKey=${encodeURIComponent(localConfig.apiKey)}`,
      );
      if (!response.ok) {
        setTestResult('error');
        return;
      }
      persistImageConfig();
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleAiTest = async () => {
    if (!localAiConfig.endpoint || !localAiConfig.apiKey) {
      setAiTestResult('error');
      return;
    }

    setIsAiTesting(true);
    setAiTestResult(null);

    try {
      const response = await fetch(
        `/api/proxy?endpoint=${encodeURIComponent(localAiConfig.endpoint)}&apiKey=${encodeURIComponent(localAiConfig.apiKey)}`,
      );
      if (!response.ok) {
        setAiTestResult('error');
        return;
      }
      setAiTestResult('success');
      onAiConfigChange(localAiConfig);
    } catch {
      setAiTestResult('error');
    } finally {
      setIsAiTesting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (activeTab === 'image') {
          void handleImageTest();
        } else {
          void handleAiTest();
        }
      }}
      className="border-b border-[rgba(42,36,32,0.08)] bg-white/75 backdrop-blur-md"
    >
      <div className="grid grid-cols-2 gap-1.5 bg-[var(--color-bg-secondary)]/45 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-300 ${
            activeTab === 'image'
              ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:bg-white/60 hover:text-[var(--color-text-primary)]'
          }`}
        >
          图像生成 API
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-300 ${
            activeTab === 'ai'
              ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:bg-white/60 hover:text-[var(--color-text-primary)]'
          }`}
        >
          AI 助手 API
        </button>
      </div>

      <div className="p-5 lg:p-6">
        {activeTab === 'image' ? (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label-brutal">API 格式</label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {API_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => {
                      onFormatChange(format.value);
                      setTestResult(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      localConfig.apiFormat === format.value
                        ? 'border-[var(--color-banana-dark)] bg-gradient-to-br from-[var(--color-banana-light)] to-[var(--color-banana-medium)] shadow-sm'
                        : 'border-[rgba(42,36,32,0.1)] bg-white/65 hover:border-[rgba(42,36,32,0.18)]'
                    }`}
                  >
                    <div className="text-sm font-medium">{format.label}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {localConfig.apiFormat !== 'webui' && (
              <div>
                <label className="label-brutal">API 地址</label>
                <input
                  type="url"
                  className="input-brutal"
                  placeholder="https://api.example.com"
                  value={localConfig.endpoint}
                  onChange={(e) => updateConfig('endpoint', e.target.value)}
                />
              </div>
            )}

            {localConfig.apiFormat === 'webui' && (
              <div className="rounded-xl border border-[rgba(42,36,32,0.1)] bg-white/65 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                已内置 WebUI 服务地址：<span className="font-mono">{WEBUI_ENDPOINT}</span>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="label-brutal mb-0">API 密钥</label>
                {localConfig.apiFormat === 'webui' && (
                  <a
                    href={WEBUI_ENDPOINT}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-accent-highlight)] hover:underline"
                  >
                    获取密钥
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input-brutal pr-20"
                  placeholder="请输入 API Key"
                  value={localConfig.apiKey}
                  onChange={(e) => updateConfig('apiKey', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <div>
              <label className="label-brutal">{localConfig.apiFormat === 'webui' ? '模型索引' : '模型'}</label>
              {localConfig.apiFormat === 'webui' ? (
                <select className="select-brutal" value={localConfig.model || '0'} onChange={(e) => updateConfig('model', e.target.value)}>
                  {WEBUI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              ) : availableModels.length > 0 ? (
                <select className="select-brutal" value={localConfig.model} onChange={(e) => updateConfig('model', e.target.value)}>
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
                  placeholder={localConfig.apiFormat === 'grokVideo' ? 'grok-imagine-0.9' : 'nano-banana-pro'}
                  value={localConfig.model}
                  onChange={(e) => updateConfig('model', e.target.value)}
                />
              )}
            </div>

            {testResult && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  testResult === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {testResult === 'success' ? '连接成功，配置已保存。' : '连接失败，请检查配置。'}
              </div>
            )}

            <button
              type="submit"
              disabled={isTesting || !localConfig.apiKey || (localConfig.apiFormat !== 'webui' && !localConfig.endpoint)}
              className={`btn-brutal btn-brutal--primary w-full ${isTesting ? 'animate-pulse' : ''}`}
            >
              {isTesting ? '测试中...' : '测试并保存'}
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <p className="rounded-xl border border-[var(--color-banana-medium)]/35 bg-[var(--color-banana-light)]/25 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              AI 助手用于优化提示词，可与图像接口共用，也可单独配置。
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-[rgba(42,36,32,0.08)] bg-white/65 px-4 py-3">
              <input
                id="sameApi"
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-accent-highlight)]"
                checked={useSameApi}
                onChange={(e) => {
                  setUseSameApi(e.target.checked);
                  if (e.target.checked) {
                    setLocalAiConfig({
                      endpoint: localConfig.endpoint,
                      apiKey: localConfig.apiKey,
                      model: localAiConfig.model,
                    });
                    setAiTestResult(null);
                  }
                }}
              />
              <label htmlFor="sameApi" className="text-sm text-[var(--color-text-secondary)]">
                使用与图像生成相同的 API
              </label>
            </div>

            <div>
              <label className="label-brutal">API 地址</label>
              <input
                type="url"
                className="input-brutal"
                placeholder="https://api.openai.com"
                value={localAiConfig.endpoint}
                onChange={(e) => updateAiConfig('endpoint', e.target.value)}
                disabled={useSameApi}
              />
            </div>

            <div>
              <label className="label-brutal">API 密钥</label>
              <div className="relative">
                <input
                  type={showAiApiKey ? 'text' : 'password'}
                  className="input-brutal pr-20"
                  placeholder="sk-..."
                  value={localAiConfig.apiKey}
                  onChange={(e) => updateAiConfig('apiKey', e.target.value)}
                  disabled={useSameApi}
                />
                <button
                  type="button"
                  onClick={() => setShowAiApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]"
                >
                  {showAiApiKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <div>
              <label className="label-brutal">聊天模型</label>
              {aiAvailableModels.length > 0 ? (
                <select className="select-brutal" value={localAiConfig.model} onChange={(e) => updateAiConfig('model', e.target.value)}>
                  <option value="">使用默认模型</option>
                  {aiAvailableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input-brutal"
                  placeholder="gpt-4 / claude-sonnet"
                  value={localAiConfig.model}
                  onChange={(e) => updateAiConfig('model', e.target.value)}
                />
              )}
            </div>

            {aiTestResult && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  aiTestResult === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {aiTestResult === 'success' ? 'AI 助手连接成功。' : 'AI 助手连接失败，请检查配置。'}
              </div>
            )}

            <button
              type="submit"
              disabled={isAiTesting || !localAiConfig.endpoint || !localAiConfig.apiKey}
              className={`btn-brutal btn-brutal--primary w-full ${isAiTesting ? 'animate-pulse' : ''}`}
            >
              {isAiTesting ? '测试中...' : '测试并保存'}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
