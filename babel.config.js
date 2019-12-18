const path = require('path')
const fs = require('fs-extra')

let srcPath = './src'
if (fs.existsSync(path.join(__dirname, '..', '..', 'node_modules'))) {
  srcPath = '../../src'
}

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module-resolver',
      {
        alias: {
          src: srcPath
        }
      }
    ]
  ]
}
