interface Arg {
  key: string
  value: string
  description: string
}

export interface McpConfig {
  name: string
  version: string
  type: string
  host: string
  description: string
  args: Arg[]
}
