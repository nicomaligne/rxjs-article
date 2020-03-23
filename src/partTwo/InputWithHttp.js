import React, { useEffect, useState } from "react";
import "./styles.css";

import { ajax } from "rxjs/ajax";
import { Subject } from "rxjs";
import { map, switchMap, delay, startWith, endWith } from "rxjs/operators";

const githubRequest$ = input =>
  ajax(`https://api.github.com/users/${input}`).pipe(
    delay(1000),
    map(userResponse => {
      return userResponse;
    })
  );

const createApi = request$ => {
  const api$ = new Subject();
  return api$.pipe(
    switchMap(input => {
      return request$(input).pipe(
        map(ajaxResponse => {
          return ajaxResponse.response;
        }),
        startWith("disabled"),
        endWith("enabled")
      );
    })
  );
};

const useGetWithPending = observer => {
  const [pending, setPending] = useState(false);
  const [data, setData] = useState({});
  useEffect(() => {
    observer.subscribe(
      clickResponse => {
        console.log({ clickResponse });
        if (clickResponse === "disabled") {
          setPending(true);
        } else if (clickResponse === "enabled") {
          setPending(false);
        } else {
          setData(clickResponse);
        }
      },
      e => console.warn("error", e),
      () => console.log("complete")
    );
  }, [observer]);
  return [pending, data];
};

const Button = ({ children, className }) => {
  const clickStream = createApi(githubRequest$);
  const [pending, data] = useGetWithPending(clickStream);
  const onClick = () => {
    clickStream.next("nicomaligne");
  };
  return (
    <button disabled={pending} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

const ButtonWithLoading = () => {
  return (
    <div className="container">
      <h1>RXJS, http call and loading feedback on a button</h1>
      <Button className="button">Click me !</Button>
    </div>
  );
};

export { ButtonWithLoading };
