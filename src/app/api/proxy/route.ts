import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, apiKey, payload, type } = body;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: '缺少 endpoint 或 apiKey' },
        { status: 400 }
      );
    }

    // 规范化 endpoint
    const baseUrl = endpoint.replace(/\/+$/, '');
    
    // 根据类型选择 API 路径
    const apiPath = type === 'chat' ? '/v1/chat/completions' : '/v1/images/generations';
    const targetUrl = `${baseUrl}${apiPath}`;

    console.log(`[Proxy] POST ${targetUrl}`);
    console.log(`[Proxy] Payload:`, JSON.stringify(payload, null, 2));

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时

    try {
      // 转发请求到目标 API
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查响应类型
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      console.log(`[Proxy] Response status: ${response.status}, content-type: ${contentType}`);
      console.log(`[Proxy] Response preview:`, responseText.substring(0, 500));

      // 如果响应是 HTML，说明出错了
      if (contentType.includes('text/html') || responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
        console.error('[Proxy] Received HTML response');
        
        // 解析 HTML 错误类型给出更明确的提示
        let errorMsg = `服务器返回错误页面 (HTTP ${response.status})`;
        if (response.status === 504) {
          errorMsg = '网关超时 (504)。你的 NewAPI 代理响应超时了。\n\n解决方案：\n1. 在 NewAPI 后台增加超时时间（推荐 300 秒以上）\n2. 或直接使用原始 API 地址（如 http://175.24.178.176:4000）';
        } else if (response.status === 502) {
          errorMsg = '网关错误 (502)。API 代理服务器无法连接到后端服务。';
        } else if (response.status === 401 || response.status === 403) {
          errorMsg = '认证失败。请检查 API 密钥是否正确。';
        }
        
        return NextResponse.json(
          { error: errorMsg },
          { status: response.status }
        );
      }

      // 尝试解析 JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('[Proxy] Failed to parse JSON');
        return NextResponse.json(
          { error: `服务器返回了无效的响应格式。响应内容: ${responseText.substring(0, 200)}...` },
          { status: 500 }
        );
      }

      if (!response.ok) {
        const errorMsg = data.error?.message || data.error?.type || data.error || `HTTP ${response.status}`;
        return NextResponse.json(
          { error: String(errorMsg) },
          { status: response.status }
        );
      }

      console.log('[Proxy] Success!');
      return NextResponse.json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('[Proxy] Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时（5分钟）。服务器响应太慢或无法连接。' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理请求失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const apiKey = searchParams.get('apiKey');

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: '缺少 endpoint 或 apiKey' },
        { status: 400 }
      );
    }

    const baseUrl = endpoint.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/v1/models`;

    console.log(`[Proxy] GET ${targetUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      console.log(`[Proxy] GET Response status: ${response.status}, content-type: ${contentType}`);

      // 如果响应是 HTML
      if (contentType.includes('text/html') || responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
        console.error('[Proxy] GET Received HTML response');
        return NextResponse.json(
          { error: `服务器返回错误页面 (HTTP ${response.status})。请检查 API 地址和密钥。` },
          { status: response.status }
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        return NextResponse.json(
          { error: '服务器返回了无效的响应格式' },
          { status: 500 }
        );
      }

      if (!response.ok) {
        const errorMsg = data.error?.message || data.error || `HTTP ${response.status}`;
        return NextResponse.json(
          { error: String(errorMsg) },
          { status: response.status }
        );
      }

      return NextResponse.json(data);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('[Proxy] GET Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时。服务器无法连接。' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理请求失败' },
      { status: 500 }
    );
  }
}
