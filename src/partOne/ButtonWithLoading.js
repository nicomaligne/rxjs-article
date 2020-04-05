import React, { useEffect, useState } from "react";
import { ajax } from "rxjs/ajax";
import { Subject, throwError } from "rxjs";
import { catchError, map, retry, switchMap, startWith } from "rxjs/operators";

const PRISTINE = "PRISTINE";
const PENDING = "PENDING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

const startWarsAPI$ = () =>
  ajax(
    `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita`
  ).pipe(
    map(ajaxResponse => {
      return ajaxResponse.response;
    }),
    catchError(err => {
      return throwError(err);
    })
  );

const createLazyStreamHttpGetWithPendingStatus = request$ => {
  const api$ = new Subject();
  return api$.pipe(
    switchMap(() => {
      return request$().pipe(startWith(PENDING), retry(3));
    })
  );
};

const initialState = { status: PRISTINE };

const useHttpGetWithPending = observer$ => {
  const [data, setData] = useState(initialState);
  useEffect(() => {
    observer$.subscribe(
      result => {
        console.log({ result });
        if (result === PENDING) {
          setData({ status: PENDING });
        } else {
          setData({ status: SUCCESS, data: result });
        }
      },
      e => {
        setData({ status: ERROR, error: e });
      },
      () => {}
    );
    return () => observer$.unsubscribe();
  }, [observer$]);
  return [data];
};

const Button = ({ children, className, onClick, disabled }) => {
  return (
    <button disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

const CocktailNoInfoAvailable = () => {
  return <div>No data is available</div>;
};

const CocktailError = () => {
  return <div>The service is not responding at the moment</div>;
};

const CocktailRecipe = ({ drinks }) => {
  return drinks.map(drink => {
    return (
      <section>
        <h3>{drink.strDrink}</h3>
        <div>glass: {drink.strGlass}</div>
        <div>instructions: {drink.strInstructions}</div>
        <img src={drink.strDrinkThumb} alt={drink.strDrink} />
      </section>
    );
  });
};

const DisplayCocktailInfos = ({ status, data }) => {
  console.log({ data });
  if (status === SUCCESS) {
    const { drinks } = data;
    return <CocktailRecipe drinks={drinks} />;
  }
  if (status === ERROR) {
    return <CocktailError />;
  }
  return <CocktailNoInfoAvailable />;
};

const ButtonWithLoading = () => {
  const clickStream$ = createLazyStreamHttpGetWithPendingStatus(startWarsAPI$);
  const [response] = useHttpGetWithPending(clickStream$);
  const onClick = () => {
    clickStream$.next();
  };
  return (
    <div className="container">
      <h1>RXJS, http get and loading feedback</h1>
      <Button
        onClick={onClick}
        disabled={response.status === PENDING}
        className="button"
      >
        Fetch margarita recipe !
      </Button>
      <DisplayCocktailInfos status={response.status} data={response.data} />
    </div>
  );
};

export { ButtonWithLoading };
