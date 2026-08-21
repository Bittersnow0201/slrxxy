/**
 * EdgeOne Pages Function
 * 路由：/api/agent-chat
 * 环境变量：DASHSCOPE_API_KEY（百炼 / DashScope API Key）
 * 可选：DASHSCOPE_MODEL（默认 qwen-plus）
 */
export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (request.method !== 'POST') {
    return json({ error: '只支持 POST' }, 405)
  }

  const apiKey = (env && (env.DASHSCOPE_API_KEY || env.DASHSCOPE_API_KEY_SLRXXY)) || ''
  if (!apiKey) {
    return json(
      {
        error:
          '未配置 DASHSCOPE_API_KEY。请在 EdgeOne 项目环境变量中填写阿里云百炼 API Key。',
      },
      500,
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: '请求体无效' }, 400)
  }

  const messages = Array.isArray(body?.messages) ? body.messages : null
  if (!messages || messages.length === 0) {
    return json({ error: '缺少 messages' }, 400)
  }

  const model = body?.model || (env && env.DASHSCOPE_MODEL) || 'qwen-plus'

  try {
    const upstream = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: typeof body?.temperature === 'number' ? body.temperature : 0.7,
      }),
    })

    const data = await upstream.json()
    if (!upstream.ok) {
      const msg = data?.error?.message || data?.message || `百炼接口错误 ${upstream.status}`
      return json({ error: msg }, upstream.status)
    }

    const reply = data?.choices?.[0]?.message?.content
    if (!reply) return json({ error: '模型没有返回内容' }, 502)

    return json({ reply, model: data?.model || model })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '调用失败' }, 502)
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  })
}
