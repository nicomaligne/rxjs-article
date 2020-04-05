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

// const checkboxStream = () => {
let checkboxStream$ = new Subject();
checkboxStream$ = checkboxStream$.pipe(
  debounceTime(200),
  switchMap((value, formState) => {
    return iif(
      () => value === true,
      of({
        ...formState,
        checkbox: {
          value,
        }
      }),
      of({
        ...formState,
        checkbox: {
          value
        },
        text: {
          value: ""
        }
      })
    );
  })
);
// };

// const selectStream = () => {
let selectStream$ = new Subject();
selectStream$ = selectStream$.pipe(
  debounceTime(200),
  map(value => {
    console.log("selectStream", value);
    return { value };
  })
);
// };

// const textStream = () => {
let textStream$ = new Subject();
textStream$ = textStream$.pipe(
  debounceTime(200),
  switchMap(value => {
    return iif(
      () => value.length < 3,
      of({ error: "too low" }),
      of({ value, error: "" })
    );
  })
);
// };

let submitStream$ = new Subject();
submitStream$ = submitStream$.pipe(
  switchMap(formState => {
    return selectStream$;
  })
);

const useObservable = (
  observable$,
  onNext,
  onError = () => {},
  onComplete = () => {}
) => {
  useEffect(() => {
    observable$.subscribe(onNext, onError, onComplete);
    return observable$.unsubscribe();
  }, [observable$, onNext, onError, onComplete]);
};

const MultipleInput = () => {
  const [formState, setFormState] = useState({
    checkbox: { value: false, error: "" },
    select: { value: "none", error: "" },
    text: { value: "", error: "" }
  });

  useObservable(textStream$, next =>
    setFormState(prevState => {
      return { ...prevState, text: next };
    })
  );

  useObservable(checkboxStream$, next => {
    console.log({ next });
    setFormState(next);
  });

  useObservable(selectStream$, next => {
    setFormState(prevState => {
      return { ...prevState, select: next };
    });
  });

  useObservable(
    submitStream$,
    next => {
      console.log({ next });
    },
    error => console.log({ error }),
    () => {}
  );

  console.log({ formState });

  const onSubmit = event => {
    event.preventDefault();
    console.log({ event });
    submitStream$.next(formState);
  };

  console.log({ formState });

  return (
    <div className="container">
      <h1>RXJS</h1>
      <h2>Multiple input</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="first-letter-cocktail">Choose a letter:</label>
          <select
            name="cocktails-alphabet"
            id="first-letter-cocktail"
            onChange={event => selectStream$.next(event.target.value)}
          >
            <option value="none">choose an option</option>
            <option value="a">a</option>
            <option value="b">b</option>
            <option value="c">c</option>
            <option value="d">d</option>
            <option value="e">e</option>
            <option value="f">f</option>
            <option value="g">g</option>
          </select>
        </div>
        <div>
          <label>Precise an ingredient</label>
          <input
            type="checkbox"
            onChange={event => {
              checkboxStream$.next(event.target.checked, formState);
            }}
          />
        </div>
        {formState.checkbox.value && (
          <div>
            <label>Enter an ingredient</label>
            <input
              type="text"
              onChange={event => textStream$.next(event.target.value)}
            />
            {formState?.text?.error?.length > 0 && (
              <div style={{ color: "red" }}>{formState.text.error}</div>
            )}
          </div>
        )}
        <button type="submit">submit</button>
        {/* <DisplayCocktailInfos status={response.status} data={response.data} /> */}
      </form>
    </div>
  );
};

export { MultipleInput };

/*
  Errors:
    - input TOO_SHORT && REQUIRED
    - select EMPTY

    submit$(text, checkbox, select)
        debounce
        switchMap
            iff select empty
                -> set status error select empty    
                -> iff checkbox
                    -> true
                        iff (required || text.length > 3)
                            -> request select + checkbox + text
                            -> off TOO_SHORT || off REQUIRED
                    -> request select

  useEffect(() => {
      subscribe(

      )
  }, [text, checkbox, select])


----------------------------------------------------------------------

text$ -> check

submit -> 






  */
