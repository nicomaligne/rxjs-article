# RXJS with React

big library as lodash for example, you don't know everthing in lodash but that's not a problem. You are searching in it when you need something in particular. Sme with rx

## Intro

I'm a React - Redux developer since -more or less- 3 years. I think Redux is a great tool, to shared data across the app, to communicate between service using event driven aspect etc.
But it isn't shining on the async part.
I have used two middlewares with redux, Thunk a little and Redux-saga a lot.
In this article we are gonna to explore RxJS, as another solution to fix async problem frontend side, using React as the ui fmk / lib (choose the definition you prefer).

## Reactive Programming

Functional programming
Stop thinking imperative way
Thinking of event stream

According to Wikipedia, “reactive programming is a declarative programming paradigm concerned with data streams and the propagation of change.” (Emphasis mine.)

## RxJS
---

DASSURMA : Just having a different syntax to subscribe to events is not really that interesting, though. What makes RP really powerful is the ability to encapsulate behaviors or kinds of data processing. RxJS calls these encapsulations “operators”. You can connect multiple observables into a whole graph of data streams using these operators.

An operator takes an observable and returns a new observable, giving the operator a chance to mangle or transform the data. This can be a basic transformation like a map or filter which you might know from Arrays. But the transformation can also be more complex like debouncing high-frequency events with debouce, flattening higher-order observables (an observable of observables) into a first-order observable with concatAll or combining multiple observables into one with combineLatestWith.

---

RxJs history + react useEffect

What is an observable ?
An observable is an infinite collection
Representation streams during this article [....3....3..4]
AS an array observable share some common api with an classic js [array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array).
You can map, filter etc...

Observable are lazy. Until you didn't susbscribe to it, it does nothing.
To subscribe you need too

```javascript
Observable.subscribe;
```

An observable in RxJS needs 3 function,
onNext,
onComplete,
onError,

You can manipulate an observable with the class function, pipe.

```javascript
Obersvable.pipe(...)
```

RxJs gives you a lot (really a lot) of operators.
Operators to apply transformation

```javascript
Observable.pipe(map(projectionFunction));
```

or filtering for example

```javascript
Observable.pipe(filter(predicateFunction));
```

You have also operators to combined observables and create a new one
They are 3 must known

- concatenate create a new observable keeping the elapsed time between the two observables
- merge create a new observable flattening them
- switch create a new observable keeping only the last entry. Very useful on frontend to only keep the last user input.

Oh one more thing, Observable are easily cancelable, and that is just awesome for frontend development.

## First example conclusion

After the theory let's code.
In our first example we are gonna make a pretty common use case, when clicking on a button,
a http request will trigger, so we want to handle the states during the call.
The pending state, button is disabled.
The success state, data is displayed and button is clickable.
The error state, a simple error message is displayed.

The react useEffect will be our glue between our ui and the observable.

First of all we know we want to make a basic http get call.
RxJS provides us an [ajax](https://rxjs-dev.firebaseapp.com/api/ajax/ajax) observable.
We are going to apply a map projection on the observable so we need to use pipe.
In this projection we are extracting the response from the http call.

```javascript
ajax(`https://swapi.co/api/films/1/`).pipe(
  map(ajaxResponse => {
    return ajaxResponse.response;
  })
);
```

Ajax returns a new observable, in this stream we are "extracting" the response from the ajax response.

The call is trigger every time you click on the button, so we want another observable here.
We want only the last click the user has done so here we will use the SwitchMap combined operators.
SwitchMqp take the last action emitted by the stream, if a new action comes in it will cancel the old one. This is one powerful thing about Rx observable they are cancellable.
It also subscribe and execute to it's inner observable. So we are creating an observable in a observable. But switch map also flatten the result of the source and the inner one.
So we have only one observable as a result.

Subject definition : Listen and emit !

```javascript
const onClick$ = new Subject();
onClick$.pipe(
  switchMap(() => {
    return ajax(`https://swapi.co/api/films/1/`).pipe(
      map(ajaxResponse => {
        return ajaxResponse.response;
      })
    );
  })
);
```

So here we are creating a stream, beginning with our onClick subject, taking only the last user input (switchMap), and for every incoming input we are making an ajax call to our api and finally returning the data.
Et voila, this is our first observable stream.
But remember observable are lazy, here nothing gonna happen, we need to subscribe before.

We are using the useEffect hook to subscribe to our observable, for the beginning we are only fill the onNext function.
And a useState to save our response.

```javascript
const [data, setData] = React.useState({});
React.useEffet(() => {
  onClick$.subscribe(data => setData({ data }));
  return () => onClick$.unsubscribe();
}, [onClick$]);
```

Ok almost done, our button needs now to trigger the stream

```javascript
<button onClick={() => onClick$.next()}>Click</button>
```

Now on every click will trigger the onClick\$ observable, it will take the last user input and make a get request, returning the data.
Now let's had a new state, the pending one. When a user click on the button, we want to give a visual feedback, so we will disabled the button.

We want to emit at the beginning of the stream the 'PENDING' value.
StartWith seems a good operator to fill the task.

```javascript
switchMap(() => {
  return ajax(`https://swapi.co/api/films/1/`).pipe(
    startWith("PENDING"),
    map(ajaxResponse => {
      return ajaxResponse.response;
    })
  );
});
```

We have to handle it in our react component.

```javascript
const [data, setData] = React.useState({});
React.useEffet(() => {
  onClick$.subscribe(data => {
    if (data === 'PENDING) {
      setData({ status: 'PENDING'})
    } else {
      setData({ data }));
    }
  }
  return () => onClick$.unsubscribe();
}, [onClick$]);
```

And our button

```javascript
<button onClick={() => onClick$.next()} disabled={data.status === "PENDING"}>
  Click
</button>
```

Ok you could absolutely do the same thing if your http get call is in your component.

```javascript
const onClick = () => {
  setData({ status: PENDING });
  fetch("https://swapi.co/api/films/1/", { method: "GET" })
    .catch(e => {
      setData({ error: e, status: ERROR });
    })
    .then(response => response.json())
    .then(data => {
      setData({ data, status: SUCCESS });
    });
};
```

It's quite the same code that we have in our `useHttpGetWithPending` hook, except we have more verbosity in the stream declaration, but we'll see that compose observable can be powerful.

For the redux async user, you should have trigger a redux event, store the state of the request in your store, listen to it in your connect to trigger the render etc.

Part of the magic here, it's that all status are data. Of course you have to save it in your React component to trigger the render you want but you don't have intermediate state layer with the store.

RxJs provides also a awesome (and very scary at first) library.
You could had the 'retry' operator to handle X retry on your call before throwing an error, with no effort.

```javascript
return request$().pipe(startWith(PENDING), retry(3));
```

Your data and their state are described and evolved along the stream you have created.  
Let's go deeper with RxJs with a little more complex example

## Second example

Input text with http call
