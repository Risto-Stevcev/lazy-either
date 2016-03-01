'use strict'
/* The is the implementation using LazyEither. Notice that it's just one elegant pipeK with the safety of Either */
const R  = require('ramda')
    , S  = require('sanctuary')
    , fs = require('fs')
const LazyEither = require('lazy-either').LazyEither
 
let writeFile = R.curry((file, data) => {
  return new LazyEither(resolve => {
    fs.writeFile(file, data, err => resolve(err ? S.Left(err) : S.Right('Write successful')))
  })
})

let readFile = path => {
  return new LazyEither(resolve => {
    fs.readFile(path, (err, data) => resolve(err ? S.Left(err) : S.Right(data.toString())))
  })
}

let readDir = path => { 
  return new LazyEither(resolve => {
    fs.readdir(path, (err, files) => resolve(err ? S.Left(err) : S.Right(files)))
  })
}

let filterJs  = R.pipe(R.filter(file => /\.js$/.test(file)), LazyEither.of)
  , readFiles = files => R.traverse(LazyEither.of, readFile, files)

let numRequires = file => LazyEither.Right(file.toString().split(/require\([^)]+\)/).length - 1)
  , printTotal = total => LazyEither.Right(`Total requires: ${total}`)

let getStats = R.pipeK(readDir, filterJs, readFiles, numRequires, printTotal, writeFile('stats.txt'))

getStats(LazyEither.Right('.')).value(val => console.log(val))
//getStats(LazyEither.Right('blablah')).value(val => console.log(val))
