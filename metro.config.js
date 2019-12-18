const path = require('path')
const fs = require('fs-extra')

const watchFolders = []
if (fs.existsSync(path.join(__dirname, '..', '..', 'node_modules'))) {
  watchFolders.push(path.resolve(__dirname, '../..'))
}

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
  watchFolders
}
