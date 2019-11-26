import { addExplicitReturn } from "./add-explicit-function-return";

export const mapSelectors = selectors =>
  selectors.reduce((acc, s) => {
    acc[s.name] = s.value;
    return acc;
  }, {});

/**
 * Create a function that maps selectors and data to values
 * Accepts arbitrary data as well
 * @todo: memoize this?
 */
export const createValueFn = str => {
  return ({ selectors, data, parent, state, ...rest }) => {
    const mergedData = mergeWithParent(data, parent);
    const mergedSelectors = mergeWithParentSelectors(selectors, parent);
    const args = {
      ...rest,
      ...mergedData,
      ...mapSelectors(mergedSelectors),
      $state: state
    };
    return createFn(str)(args);
  };
};

/**
 * Create a function that returns a value based on the provided string
 * @todo: this would be faster if we could only create the function once
 * and pull out the names of the values needed
 * @todo: memoize this?
 */
export const createFn = str => {
  str = addExplicitReturn(str);
  return args => {
    // eslint-disable-next-line
    return new Function(...Object.keys(args), str)(...Object.values(args));
  };
};

/**
 * Only run a callback when the function returns a new value
 */
export const createMemoizedValueFn = (fn, cb) => {
  let prevValue;
  return (...args) => {
    const value = fn(...args);
    if (value !== prevValue) {
      cb(value);
      prevValue = value;
    }
  };
};

/**
 * Walk the tree of parents to build a set of selectors
 * Child selectors will take precedence
 */
export const mergeWithParentSelectors = (selectors = [], parent = null) => {
  const merged = [
    ...(parent
      ? mergeWithParentSelectors(parent.selectors, parent.parent)
      : []),
    ...selectors
  ];
  return merged;
};

/**
 * Walk the tree of parents to build a set of data
 * Child data will take precedence
 */
export const mergeWithParent = (data = {}, parent = null) => {
  const merged = {
    ...(parent ? mergeWithParent(parent.data, parent.parent) : {}),
    ...data
  };
  return merged;
};
