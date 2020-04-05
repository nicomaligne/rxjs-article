import React, { useEffect, useState } from "react";
import { ajax } from "rxjs/ajax";
import { Subject, throwError, of, iif } from "rxjs";
import {
  catchError,
  map,
  retry,
  switchMap,
  startWith,
  debounceTime
} from "rxjs/operators";
import { DisplayCocktailInfos } from "../components/DisplayCocktailInfos";

const PRISTINE = "PRISTINE";
const PENDING = "PENDING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";
const TOO_SHORT = "TOO_SHORT";

const cocktailAPI$ = value =>
  ajax(
    `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${value}`
  ).pipe(
    map(ajaxResponse => {
      return { status: SUCCESS, data: ajaxResponse.response };
    }),
    catchError(err => {
      return throwError(err);
    })
  );

const createLazyStreamHttpGetWithPendingStatus = request$ => {
  const api$ = new Subject();
  return api$.pipe(
    debounceTime(500),
    switchMap(value => {
      return iif(
        () => value.length > 3,
        request$(value).pipe(startWith({ status: PENDING }), retry(3)),
        of({ status: TOO_SHORT })
      );
    })
  );
};

const initialState = { status: PRISTINE };

const useHttpGetWithPending = observer$ => {
  const [result, setResult] = useState(initialState);
  useEffect(() => {
    observer$.subscribe(
      streamResult => {
        setResult(streamResult);
      },
      err => {
        setResult({ status: ERROR, error: err });
      },
      () => {
        console.warn("stream complete");
      }
    );
    return () => observer$.unsubscribe();
  }, [observer$]);
  return [result];
};

const InputWithHttpGet = () => {
  const clickStream$ = createLazyStreamHttpGetWithPendingStatus(cocktailAPI$);
  const [response] = useHttpGetWithPending(clickStream$);

  const onChange = event => {
    clickStream$.next(event.target.value);
  };
  return (
    <div className="container">
      <h1>RXJS</h1>
      <h2>Dynamic get input</h2>
      <label>Ask for a cocktail</label>
      <input type="text" onChange={onChange} />
      <DisplayCocktailInfos status={response.status} data={response.data} />
    </div>
  );
};

export { InputWithHttpGet };
