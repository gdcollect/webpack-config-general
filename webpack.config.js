/**
 * This is the configuration file for Webpack.
 * What settings we have for webpack here:
 * - Entry: The entrypoint of the graph for resolving dependencies
 * - Output: The output folder and file name of the bundle
 * - Plugins:
 *   - HtmlWebpackPlugin: Generate the static HTML contents from template
 *   - MiniCssExtractPlugin: Extract CSS generated from SCSS files into separate file 
 *     - This is for production only
 *     - For development: We only use style-loader
 *   - OptimizeCSSAssetsPlugin: Optimize and minify CSS (Production only)
 *   - PurgecssPlugin: Purge unused CSS styles of external framework (Production only)
 *   - Autoprefixer: Automatically prefix some CSS rules for browser compatibility. Used with postcss-loader and glob
 */

// DEPENDENCIES
// ************

require('dotenv').config()
const { join } = require('path')
const glob = require('glob')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')
const Autoprefixer = require('autoprefixer')

const { WDS_HOST, WDS_PORT } = process.env // Settings for Webpack-dev-server

// HELPER FUNCTIONS
// ****************

const isProduction = env => env === 'production'

// WEBPACK CONFIG
// **************

// --- ENTRY / OUTPUT ---
// **********************

const entry = { 
  index: './src/index.js' 
}
const output = {
  filename: 'bundle.js',
  path: join(__dirname, 'dist')
}

// --- MODULE / LOADERS ---
// ************************

const webpackModule = env => ({
  rules: [{
    // Handle JS, JSX and MJS files
    test: /\.m?jsx?$/,
    exclude: [/(node_modules)/], // Must be a RegExp
    use: [{
      loader: 'babel-loader',
      options: { presets: ['@babel/preset-env'] }
    }]
  }, { 
    // Handle CSS, SASS, and SCSS files
    test: [/\.s?css$/, /\.sass$/],
    exclude: [/node_modules/], // Must be a RegExp
    use: [{
      loader: isProduction(env) ? MiniCssExtractPlugin.loader : 'style-loader', // Extract CSS to separate file: main.css
      options: { sourceMap: isProduction(env) ? false : true }
    }, { 
      loader: 'css-loader',
      options: { sourceMap: isProduction(env) ? false : true }
    }, {
      loader: 'postcss-loader',
      options: { plugins: () => [Autoprefixer()] },
    }, { 
      loader: 'sass-loader',
      options: { sourceMap: isProduction(env) ? false : true }
    }]
  }]
})

// --- PLUGINS ---
// ***************

const plugins = [
  // Auto-generate index.html
  new HtmlWebpackPlugin({
    title: 'Webpack Demo',
    template: 'src/templates/index.html'
  }),
  // Extract CSS to separate file for production mode: [name] is the 'entry'
  new MiniCssExtractPlugin({ 
    filename: '[name].css' 
  }),
  // Purge unused CSS: Must be used AFTER MiniCssExtractPlugin. CSS-Mapping is lost. Used in production only.
  new PurgecssPlugin({
    paths: glob.sync(`${join(__dirname, 'src')}/**/*`,  { 
      nodir: true 
    }),
  })
]

// --- OPTIMIZATIONS FOR PRODUCTION ---
// ************************************

const optimize = {
  minimizer: [new OptimizeCSSAssetsPlugin({})]
}

// --- WEBPACK-DEV-SERVER ---
// **************************

const devServer = {
  host: WDS_HOST, // Default: `localhost`
  port: WDS_PORT, // Default: 8080
  open: false, // Automatically open the page in browser
  historyApiFallback: true, // Using HTML5 History API based routing
  overlay: true, // Error overlay to capture compilation related warnings and errors
  contentBase: join(__dirname, 'dist') // Contents not passing through webpack are served directly from this folder
  // proxy: { "/api": "http://my.api/endpoint" } // If using multiple servers, proxy WDS to them
  // header: // Attach custom headers to your requests here
}

// EXPORT CONFIG
// *************
// 'process.env' is automatically passed to the function during the build call
// Any other arguments during the call is passed as 'argv'

module.exports = (env, argv) => ({
  mode: env,
  entry, 
  output,
  plugins,
  module: webpackModule(env),
  optimization: isProduction(env) ? optimize : {},
  devServer: isProduction(env) ? {} : devServer,
  devtool: isProduction(env) ? false : 'cheal-module-eval-source-map'
})
