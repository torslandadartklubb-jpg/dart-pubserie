/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@supabase/supabase-js', '@supabase/gotrue-js', '@supabase/realtime-js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = ['web', 'es5'];
    }
    return config;
  },
};

module.exports = nextConfig;
