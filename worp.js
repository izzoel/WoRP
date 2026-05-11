const CONFIG = {
  originHost: "depositori.zetware.id",
  publicHost: "depositori.prisma.unbl.ac.id",
  protocol: "https"
};

const ORIGIN = `${CONFIG.protocol}://${CONFIG.originHost}`;
const PUBLIC = `${CONFIG.protocol}://${CONFIG.publicHost}`;

const ASSET_PATH_PREFIXES = [
  "/build/",
  "/css/",
  "/images/",
  "/img/",
  "/js/",
  "/logo/",
  "/plugins/",
  "/prestasi/",
  "/profil/",
  "/thumbnails/",
  "/storage/",
  "/uploads/",
  "/upload/",
  "/assets/",
  "/media/",
  "/files/"
];

const ASSET_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i;

function isStaticAsset(pathname) {
  return (
    ASSET_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    ASSET_EXTENSIONS.test(pathname)
  );
}

function rewriteToPublic(value) {
  if (!value) return value;

  return value
    .replaceAll(`${ORIGIN}`, PUBLIC)
    .replaceAll(`http://${CONFIG.originHost}`, PUBLIC)
    .replaceAll(`//${CONFIG.originHost}`, `//${CONFIG.publicHost}`)
    .replaceAll(CONFIG.originHost, CONFIG.publicHost)
    .replaceAll("http://localhost", PUBLIC)
    .replaceAll("https://localhost", PUBLIC);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = `${ORIGIN}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);

    headers.set("Host", CONFIG.originHost);
    headers.set("X-Forwarded-Host", CONFIG.publicHost);
    headers.set("X-Forwarded-Proto", CONFIG.protocol);
    headers.set("X-Forwarded-Port", CONFIG.protocol === "https" ? "443" : "80");
    headers.delete("Accept-Encoding");

    if (isStaticAsset(url.pathname)) {
      headers.set("Referer", `${ORIGIN}/`);
      headers.set("Origin", ORIGIN);
      headers.set("Accept", request.headers.get("Accept") || "*/*");
    } else {
      headers.set("Referer", `${PUBLIC}/`);
      headers.set("Origin", PUBLIC);
    }

    const init = {
      method: request.method,
      headers,
      redirect: "manual"
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const response = await fetch(targetUrl, init);
    const newHeaders = new Headers(response.headers);

    const location = newHeaders.get("location");
    if (location) {
      newHeaders.set("location", rewriteToPublic(location));
    }

    const contentType = response.headers.get("content-type") || "";

    const shouldRewrite =
      contentType.includes("text/html") ||
      contentType.includes("text/css") ||
      contentType.includes("application/javascript") ||
      contentType.includes("text/javascript");

    if (shouldRewrite) {
      const originalBody = await response.text();
      const rewrittenBody = rewriteToPublic(originalBody);

      newHeaders.delete("content-length");
      newHeaders.delete("content-encoding");

      return new Response(rewrittenBody, {
        status: response.status,
        headers: newHeaders
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};