import { ConfigurationSchema } from '@jbrowse/core/configuration'
import { createBaseTrackConfig } from '@jbrowse/core/pluggableElementTypes'
import PluginManager from '@jbrowse/core/PluginManager'

/**
 * #config HicTrack
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = (pluginManager: PluginManager) =>
  ConfigurationSchema(
    'HicTrack',
    {},
    {
      /**
       * #baseConfiguration
       */
      baseConfiguration: createBaseTrackConfig(pluginManager),
    },
  )

export default configSchema
