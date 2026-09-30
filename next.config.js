/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false, // Stäng av SWC (som genererar för modern ES-kod)
  transpilePackages: ['@supabase/supabase-js', '@supabase/gotrue-js', '@supabase/realtime-js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tvinga target till es5 för webbläsaren
      config.target = ['web', 'es5'];
    }
    return config;
  },
};

module.exports = nextConfig;
