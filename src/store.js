import { createStore, combineReducers, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import {
  call,
  put,
  select,
  all,
  takeLatest,
  takeEvery
} from "redux-saga/effects";
import { selectSearch, selectFilms } from "./selectors";

const defaultListState = {
  pageDetails: {
    title: "Test Title"
  },
  search: "Han",
  itemList: [],
  films: [],
  loading: false,
  errorMessage: ""
};

const defaultLoginState = {
  username: "stan",
  password: "stan'spassword"
};

const reducers = combineReducers({
  list(state = defaultListState, action) {
    switch (action.type) {
      case "SET_ITEM_LIST":
        return {
          ...state,
          loading: false,
          itemList: action.payload
        };
      case "LOAD_LIST_FAILED":
        return {
          ...state,
          loading: false,
          errorMessage: action.payload
        };
      case "LOAD_LIST":
        return {
          ...state,
          loading: true,
          errorMessage: ""
        };
      case "ADD_ITEM":
        return {
          ...state,
          itemList: state.itemList.concat(action.payload)
        };
      case "ADD_FILMS":
        return {
          ...state,
          films: state.films.concat(action.payload)
        };
      case "SET_SEARCH":
        return {
          ...state,
          search: action.payload
        };
      default:
        return state;
    }
  },
  login(state = defaultLoginState, action) {
    switch (action.type) {
      default:
        return state;
    }
  }
});

const fetchList = search => {
  return fetch(
    `https://swapi.co/api/people/?search=${encodeURIComponent(search)}`
  )
    .then(r => r.json())
    .then(r => r.results);
};

const fetchResource = url => {
  return fetch(url).then(r => r.json());
};

function* loadList() {
  try {
    const search = yield select(selectSearch);
    const list = yield call(fetchList, search);
    yield put({ type: "SET_ITEM_LIST", payload: list });
  } catch (e) {
    yield put({ type: "LOAD_LIST_FAILED", message: e.message });
  }
}

function* loadFilms(action) {
  try {
    const existingFilms = yield select(selectFilms);
    const existingUrls = existingFilms.map(f => f.url);
    const films = yield all(
      action.payload
        .filter(url => !existingUrls.includes(url))
        .map(url => call(fetchResource, url))
    );
    yield put({ type: "ADD_FILMS", payload: films });
  } catch (e) {
    yield put({ type: "LOAD_FILM_FAILED", message: e.message });
  }
}

function* listSaga() {
  yield takeLatest("LOAD_LIST", loadList);
}

function* filmSaga() {
  yield takeEvery("LOAD_FILMS", loadFilms);
}

const sagaMiddleware = createSagaMiddleware();
export const store = createStore(reducers, applyMiddleware(sagaMiddleware));
sagaMiddleware.run(listSaga);
sagaMiddleware.run(filmSaga);
