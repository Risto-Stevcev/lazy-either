# LazyEither

The `LazyEither` type is used to represent a lazy `Either` value. It is similar to the `Future` and `Promise` types. The constructor continuation function parameter and *eventual* return value is an `Either` type. The execution is delayed until the value is requested using one of it's methods.

The implementation is more favorable than the `Future` type because it is very easy to compose elegant pipelines, and it handles errors nicely. If `fork`-like branching is desired, it can be done just by resolving the pipeline using `value` and checking whether the result `isLeft` or `isRight` (though branching is not usually needed). See the examples section for more details.

The implementation follows the [Fantasy Land](https://github.com/fantasyland/fantasy-land) specifications. The `LazyEither` type is a `Functor`, `Applicative` and `Monad`. It is not (necessarily) a `Setoid` due to it's lazy/deferred nature. 


## Construction

The `LazyEither` type consists of a single constructor that accepts a function which must accept a continuation function used to resolve the `LazyEither` instance into an `Either` type: 

```hs
LazyEither :: ((Either e a -> ()) -> ()) -> LazyEither (Either e a)
```

The resolved instance should be an [Either type](https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md).


```js
//:: (Num -> a) -> LazyEither (Either e a)
let delayed = (ms, val) => LazyEither(resolve => {
  ms > 1000 ? resolve(S.Left(Error('Delay too long')))
            : setTimeout(() => resolve(S.Right(val)), ms)
})
```

```js
delayed(500, 'Hello').value(result => console.log(result))  // returns Right('Hello')
delayed(1001, 'Hey').value(result => console.log(result))  // returns Left(Error('Delay too long'))
```


## Interaction

Once a `LazyEither` instance has been created, the various methods attached to the instance can be used to instruct further transformations to take place. Nothing is actually executed until the `value` or `equals` method is called.

The `map`, `ap` and `chain` functions can be used to transform resolved values of a `LazyEither` instance.

```js
//:: (Either e String) -> LazyEither (Either e [String])
let ls = path => LazyEither(resolve =>
  fs.readdir(path, (err, files) => resolve(err ? S.Left(err) : S.Right(files))))

//:: (Either e String) -> LazyEither (Either e String)
let cat = file => LazyEither(resolve =>
  fs.readFile(file, 'utf8', (err, data) => resolve(err ? S.Left(err) : S.Right(data))))

//:: (Either e String) -> LazyEither (Either e String)
let catDir = dir => ls(dir.value).chain(R.traverse(LazyEither.of, cat)).map(R.join('\n'))
```

A `LazyEither` instance is executed when `value` or `equals` gets called:

```js
catDir(S.Right('.')).value(data => console.log(data.value))
```


## Reference

### Constructors

#### `LazyEither`

```hs
:: ((Either e a -> ()) -> ()) -> LazyEither (Either e a)
```
Constructs a `LazyEither` instance that represents some action that may possibly fail. It takes a function which must accept a continuation function that takes an `Either` type used to represent success or failure. 

#### `LazyEither.Right`
```hs
:: a -> LazyEither (Either e a)
```
Creates a `LazyEither` instance that resolves to a `Right` with the given value.

#### `LazyEither.Left`
```hs
:: e -> LazyEither (Either e a)
```
Creates a `LazyEither` instance that resolves to a `Left` with the given value.


### Static methods

#### `LazyEither.of`
```hs
:: a -> LazyEither (Either e a)
```

Creates a pure instance that resolves to a `Right` with the given value. This is also an instance method.

#### `LazyEither.lift`
```hs
:: (a -> b) -> a -> LazyEither (Either e b)
```

Lifts a function of arity `1` into one that returns a `LazyEither` instance.

#### `LazyEither.liftN`
```hs
:: n -> (a -> b -> ..) -> a -> b -> .. -> LazyEither (Either e b)
```

Lifts a function of arity `n` into one that returns a `LazyEither` instance.


### Instance methods

#### `lazyEither.map`
```hs
:: LazyEither (Either e a) ~> (a -> b) -> LazyEither (Either e b)
```
Transforms the resolved `Either` value of this `LazyEither` instance with the given function. If the instance resolves as a `Left` value, the provided function is not called and the returned `LazyEither` instance will resolve with that `Left` value.

#### `lazyEither.ap`
```hs
:: LazyEither (Either e (a -> b)) ~> LazyEither (Either e a) -> LazyEither (Either e b)
```
Applies the `Either` function of this `LazyEither` instance to the `Either` value of the provided `LazyEither` instance, producing a `LazyEither` instance of the result. If either `LazyEither` resolves as a `Left` value, then the returned `LazyEither` instance will resolve with that `Left` value.

#### `lazyEither.chain`
```hs
:: LazyEither (Either e a) ~> (a -> LazyEither (Either e b)) -> LazyEither (Either e b)
```
Calls the provided function with the value of this `LazyEither` instance, returning the new `LazyEither` instance. If either `LazyEither` instance resolves as a `Left` value, the returned `LazyEither` instance will resolve with that `Left` value. The provided function can be used to try to recover the error.

#### `lazyEither.bimap`
```hs
:: LazyEither (Either e a) ~> (e -> f) -> (a -> b) -> LazyEither (Either f b)
```
Uses the provided functions to transform this `LazyEither` instance when it resolves to a `Left` or a `Right` value, respectively.

#### `lazyEither.value`
```hs
:: LazyEither (Either e a) ~> ((Either e a) -> ()) -> ()
```
Calls the provided function with the value of this `LazyEither` instance without returning a new `LazyEither` instance. It is similar to `Future.fork`. This function can be used as a final processing step for the returned `Either` value, or to create a branch of two seperate execution streams to handle the resolved `Left` or `Right` value.

#### `lazyEither.equals`
```hs
:: LazyEither (Either a b) ~> LazyEither (Either c d) -> ((Boolean) -> ()) -> ()
```
Compares the `Either` value of this `LazyEither` instance with the `Either` value of the provided `LazyEither` instance, and calls the provided function with the `Boolean` result of the comparison. Like `value`, this function will resolve the pipeline. The result will return `True` if both `Either` values match or `False` if they do not match.
