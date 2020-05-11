/**
 *
 * Get successful control from form and assemble into object.
 * @see {@link http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2}
 * @module FormSerialization
 */

// types which indicate a submit action and are not successful controls
// these will be ignored
const kRSubmitter = /^(?:submit|button|image|reset|file)$/i;

// node names which could be successful controls
const kRSuccessContrls = /^(?:input|select|textarea|keygen)/i;

// Matches bracket notation.
const brackets = /(\[[^[\]]*])/g;

/**
 * @callback module:FormSerialization.Serializer
 * @param {PlainObject|string|any} result
 * @param {string} key
 * @param {string} value
 * @returns {PlainObject|string|any} New result
*/

/**
 * @typedef {PlainObject} module:FormSerialization.Options
 * @property {boolean} [hash] Configure the output type. If true, the
 *  output will be a JavaScript object.
 * @property {module:FormSerialization.Serializer} [serializer] Optional
 *   serializer function to override the default one. Otherwise, hash
 *   and URL-encoded string serializers are provided with this module,
 *   depending on the setting of `hash`.
 * @property {boolean} [disabled] If true serialize disabled fields.
 * @property {boolean} [empty] If true serialize empty fields
*/

/**
 * Serializes form fields.
 * @function module:FormSerialization.serialize
 * @param {HTMLFormElement} form MUST be an `HTMLFormElement`
 * @param {module:FormSerialization.Options} options is an optional argument
 *   to configure the serialization.
 * @returns {any|string|PlainObject} Default output with no options specified is
 *   a url encoded string
 */
export function serialize (form, options) {
  if (typeof options !== 'object') {
    options = {hash: Boolean(options)};
  } else if (options.hash === undefined) {
    options.hash = true;
  }

  let result = options.hash ? {} : '';
  const serializer = options.serializer ||
    (options.hash ? hashSerializer : strSerialize);

  const elements = form && form.elements ? [...form.elements] : [];

  // Object store each radio and set if it's empty or not
  const radioStore = Object.create(null);

  elements.forEach((element) => {
    // ignore disabled fields
    if ((!options.disabled && element.disabled) || !element.name) {
      return;
    }
    // ignore anything that is not considered a success field
    if (!kRSuccessContrls.test(element.nodeName) ||
      kRSubmitter.test(element.type)) {
      return;
    }

    const {name: key, type, name, checked} = element;
    let {value} = element;

    // We can't just use element.value for checkboxes cause some
    //   browsers lie to us; they say "on" for value when the
    //   box isn't checked
    if ((type === 'checkbox' || type === 'radio') && !checked) {
      value = undefined;
    }

    // If we want empty elements
    if (options.empty) {
      // for checkbox
      if (type === 'checkbox' && !checked) {
        value = '';
      }

      // for radio
      if (type === 'radio') {
        if (!radioStore[name] && !checked) {
          radioStore[name] = false;
        } else if (checked) {
          radioStore[name] = true;
        }
        if (value === undefined) {
          return;
        }
      }
    } else if (!value) {
      // value-less fields are ignored unless options.empty is true
      return;
    }

    // multi select boxes
    if (type === 'select-multiple') {
      let isSelectedOptions = false;
      [...element.options].forEach((option) => {
        const allowedEmpty = options.empty && !option.value;
        const hasValue = (option.value || allowedEmpty);
        if (option.selected && hasValue) {
          isSelectedOptions = true;

          // If using a hash serializer be sure to add the
          // correct notation for an array in the multi-select
          // context. Here the name attribute on the select element
          // might be missing the trailing bracket pair. Both names
          // "foo" and "foo[]" should be arrays.
          if (options.hash && key.slice(-2) !== '[]') {
            result = serializer(result, key + '[]', option.value);
          } else {
            result = serializer(result, key, option.value);
          }
        }
      });

      // Serialize if no selected options and options.empty is true
      if (!isSelectedOptions && options.empty) {
        result = serializer(result, key, '');
      }

      return;
    }

    result = serializer(result, key, value);
  });

  // Check for all empty radio buttons and serialize them with key=""
  if (options.empty) {
    Object.entries(radioStore).forEach(([key, value]) => {
      if (!value) {
        result = serializer(result, key, '');
      }
    });
  }

  return result;
}

/**
 *
 * @param {string} string
 * @returns {string[]}
 */
