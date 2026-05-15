import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@huggingface/transformers', 'pdf-parse'],
};

export default nextConfig;
