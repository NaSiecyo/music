export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  // 将 /api/xxx 的请求转发到你的 ncm-api 后端
  const targetPath = url.pathname.replace('/api/', '/');
  const targetUrl = `https://nmapi.furryopen.com${targetPath}${url.search}`; // 替换为你的API域名
  const resp = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
  });
  const newHeaders = new Headers(resp.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  return new Response(resp.body, {
    status: resp.status,
    headers: newHeaders,
  });
}
