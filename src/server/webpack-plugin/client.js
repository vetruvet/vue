const hash = require('hash-sum')
const uniq = require('lodash.uniq')
import { isJS, isCSS, getAssetName, onEmit, stripModuleIdHash } from './util'

export default class VueSSRClientPlugin {
  constructor (options = {}) {
    this.options = Object.assign({
      filename: 'vue-ssr-client-manifest.json'
    }, options)
  }

  apply (compiler) {
    const stage = 'PROCESS_ASSETS_STAGE_ADDITIONAL'
    onEmit(compiler, 'vue-client-plugin', stage, (compilation, cb) => {
      const stats = compilation.getStats().toJson()

      const allFiles = uniq(stats.assets
        .map(a => a.name))

      const initialFiles = uniq(Object.keys(stats.entrypoints)
        .map(name => stats.entrypoints[name].assets)
        .reduce((assets, all) => all.concat(assets), [])
        .map(getAssetName)
        .filter((file) => isJS(file) || isCSS(file)))

      const asyncFiles = allFiles
        .filter((file) => isJS(file) || isCSS(file))
        .filter(file => initialFiles.indexOf(file) < 0)

      const manifest = {
        publicPath: stats.publicPath,
        initial: initialFiles,
        async: asyncFiles,
        moduleChunk: {},
        chunkFiles: {},
        chunkSiblings: {},
      }

      stats.chunks.forEach(c => {
        manifest.chunkFiles[c.id] = c.files
        manifest.chunkSiblings[c.id] = c.siblings
      })

      stats.modules.forEach(m => {
        if (m.chunks.length === 1) {
          var id = stripModuleIdHash(m.identifier)
          manifest.moduleChunk[hash(id)] = m.chunks[0]
        }
      })

      const json = JSON.stringify(manifest, null, 2)
      compilation.assets[this.options.filename] = {
        source: () => json,
        size: () => json.length
      }
      cb()
    })
  }
}
