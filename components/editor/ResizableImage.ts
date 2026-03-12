import Image from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNode } from "./ImageNode"

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width") || element.style.width
          return width ? parseInt(width, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      textAlign: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-text-align") || "left",
        renderHTML: (attributes) => {
          return { "data-text-align": attributes.textAlign }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode)
  },
})
