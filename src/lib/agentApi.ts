export type AgentChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function sendAgentChat(messages: AgentChatMessage[]): Promise<string> {
  const res = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  let data: { reply?: string; error?: string } = {}
  try {
    data = (await res.json()) as { reply?: string; error?: string }
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data.error || `对话失败（${res.status}）`)
  }
  if (!data.reply) throw new Error(data.error || '没有收到回复')
  return data.reply
}
