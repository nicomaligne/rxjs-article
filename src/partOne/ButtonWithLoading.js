import React, { useEffect, useState } from "react";
import "./styles.css";
import { ajax } from "rxjs/ajax";
import { Subject, throwError } from "rxjs";
import { catchError, map, switchMap, startWith } from "rxjs/operators";

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
      console.log("startWarsAPI failed", err);
      return throwError(err);
    })
  );

const createLazyStreamHttpGetWithPendingStatus = request$ => {
  const api$ = new Subject();
  return api$.pipe(
    switchMap(() => {
      return request$().pipe(startWith(PENDING));
    })
  );
};

const useHttpGetWithPending = observer$ => {
  const [data, setData] = useState({ status: PRISTINE });
  useEffect(() => {
    observer$.subscribe(
      result => {
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

const NoDataAvailable = () => {
  return <div>No data is available</div>;
};

const DisplaySWFilmData = ({
  title,
  director,
  producers,
  releaseDate,
  opening
}) => {
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

const ButtonWithLoading = () => {
  const clickStream$ = createLazyStreamHttpGetWithPendingStatus(startWarsAPI$);
  const [response] = useHttpGetWithPending(clickStream$);
  if (response.status === ERROR) {
    console.log("Do something about it", response.error);
  }
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

      {response && response.status === SUCCESS ? (
        <DisplaySWFilmData
          title={response.data.title}
          director={response.data.director}
          producers={response.data.producer}
          releaseDate={response.data.release_date}
          opening={response.data.opening_crawl}
        />
      ) : (
        <NoDataAvailable />
      )}
    </div>
  );
};

export { ButtonWithLoading };
