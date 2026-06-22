/** @type {import('next').NextConfig} */
const nextConfig = {
  // R3F sets up the GL context imperatively; StrictMode's double-invoke in dev
  // can create/dispose the WebGL context twice. Disabled for canvas stability.
  reactStrictMode: false,
};

export default nextConfig;
