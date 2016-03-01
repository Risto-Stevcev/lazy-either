'use strict'
/* This is the implementation using Futures. Notice how it doesn't have that extra type safety with Either, 
 * the chain has a kink (chain1 and chain2), and worst of all, the pyramid of doom is back!
 */
const futurizer = require('futurizer').futurizer
    , R         = require('ramda')
    , fs        = require('fs')

const Either = require('ramda-fantasy').Either
    , Future = require('ramda-fantasy').Future

let readFile = futurizer(fs.readFile) // returns a buffer
  , readDir  = futurizer(fs.readdir)

let writeFile = R.curry((file, data) => {
  return Future((reject, resolve) => {
    fs.writeFile(file, data, (err) => {
      if (err)
        reject(err)
      else
        resolve('Write successful')
    })
  })
})

let filterJs  = R.pipe(R.filter(file => /\.js$/.test(file)), Future.of)
  , readFiles = files => R.traverse(Future.of, readFile, files)

let numRequires = file => file.toString().split(/require\([^)]+\)/).length - 1

let chain1 = path => readDir(path).chain(filterJs).chain(readFiles)
  , chain2 = R.pipe(R.map(numRequires), R.reduce(R.add, 0), R.concat('Total requires: '))

/** The Pyramid of Doom (a.k.a. callback hell) **/
chain1('.').fork(
  error => {
    console.error(`${error.name}: ${error.message}`)
  },
  data  => {
    R.pipe(chain2, writeFile('stats.txt'))(data).fork(
      error => {
        console.error(`${error.name}: ${error.message}`)
      },
      data => {
        console.log(data)
      }
    )
  }
)
