'use strict'
const R = require('ramda')
    , S = require('sanctuary')

let LazyEither = function(f) {
  if (!(this instanceof LazyEither)) {
    return new LazyEither(f)
  }
  this._value = f
}

LazyEither.prototype.value = function(resolve) {
  this._value(res => resolve(res))
}

LazyEither.of = LazyEither.Right = function(x) {
  return new LazyEither(function(resolve) { return resolve(S.Right(x)) })
}
LazyEither.prototype.of = LazyEither.of

LazyEither.Left = function(x) {
  return new LazyEither(function(resolve) { return resolve(S.Left(x)) })
}

LazyEither.prototype.chain = function(f) {
  return new LazyEither(function(resolve) {
    this._value(res => res.isLeft ? resolve(res) : f(res.value)._value(result => resolve(result)))
  }.bind(this))
}

LazyEither.prototype.map = function(f) {
  return this.chain(function(a) { return LazyEither.Right(f(a)) })
}

LazyEither.prototype.bimap = function(leftFn, rightFn) {
  return new LazyEither(function(resolve) {
    this._value(result => result.isLeft ? resolve(S.Left(leftFn(result.value)))
                                        : resolve(S.Right(rightFn(result.value))))
  }.bind(this))
}

LazyEither.prototype.ap = function(m) {
  return new LazyEither(function(resolve) {
    let applyFn, val
    let doReject = R.once(resolve)
 
    var resolveIfDone = function() {
      if (applyFn && applyFn.isLeft)
        doReject(applyFn)
      else if (val && val.isLeft)
        doReject(val)
      else if (applyFn != null && val != null) {
        resolve(S.Right(applyFn.value(val.value)))
      }
    }

    this._value(fn => {
      applyFn = fn
      resolveIfDone()
    })

    m._value(result => {
      val = result
      resolveIfDone()
    })
  }.bind(this))
}

LazyEither.prototype.equals = function(m, resolve) {
  this._value(res => {
    m._value(mres => resolve(res.isLeft === mres.isLeft && res.value === mres.value))
  })
}

LazyEither.lift  = f => R.pipe(f, LazyEither.Right)
LazyEither.liftN = (n, f) => R.curryN(n, R.pipe(f, LazyEither.Right))

LazyEither.promote = either => LazyEither(resolve => resolve(either))

module.exports = { LazyEither: LazyEither }
