'use strict'
const expect = require('chai').expect
const LazyEither = require('../index')
const R = require('ramda')
    , S = require('sanctuary')

describe('Constructors', function() {
  it('should construct a Lazy Left value', function(done) {
    LazyEither.Left('bad').value(res => {
      expect(res).to.deep.equal(S.Left('bad'))
      done()
    })
  })

  it('should construct a Lazy Right value', function(done) {
    LazyEither.Right('good').value(res => {
      expect(res).to.deep.equal(S.Right('good'))
      done()
    })
  })

  it('should construct using LazyEither.of', function(done) {
    LazyEither.of('good').value(res => {
      expect(res).to.deep.equal(S.Right('good'))
      done()
    })
  })

  it('should update the instance using LazyEither.of', function(done) {
    LazyEither.Left('bad').of('good').value(res => {
      expect(res).to.deep.equal(S.Right('good'))
      done()
    })
  })

  it('should handle async delayed values', function(done) {
    let startTime = Date.now()
    LazyEither(resolve => {
      setTimeout(() => {
        return resolve(S.Right('hello'))
      }, 1000)
    }).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Right('hello'))
      expect(endTime - startTime).to.be.closeTo(1000, 100)
      done()
    })
  })
})



describe('Chain', function() {
  before(function() {
    this.delayed = t => LazyEither(resolve => {
      if (t > 1000)
        return resolve(S.Left('Delay too long'))

      setTimeout(() => {
        return resolve(S.Right('hello'))
      }, t)
    })
  })

  it('should not execute the rest of the chain if it fails and should propagate the Left value', function(done) {
    let startTime = Date.now()
    LazyEither.Left('bad').chain(this.delayed).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Left('bad'))
      expect(endTime - startTime).to.be.closeTo(0, 100)
      done()
    })
  })

  it('should pass the result to the next item in the chain (1)', function(done) {
    let startTime = Date.now()
    LazyEither.Right(1500).chain(this.delayed).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Left('Delay too long'))
      expect(endTime - startTime).to.be.closeTo(0, 100)
      done()
    })
  })

  it('should pass the result to the next item in the chain (2)', function(done) {
    let startTime = Date.now()
    LazyEither.Right(800).chain(this.delayed).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Right('hello'))
      expect(endTime - startTime).to.be.closeTo(800, 100)
      done()
    })
  })

  it('should pass the result to the next item in the chain (3)', function(done) {
    let startTime = Date.now()
    LazyEither.Right(1001).chain(this.delayed).chain(LazyEither.lift(R.identity)).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Left('Delay too long'))
      expect(endTime - startTime).to.be.closeTo(0, 100)
      done()
    })
  })

  it('should pass the result to the next item in the chain (4)', function(done) {
    let startTime = Date.now()
    LazyEither.Right(1001).chain(LazyEither.lift(a => a - 1)).chain(this.delayed).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Right('hello'))
      expect(endTime - startTime).to.be.closeTo(1000, 100)
      done()
    })
  })

  it('should pass the result to the next item in the chain (5)', function(done) {
    let startTime = Date.now()
    LazyEither.Left('bad').of(200).chain(this.delayed).chain(LazyEither.lift(hi => `${hi} world`)).value(res => {
      let endTime = Date.now()
      expect(res).to.deep.equal(S.Right('hello world'))
      expect(endTime - startTime).to.be.closeTo(200, 100)
      done()
    })
  })

  it('should satisfy associativity', function(done) {
    let val1, val2
    let add3  = LazyEither.lift(R.add(3))
      , mult2 = LazyEither.lift(R.multiply(2)) 

    let resolveIfDone = _ => { if (val1 && val2) done() }

    LazyEither.Right(5).chain(add3).chain(mult2).value(res => {
      val1 = res
      expect(res).to.deep.equal(S.Right(16))
      resolveIfDone() 
    })

    LazyEither.Right(5).chain(x => add3(x).chain(mult2)).value(res => {
      val2 = res
      expect(res).to.deep.equal(S.Right(16))
      resolveIfDone() 
    })
  })
})



describe('Functor', function() {
  it('should apply the map to a Right value (1)', function(done) {
    LazyEither.Right(1).map(R.add(7)).value(res => {
      expect(res).to.deep.equal(S.Right(8))
      done()
    })
  })

  it('should apply the map to a Right value (2)', function(done) {
    LazyEither.Right('foo').map(a => `${a} bar`).map(a => `${a} baz`).value(res => {
      expect(res).to.deep.equal(S.Right('foo bar baz'))
      done()
    })
  })

  it('should not apply the map function to a Left value (1)', function(done) {
    LazyEither.Left('bad').map(a => `${a} bar`).map(a => `${a} baz`).value(res => {
      expect(res).to.deep.equal(S.Left('bad'))
      done()
    })
  })

  it('should satisfy identity (1)', function(done) {
    LazyEither.Right('good').map(R.identity).value(res => {
      expect(res).to.deep.equal(S.Right('good'))
      done()
    })
  })

  it('should satisfy identity (2)', function(done) {
    LazyEither.Left('bad').map(R.identity).value(res => {
      expect(res).to.deep.equal(S.Left('bad'))
      done()
    })
  })

  it('should satisfy composition', function(done) {
    let val1, val2
    let resolveIfDone = _ => { if (val1 && val2) done() }

    LazyEither.Right(5).map(R.add(3)).map(R.multiply(2)).value(res => {
      val1 = res
      expect(res).to.deep.equal(S.Right(16))
      resolveIfDone() 
    })

    LazyEither.Right(5).map(x => R.multiply(2)(R.add(3, x))).value(res => {
      val2 = res
      expect(res).to.deep.equal(S.Right(16))
      resolveIfDone() 
    })
  })
})



