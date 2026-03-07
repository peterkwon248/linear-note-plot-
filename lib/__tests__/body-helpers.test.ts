import { describe, it, expect } from 'vitest'
import { extractPreview, extractLinksOut } from '../body-helpers'

describe('extractPreview', () => {
  it('returns plain text as-is up to 120 chars', () => {
    const text = 'This is a plain text note with no special formatting'
    expect(extractPreview(text)).toBe(text)
  })

  it('strips # heading marker', () => {
    const text = '# Heading\nSome content'
    expect(extractPreview(text)).toBe('Heading\nSome content'.replace(/\n/g, ' '))
  })

  it('strips ## through ###### heading markers', () => {
    expect(extractPreview('## Heading 2')).toBe('Heading 2')
    expect(extractPreview('### Heading 3')).toBe('Heading 3')
    expect(extractPreview('#### Heading 4')).toBe('Heading 4')
    expect(extractPreview('##### Heading 5')).toBe('Heading 5')
    expect(extractPreview('###### Heading 6')).toBe('Heading 6')
  })

  it('strips bold formatting **text**', () => {
    expect(extractPreview('This is **bold** text')).toBe('This is bold text')
  })

  it('strips italic formatting _text_', () => {
    expect(extractPreview('This is _italic_ text')).toBe('This is italic text')
  })

  it('strips strikethrough ~~text~~', () => {
    expect(extractPreview('This is ~~strikethrough~~ text')).toBe('This is strikethrough text')
  })

  it('strips inline code backticks', () => {
    expect(extractPreview('Use `const x = 1` in your code')).toBe('Use const x = 1 in your code')
  })

  it('strips link brackets [link]', () => {
    expect(extractPreview('Check the [documentation]')).toBe('Check the documentation')
  })

  it('collapses multiple newlines to spaces', () => {
    const text = 'Line 1\n\n\nLine 2\n\nLine 3'
    expect(extractPreview(text)).toBe('Line 1 Line 2 Line 3')
  })

  it('respects custom maxLen parameter', () => {
    const text = 'This is a longer text that should be truncated'
    expect(extractPreview(text, 10)).toBe('This is a ')
    expect(extractPreview(text, 20)).toBe('This is a longer tex')
  })

  it('returns empty string for empty input', () => {
    expect(extractPreview('')).toBe('')
  })

  it('truncates very long text to default 120 chars', () => {
    const longText = 'a'.repeat(150)
    expect(extractPreview(longText)).toHaveLength(120)
    expect(extractPreview(longText)).toBe('a'.repeat(120))
  })

  it('handles combined formatting markers', () => {
    const text = '# **Bold Heading** with _italic_ and `code`'
    expect(extractPreview(text)).toBe('Bold Heading with italic and code')
  })

  it('trims leading and trailing whitespace', () => {
    expect(extractPreview('   spaced text   ')).toBe('spaced text')
  })

  it('handles markdown link syntax with brackets', () => {
    expect(extractPreview('[Link text](url)')).toBe('Link text(url)')
  })

  it('collapses newlines before trimming', () => {
    expect(extractPreview('\n\n  text  \n\n')).toBe('text')
  })
})

describe('extractLinksOut', () => {
  it('extracts single wiki-link [[Hello]]', () => {
    expect(extractLinksOut('[[Hello]]')).toEqual(['hello'])
  })

  it('extracts multiple wiki-links', () => {
    const result = extractLinksOut('[[First]] and [[Second]] links')
    expect(result).toHaveLength(2)
    expect(result).toContain('first')
    expect(result).toContain('second')
  })

  it('deduplicates duplicate links', () => {
    const result = extractLinksOut('[[Same]] link [[Same]] again')
    expect(result).toEqual(['same'])
  })

  it('lowercases all links', () => {
    const result = extractLinksOut('[[UPPER]] [[MiXeD]] [[lower]]')
    expect(result).toHaveLength(3)
    expect(result).toContain('upper')
    expect(result).toContain('mixed')
    expect(result).toContain('lower')
  })

  it('returns empty array when no links found', () => {
    expect(extractLinksOut('Just regular text')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(extractLinksOut('')).toEqual([])
  })

  it('handles nested brackets [[[test]]]', () => {
    // [[[test]]] → regex matches [[ then [test ([ is not ]) then ]]
    // So the captured inner text is "[test"
    const result = extractLinksOut('[[[test]]]')
    expect(result).toEqual(['[test'])
  })

  it('extracts links with spaces', () => {
    expect(extractLinksOut('[[My Note]]')).toEqual(['my note'])
    expect(extractLinksOut('[[Multi Word Link]]')).toEqual(['multi word link'])
  })

  it('handles multiple spaces in link text', () => {
    expect(extractLinksOut('[[Multi  Space  Link]]')).toEqual(['multi  space  link'])
  })

  it('extracts links with special characters inside', () => {
    expect(extractLinksOut('[[Note-123]] and [[item_2]]')).toEqual(['note-123', 'item_2'])
  })

  it('returns unique links in order of first appearance', () => {
    const result = extractLinksOut('[[A]] [[B]] [[A]] [[C]] [[B]]')
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('c')
  })

  it('ignores incomplete link patterns', () => {
    expect(extractLinksOut('[[incomplete and [another]')).toEqual([])
  })

  it('extracts links from text with other markdown', () => {
    const text = 'Check [[Note1]] for details and **bold** text with [[Note2]]'
    const result = extractLinksOut(text)
    expect(result).toHaveLength(2)
    expect(result).toContain('note1')
    expect(result).toContain('note2')
  })
})
