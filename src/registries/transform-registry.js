import * as transforms from "../transforms";

/**
 * Get an transform from the registry and throw an error if it doesn't exist
 */
export const getTransform = name => {
  if (!transforms[name]) {
    throw new Error(
      `Transform ${name} was not found in the Tapas transform registry!`
    );
  }
  return transforms[name];
};