describe('Applicative', function() {
  it('should be apply the ap function', function(done) {
    LazyEither.Right(R.multiply(3)).ap(LazyEither.Right(4)).value(res => {
      expect(res).to.deep.equal(S.Right(12))
      done()
    })
  })

  it('should propagate a Left value (1)', function(done) {
    LazyEither.Left('bad').ap(LazyEither.Right(2)).value(res => {
      expect(res).to.deep.equal(S.Left('bad'))
      done()
    })
  })

  it('should propagate a Left value (2)', function(done) {
    LazyEither.Right(R.add(5)).ap(LazyEither.Left('bad')).value(res => {
      expect(res).to.deep.equal(S.Left('bad'))
      done()
    })
  })

  it('should be able to compose multiple ap functions', function(done) {
    LazyEither.Right(R.multiply(2)).ap(LazyEither.Right(R.add(3)).ap(LazyEither.Right(5))).value(res => {
      expect(res).to.deep.equal(S.Right(16))
      done()
    })
  })

  it('should satisfy identity', function(done) {
    LazyEither.Right(R.identity).ap(LazyEither.Right('good')).value(res => {
      expect(res).to.deep.equal(S.Right('good'))
      done()
    })
  })

  it('should satisfy homomorphism', function(done) {
    LazyEither.of(R.add(3)).ap(LazyEither.of(5)).value(res => {
      LazyEither.of(R.add(3, 5)).value(res2 => {
        expect(res).to.deep.equal(res2)
        done()
      })
    })
  })

  it('should satisfy interchange', function(done) {
    LazyEither.of(R.add(3)).ap(LazyEither.of(5)).value(res => {
      LazyEither.of(f => f(5)).ap(LazyEither.of(R.add(3))).value(res2 => {
        expect(res).to.deep.equal(S.Right(8))
        expect(res).to.deep.equal(res2)
        done()
      })
    })
  })
})



describe('Setoid (contitional)', function() {
  it('should return true if a and b are equal (reflexivity) (1)', function(done) {
    LazyEither.Right('good').equals(LazyEither.Right('good'), res => {
      expect(res).to.be.true
      done()
    })
  })

  it('should return true if a and b are equal (reflexivity) (2)', function(done) {
    LazyEither.Left('bad').equals(LazyEither.Left('bad'), res => {
      expect(res).to.be.true
      done()
    })
  })

  it('should return false if a and b are not equal (1)', function(done) {
    LazyEither.Right(1).equals(LazyEither.Right(2), res => {
      expect(res).to.be.false
      done()
    })
  })

  it('should return false if a and b are not equal (2)', function(done) {
    LazyEither.Left(1).equals(LazyEither.Left(2), res => {
      expect(res).to.be.false
      done()
    })
  })

  it('should return false if a and b are equal but Left and Right', function(done) {
    LazyEither.Left(1).equals(LazyEither.Right(1), res => {
      expect(res).to.be.false
      done()
    })
  })

  it('should satisfy symmetry', function(done) {
    LazyEither.Right(7 + 5).equals(LazyEither.Right(3 * 4), res => {
      LazyEither.Right(3 * 4).equals(LazyEither.Right(7 + 5), res2 => {
        expect(res).to.deep.equal(res2)
        done()
      })
    })
  })

  it('should satisfy transitivity', function(done) {
    LazyEither.Right(7 + 5).equals(LazyEither.Right(3 * 4), res => {
      LazyEither.Right(3 * 4).equals(LazyEither.Right(72 / 6), res2 => {
        LazyEither.Right(7 + 5).equals(LazyEither.Right(72 / 6), res2 => {
          expect(res).to.deep.equal(res2)
          done()
        })
      })
    })
  })
})



describe('Lift', function() {
  it('should lift a function of arity 1', function(done) {
    let lifted = LazyEither.lift(R.multiply(3))

    LazyEither.Right(3).chain(lifted).value(res => {
      expect(res).to.deep.equal(S.Right(9))
      done()
    })
  })

  it('should lift a function of arity n', function(done) {
    let add  = R.curry((a, b, c, d, e) => a + b + c + d + e)
      , lifted = LazyEither.liftN(5, add)

    LazyEither.Right(3).chain(lifted(4, 5, 6, 7)).value(res => {
      expect(res).to.deep.equal(S.Right(25))
      done()
    })
  })
})



describe('Promote', function() {
  it('should promote an Either type to a LazyEither type (Left)', function(done) {
    LazyEither.promote(S.Left('bad')).value(either => {
      expect(either.isLeft).to.be.true
      expect(either.value).to.equal('bad')
      done()
    })
  })

  it('should promote an Either type to a LazyEither type (Right)', function(done) {
    LazyEither.promote(S.Right('good')).value(either => {
      expect(either.isRight).to.be.true
      expect(either.value).to.equal('good')
      done()
    })
  })
})
