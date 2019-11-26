/**
 * Replace a string with a *** version of it
 */
export const hidden = val => {
  let str = "";
  for (let i = 0; i < val.length; i++) {
    str += "*";
  }
  return str;
};
