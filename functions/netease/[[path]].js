export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  let targetPath = url.pathname.replace('/netease/', '/');

  // R3PLAYX 用的路径 → ncm-api 实际路径 的映射
  const pathMap = {
    '/personal/fm': '/personal_fm',
    '/personal/fm/trash': '/fm_trash',
  };
  targetPath = pathMap[targetPath] || targetPath;

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