function parseKeys (string) {
  const keys = [];
  const prefix = /^([^[\]]*)/;
  const children = new RegExp(brackets);
  let match = prefix.exec(string);

  if (match[1]) {
    keys.push(match[1]);
  }

  while ((match = children.exec(string)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

/**
* @typedef {GenericArray} ResultArray
*/

/**
 *
 * @param {PlainObject|ResultArray} result
 * @param {string[]} keys
 * @param {string} value
 * @returns {string|PlainObject|ResultArray}
 */
function hashAssign (result, keys, value) {
  if (keys.length === 0) {
    return value;
  }

  const key = keys.shift();
  const between = key.match(/^\[(.+?)]$/);

  if (key === '[]') {
    result = result || [];

    if (Array.isArray(result)) {
      result.push(hashAssign(null, keys, value));
    } else {
      // This might be the result of bad name attributes like "[][foo]",
      // in this case the original `result` object will already be
      // assigned to an object literal. Rather than coerce the object to
      // an array, or cause an exception the attribute "_values" is
      // assigned as an array.
      result._values = result._values || [];
      result._values.push(hashAssign(null, keys, value));
    }
    return result;
  }

  // Key is an attribute name and can be assigned directly.
  if (!between) {
    result[key] = hashAssign(result[key], keys, value);
  } else {
    const string = between[1];
    // +var converts the variable into a number
    // better than parseInt because it doesn't truncate away trailing
    // letters and actually fails if whole thing is not a number
    const index = Number(string);

    // If the characters between the brackets is not a number it is an
    // attribute name and can be assigned directly.
    // Switching to Number.isNaN would require a polyfill for IE11
    // eslint-disable-next-line unicorn/prefer-number-properties
    if (isNaN(index)) {
      result = result || {};
      result[string] = hashAssign(result[string], keys, value);
    } else {
      result = result || [];
      result[index] = hashAssign(result[index], keys, value);
    }
  }
  return result;
}

/**
 * Object/hash encoding serializer.
 * @param {PlainObject} result
 * @param {string} key
 * @param {string} value
 * @returns {PlainObject}
 */
function hashSerializer (result, key, value) {
  const hasBrackets = key.match(brackets);

  // Has brackets? Use the recursive assignment function to walk the keys,
  // construct any missing objects in the result tree and make the assignment
  // at the end of the chain.
  if (hasBrackets) {
    const keys = parseKeys(key);
    hashAssign(result, keys, value);
  } else {
    // Non bracket notation can make assignments directly.
    const existing = result[key];

    // If the value has been assigned already (for instance when a radio and
    // a checkbox have the same name attribute) convert the previous value
    // into an array before pushing into it.
    //
    // NOTE: If this requirement were removed all hash creation and
    // assignment could go through `hashAssign`.
    if (existing) {
      if (!Array.isArray(existing)) {
        result[key] = [existing];
      }

      result[key].push(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * URL form encoding serializer.
 * @param {string} result
 * @param {string} key
 * @param {string} value
 * @returns {string} New result
 */
function strSerialize (result, key, value) {
  // encode newlines as \r\n cause the html spec says so
  value = value.replace(/(\r)?\n/g, '\r\n');
  value = encodeURIComponent(value);

  // spaces should be '+' rather than '%20'.
  value = value.replace(/%20/g, '+');
  return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value;
}

/**
 * @function module:FormSerialization.deserialize
 * @param {HTMLFormElement} form
 * @param {PlainObject} hash
 * @returns {void}
 */
export function deserialize (form, hash) {
  // input(text|radio|checkbox)|select(multiple)|textarea|keygen
  Object.entries(hash).forEach(([name, value]) => {
    let control = form[name];
    let hasBrackets = false;
    // istanbul ignore else
    if (!control) { // Try again for jsdom
      control = form.querySelector(`[name="${name}"]`);
      if (!control) {
        // We want this for `RadioNodeList` so setting value
        //  auto-disables other boxes
        control = form[name + '[]'];
        // istanbul ignore next
        if (!control || typeof control !== 'object' || !('length' in control)) {
          // The latter query would only get a single
          //  element, so if not a `RadioNodeList`, we get
          //  all values here
          control = form.querySelectorAll(`[name="${name}[]"]`);
          if (!control.length) {
            throw new Error(`Name not found ${name}`);
          }
        }
        hasBrackets = true;
      }
    }
    const {type} = control;
    if (type === 'checkbox') {
      control.checked = value !== '';
    }
    if (type === 'radio' || (control[0] && control[0].type === 'radio')) {
      [...form.querySelectorAll(
        `[name="${name + (hasBrackets ? '[]' : '')}"]`
      )].forEach((radio) => {
        radio.checked = value === radio.value;
      });
    }
    if (control[0] && control[0].type === 'select-multiple') {
      [...control[0].options].forEach((o) => {
        if (value.includes(o.value)) {
          o.selected = true;
        }
      });
      return;
    }
    if (Array.isArray(value)) {
      // options on a multiple select
      if (type === 'select-multiple') {
        [...control.options].forEach((o) => {
          if (value.includes(o.value)) {
            o.selected = true;
          }
        });
        return;
      }
      value.forEach((v, i) => {
        const c = control[i];
        if (c.type === 'checkbox') {
          const isMatch = c.value === v || v === 'on';
          c.checked = isMatch;
          return;
        }
        if (c.type === 'select-multiple') {
          [...c.options].forEach((o) => {
            if (v.includes(o.value)) {
              o.selected = true;
            }
          });
          return;
        }
        c.value = v;
      });
    } else {
      control.value = value;
    }
  });
}
