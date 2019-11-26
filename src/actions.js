export const setItemList = items => ({
  type: "SET_ITEM_LIST",
  payload: items
});

export const setSearch = payload => ({
  type: "SET_SEARCH",
  payload
});

export const loadList = () => ({
  type: "LOAD_LIST"
});

export const loadFilms = payload => ({
  type: "LOAD_FILMS",
  payload
});

export const addItem = item => ({
  type: "ADD_ITEM",
  payload: item
});
