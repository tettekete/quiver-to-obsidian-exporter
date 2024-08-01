

/**
 * Sanitizes input string for use as an Obsidian note title.
 * 
 * Removes or replaces characters that are not allowed in Obsidian titles.
 * The following characters are not allowed in Obsidian titles:
 * `/`, `:`, `\`, `#`, `^`, `[`, `]`, `|`
 * and begin with `.`
 * 
 * If the title is empty, "__empty_title__" is set as a provisional name.
 * 
 * @param title The original title string to be sanitized.
 * @returns The sanitized title string.
 */
export function sanitizeTitle(title: string): string {

  if( ! title.length )
  {
    title = '__empty_title__';
  }

  return [
    [/\//g, "／"],
    [/:/g, "："],
    [/\\/g, "¥"],
    [/#/g, "＃"],
    [/\^/g, "~"],
    [/\[/g, "［"],
    [/]/g, "］"],
    [/\|/g, "｜"],
    [/^\./,"．"]
  ].reduce((title: string, pair: [RegExp, string]): string => {
    return title.replace(pair[0], pair[1]);
  }, sanitizeTime(sanitizeDate(title)));
}

function sanitizeDate(title: string): string {

  const regExp = /(\d{4})\/(\d{2})\/(\d{2})/g;
  return title.replace(regExp, "$1-$2-$3");
}

function sanitizeTime(title: string): string {

  const regExp = /(\d{2}):(\d{2}):(\d{2})/g;
  return title.replace(regExp, "$1：$2：$3");
}
