import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function agentChatProxy(): Plugin {
  return {
    name: 'agent-chat-proxy',
    configureServer(server) {
      server.middlewares.use('/api/agent-chat', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        req.on('end', async () => {
          try {
            const env = loadEnv(server.config.mode, server.config.root, '')
            const apiKey = env.DASHSCOPE_API_KEY || ''
            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(
                JSON.stringify({
                  error: '本地未配置 DASHSCOPE_API_KEY。请在 .env 里填写阿里云百炼 API Key。',
                }),
              )
              return
            }

            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as {
              messages?: unknown
              model?: string
              temperature?: number
            }
            const model = body.model || env.DASHSCOPE_MODEL || 'qwen-plus'
            const upstream = await fetch(
              'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model,
                  messages: body.messages,
                  temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
                }),
              },
            )
            const data = (await upstream.json()) as {
              choices?: Array<{ message?: { content?: string } }>
              error?: { message?: string }
              message?: string
              model?: string
            }
            res.statusCode = upstream.ok ? 200 : upstream.status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            if (!upstream.ok) {
              res.end(
                JSON.stringify({
                  error: data?.error?.message || data?.message || `百炼接口错误 ${upstream.status}`,
                }),
              )
              return
            }
            res.end(
              JSON.stringify({
                reply: data?.choices?.[0]?.message?.content || '',
                model: data?.model || model,
              }),
            )
          } catch (error) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : '代理失败' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), agentChatProxy()],
  // 相对路径，方便上传到任意静态托管（国内平台也适用）
  base: './',
})
