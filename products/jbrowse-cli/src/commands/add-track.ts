import { flags } from '@oclif/command'
import fs from 'fs'
import path from 'path'
import parseJSON from 'json-parse-better-errors'
import JBrowseCommand from '../base'

const { copyFile, rename, symlink } = fs.promises
const { COPYFILE_EXCL } = fs.constants

interface Track {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface Config {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assemblies?: { name: string; sequence: { [key: string]: any } }[]
  configuration?: {}
  connections?: unknown[]
  defaultSession?: {}
  tracks?: Track[]
}

interface UriLocation {
  uri: string
  locationType: 'UriLocation'
}

interface LocalPathLocation {
  localPath: string
  locationType: 'LocalPathLocation'
}

const isUrl = (loc?: string) => loc?.match(/^https?:\/\//)

export default class AddTrack extends JBrowseCommand {
  // @ts-ignore
  target: string

  static description = 'Add a track to a JBrowse 2 configuration'

  static examples = [
    '# copy /path/to/my.bam and /path/to/my.bam.bai to current directory and adds track to config.json',
    '$ jbrowse add-track /path/to/my.bam --load copy',
    '',

    '# copy my.bam and my.bam.bai to /path/to/jb2/bam and adds track entry to /path/to/jb2/bam/config.json',
    '$ jbrowse add-track my.bam --load copy --out /path/to/jb2 --subDir bam',
    '',

    `# same as above, but specify path to bai file. needed for if the bai file does not have the extension .bam.bai`,
    '$ jbrowse add-track my.bam --indexFile my.bai --load copy',
    '',

    '# creates symlink for /path/to/my.bam and adds track to config.json',
    '$ jbrowse add-track /path/to/my.bam --load symlink',
    '',

    '# add track from URL to config.json, no --load flag needed',
    '$ jbrowse add-track https://mywebsite.com/my.bam',
    '',

    '# --load inPlace adds a track without doing file operations',
    '$ jbrowse add-track /url/relative/path.bam --load inPlace',
  ]

  static args = [
    {
      name: 'track',
      required: true,
      description: `Track file or URL`,
    },
  ]

  static flags = {
    trackType: flags.string({
      char: 't',
      description: `Type of track, by default inferred from track file`,
    }),
    name: flags.string({
      char: 'n',
      description:
        'Name of the track. Will be defaulted to the trackId if none specified',
    }),
    indexFile: flags.string({
      description: 'Optional index file for the track',
    }),
    description: flags.string({
      char: 'd',
      description: 'Optional description of the track',
    }),
    assemblyNames: flags.string({
      char: 'a',
      description:
        'Assembly name or names for track as comma separated string. If none, will default to the assembly in your config file',
    }),
    category: flags.string({
      description:
        'Optional Comma separated string of categories to group tracks',
    }),
    config: flags.string({
      description: `Any extra config settings to add to a track. i.e '{"defaultRendering": "density"}'`,
    }),
    target: flags.string({
      description: 'path to config file in JB2 installation to write out to.',
    }),
    out: flags.string({
      description: 'synonym for target',
    }),
    subDir: flags.string({
      description:
        'when using --load a file, output to a subdirectory of the target dir',
      default: '',
    }),
    help: flags.help({ char: 'h' }),
    trackId: flags.string({
      description:
        'trackId for the track, by default inferred from filename, must be unique throughout config',
    }),
    load: flags.string({
      char: 'l',
      description:
        'Required flag when using a local file. Choose how to manage the track. Copy, symlink, or move the track to the JBrowse directory. Or inPlace to leave track alone',
      options: ['copy', 'symlink', 'move', 'inPlace'],
    }),
    skipCheck: flags.boolean({
      description:
        'Skip check for whether or not the file or URL exists or if you are in a JBrowse directory',
    }),
    overwrite: flags.boolean({
      description: 'Overwrites existing track if it shares the same trackId',
    }),
    force: flags.boolean({
      char: 'f',
      description: 'Equivalent to `--skipCheck --overwrite`',
    }),
    protocol: flags.string({
      description: 'Force protocol to a specific value',
      default: 'uri',
    }),
  }

  async run() {
    const { args: runArgs, flags: runFlags } = this.parse(AddTrack)

    const { track: argsTrack } = runArgs
    const {
      config,
      skipCheck,
      force,
      overwrite,
      category,
      description,
      load,
      subDir,
      target,
      protocol,
      out,
      indexFile: index,
    } = runFlags

    const output = target || out || '.'
    const isDir = fs.lstatSync(output).isDirectory()
    this.target = isDir ? `${output}/config.json` : output

    let { trackType, trackId, name, assemblyNames } = runFlags

    const configDirectory = path.dirname(this.target)
    if (!argsTrack) {
      this.error(
        'No track provided. Example usage: jbrowse add-track yourfile.bam',
        { exit: 120 },
      )
    }

    if (subDir) {
      const dir = path.join(configDirectory, subDir)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
    }
    const location = argsTrack

    const inPlace = load === 'inPlace'
    const useIndex = isUrl(index) || inPlace || index
    const effectiveLocation =
      isUrl(location) || inPlace
        ? location
        : path.join(subDir, path.basename(location))

    const effectiveIndexLocation =
      !index || isUrl(index) || inPlace
        ? index
        : path.join(subDir, path.basename(index))
    const adapter = useIndex
      ? this.guessAdapter(effectiveLocation, protocol, effectiveIndexLocation)
      : this.guessAdapter(effectiveLocation, protocol)

    if (adapter.type === 'PAFAdapter') {
      // @ts-ignore
      adapter.assemblyNames = assemblyNames.split(',').map(a => a.trim())
    }

    if (isUrl(location) && load) {
      this.error(
        'The --load flag is used for local files only, but a URL was provided',
        { exit: 100 },
      )
    } else if (!isUrl(location) && !load) {
      this.error(
        `The --load flag should be used if a local file is used, example --load
        copy to copy the file into the config directory. Options for load are
        copy/move/symlink/inPlace (inPlace for no file operations)`,
        { exit: 110 },
      )
    }
    if (adapter.type === 'UNKNOWN') {
      this.error('Track type is not recognized', { exit: 120 })
    }
    if (adapter.type === 'UNSUPPORTED') {
      this.error('Track type is not supported', { exit: 130 })
    }

    // only add track if there is an existing config.json
    const configContents: Config = await this.readJsonFile(this.target)

    if (!configContents.assemblies || !configContents.assemblies.length) {
      this.error('No assemblies found. Please add one before adding tracks', {
        exit: 150,
      })
    }
    if (configContents.assemblies.length > 1 && !assemblyNames) {
      this.error(
        'Too many assemblies, cannot default to one. Please specify the assembly with the --assemblyNames flag',
      )
    }

    // set up the track information
    trackType = trackType || this.guessTrackType(adapter.type)
    trackId = trackId || path.basename(location, path.extname(location))
    name = name || trackId
    assemblyNames = assemblyNames || configContents.assemblies[0].name
    this.debug(`Name is: ${name}`)
    this.debug(`Type is: ${trackType}`)
    this.debug(`Track is :${trackId}`)
    this.debug(`Assembly name(s) is :${assemblyNames}`)

    const configObj = config ? parseJSON(config) : {}
    const trackConfig: Track = {
      type: trackType,
      trackId,
      name,
      adapter,
      category: category?.split(',').map(c => c.trim()),
      assemblyNames: assemblyNames.split(',').map(a => a.trim()),
      description,
      ...configObj,
    }
    this.debug(
      `Track location: ${location}, index: ${adapter ? adapter.index : ''}`,
    )

    // any special track modifications go here
    switch (trackType) {
      case 'AlignmentsTrack': {
        const assembly = configContents.assemblies.find(
          asm => asm.name === assemblyNames,
        )
        if (assembly) {
          trackConfig.adapter.sequenceAdapter = assembly.sequence.adapter
        } else if (!skipCheck) {
          this.error(`Failed to find assemblyName ${assemblyNames}`)
        }
        break
      }
    }

    if (!configContents.tracks) {
      configContents.tracks = []
    }

    const idx = configContents.tracks.findIndex(
      configTrack => configTrack.trackId === trackId,
    )

    if (idx !== -1) {
      this.debug(`Found existing trackId ${trackId} in configuration`)
      if (force || overwrite) {
        this.debug(`Overwriting track ${trackId} in configuration`)
        configContents.tracks[idx] = trackConfig
      } else {
        this.error(
          `Cannot add track with id ${trackId}, a track with that id already exists (use --force to override)`,
          { exit: 160 },
        )
      }
    } else {
      configContents.tracks.push(trackConfig)
    }

    // get path of destination, and remove file at that path if it exists and
    // force is set
    const destinationFn = (dir: string, file: string) => {
      const dest = path.resolve(path.join(dir, subDir, path.basename(file)))
      if (force) {
        try {
          fs.unlinkSync(dest)
        } catch (e) {
          /* unconditionally unlinkSync, due to
           * https://github.com/nodejs/node/issues/14025#issuecomment-754021370
           * and https://github.com/GMOD/jbrowse-components/issues/2768 */
        }
      }
      return dest
    }

    const loadType =
      (load as 'copy' | 'inPlace' | 'move' | 'symlink' | undefined) || 'inPlace'
    const callbacks = {
      copy: (src: string, dest: string) => copyFile(src, dest, COPYFILE_EXCL),
      move: (src: string, dest: string) => rename(src, dest),
      symlink: (src: string, dest: string) => symlink(path.resolve(src), dest),
      inPlace: () => {
        /* do nothing */
      },
    }

    await Promise.all(
      Object.values(this.guessFileNames(location, index))
        .filter(f => !!f)
        .map(src =>
          callbacks[loadType](src, destinationFn(configDirectory, src)),
        ),
    )

    this.debug(`Writing configuration to file ${this.target}`)
    await this.writeJsonFile(this.target, configContents)

    this.log(
      `${
        idx !== -1 ? 'Overwrote' : 'Added'
      } track with name "${name}" and trackId "${trackId}" ${
        idx !== -1 ? 'in' : 'to'
      } ${this.target}`,
    )
  }

  guessFileNames(fileName: string, index?: string) {
    if (/\.bam$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.bai`,
      }
    }

    if (/\.cram$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.crai`,
      }
    }

    if (/\.gff3?$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.gff3?\.b?gz$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.tbi`,
      }
    }

    if (/\.gtf?$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.vcf$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.vcf\.b?gz$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.tbi`,
      }
    }

    if (/\.vcf\.idx$/i.test(fileName)) {
      return {}
    }

    if (/\.bed$/i.test(fileName)) {
      return {}
    }

    if (/\.bed\.b?gz$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.tbi`,
      }
    }

    if (/\.bed\.idx$/i.test(fileName)) {
      return {}
    }

    if (/\.(bb|bigbed)$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.(bw|bigwig)$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.(fa|fasta|fas|fna|mfa)$/i.test(fileName)) {
      return {
        file: fileName,
        index: index || `${fileName}.fai`,
      }
    }

    if (/\.(fa|fasta|fas|fna|mfa)\.b?gz$/i.test(fileName)) {
      return {
        file: fileName,
        index: `${fileName}.fai`,
        index2: `${fileName}.gzi`,
      }
    }

    if (/\.2bit$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.sizes$/i.test(fileName)) {
      return {}
    }

    if (/\/trackData.jsonz?$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\/sparql$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.hic$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    if (/\.paf$/i.test(fileName)) {
      return {
        file: fileName,
      }
    }

    return {}
  }

  // find way to import this instead of having to paste it
  guessAdapter(fileName: string, protocol: string, index?: string) {
    function makeLocation(location: string) {
      if (protocol === 'uri') {
        return { uri: location, locationType: 'UriLocation' } as UriLocation
      }
      if (protocol === 'localPath') {
        return {
          localPath: location,
          locationType: 'LocalPathLocation',
        } as LocalPathLocation
      }
      throw new Error(`invalid protocol ${protocol}`)
    }
    if (/\.bam$/i.test(fileName)) {
      return {
        type: 'BamAdapter',
        bamLocation: makeLocation(fileName),
        index: {
          location: makeLocation(index || `${fileName}.bai`),
          indexType:
            index && index.toUpperCase().endsWith('CSI') ? 'CSI' : 'BAI',
        },
      }
    }

    if (/\.cram$/i.test(fileName)) {
      return {
        type: 'CramAdapter',
        cramLocation: makeLocation(fileName),
        craiLocation: makeLocation(`${fileName}.crai`),
      }
    }

    if (/\.gff3?$/i.test(fileName)) {
      return {
        type: 'Gff3Adapter',
        gffLocation: makeLocation(fileName),
      }
    }

    if (/\.gff3?\.b?gz$/i.test(fileName)) {
      return {
        type: 'Gff3TabixAdapter',
        gffGzLocation: makeLocation(fileName),
        index: {
          location: makeLocation(index || `${fileName}.tbi`),
          indexType:
            index && index.toUpperCase().endsWith('CSI') ? 'CSI' : 'TBI',
        },
      }
    }

    if (/\.gtf?$/i.test(fileName)) {
      return {
        type: 'GtfAdapter',
        gtfLocation: makeLocation(fileName),
      }
    }

    if (/\.vcf$/i.test(fileName)) {
      return {
        type: 'VcfAdapter',
        vcfLocation: makeLocation(fileName),
      }
    }

    if (/\.vcf\.b?gz$/i.test(fileName)) {
      return {
        type: 'VcfTabixAdapter',
        vcfGzLocation: makeLocation(fileName),
        index: {
          location: makeLocation(index || `${fileName}.tbi`),
          indexType:
            index && index.toUpperCase().endsWith('CSI') ? 'CSI' : 'TBI',
        },
      }
    }

    if (/\.vcf\.idx$/i.test(fileName)) {
      return {
        type: 'UNSUPPORTED',
      }
    }

    if (/\.bed$/i.test(fileName)) {
      return {
        type: 'UNSUPPORTED',
      }
    }

    if (/\.bed\.b?gz$/i.test(fileName)) {
      return {
        type: 'BedTabixAdapter',
        bedGzLocation: makeLocation(fileName),
        index: {
          location: makeLocation(index || `${fileName}.tbi`),
          indexType:
            index && index.toUpperCase().endsWith('CSI') ? 'CSI' : 'TBI',
        },
      }
    }

    if (/\.bed$/i.test(fileName)) {
      return {
        type: 'BedAdapter',
        bedLocation: makeLocation(fileName),
      }
    }

    if (/\.(bb|bigbed)$/i.test(fileName)) {
      return {
        type: 'BigBedAdapter',
        bigBedLocation: makeLocation(fileName),
      }
    }

    if (/\.(bw|bigwig)$/i.test(fileName)) {
      return {
        type: 'BigWigAdapter',
        bigWigLocation: makeLocation(fileName),
      }
    }

    if (/\.(fa|fasta|fna|mfa)$/i.test(fileName)) {
      return {
        type: 'IndexedFastaAdapter',
        fastaLocation: makeLocation(fileName),
        faiLocation: makeLocation(index || `${fileName}.fai`),
      }
    }

    if (/\.(fa|fasta|fna|mfa)\.b?gz$/i.test(fileName)) {
      return {
        type: 'BgzipFastaAdapter',
        fastaLocation: makeLocation(fileName),
        faiLocation: makeLocation(`${fileName}.fai`),
        gziLocation: makeLocation(`${fileName}.gzi`),
      }
    }

    if (/\.2bit$/i.test(fileName)) {
      return {
        type: 'TwoBitAdapter',
        twoBitLocation: makeLocation(fileName),
      }
    }

    if (/\.sizes$/i.test(fileName)) {
      return {
        type: 'UNSUPPORTED',
      }
    }

    if (/\/trackData.jsonz?$/i.test(fileName)) {
      return {
        type: 'NCListAdapter',
        rootUrlTemplate: makeLocation(fileName),
      }
    }

    if (/\/sparql$/i.test(fileName)) {
      return {
        type: 'SPARQLAdapter',
        endpoint: fileName,
      }
    }

    if (/\.hic/i.test(fileName)) {
      return {
        type: 'HicAdapter',
        hicLocation: makeLocation(fileName),
      }
    }

    if (/\.paf/i.test(fileName)) {
      return {
        type: 'PAFAdapter',
        pafLocation: makeLocation(fileName),
      }
    }

    return {
      type: 'UNKNOWN',
    }
  }

  guessTrackType(adapterType: string): string {
    const known: { [key: string]: string | undefined } = {
      BamAdapter: 'AlignmentsTrack',
      CramAdapter: 'AlignmentsTrack',
      BgzipFastaAdapter: 'ReferenceSequenceTrack',
      BigWigAdapter: 'QuantitativeTrack',
      IndexedFastaAdapter: 'ReferenceSequenceTrack',
      TwoBitAdapter: 'ReferenceSequenceTrack',
      VcfTabixAdapter: 'VariantTrack',
      VcfAdapter: 'VariantTrack',
      HicAdapter: 'HicTrack',
      PAFAdapter: 'SyntenyTrack',
    }
    return known[adapterType] || 'FeatureTrack'
  }
}
