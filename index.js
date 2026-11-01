/**
 * dsh-time — 时间确认工具
 *
 * 注册一个模型可调用的 `get_current_time` 工具，返回精确的本地时间/日期/星期/时区/UTC。
 * 目的在于让模型在涉及「今天/明天/几号/星期几/多久前」时先查真实时间，而不是凭记忆推断。
 *
 * 注意：这里直接用原始 ToolDefinition（不经 `@deepseek-ai/dsh-tools` 的 defineTool），
 * 因为 link 安装的插件目录不在 profile 的模块解析链上，import 内置包会失败。
 */
export const name = 'dsh-time'
export const inject = ['tools']

function pad(n) {
  return String(n).padStart(2, '0')
}

function snapshot() {
  const now = new Date()
  const offsetMinutes = -now.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  let timezone = 'local'
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local' } catch { /* noop */ }
  return {
    local: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()],
    timezone,
    offset: `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`,
    utc: now.toISOString(),
    timestamp: now.getTime(),
  }
}

export function apply(ctx) {
  ctx.effect(() =>
    ctx.tools.register({
      name: 'get_current_time',
      description:
        '获取当前精确时间（本地日期/时间/星期/时区/UTC/Unix 时间戳）。' +
        '涉及「今天 / 明天 / 昨天 / 几号 / 星期几 / 几天前 / 截止时间」等时间判断时，先调用本工具确认，不要凭记忆推断。',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          properties: {
            local: { type: 'string' },
            weekday: { type: 'string' },
            timezone: { type: 'string' },
            offset: { type: 'string' },
            utc: { type: 'string' },
            timestamp: { type: 'number' },
          },
          required: ['local', 'weekday', 'timezone', 'offset', 'utc', 'timestamp'],
          additionalProperties: false,
        },
        render: (_args, value) => [{
          type: 'text',
          text: [
            `本地时间：${value.local}（${value.weekday}）`,
            `时区：${value.timezone}（UTC${value.offset}）`,
            `UTC：${value.utc}`,
            `Unix 时间戳：${value.timestamp}`,
          ].join('\n'),
        }],
      },
      async execute() {
        return snapshot()
      },
    }),
    'dsh-time: get_current_time tool',
  )
}
