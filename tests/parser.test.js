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

o('Parses a question using defaults', async function () {
  const content = `
    <group name="With defaults">
      <question id="test1">
        <body>Hello</body>
        <choice-group>
          <choice answer>first</choice>
          <choice>second</choice>
          <choice>third</choice>
        </choice-group>
      </question>
    </group>
  `

  const groups = await parse(content)
  o(groups.length).equals(1)
  o(groups[0].name).equals('With defaults')
  o(groups[0].questions.length).equals(1)

  const question = groups[0].questions[0]
  o(question.text).equals('Hello')
  o(question.type).equals('multiple-choice')

  o(question.choiceGroups.length).equals(1)
  o(question.choiceGroups[0].name).equals('default')
  o(question.choiceGroups[0].choices).deepEquals([
    { text: 'first',  answer: true },
    { text: 'second', answer: false },
    { text: 'third', answer: false },
  ])
})

o('Parses a line-numbers question', async function () {
  const content = g(`
    <question id="test2" type="line-numbers">
      <body>Line Nums</body>
      <code answer="1,3">
      var x = 10;
      f(x);
      </code>
    </question>
  `)

  const groups = await parse(content)
  o(groups.length).equals(1)
  o(groups[0].name).equals('g')
  o(groups[0].questions.length).equals(1)

  const question = groups[0].questions[0]
  o(question.text).equals('Line Nums')
  o(question.type).equals('line-numbers')

  o(question.code.answer).deepEquals([1,3])
  o(question.code.text).equals(
`var x = 10;
f(x);`
  )
})

o('Parses an input question', async function () {
  const content = g(`
    <question id="first" type="input">
      <body>My Input</body>
      <answer>the answer</answer>
    </question>
  `)

  const groups = await parse(content)

  const question = groups[0].questions[0]
  o(question.text).equals('My Input')
  o(question.type).equals('input')
  o(question.answer).deepEquals({ text: 'the answer' })
})

o('Parses multiple questions', async function () {
  const sample = (id) => `
    <question id="${id}" type="input">
      <body>My Input ${id}</body>
      <answer>the answer ${id}</answer>
    </question>
  `
  const groups = await parse(`<group name="multi">${sample(1) + sample(2)}</group>`)
  o(groups.length).equals(1)
  o(groups[0].name).equals('multi')
  o(groups[0].questions.length).equals(2)

  const questions = groups[0].questions

  o(questions[0].text).equals('My Input 1')
  o(questions[0].type).equals('input')
  o(questions[0].answer).deepEquals({ text: 'the answer 1' })

  o(questions[1].text).equals('My Input 2')
  o(questions[1].type).equals('input')
  o(questions[1].answer).deepEquals({ text: 'the answer 2' })
})


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
