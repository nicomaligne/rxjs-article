import React, { useEffect, useState } from "react";
import { ajax } from "rxjs/ajax";
import { Subject, throwError } from "rxjs";
import { catchError, map, retry, switchMap, startWith } from "rxjs/operators";

const PRISTINE = "PRISTINE";
const PENDING = "PENDING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

const startWarsAPI$ = () =>
  ajax(`https://swapi.co/api/films/1/`).pipe(
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

const SWNoInfoAvailable = () => {
  return <div>No data is available</div>;
};

const SWFilmError = () => {
  return <div>The service is not responding at the moment</div>;
};

const SWFilm = ({ title, director, producers, releaseDate, opening }) => {
  return (
    <section>
      <div>{title}</div>
      <div>Director: {director}</div>
      <div>Producer(s): {producers}</div>
      <div>Release date: {releaseDate}</div>
      <p>{opening}</p>
    </section>
  );
};

const DisplaySWFilmInfos = ({ status, data }) => {
  if (status === SUCCESS) {
    const { title, director, producer, release_date, opening_crawl } = data;
    return (
      <SWFilm
        title={title}
        director={director}
        producers={producer}
        releaseDate={release_date}
        opening={opening_crawl}
      />
    );
  }
  if (status === ERROR) {
    return <SWFilmError />;
  }
  return <SWNoInfoAvailable />;
};

const ButtonWithLoading = () => {
  const clickStream$ = createLazyStreamHttpGetWithPendingStatus(startWarsAPI$);
  const [response] = useHttpGetWithPending(clickStream$);
  const onClick = () => {
    clickStream$.next();
  };
  return (
    <div className="container">
      <h1>RXJS, http call and loading feedback</h1>
      <Button
        onClick={onClick}
        disabled={response.status === PENDING}
        className="button"
      >
        Fetch Star Wars Episode One !
      </Button>
      <DisplaySWFilmInfos status={response.status} data={response.data} />
    </div>
  );
};

export { ButtonWithLoading };
