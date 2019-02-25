const o = require('ospec')
const { parse } = require('../dist/parser')

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


const g = (content) => `<group name="g">${content}</group>`
