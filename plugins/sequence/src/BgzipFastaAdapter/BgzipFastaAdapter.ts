import { BgzipIndexedFasta } from '@gmod/indexedfasta'
import { FileLocation } from '@jbrowse/core/util/types'
import { openLocation } from '@jbrowse/core/util/io'
import IndexedFasta from '../IndexedFastaAdapter/IndexedFastaAdapter'

export default class extends IndexedFasta {
  public async setupPre() {
    const fastaLocation = this.getConf('fastaLocation')
    const faiLocation = this.getConf('faiLocation')
    const gziLocation = this.getConf('gziLocation')
    const fastaOpts = {
      fasta: openLocation(fastaLocation as FileLocation, this.pluginManager),
      fai: openLocation(faiLocation as FileLocation, this.pluginManager),
      gzi: openLocation(gziLocation as FileLocation, this.pluginManager),
    }

    return { fasta: new BgzipIndexedFasta(fastaOpts) }
  }
}
