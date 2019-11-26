import { getElement } from "../registries/element-registry";

/**
 * Run all events for a given lifecycle
 */
export const triggerLifecycleEvents = ({ el, name }) => {
  const { events } = getElement(el);
  events.forEach(e => e.name === name && e.callback());
};
