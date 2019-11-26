import * as selectors from "../selectors";

/**
 * Get an selector from the registry and throw an error if it doesn't exist
 */
export const getSelector = name => {
  if (!selectors[name]) {
    throw new Error(
      `Selector ${name} was not found in the Tapas selector registry!`
    );
  }
  return selectors[name];
};
