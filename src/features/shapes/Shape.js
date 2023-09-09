import { resizeVertices, dimensions } from "@/common/geometry"
import { pick } from "lodash"
import { LRUCache } from "lru-cache"
import Model from "@/common/Model"

const cache = new LRUCache({
  length: (n, key) => {
    return n.length
  },
  max: 500000,
})

export default class Shape extends Model {
  constructor(type) {
    super(type)
    this.cache = []

    Object.assign(this, {
      selectGroup: "Shapes",
      shouldCache: true,
      autosize: true,
      startingWidth: 100,
      startingHeight: 100,
      aspectRatioLocked: true,
    })
  }

  // calculates the initial dimensions of the model
  initialDimensions(props) {
    const { width, height } = this.recalculateDimensions(
      props,
      this.startingWidth,
      this.startingHeight,
    )
    return {
      width,
      height,
      aspectRatio: width / height,
    }
  }

  recalculateDimensions(props, width, height) {
    if (this.autosize) {
      const vertices = this.initialVertices(props)

      resizeVertices(vertices, width, height, false)

      return dimensions(vertices)
    } else {
      return {
        width,
        height,
      }
    }
  }

  // returns an array of vertices used to calculate the initial width and height of a model
  initialVertices(props) {
    return this.getVertices({
      shape: this.getInitialState(props),
      creating: true,
    })
  }

  getCacheKey(state) {
    // include only model values in key
    const cacheState = { ...state }
    cacheState.shape = pick(cacheState.shape, Object.keys(this.getOptions()))
    cacheState.type = state.shape.type

    return JSON.stringify(cacheState)
  }

  // override as needed; returns an array of Victor vertices that render
  // the shape with the specific options
  getVertices(state) {
    return []
  }

  getCachedVertices(state) {
    if (this.shouldCache) {
      const key = this.getCacheKey(state)
      let vertices = cache.get(key)

      if (!vertices) {
        vertices = this.getVertices(state)

        if (vertices.length > 1) {
          cache.set(key, vertices)
        }
      }

      // return a copy of these vertices even though it's coming from the cache, because
      // downstream logic is modifying them directly; it's the computation of the vertices
      // that can be expensive, not the copying.
      return vertices.map((vertex) => vertex.clone())
    } else {
      return this.getVertices(state)
    }
  }

  // override as needed; hook to modify updates to a layer
  handleUpdate(changes) {
    // default is to do nothing
  }
}
