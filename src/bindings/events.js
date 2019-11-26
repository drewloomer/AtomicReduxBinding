import {
  getElement,
  updateElementEvents,
  updateElementState
} from "../registries/element-registry";
import { createValueFn } from "./value-parsing";
import { getAction } from "../registries/action-registry";
import { store } from "../store";
import { applyBindings } from "./apply";

/**
 * Create an attribute binding
 * Interprets the value string and creates a memoized function to return
 * a value when the selectors on this element change
 */
export const bindEvents = ({ el, events }) => {
  if (!events) return;
  const { events: evts } = getElement(el);
  const lifecycleList = ["init", "change", "remove"];

  // Replace existing DOM event bindings
  updateElementEvents(el, [
    ...evts,
    ...events.map(({ name, action, value, callback, target }) => {
      // Is this a lifecycle event or a DOM event?
      const isLifecycleEvent = lifecycleList.includes(name);

      // Allow for a sub-element to be the target of the binding
      const targetEl = target ? el.querySelector(target) : el;

      // Create a function that runs an arbitrary script and returns a value
      const cb = callback && createValueFn(callback);

      // The callback takes precedence over the value
      // Create a function that accepts selectors, data and arbitrary values to return a value
      const fn = cb ? cb : value ? createValueFn(value) : () => {};

      // Get an action from the action registry
      const act = action && getAction(action);

      // Create an event listener so that we can also remove it later
      // If there is a callback to run arbitrary code, run it
      // Otherwise dispatch the appropriate action
      const boundEvent = e => {
        const { selectors, data, state, parent } = getElement(el);
        const args = {
          $event: e,
          state,
          selectors,
          data,
          parent: getElement(parent),
          setState: vals => {
            updateElementState(el, { ...state, ...vals });
            applyBindings(el, true);
          }
        };
        if (cb) cb(args);
        if (act) store.dispatch(act(fn(args)));
      };

      // Allow the listener to be unbound later
      let removeEventListener = () => {};

      // If this isn't a lifecycle event,, bind to the DOM event
      if (!isLifecycleEvent) {
        targetEl.addEventListener(name, boundEvent);
        removeEventListener = () =>
          targetEl.removeEventListener(name, boundEvent);
      }

      return {
        name,
        callback: boundEvent,
        removeEventListener
      };
    })
  ]);
};

/**
 * Unbind all the event listeners for an event.
 */
export const unbindEvents = ({ el }) => {
  const { events } = getElement(el);
  events.forEach(e => e.removeEventListener());
};
