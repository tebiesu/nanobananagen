'use client';

import { useEffect, useState } from 'react';
import type { ApiFormat } from '@/app/page';

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
  availableModels: string[];
  aiConfig: AiAssistantConfig;
  onAiConfigChange: (config: AiAssistantConfig) => void;
  aiAvailableModels: string[];
}

const API_FORMATS: Array<{ value: ApiFormat; label: string; desc: string }> = [
  { value: 'chat', label: '聊天补全', desc: '/v1/chat/completions' },
  { value: 'images', label: '图像生成', desc: '/v1/images/generations' },
];

export default function ApiConfigPanel({
  config,
  onChange,
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

  useEffect(() => setLocalConfig(config), [config]);
  useEffect(() => setLocalAiConfig(aiConfig), [aiConfig]);

  const updateConfig = <K extends keyof ApiConfig>(key: K, value: ApiConfig[K]) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const updateAiConfig = <K extends keyof AiAssistantConfig>(key: K, value: AiAssistantConfig[K]) => {
    setLocalAiConfig((prev) => ({ ...prev, [key]: value }));
    setAiTestResult(null);
  };

  const handleImageTest = async () => {
    if (!localConfig.endpoint || !localConfig.apiKey) {
      setTestResult('error');
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

      setTestResult('success');
      onChange(localConfig);
      onAiConfigChange(localAiConfig);
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
              <div className="grid grid-cols-2 gap-2.5">
                {API_FORMATS.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => updateConfig('apiFormat', format.value)}
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

            <div>
              <label className="label-brutal">API 密钥</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input-brutal pr-20"
                  placeholder="sk-..."
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
              <label className="label-brutal">模型</label>
              {availableModels.length > 0 ? (
                <select
                  className="select-brutal"
                  value={localConfig.model}
                  onChange={(e) => updateConfig('model', e.target.value)}
                >
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
                  placeholder="nano-banana-pro"
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
                {testResult === 'success' ? '连接成功，配置已保存。' : '连接失败，请检查 API 地址和密钥。'}
              </div>
            )}

            <button
              type="submit"
              disabled={isTesting || !localConfig.endpoint || !localConfig.apiKey}
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
                checked={
                  localAiConfig.endpoint === localConfig.endpoint &&
                  localAiConfig.apiKey === localConfig.apiKey
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setLocalAiConfig({
                      endpoint: localConfig.endpoint,
                      apiKey: localConfig.apiKey,
                      model: localAiConfig.model,
                    });
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
                <select
                  className="select-brutal"
                  value={localAiConfig.model}
                  onChange={(e) => updateAiConfig('model', e.target.value)}
                >
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
