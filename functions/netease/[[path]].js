export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 转发到你的 ncm-api 域名（注意：把 /netease/ 换成 /）
  const targetPath = url.pathname.replace('/netease/', '/');
  const targetUrl = `https://nmapi.furryopen.com${targetPath}${url.search}`;

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
