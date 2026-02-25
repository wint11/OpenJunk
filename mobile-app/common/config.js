
// 服务器地址
// 本地开发请使用本机 IP (例如 192.168.0.x:3000)
// 生产环境请使用公网 IP
export const BASE_URL = 'http://121.41.230.120:3000'; 
// export const BASE_URL = 'http://192.168.0.105:3000'; // 你的本地 IP

export const API = {
	PAPERS: `${BASE_URL}/api/v1/papers`,
	JOURNALS: `${BASE_URL}/api/v1/journals`,
	TRENDS: `${BASE_URL}/api/v1/trends`,
	PDF_BASE: `${BASE_URL}/uploads/pdfs/`
}
