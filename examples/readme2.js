'use strict'
const LazyEither = require('..')
const fs = require('fs')
    , os = require('os')
    , path = require('path')
    , R  = require('ramda')
    , S  = require('sanctuary')

//:: String -> String -> String
const join = S.curry2(path.join)

//:: String -> LazyEither (Either e [String])
const ls = path => LazyEither(resolve =>
  fs.readdir(path, (err, files) => resolve(err ? S.Left(err) : S.Right(S.map(join(path), files)))))

//:: String -> LazyEither (Either e String)
const cat = file => LazyEither(resolve =>
  fs.readFile(file, {encoding: 'utf8'}, (err, data) => resolve(err ? S.Left(err) : S.Right(data))))

//:: String -> LazyEither (Either e String)
const catDir =
S.pipe([ls,
        S.chain(S.traverse(LazyEither, cat)),
        S.map(S.unlines)])

// A LazyEither instance is executed when value gets called:
catDir(os.homedir()).value(S.either(console.error, console.log))
