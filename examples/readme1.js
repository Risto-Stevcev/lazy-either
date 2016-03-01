'use strict'
const LazyEither = require('lazy-either').LazyEither
const S = require('sanctuary')

//:: (Num -> a) -> LazyEither (Either e a)
let delayed = (ms, val) => LazyEither(resolve => {
  ms > 1000 ? resolve(S.Left(Error('Delay too long')))
            : setTimeout(() => resolve(S.Right(val)), ms)
})

delayed(500, 'Hello').value(result => console.log(result))  // returns Right('Hello')
delayed(1001, 'Hey').value(result => console.log(result))  // returns Left(Error('Delay too long'))
