# Atomic Element Binding Demo

The purpose of this demo is to prove a methodology for connecting components (HTML) rendered server-side with dynamic data linked to a redux store.

These components should:

- consume data via redux selectors
- respond to user actions by dispatching actions and executing arbitrary code

To accomplish this input and output of data, this tool establishes a syntax for defining dynamic behavior of an element (or its children) that can be simply implemented in an AEM dialog box.

Here is an example of creating a simple data binding on an element:

```html
<p data-tapas-id="6">
  <script>
    Tapas.bindElement({
      id: "6",
      selectors: [
        {
          selector: "selectUsername",
          name: "$username"
        },
        {
          selector: "selectFirstName",
          name: "$firstName"
        }
      ],
      text: {
        value: "$firstName + ': ' + $username"
      }
    });
  </script>
</p>
```

The above example will call the `selectUsername` selector to pull data out of the Redux store. It provides that data to any bindings using its given name. The `text` binding takes the provided `$username` and binds it to the `innerHTML` of the element with a matching `data-tapas-id` to the one provided in the `bindElement` call.

Listening for DOM events on an element looks similar:

```html
<input data-tapas-id="8" />
<script>
  Tapas.bindElement({
    id: "8",
    events: [
      {
        name: "change",
        action: "updateText",
        value: "{ text: $event.target.value }"
      }
    ]
  });
</script>
```

This call to `bindElement` includes an array of events to listen for. The `name` of the event maps to the DOM event name. The Redux action to dispatch is `updateText` and the value passed to that action will be whatever is returned `value`. The DOM event object is exposed to `value` as `$event` for convenience.

## Consuming Data

There are three means of exposing dynamic data to a bound element: selectors, parent data for list items, and state.

### Selectors

To pull data out of the store and receive updates when that data changes, memoized selectors are used. Whenever the return value of any selector changes, all bindings on an element are updated. An element can reference any number of selectors.

#### Selector Definition

| property    | type     | required | description                                                                                                                                          |
| ----------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector    | string   | true     | The name of the selector to use.                                                                                                                     |
| name        | string   | true     | When exposing the selected data to the element's bindings, this is the name of the variable that will be populated.                                  |
| selectorArg | string[] | false    | Arguments to pass to the selector. Used with the `custom` selector to provide a path to the data to select from the store as a dot-separated string. |

### Parent Data

When writing nested components (as in lists), all data selected by a parent (or a parent's parent!) is also available on the child. When iterating over a list, each item in the array will be exposed as a variable that matches the `itemName` property of the list (defaulting to `$item`). [Read more about lists.](#Lists)

### State

Bindings can also hold internal state to power more complex interactions. The value of this state can be pre-populated by passing an object as the `defaultState`. [Read more about managing state.](#Managing-State)

## Binding Data to the DOM

Data provided by selectors, parents or state can be bound to various parts of the DOM including element text, element attribute(s) or element class name(s).

### Text

To bind the text of an element (or one of its children), the text binding can take a value, optinally transform it, and then insert it into the DOM. A single text binding can be defined, or an array of bindings.

@todo: should this be called `html` since it actually binds the `innerHTML`?

#### Text Binding Definition

| property  | type   | required | description                                                               |
| --------- | ------ | -------- | ------------------------------------------------------------------------- |
| value     | string | true     | A Javascript expression that returns a value for the binding.             |
| transform | string | false    | A transform method to run the data through before inserting into the DOM. |
| target    | string | false    | A sub-element to target with this binding.                                |

### Attributes

To bind attributes of an element (or one of its children), the attribute binding can take a value, optinally transform it, and then bind it to a named attribute. Bindings that return `undefined` will cause the attribute to be removed.

#### Attribute Binding Definition

| property  | type   | required | description                                                               |
| --------- | ------ | -------- | ------------------------------------------------------------------------- |
| name      | string | true     | The name of the attribute to target.                                      |
| value     | string | true     | A Javascript expression that returns a value for the binding.             |
| transform | string | false    | A transform method to run the data through before inserting into the DOM. |
| target    | string | false    | A sub-element to target with this binding.                                |

### Classes

To bind class names of an element (or one of its children), the classname binding can take a value and then bind it to a specific classname. Bindings that return a falsy value will cause the classname to be removed.

@todo: should there be a way to interpolate a value into the classname?

#### Class Binding Definition

| property | type   | required | description                                                                |
| -------- | ------ | -------- | -------------------------------------------------------------------------- |
| name     | string | true     | The name of the class to add if a truthy value is returned from the value. |
| value    | string | true     | A Javascript expression that returns a value for the binding.              |
| target   | string | false    | A sub-element to target with this binding.                                 |

### Lists

The list binding allows a child of the bound element to be repeated with data. Each child is associated with its parent by having an ID that is related. For example, if the parent has an ID of `5`, the list children will have IDs of `5.1`, `5.2`, etc. Nested lists will continue the pattern with `5.1.1`, etc.

Because the list children are rendered dynamically, only an empty first child will be in the initial HTML to serve as a template.

#### List Binding Definition

| property       | type   | required | description                                                                                                |
| -------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| value          | string | true     | A Javascript expression that returns a value for the binding.                                              |
| itemName       | string | false    | The name to use when exposing each item of the `value` array. Defaults to `$item`.                         |
| itemKey        | string | false    | The key to use as a unique ID when determining to create new DOM nodes or update exisiting ones on render. |
| templateTarget | string | false    | A sub-element to use as the template                                                                       |

## Responding to Events

A fully-functioning application needs to accept input from the user. This library provides a mechanism for triggering Redux actions or arbitrary callbacks in response to user interactions. It also exposes a few "lifecycle" events to run callbacks based on points in the render cycle.

#### Event Binding Definition

| property | type   | required | description                                                                                         |
| -------- | ------ | -------- | --------------------------------------------------------------------------------------------------- |
| name     | string | true     | The name of the DOM event to listen for.                                                            |
| value    | string | false    | A Javascript expression that returns a value to pass to the action.                                 |
| callback | string | false    | Arbitrary JS to run when the event fires. The return value will be passed to the action (if given). |
| action   | string | false    | A Redux action to dispatch with either the result of the callback or the value.                     |
| target   | string | false    | A sub-element to target with this binding.                                                          |

#### Lifecycle Events

Each element event binding can also bind to callbacks related to the render lifecycle: `init`, `update` and `remove`.

@todo: implement update
@todo: are these sufficient? are these good names?

## Managing State

Each binding can maintain its own internal state. This is useful for more complex interactions.

State can be accessed inside any `value` or `callback` value inside the `$state` variable. To update the state, call `setState` with an object for a payload.

---

## Todos:

1. Determine strategy for complex components
