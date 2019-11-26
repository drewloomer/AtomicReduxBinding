import { createSelector } from "reselect";
import dot from "dot-prop";
import { memoize } from "lodash";

export const custom = s => memoize(path => dot.get(s, path));

export const selectList = s => s.list;
export const selectPageDetails = createSelector(
  selectList,
  s => s.pageDetails
);
export const selectItemList = createSelector(
  selectList,
  s => s.itemList
);
export const selectSearch = createSelector(
  selectList,
  s => s.search
);

export const selectItemsLoading = createSelector(
  selectList,
  s => s && s.loading
);
export const selectItemsLoadingError = createSelector(
  selectList,
  s => s && s.errorMessage
);
export const selectFilms = createSelector(
  selectList,
  s => (s ? s.films : [])
);
export const selectFilmsByUrl = createSelector(
  selectFilms,
  films => memoize(urls => films.filter(f => urls.includes(f.url)))
);

export const selectLogin = s => s.login;
export const selectUsername = createSelector(
  selectLogin,
  s => s.username
);
export const selectPassword = createSelector(
  selectLogin,
  s => s.password
);
