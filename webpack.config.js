const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // ... existing config
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        },
        // Separate lazy components
        lazyComponents: {
          test: /[\\/]src[\\/]components[\\/].*\.tsx$/,
          name: 'lazy-components',
          chunks: 'async',
          priority: 3
        },
        // Separate services
        services: {
          test: /[\\/]src[\\/]services[\\/].*\.ts$/,
          name: 'services',
          chunks: 'all',
          priority: 2
        }
      }
    },
    runtimeChunk: 'single'
  },
  plugins: [
    // Bundle analyzer (uncomment to analyze bundle)
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    //   reportFilename: 'bundle-report.html'
    // })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
}; 