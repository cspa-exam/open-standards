import * as sax from 'sax'
const theredoc = require('theredoc')

const DEFAULT_QUESTION_TYPE: QuestionType = 'multiple-choice'

export type Group = {
  name: string
  questions: Question[]
}

type common = {
  id: string
  text: string
}

export type MultiChoiceQuestion = common & {
  type: 'multiple-choice'
  choiceGroups: ChoiceGroup[]
}
export type ChoiceGroup = {
  name: string
  label: string | null
  choices: Choice[]
}
export type Choice = {
  text: string
  answer: boolean
}

export type LineNumbersQuestion = common & {
  type: 'line-numbers'
  code: {
    text: string
    answer: number[]
  }
}

export type InputQuestion = common & {
  type: 'input'
  answer: { text: string }
}

export type Question = MultiChoiceQuestion | LineNumbersQuestion | InputQuestion
export type QuestionType = Question['type']

type QuestionBuild = {
  /** For convenience */
  id: string
  hasBody: boolean
  question: Question
}

type ParseOptions = {
  existingIds?: string[]
}

export function parse (contents: string, options: ParseOptions = {}): Promise<Group[]> {
  return new Promise((resolve, reject) => {
    const parser = sax.parser(false, {
      lowercase: true,
    })

    const groups: Group[] = []
    const seenIds: Record<string,true | undefined>
      = (options.existingIds || []).reduce((all, id) => {
        all[id] = true
        return all
      }, {} as any)

    let current: QuestionBuild
    let textTarget: null | { text: string } = null

    const tagStack: string[] = []

    parser.onopentag = (node) => {
      const currentTag = tagStack[tagStack.length - 1]
      if (node.name === 'root') {
        // Do nothing!
      }
      else if (node.name === 'group') {
        if (currentTag !== 'root') { throw new InvalidChild(currentTag, node.name) }

        const name = node.attributes.name as string
        if (! name) {
          throw new OpenStandardParseError(`<group> requires a name attribute`)
        }
        groups.push({
          name: name,
          questions: [],
        })
      }
      else if (node.name === 'question') {
        if (currentTag !== 'group') { throw new InvalidChild(currentTag, node.name) }

        const type = (node.attributes.type as QuestionType) || DEFAULT_QUESTION_TYPE
        if (type !== 'multiple-choice' && type !== 'line-numbers' && type !== 'input') {
          throw new OpenStandardParseError(`Invalid question type: ${type}`)
        }

        const id = node.attributes.id as string

        if (seenIds[id]) {
          throw new DuplicateId(id)
        }
        seenIds[id] = true

        if (type === 'multiple-choice') {
          current = {
            id: id,
            hasBody: false,
            question: {
              type: type,
              id: id,
              text: '',
              choiceGroups: [],
            }
          }
        }
        else if (type === 'line-numbers') {
          current = {
            id: id,
            hasBody: false,
            question: {
              type: type,
              id: id,
              text: '',
              code: {
                text: '',
                answer: [],
              }
            }
          }
        }
        else if (type === 'input') {
          current = {
            id: id,
            hasBody: false,
            question: {
              type: type,
              id: id,
              text: '',
              answer: { text: '' },
            }
          }
        }

        if (! current.id) {
          throw new OpenStandardParseError(`Question id is required.`)
        }

        whitelistAttrs(['id', 'type'], 'question', current.id, Object.keys(node.attributes))
      }
      else if (node.name === 'body') {
        if (currentTag !== 'question') { throw new InvalidChild(currentTag, node.name) }
        if (current.hasBody) {
          throw new OpenStandardParseError(`Cannot have two body tags (question id=${current.id})`)
        }
        whitelistAttrs([], 'body', current.id, Object.keys(node.attributes))
        textTarget = current.question
      }
      else if (node.name === 'choice-group') {
        if (currentTag !== 'question') { throw new InvalidChild(currentTag, node.name) }
        if (current.question.type !== 'multiple-choice') {
          throw new InvalidChildForQuestionType(current.id, current.question.type, 'choice-group')
        }
        whitelistAttrs(['name', 'label'], 'choice-group', current.id, Object.keys(node.attributes))

        current.question.choiceGroups.push({
          name: (node.attributes.name as string) || 'default',
          label: (node.attributes.label as string) || null,
          choices: [],
        })
      }
      else if (node.name === 'choice') {
        if (currentTag !== 'choice-group') { throw new InvalidChild(currentTag, node.name) }
        whitelistAttrs(['answer'], 'choice', current.id, Object.keys(node.attributes))

        if (current.question.type !== 'multiple-choice') {
          throw new InvalidChildForQuestionType(current.id, current.question.type, node.name)
        }

        const cg = current.question.choiceGroups[current.question.choiceGroups.length-1]
        cg.choices.push({
          answer: 'answer' in node.attributes,
          text: '',
        })
        textTarget = cg.choices[cg.choices.length - 1]
      }
      else if (node.name === 'code') {
        if (current.question.type !== 'line-numbers') {
          throw new InvalidChildForQuestionType(current.id, current.question.type, node.name)
        }
        whitelistAttrs(['answer'], 'code', current.id, Object.keys(node.attributes))

        current.question.code.answer = (node.attributes.answer as string || '')
          .split(',')
          .map(val => Number(val.trim()))
          .filter(x => x)

        if (current.question.code.answer.length === 0) {
          throw new OpenStandardParseError(`<code> requires at least one answer`)
        }

        textTarget = current.question.code
      }
      else if (node.name === 'answer') {
        if (current.question.type !== 'input') {
          throw new InvalidChildForQuestionType(current.id, current.question.type, node.name)
        }
        whitelistAttrs([], 'answer', current.id, Object.keys(node.attributes))

        textTarget = current.question.answer
      }
      else {
        throw new OpenStandardParseError(`Invalid tag: ${node.name}`)
      }

      tagStack.push(node.name)
    }

    parser.ontext = (text) => {
      if (textTarget) {
        textTarget.text += text
      }
    }

    parser.onclosetag = (tagName) => {
      if (tagName === 'question') {
        if (! current.hasBody) {
          throw new OpenStandardParseError(`Body is required (question id=${current.id})`)
        }
        const currentGroup = groups[groups.length - 1]
        currentGroup.questions.push(current.question)
      }

      if (
        tagName === 'choice-group' &&
        current.question.type === 'multiple-choice' &&
        current.question.choiceGroups.length >= 2 &&
        ! current.question.choiceGroups.every(g => !! g.label)
      ) {
        throw new ChoiceGroupLabelsError(current.id)
      }

      if (tagName === 'body') {
        current.hasBody = true
      }

      if (textTarget && ['body', 'choice', 'code', 'answer'].includes(tagName)) {
        if (textTarget.text.indexOf('\t') >= 0) {
          throw new OpenStandardParseError(`Please do not use tab characters in <${tagName}> (question id=${current.id})`)
        }
        textTarget.text = theredoc([textTarget.text], [])
        textTarget = null
      }

      tagStack.pop()
    }

    parser.onerror = (e) => {
      reject(e)
    }
    parser.onend = () => {
      resolve(groups)
    }

    parser.write(`<root>${contents}</root>`).close()
  })
}

