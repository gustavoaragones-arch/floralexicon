import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * `cloudflare: {}` matches the requested default block; `...defineCloudflareConfig()`
 * supplies required adapter fields (so it must come after that key).
 * `buildCommand` avoids infinite recursion when `npm run build` is `opennextjs-cloudflare build`.
 */
export default {
  cloudflare: {},
  buildCommand: "npx next build",
  ...defineCloudflareConfig(),
};
