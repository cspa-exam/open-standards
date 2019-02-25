const o = require('ospec')
const {
  parse,
  DuplicateId,
  InvalidChild,
  InvalidAttribute,
  ChoiceGroupLabelsError,
  OpenStandardParseError,
  InvalidChildForQuestionType,
} = require('../dist/parser')

o.spec("General errors", function () {
  async function check (existingIds, CustomError, content, more) {
    try {
      await parse(content, { existingIds })
      throw new Error('should not get here')
    }
    catch (err) {
      if (!(err instanceof CustomError)) { console.error(err) }
      o(err instanceof CustomError).equals(true)
      o(err instanceof OpenStandardParseError).equals(true)
      more(err)
    }
  }

  o("duplicate ids (within one parse)", async function () {
    const question = `
      <question id="dupe" type="line-numbers">
        <body>b</body>
        <code answer="1"></code>
      </question>
    `
    await check([], DuplicateId, g(question + question), err => {
      o(err.id).equals('dupe')
    })
  })

  o("duplicate ids (with external ids)", async function () {
    const question = `
      <question id="external-dupe" type="line-numbers">
        <body>b</body>
        <code answer="1"></code>
      </question>
    `
    await check(["external-dupe"], DuplicateId, g(question), err => {
      o(err.id).equals('external-dupe')
    })
  })

  o("empty body", async function () {})

  o("labels in multiple choice groups", async function () {
    const question = `
      <question id="labels">
        <body>b</body>
        <choice-group>
          <choice>1</choice>
          <choice>2</choice>
        </choice-group>
        <choice-group>
          <choice>1</choice>
          <choice>2</choice>
        </choice-group>
      </question>
    `
    await check([], ChoiceGroupLabelsError, g(question), err => {
      o(err.id).equals('labels')
    })
  })
})


o.spec("Rejects tab characters in content tags", function () {
})


o.spec("Attribute rejection", function () {
  async function check (tagName, content) {
    try {
      await parse(content)
      throw new Error('should not get here')
    }
    catch (err) {
      if (!(err instanceof InvalidAttribute)) { console.error(err) }
      o(err instanceof InvalidAttribute).equals(true)
      o(err instanceof OpenStandardParseError).equals(true)
      o(err.tagName).equals(tagName)
    }
  }
  o("body", () => check('body', g(`<question id="5"><body x></body></question>`)))
  o("code", () => check('code', g(`<question id="5" type="line-numbers"><code answr="4,5"></code></question>`)))
  o("answer", () => check('answer', g(`<question id="5" type="input"><answer attr></code></question>`)))
  o("question", () => check('question', g(`<question id="5" typp="4"></question>`)))
  o("choice-group", () => check('choice-group', g(`<question id="5"><choice-group nam="cool"></choice-group></question>`)))

  o("given-code", () => check('given-code', g(`
    <question type="short-coding" id="5"><given-code placehlr="123">x</given-code></question>
  `)))

  o("choice", () => check('choice', g(`
    <question id="5">
      <choice-group>
        <choice>x</choice>
        <choice answerr>y</choice>
      </choice-group>
    </question>
  `)))
})


o.spec("Invalid children", function () {
  async function check (parentTag, childTag, content) {
    try {
      await parse(content)
      throw new Error('should not get here')
    }
    catch (err) {
      if (!(err instanceof InvalidChild)) { console.error(err) }
      o(err instanceof InvalidChild).equals(true)
      o(err instanceof OpenStandardParseError).equals(true)
      o(err.parentTag).equals(parentTag)
      o(err.childTag).equals(childTag)
    }
  }
  o("group", () => check('group', 'group', `<group name="x"><group></group></group>`))
  o("choice", () => check('question', 'choice', g(`<question id="5"><choice></choice></question>`)))
  o("question", () => check('root', 'question', `<question id="12"></question>`))

  o("body", () => check('choice-group', 'body', g(`
    <question id="5">
      <choice-group><body>b</body></choice-group>
    </question>
  `)))
  o("choice-group", () => check('choice-group', 'choice-group', g(`
    <question id="5">
      <choice-group><choice-group></choice-group></choice-group>
    </question>
  `)))
})


o.spec("Invalid tags for question types", function () {
  async function check (questionType, tagName, content) {
    try {
      await parse(content)
      throw new Error('should not get here')
    }
    catch (err) {
      if (!(err instanceof InvalidChildForQuestionType)) { console.error(err) }
      o(err instanceof InvalidChildForQuestionType).equals(true)
      o(err instanceof OpenStandardParseError).equals(true)
      o(err.tagName).equals(tagName)
      o(err.questionType).equals(questionType)
    }
  }
  o("code", () => check('multiple-choice', 'code', g(`<question id="500"><code></code></question>`)))
  o("choice-group", () => check('input', 'choice-group',
    g(`<question id="501" type="input"><choice-group></choice-group></question>`)
  ))
  o("answer", () => check('line-numbers', 'answer',
    g(`<question id="501" type="line-numbers"><answer></answer></question>`)
  ))
})

const g = (content) => `<group name="g">${content}</group>`
