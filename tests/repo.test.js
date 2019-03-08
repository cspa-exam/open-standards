const o = require('ospec')
const path = require('path')
const glob = require('glob')
const {parse} = require('../dist/parser')
const {parseStandards} = require('../dist/standards')
const {readFileSync} = require('fs')

o('CSPA Open Standards Repo lint', async function () {
  const questionFiles = glob.sync(__dirname + '/../standards/**/*.xml')

  let seenIds = []
  for (const file of questionFiles) {
    try {
      const groups = await parse(readFileSync(file), {
        existingIds: seenIds
      })
      seenIds = seenIds.concat(
        groups.map(g => g.questions.map(q => q.id)).reduce(concat, [])
      )
    }
    catch (err) {
      err.message = `${err.message}\n  in ${path.basename(file)}`
      throw err
    }
  }
})

o('getQuestions', async function () {
  const standards = await parseStandards()
  o(standards[0].sections[0].name).equals('1.1 Function Scopes')
  o(standards[0].sections[6].name).equals('2.3 Keyword this Binding')
})

function concat (a,b) { return a.concat(b) }
