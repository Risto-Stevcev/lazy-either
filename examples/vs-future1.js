'use strict'
const R  = require('ramda')
    , S  = require('sanctuary')
    , fs = require('fs')
    , os = require('os')
    , path = require('path')
const LazyEither = require('..')

const join = S.curry2(path.join)

const readDir = path =>
  new LazyEither(resolve => {
    fs.readdir(path,
               (err, files) => resolve(err != null ? S.Left(err) : S.Right(S.map(join(path), files))))
  })

const readFile = path =>
  new LazyEither(resolve => {
    fs.readFile(path,
                {encoding: 'utf8'},
                (err, data) => resolve(err != null ? S.Left(err) : S.Right(data)))
  })

const writeFile = S.curry2((file, data) =>
  new LazyEither(resolve => {
    fs.writeFile(file,
                 data,
                 err => resolve(err != null ? S.Left(err) : S.Right('Write successful')))
  })
)

const getStats =
S.pipe([readDir,
        S.map(S.filter(S.test(/[.]js$/))),
        S.chain(S.traverse(LazyEither, readFile)),
        S.map(String),
        S.map(S.matchAll(/require[(][^)]+[)]/g)),
        S.map(S.prop('length')),
        S.map(String),
        S.map(S.concat('Total requires: ')),
        S.chain(writeFile('stats.txt'))])

getStats(__dirname).value(console.log)
//getStats('blablah').value(console.log)
