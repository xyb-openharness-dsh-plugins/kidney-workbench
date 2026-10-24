/* 路由表：独立启动（dev-server）与 DSH 宿主两条链路共用这一份。
 *
 * 为什么要抽出来：不抽的话 `/api/kidney/bootstrap` 会有两个实现，本地能开、装进 Desktop
 * 就 404（食管癌那轮踩过）。这里只依赖 node 内置模块，**不许 import Schemastery**
 * —— 独立启动时那个 peer 依赖并不存在。
 *
 * 鉴权不在这里：宿主链路由 dsh/index.js 先过 `connection.requestRejection`，
 * 独立启动本来就只有本机访问，不需要登录态。
 *
 * M6 最小集只有四条：/health、/bootstrap、/profile/:key、/ui/*。
 * MinerU 导入（/import、/candidate/*、/settings/mineru）属 M7 及以后的增量，
 * 相应的 parse.js / settings.js 不在本仓，这里也就不留空路由占位。
 */

export const API_PREFIX = '/api/kidney'
export const UI_PREFIX = `${API_PREFIX}/ui`

function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': buf.length, 'cache-control': 'no-store' })
  res.end(buf)
}

function errorBody(error) {
  return { status: 500, body: { error: 'internal_error', message: error.message } }
}

/**
 * @param {object} opts
 * @param {{bootstrap():object, profile(key:string, opts?:object):object|null, db:object}} opts.source
 * @param {string} opts.version
 * @param {string} opts.build
 * @param {(req:object,res:object,path:string)=>boolean} opts.serveUi 静态文件出口（两条链路的 public/ 定位不同）
 * @param {string|null|(()=>string|null)} [opts.failure] 数据源打不开的原因；非空时除 /health 外一律 503。
 *   **允许传函数**：宿主进程常在装包之前就启动了，插件若把"打不开"定死成构造时的一个字符串，
 *   用户装好新包、只重开工作台时看到的永远是同一句错（小甲宝 0.3.0 真机踩过）。传函数则每次
 *   请求重新取值，数据源自愈后错误自然消失。
 */
export function createApiHandler({ source, version, build, serveUi, failure = null }) {
  /* 一次取值，按请求求值：failure 可以是字符串（老调用方式）或函数（懒重试）。 */
  const failureOf = () => (typeof failure === 'function' ? failure() : failure)
  return function handle(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1')
    const path = url.pathname
    const why = failureOf()

    if (path === `${API_PREFIX}/health`) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      return sendJson(res, 200, {
        ok: !why, version, build, apiVersion: 'v1', ui: UI_PREFIX,
        capabilities: ['bootstrap', 'profile'],
        error: why || undefined,
      })
    }

    /* 数据源打不开：/health 已经报了原因，其它接口统一 503，不假装返回空数据。 */
    const unavailable = (res2) => sendJson(res2, 503, { error: 'bootstrap_unavailable', message: why })
    if (why && path !== `${API_PREFIX}/health` && !(path === UI_PREFIX || path.startsWith(`${UI_PREFIX}/`))) return unavailable(res)

    if (path === `${API_PREFIX}/bootstrap`) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      try {
        return sendJson(res, 200, source.bootstrap())
      } catch (error) {
        const { status, body } = errorBody(error)
        return sendJson(res, status, body)
      }
    }

    /* 单档案；私密过滤在前端 sharedOnly 一处做（MPM 口径）。 */
    const profileMatch = path.match(new RegExp(`^${API_PREFIX}/profile/([^/]+)$`))
    if (profileMatch) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      const key = decodeURIComponent(profileMatch[1])
      const profile = source.profile(key)
      if (!profile) return sendJson(res, 404, { error: 'profile_not_found', key })
      return sendJson(res, 200, { profile })
    }

    if (path === UI_PREFIX || path.startsWith(`${UI_PREFIX}/`)) {
      return void serveUi(req, res, path.slice(UI_PREFIX.length) || '/')
    }
    return sendJson(res, 404, { error: 'not_found', path })
  }
}
