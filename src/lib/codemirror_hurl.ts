import { parser } from './syntax.grammar'
import { LRLanguage, LanguageSupport } from '@codemirror/language'
import { styleTags, tags as t } from '@lezer/highlight'

export const HurlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        Boolean: t.bool,
        String: t.string,
        LineComment: t.lineComment,
        '( )': t.paren
      })
    ]
  }),
  languageData: {
    commentTokens: { line: ';' }
  }
})

export function Hurl(): LanguageSupport {
  return new LanguageSupport(HurlLanguage)
}
