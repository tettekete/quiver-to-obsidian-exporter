import Turndown from 'turndown'


const TurndownService: Turndown  = new Turndown()

// extend turndown link rule to replace quiver-file-url
TurndownService.addRule('quiver-file-url', {
  filter: function (node, options) {
    return (
      options.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      node.getAttribute('href') &&
      node.getAttribute('href').startsWith('quiver-file-url/')
    )
  },
  replacement: function (content, node: HTMLAnchorElement, options) {
    const href = node.getAttribute('href')
    const fileName = href.replace('quiver-file-url/', '')
    
    return `[[${fileName}]]`
  }
})

TurndownService.addRule('quiver-file-url-image', {
  filter: function (node, options) {
    return (
      node.nodeName === 'IMG' &&
      node.getAttribute('src') &&
      node.getAttribute('src').startsWith('quiver-image-url/')
    )
  },
  replacement: function (content, node: HTMLImageElement, options) {
    const src = node.getAttribute('src')
    const fileName = src.replace('quiver-image-url/', '')

    return `![[${fileName}]]`
  }
})

export default TurndownService
