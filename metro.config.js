const path = require('path')

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
  watchFolders: [
    path.resolve(__dirname, '../../src')
  ],
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (target.hasOwnProperty(name)) { // eslint-disable-line
            return target[name]
          }
          return path.join(process.cwd(), `node_modules/${name}`)
        }
      }
    )
  }
}
