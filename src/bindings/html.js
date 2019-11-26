import {
  getElement,
  updateElementBindings
} from "../registries/element-registry";
import { createValueFn, createMemoizedValueFn } from "./value-parsing";

/**
 * Create an HTML binding
 * Interprets the value string and creates a memoized function to return
 * a value when the selectors on this element change
 */
export const bindHtml = ({ el, html }) => {
  if (!html) return;

  // Text can be passed as a single item or an array
  html = Array.isArray(html) ? html : [html];

  const { bindings } = getElement(el);

  // Replace existing html bindings
  updateElementBindings(el, {
    ...bindings,
    html: html.map(({ value, target, transform }) => {
      // Allow for a sub-element to be the target of the binding
      const targetEl = target ? el.querySelector(target) : el;

      // Create memoized funtion that accepts the current value and applies it to the element
      const fn = createValueFn(value);
      const updateFn = createMemoizedValueFn(
        fn,
        value => (targetEl.innerHTML = value)
      );

      return updateFn;
    })
  });
};
