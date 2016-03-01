'use strict'
const LazyEither = require('lazy-either').LazyEither
const fs = require('fs')
    , R  = require('ramda')
    , S  = require('sanctuary')

//:: (Either e String) -> LazyEither (Either e [String])
let ls = path => LazyEither(resolve =>
  fs.readdir(path, (err, files) => resolve(err ? S.Left(err) : S.Right(files))))

//:: (Either e String) -> LazyEither (Either e String)
let cat = file => LazyEither(resolve =>
  fs.readFile(file, 'utf8', (err, data) => resolve(err ? S.Left(err) : S.Right(data))))

//:: (Either e String) -> LazyEither (Either e String)
let catDir = dir => ls(dir.value).chain(R.traverse(LazyEither.of, cat)).map(R.join('\n'))

// A LazyEither instance is executed when value gets called:
catDir(S.Right('.')).value(data => console.log(data.value))
