const ParenthesesType = {
  Open: "(",
  Close: ")"
};

/**
 * Remove any trailing or leading new lines from a string.
 */
function removeLeadingOrTrailingNewlines(str) {
  return str.replace(/^(\n)/, "").replace(/(\n)$/, "");
}

/**
 * Remove all new line characters inside of parentheses.
 * Get all the ranges, then loop over them and replace the \n characters with a dummy
 * character so our offsets don't get screwy (we're using \s), then replace all instances of \s
 * at the end for a nice, clean string.
 */
function removeNewLinesInsideParentheses(str) {
  getParenthesesRanges(str).map(
    r => (str = replaceInRange(str, r[0], r[1], /\n/gi, "\\s"))
  );
  return str.replace(/\\s/gi, "");
}

/**
 * Replace a RegExp with a string inside a number range.
 * @param str Input string
 * @param start Start index
 * @param end End index
 * @param find RegExp to search for
 * @param replace String to replace with
 */
function replaceInRange(str, start, end, find, replace) {
  return (
    str.slice(0, start + 1) +
    str.slice(start + 1, end).replace(find, replace) +
    str.slice(end)
  );
}

/**
 * Get a list of start and end ranges for parentheses in a string.
 */
function getParenthesesRanges(str) {
  const matches = str.match(/\(/gi);
  const opens = [];
  const closes = [];
  const groups = [];

  if (!matches) {
    return [];
  }

  // Get all the open and close values
  for (let i = 0; i < matches.length; i++) {
    opens.push(
      str.indexOf(
        ParenthesesType.Open,
        opens[i - 1] === undefined ? 0 : opens[i - 1] + 1
      )
    );
    closes.push(
      str.indexOf(
        ParenthesesType.Close,
        closes[i - 1] === undefined ? 0 : closes[i - 1] + 1
      )
    );
  }

  // Build an array of parentheses details of all the parens in order
  const parens = opens
    .map(o => ({ type: ParenthesesType.Open, index: o }))
    .concat(closes.map(c => ({ type: ParenthesesType.Close, index: c })))
    .sort((a, b) => (a.index > b.index ? 1 : -1));

  // Loop through all the parentheses details, find the open parens that are adjacent to a close
  // paren and add them to the list of groups. Do this until all the parens are accounted for.
  let j = 0;
  while (parens.length) {
    if (
      parens[j].type === ParenthesesType.Open &&
      parens[j + 1].type === ParenthesesType.Close
    ) {
      groups.push([parens[j].index, parens[j + 1].index]);
      parens.splice(j, 2);
      j = 0;
      continue;
    }
    j++;
  }
  return groups;
}

export function addReturnAfterSemicolons(str) {
  return str.replace(/[;]{1,}/gi, ";\n");
}

// Add explicit return statements to a string of JS.
export function addExplicitReturn(str) {
  // Early exit if there is already a return.
  if (str.includes("return")) {
    return str;
  }

  // Remove new lines that aren't needed or will confuse us.
  str = removeLeadingOrTrailingNewlines(
    addReturnAfterSemicolons(removeNewLinesInsideParentheses(str))
  );

  // Replace the last new line with a return statement.
  const newStr = str.replace(/\n(?!.*\n)/gi, "\nreturn ");

  // If we haven't modified the string through our above actions, there was no good place
  // to put a return. Assume this is a one liner and put it at the start.
  return newStr !== str ? newStr : `return ${str}`;
}
