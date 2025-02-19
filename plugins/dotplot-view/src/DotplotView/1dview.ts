import { getParent, Instance } from 'mobx-state-tree'
import { observable } from 'mobx'
import Base1DView from '@jbrowse/core/util/Base1DViewModel'
import calculateDynamicBlocks from '@jbrowse/core/util/calculateDynamicBlocks'

/**
 * #stateModel Dotplot1DView
 * ref https://mobx-state-tree.js.org/concepts/volatiles on volatile state used here
 */
const Dotplot1DView = Base1DView.extend(self => {
  const scaleFactor = observable.box(1)
  return {
    views: {
      /**
       * #getter
       * this uses padding=false and elision=false
       */
      get dynamicBlocks() {
        return calculateDynamicBlocks(self, false, false)
      },
      /**
       * #getter
       */

      get scaleFactor() {
        return scaleFactor.get()
      },

      /**
       * #getter
       */
      get maxBpPerPx() {
        return self.totalBp / self.width
      },
    },
    actions: {
      /**
       * #action
       */
      setScaleFactor(n: number) {
        scaleFactor.set(n)
      },

      /**
       * #action
       */
      center() {
        const centerBp = self.totalBp / 2
        const centerPx = centerBp / self.bpPerPx
        self.scrollTo(Math.round(centerPx - self.width / 2))
      },
    },
  }
})

const DotplotHView = Dotplot1DView.extend(self => ({
  views: {
    get width() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getParent<any>(self).viewWidth
    },
  },
}))

const DotplotVView = Dotplot1DView.extend(self => ({
  views: {
    get width() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return getParent<any>(self).viewHeight
    },
  },
}))

export { DotplotVView, DotplotHView, Dotplot1DView }
export type Dotplot1DViewModel = Instance<typeof Dotplot1DView>
