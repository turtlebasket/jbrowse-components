import React from 'react'
import { observer } from 'mobx-react'
import { isStateTreeNode, getType } from 'mobx-state-tree'
import { ConfigurationSchema } from '@jbrowse/core/configuration'

export { default as stateModelFactory } from './model'
export const configSchema = ConfigurationSchema('ConfigurationEditorWidget', {})
export const HeadingComponent = observer(
  ({ model }: { model?: { target: { type: string } } }) => {
    if (model?.target) {
      if (model.target.type) {
        return <>{`${model.target.type} settings`}</>
      }
      if (isStateTreeNode(model.target)) {
        const type = getType(model.target)
        if (type?.name) {
          return (
            <>{`${type.name.replace('ConfigurationSchema', '')} settings`}</>
          )
        }
      }
    }
    return <>Settings</>
  },
)
