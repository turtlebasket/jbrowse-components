import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config ChainAdapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const ChainAdapter = ConfigurationSchema(
  'ChainAdapter',
  {
    /**
     * #slot
     */
    assemblyNames: {
      type: 'stringArray',
      defaultValue: [],
      description:
        'Target is the first value in the array, query is the second',
    },
    /**
     * #slot
     * can be specified as alternative to assemblyNames
     */
    targetAssembly: {
      type: 'string',
      defaultValue: '',
      description: 'Alternative to assemblyNames array: the target assembly',
    },
    /**
     * #slot
     * can be specified as alternative to assemblyNames
     */
    queryAssembly: {
      type: 'string',
      defaultValue: '',
      description: 'Alternative to assemblyNames array: the query assembly',
    },
    /**
     * #slot
     */
    chainLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/file.chain', locationType: 'UriLocation' },
    },
  },
  { explicitlyTyped: true },
)

export default ChainAdapter
