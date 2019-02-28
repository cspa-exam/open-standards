const o = require('ospec')
const {
  parse,
  OpenStandardParseError,
  ChoiceGroupAnswerCountError,
} = require('../dist/parser')

o.spec("multiple-choice validation", function () {
  o("Requires at least one answer for a choice-group", async function () {
    await check(ChoiceGroupAnswerCountError, g(`
      <question id="no-answer">
        <body>No answer</body>
        <choice-group>
          <choice>10</choice>
          <choice>20</choice>
        </choice-group>
      </question>
    `), err => {
      o(err.id).equals('no-answer')
    })
  })

  o("Requires no more than one answer for a choice-group", async function () {
    await check(ChoiceGroupAnswerCountError, g(`
      <question id="too-many-answer">
        <body>No Tests</body>
        <choice-group>
          <choice answer>10</choice>
          <choice answer>20</choice>
        </choice-group>
      </question>
    `))
  })
})

o.spec("short-coding validation", function () {
  o("Requires one test for short coding", async function () {
    await check(OpenStandardParseError, g(`
      <question id="no-tests" type="short-coding">
        <body>No Tests</body>
        <given-code>x</given-code>
      </question>
    `), err => {
      o(!! err.message.match(/at least one/)).equals(true)
      o(!! err.message.match(/<test>/)).equals(true)
    })
  })

  o("Allows no tests with input-slot", async function () {
    const content = g(`
      <question id="no-tests" type="short-coding">
        <body>No Tests</body>
        <given-code input-slot="abc">foo(abc)</given-code>
      </question>
    `)
    await parse(content)
  })
})

const g = (content) => `<group name="g">${content}</group>`

async function check (ErrorType, content, more) {
  try {
    await parse(content)
    throw new Error('Should not get here')
  }
  catch (err) {
    if (!(err instanceof OpenStandardParseError)) { console.error(err) }
    o(err instanceof ErrorType).equals(true)
    more && more(err)
  }
}
