module.exports = {
    publicPath: '/',
    outputDir: 'dist',
    assetsDir: 'static',
    devServer: {
        port: 8080, 
        open: true,
        overlay: {
            warnings: false,
            errors: true
        },
        proxy: {
            '/api': {
                target: 'https://lottery.gmerit.com/', 
                changeOrigin: true, 
                pathRewrite: {
                '^/api': 'api'
                }
            }
        }
    }
}