/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        V2RAY_SERVER: 'http://localhost:1254'
    },
    experimental: {
        externalDir: true,
    },
};

module.exports = nextConfig;