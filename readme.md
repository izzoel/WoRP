# Cloudflare Worker Reverse Proxy

Worker ini digunakan untuk memproxy:

- Public: `sivo.zetware.id`
- Origin: `sivo.unbl.ac.id`

## Konfigurasi

Edit bagian berikut di `worker.js`:

```js
const CONFIG = {
  originHost: "sivo.unbl.ac.id",
  publicHost: "sivo.zetware.id",
  protocol: "https",
};
```
