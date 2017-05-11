'use strict'
const LazyEither = require('..')
const S = require('sanctuary')

//:: (Number, a) -> LazyEither (Either e a)
let delayed = (ms, val) => LazyEither(resolve => {
  ms > 1000 ? resolve(S.Left(Error('Delay too long')))
            : setTimeout(() => resolve(S.Right(val)), ms)
})

delayed(500, 'Hello').value(console.log)  // returns Right('Hello')
delayed(1001, 'Hey').value(console.log)  // returns Left(Error('Delay too long'))
