

export function transformImageLinkOnMarkdown(markdown: string) {

  return markdown.replaceAll(/(?:__|[*#])|\[(.*?)\]\((.*?)\)/g, (match, p1, p2) => {
    if (p2?.startsWith('quiver-image-url/')) {
      return `[[${p2.replace('quiver-image-url/', '').replace(/ *=(\d+x\d+)$/, '|$1')}]]`;
    } else {
      return match
    }
  })
}
