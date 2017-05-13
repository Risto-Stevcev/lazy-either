'use strict'
const R = require('ramda')
    , S = require('sanctuary')

const LazyEither = function(f) {
  if (!(this instanceof LazyEither)) {
    return new LazyEither(f)
  }
  this._value = f
}

LazyEither.prototype.value = function(resolve) {
  this._value(resolve)
}

LazyEither['fantasy-land/of'] = LazyEither.Right = function(x) {
  return new LazyEither(S.T(S.Right(x)))
}

LazyEither.Left = function(x) {
  return new LazyEither(S.T(S.Left(x)))
}

LazyEither.prototype['fantasy-land/chain'] = function(f) {
  const self = this
  return new LazyEither(resolve => {
    self._value(S.either(a => resolve(S.Left(a)), b => f(b)._value(resolve)))
  })
}

LazyEither.prototype['fantasy-land/map'] = function(f) {
  return S.chain(S.compose(LazyEither.Right, f), this)
}

LazyEither.prototype['fantasy-land/bimap'] = function(leftFn, rightFn) {
  const self = this
  return new LazyEither(resolve => {
    self._value(S.compose(resolve, S.either(leftFn, rightFn)))
  })
}

LazyEither.prototype['fantasy-land/ap'] = function(other) {
  const self = this
  return new LazyEither(resolve => {
    let applyFn, val
    const doReject = R.once(resolve)

    const resolveIfDone = () => {
      if (applyFn && applyFn.isLeft)
        doReject(applyFn)
      else if (val && val.isLeft)
        doReject(val)
      else if (applyFn != null && val != null)
        resolve(S.Right(applyFn.value(val.value)))
    }

    other._value(fn => {
      applyFn = fn
      resolveIfDone()
    })

    self._value(result => {
      val = result
      resolveIfDone()
    })
  })
}

LazyEither.prototype['fantasy-land/equals'] = function(other, resolve) {
  this._value(res => {
    other._value(S.compose(resolve, S.equals(res)))
  })
}

LazyEither.lift  = f => R.pipe(f, LazyEither.Right)
LazyEither.liftN = (n, f) => R.curryN(n, R.pipe(f, LazyEither.Right))

LazyEither.promote = S.compose(LazyEither, S.T)

module.exports = { LazyEither: LazyEither }
