import * as fs from 'fs'
import * as path from 'path'
import {parse} from './parser'

export async function getQuestions () {
  const standardsDir = path.resolve(__dirname, '../standards')
  const dirs: string[] = (await readDir(standardsDir))
    .filter(file => fs.statSync(`${standardsDir}/${file}`).isDirectory())

  return Promise.all(dirs.map(async dir => {

    const questionFiles = (await readDir(`${standardsDir}/${dirs[0]}`))
      .filter(file => file.match(/\.xml/))

    var sections = await Promise.all(questionFiles.map(async file => {
      const [, section] = file.match(/^(.*)\.xml$/)!
      const content = await readFile(`${standardsDir}/${dir}/${file}`)
      return {
        section: section,
        questionGroups: await parse(content)
      }
    }))

    return {
      subject: dir,
      sections: sections,
    }
  }))
}

function readFile (path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, content) => {
      if (err) return reject(err)
      resolve(content)
    })
  })
}
function readDir (path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(path, { encoding: 'utf8' }, (err, files) => {
      if (err) return reject(err)
      resolve(files)
    })
  })
}

// getQuestions().then(x => console.log(JSON.stringify(x, undefined, 2)))
