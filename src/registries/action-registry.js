import * as actions from "../actions";

/**
 * Get an action from the registry and throw an error if it doesn't exist
 */
export const getAction = name => {
  if (!actions[name]) {
    throw new Error(
      `Action ${name} was not found in the Tapas action registry!`
    );
  }
  return actions[name];
};
