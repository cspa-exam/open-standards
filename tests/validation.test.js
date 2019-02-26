const o = require('ospec')
const {
  parse,
  OpenStandardParseError,
} = require('../dist/parser')

o.spec("short-coding validation", function () {
  o("Requires one test for short coding", async function () {
    const content = g(`
      <question id="no-tests" type="short-coding">
        <body>No Tests</body>
        <given-code>x</given-code>
      </question>
    `)
    try {
      await parse(content)
      throw new Error('should not get here')
    }
    catch (err) {
      if (!(err instanceof OpenStandardParseError)) { console.error(err) }
      o(err instanceof OpenStandardParseError).equals(true)
      o(!! err.message.match(/at least one/)).equals(true)
      o(!! err.message.match(/<test>/)).equals(true)
    }
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