function whitelistAttrs (valid: string[], tagName: string, id: string | null, attrs: string[]) {
  attrs.forEach(attr => {
    if (! valid.includes(attr)) {
      throw new InvalidAttribute(id, tagName, attr)
    }
  })
}

export class OpenStandardParseError extends Error {}

export class DuplicateId extends OpenStandardParseError {
  constructor(public id: string) {
    super(`Duplicate question id: "${id}"`)
  }
}
export class ChoiceGroupLabelsError extends OpenStandardParseError {
  constructor(public id: string) {
    super(`<choice-group> must have a label attribute when multiple are present (question id=${id})`)
  }
}
export class InvalidAttribute extends OpenStandardParseError {
  public tagName: string
  constructor(id: string | null, tagName: string, attr: string) {
    const location = id ? ` (question id=${id})` : ''
    super(`Invalid ${tagName} attribute: '${attr}'${location}`)
    this.tagName = tagName
  }
}
export class InvalidChild extends OpenStandardParseError {
  constructor(public parentTag: string, public childTag: string) {
    super(`A <${childTag}> cannot be a child of <${parentTag}>`)
  }
}
export class InvalidChildForQuestionType extends OpenStandardParseError {
  constructor(id: string, public questionType: string, public tagName: string) {
    super(`A <${tagName}> cannot be a child of a ${questionType} question (id=${id})`)
  }
}
