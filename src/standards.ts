import * as fs from 'fs'
import * as path from 'path'
import {parse, Section, Standard} from './parser'

export async function parseStandards () {
  const standardsDir = path.resolve(__dirname, '../standards')
  const dirs: string[] = (await readDir(standardsDir))
    .filter(file => fs.statSync(`${standardsDir}/${file}`).isDirectory())

  return Promise.all(dirs.map(async dir => {

    const questionFiles = (await readDir(`${standardsDir}/${dirs[0]}`))
      .filter(file => file.match(/\.xml/))

    var sections = await Promise.all(questionFiles.map(async file => {
      const [, sectionName] = file.match(/^(.*)\.xml$/)!
      const content = await readFile(`${standardsDir}/${dir}/${file}`)
      const section: Section = {
        name: titleize(sectionName),
        questionGroups: await parse(content)
      }
      return section
    }))

    const standard: Standard = {
      name: dir,
      sections: sections,
    }
    return standard
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

function titleize (src: string) {
  return src.split('-')
    .map(p => p[0].toUpperCase() + p.slice(1))
    .map(p => p[0] === '_' ? p.slice(1) : p) // Remove leading underscores
    .join(' ')
}
