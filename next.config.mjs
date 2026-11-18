/** @type {import('next').NextConfig} */
const web3FormsAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? process.env.WEB3FORMS_ACCESS_KEY;

const nextConfig = {
  ...(web3FormsAccessKey ? {
    // Web3Forms uses a public access key for direct browser submissions.
    env: { NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY: web3FormsAccessKey },
  } : {}),
  allowedDevOrigins: ['127.0.0.1'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader'],
    });
    return config;
  },
};

export default nextConfig;
