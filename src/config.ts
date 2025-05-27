export const WEB_PORT = Number(process.env.WEB_PORT || 3000)
export const WEB_BASE_URL = `http://localhost:${WEB_PORT}`

export const API_PORT = Number(process.env.API_PORT || 3001)
export const API_BASE_URL = `http://localhost:${API_PORT}`

export const MCP_PORT = Number(process.env.MCP_PORT || 3002)
export const MCP_BASE_URL = `http://localhost:${MCP_PORT}`
