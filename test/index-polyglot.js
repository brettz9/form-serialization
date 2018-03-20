(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  var toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  // get successful control from form and assemble into object
  // http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2

  // types which indicate a submit action and are not successful controls
  // these will be ignored
  var kRSubmitter = /^(?:submit|button|image|reset|file)$/i;

  // node names which could be successful controls
  var kRSuccessContrls = /^(?:input|select|textarea|keygen)/i;

  // Matches bracket notation.
  var brackets = /(\[[^[\]]*\])/g;

  // serializes form fields
  // @param form MUST be an HTMLForm element
  // @param options is an optional argument to configure the serialization. Default output
  // with no options specified is a url encoded string
  //    - hash: [true | false] Configure the output type. If true, the output will
  //    be a js object.
  //    - serializer: [function] Optional serializer function to override the default one.
  //    The function takes 3 arguments (result, key, value) and should return new result
  //    hash and url encoded str serializers are provided with this module
  //    - disabled: [true | false]. If true serialize disabled fields.
  //    - empty: [true | false]. If true serialize empty fields
  function serialize(form, options) {
      if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
          options = { hash: !!options };
      } else if (options.hash === undefined) {
          options.hash = true;
      }

      var result = options.hash ? {} : '';
      var serializer = options.serializer || (options.hash ? hashSerializer : strSerialize);

      var elements = form && form.elements ? [].concat(toConsumableArray(form.elements)) : [];

      // Object store each radio and set if it's empty or not
      var radioStore = Object.create(null);

      elements.forEach(function (element) {
          // ignore disabled fields
          if (!options.disabled && element.disabled || !element.name) {
              return;
          }
          // ignore anything that is not considered a success field
          if (!kRSuccessContrls.test(element.nodeName) || kRSubmitter.test(element.type)) {
              return;
          }

          var key = element.name,
              type = element.type,
              name = element.name,
              checked = element.checked;
          var value = element.value;

          // We can't just use element.value for checkboxes cause some browsers lie to us;
          // they say "on" for value when the box isn't checked

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
              value = [];

              var isSelectedOptions = false;
              [].concat(toConsumableArray(element.options)).forEach(function (option) {
                  var allowedEmpty = options.empty && !option.value;
                  var hasValue = option.value || allowedEmpty;
                  if (option.selected && hasValue) {
                      isSelectedOptions = true;

                      // If using a hash serializer be sure to add the
                      // correct notation for an array in the multi-select
                      // context. Here the name attribute on the select element
                      // might be missing the trailing bracket pair. Both names
                      // "foo" and "foo[]" should be arrays.
                      if (options.hash && key.slice(key.length - 2) !== '[]') {
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
          Object.entries(radioStore).forEach(function (_ref) {
              var _ref2 = slicedToArray(_ref, 2),
                  key = _ref2[0],
                  value = _ref2[1];

              if (!value) {
                  result = serializer(result, key, '');
              }
          });
      }

      return result;
  }

  function parseKeys(string) {
      var keys = [];
      var prefix = /^([^[\]]*)/;
      var children = new RegExp(brackets);
      var match = prefix.exec(string);

      if (match[1]) {
          keys.push(match[1]);
      }

      while ((match = children.exec(string)) !== null) {
          keys.push(match[1]);
      }

      return keys;
  }

  function hashAssign(result, keys, value) {
      if (keys.length === 0) {
          return value;
      }

      var key = keys.shift();
      var between = key.match(/^\[(.+?)\]$/);

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
          var string = between[1];
          // +var converts the variable into a number
          // better than parseInt because it doesn't truncate away trailing
          // letters and actually fails if whole thing is not a number
          var index = +string;

          // If the characters between the brackets is not a number it is an
          // attribute name and can be assigned directly.
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

  // Object/hash encoding serializer.
  function hashSerializer(result, key, value) {
      var hasBrackets = key.match(brackets);

      // Has brackets? Use the recursive assignment function to walk the keys,
      // construct any missing objects in the result tree and make the assignment
      // at the end of the chain.
      if (hasBrackets) {
          var keys = parseKeys(key);
          hashAssign(result, keys, value);
      } else {
          // Non bracket notation can make assignments directly.
          var existing = result[key];

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

  // urlform encoding serializer
  function strSerialize(result, key, value) {
      // encode newlines as \r\n cause the html spec says so
      value = value.replace(/(\r)?\n/g, '\r\n');
      value = encodeURIComponent(value);

      // spaces should be '+' rather than '%20'.
      value = value.replace(/%20/g, '+');
      return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + value;
  }

  function deserialize(form, hash) {
      // input(text|radio|checkbox)|select(multiple)|textarea|keygen
      Object.entries(hash).forEach(function (_ref3) {
          var _ref4 = slicedToArray(_ref3, 2),
              name = _ref4[0],
              value = _ref4[1];

          var control = form[name];
          if (!form[name]) {
              control = form[name + '[]']; // We want this for RadioNodeList so setting value auto-disables other boxes
              if (!('length' in control)) {
                  // The latter assignment only gets single
                  //    elements, so if not a RadioNodeList, we get all values here
                  control = form.querySelectorAll('[name="' + name + '[]"]');
              }
          }
          var _control = control,
              type = _control.type;

          if (type === 'checkbox') {
              control.checked = value !== '';
          }
          if (Array.isArray(value)) {
              if (type === 'select-multiple') {
                  [].concat(toConsumableArray(control.options)).forEach(function (o) {
                      if (value.includes(o.value)) {
                          o.selected = true;
                      }
                  });
                  return;
              }
              value.forEach(function (v, i) {
                  var c = control[i];
                  if (c.type === 'checkbox') {
                      var isMatch = c.value === v || v === 'on';
                      c.checked = isMatch;
                      return;
                  }
                  c.value = v;
              });
          } else {
              control.value = value;
          }
      });
  }

  /* globals test */

  // import assert from 'assert';
  // import domify from 'domify';

  var assert = require('assert');
  var domify = require('domify');

  function hashCheck(form, exp) {
      assert.deepEqual(serialize(form, { hash: true }), exp);
  }

  function strCheck(form, exp) {
      assert.equal(serialize(form), exp);
  }

  function disabledCheck(form, exp) {
      assert.deepEqual(serialize(form, { hash: false, disabled: true }), exp);
  }

  function emptyCheck(form, exp) {
      assert.deepEqual(serialize(form, { hash: false, disabled: true, empty: true }), exp);
  }

  function emptyCheckHash(form, exp) {
      assert.deepEqual(serialize(form, { hash: true, disabled: true, empty: true }), exp);
  }

  test('null form', function () {
      hashCheck(null, {});
      strCheck(null, '');
      emptyCheck(null, '');
      emptyCheckHash(null, {});
  });

  test('bad form', function () {
      var form = {};
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, '');
      emptyCheckHash(form, {});
  });

  test('empty form', function () {
      var form = domify('<form></form>');
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, '');
      emptyCheckHash(form, {});
  });

  // basic form with single input
  test('single element', function () {
      var form = domify('<form><input type="text" name="foo" value="bar"/></form>');
      hashCheck(form, {
          'foo': 'bar'
      });
      strCheck(form, 'foo=bar');
      emptyCheck(form, 'foo=bar');
      emptyCheckHash(form, {
          'foo': 'bar'
      });
  });

  test('ignore no value', function () {
      var form = domify('<form><input type="text" name="foo"/></form>');
      hashCheck(form, {});
      strCheck(form, '');
  });

  test('do not ignore no value when empty option', function () {
      var form = domify('<form><input type="text" name="foo"/></form>');
      emptyCheck(form, 'foo=');
      emptyCheckHash(form, {
          'foo': ''
      });
  });

  test('multi inputs', function () {
      var form = domify('<form>' + '<input type="text" name="foo" value="bar 1"/>' + '<input type="text" name="foo.bar" value="bar 2"/>' + '<input type="text" name="baz.foo" value="bar 3"/>' + '</form>');
      hashCheck(form, {
          'foo': 'bar 1',
          'foo.bar': 'bar 2',
          'baz.foo': 'bar 3'
      });
      strCheck(form, 'foo=bar+1&foo.bar=bar+2&baz.foo=bar+3');
  });

  test('handle disabled', function () {
      var form = domify('<form>' + '<input type="text" name="foo" value="bar 1"/>' + '<input type="text" name="foo.bar" value="bar 2" disabled/>' + '</form>');
      hashCheck(form, {
          'foo': 'bar 1'
      });
      strCheck(form, 'foo=bar+1');
      disabledCheck(form, 'foo=bar+1&foo.bar=bar+2');
  });

  test('handle disabled and empty', function () {
      var form = domify('<form>' + '<input type="text" name="foo" value=""/>' + '<input type="text" name="foo.bar" value="" disabled/>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
      disabledCheck(form, '');
      emptyCheck(form, 'foo=&foo.bar=');
      emptyCheckHash(form, {
          'foo': '',
          'foo.bar': ''
      });
  });

  test('ignore buttons', function () {
      var form = domify('<form>' + '<input type="submit" name="foo" value="submit"/>' + '<input type="reset" name="foo.bar" value="reset"/>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
  });

  test('checkboxes', function () {
      var form = domify('<form>' + '<input type="checkbox" name="foo" checked/>' + '<input type="checkbox" name="bar"/>' + '<input type="checkbox" name="baz" checked/>' + '</form>');
      hashCheck(form, {
          'foo': 'on',
          'baz': 'on'
      });
      strCheck(form, 'foo=on&baz=on');
      emptyCheck(form, 'foo=on&bar=&baz=on');
      emptyCheckHash(form, {
          'foo': 'on',
          'bar': '',
          'baz': 'on'
      });
  });

  test('checkboxes - array', function () {
      var form = domify('<form>' + '<input type="checkbox" name="foo[]" value="bar" checked/>' + '<input type="checkbox" name="foo[]" value="baz" checked/>' + '<input type="checkbox" name="foo[]" value="baz"/>' + '</form>');
      hashCheck(form, {
          'foo': ['bar', 'baz']
      });
      strCheck(form, 'foo%5B%5D=bar&foo%5B%5D=baz');
      emptyCheck(form, 'foo%5B%5D=bar&foo%5B%5D=baz&foo%5B%5D=');
      emptyCheckHash(form, {
          'foo': ['bar', 'baz', '']
      });
  });

  test('checkboxes - array with single item', function () {
      var form = domify('<form>' + '<input type="checkbox" name="foo[]" value="bar" checked/>' + '</form>');
      hashCheck(form, {
          'foo': ['bar']
      });
      strCheck(form, 'foo%5B%5D=bar');
  });

  test('select - single', function () {
      var form = domify('<form>' + '<select name="foo">' + '<option value="bar">bar</option>' + '<option value="baz" selected>baz</option>' + '</select>' + '</form>');
      hashCheck(form, {
          'foo': 'baz'
      });
      strCheck(form, 'foo=baz');
  });

  test('select - single - empty', function () {
      var form = domify('<form>' + '<select name="foo">' + '<option value="">empty</option>' + '<option value="bar">bar</option>' + '<option value="baz">baz</option>' + '</select>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, 'foo=');
      emptyCheckHash(form, {
          'foo': ''
      });
  });

  test('select - multiple', function () {
      var form = domify('<form>' + '<select name="foo" multiple>' + '<option value="bar" selected>bar</option>' + '<option value="baz">baz</option>' + '<option value="cat" selected>cat</option>' + '</select>' + '</form>');
      hashCheck(form, {
          'foo': ['bar', 'cat']
      });
      strCheck(form, 'foo=bar&foo=cat');
  });

  test('select - multiple - empty', function () {
      var form = domify('<form>' + '<select name="foo" multiple>' + '<option value="">empty</option>' + '<option value="bar">bar</option>' + '<option value="baz">baz</option>' + '<option value="cat">cat</option>' + '</select>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, 'foo=');
      emptyCheckHash(form, {
          'foo': ''
      });
  });

  test('radio - no default', function () {
      var form = domify('<form>' + '<input type="radio" name="foo" value="bar1"/>' + '<input type="radio" name="foo" value="bar2"/>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, 'foo=');
      emptyCheckHash(form, {
          'foo': ''
      });
  });

  test('radio - single default', function () {
      var form = domify('<form>' + '<input type="radio" name="foo" value="bar1" checked="checked"/>' + '<input type="radio" name="foo" value="bar2"/>' + '</form>');
      hashCheck(form, {
          foo: 'bar1'
      });
      strCheck(form, 'foo=bar1');
      emptyCheck(form, 'foo=bar1');
      emptyCheckHash(form, {
          foo: 'bar1'
      });
  });

  test('radio - empty value', function () {
      var form = domify('<form>' + '<input type="radio" name="foo" value="" checked="checked"/>' + '<input type="radio" name="foo" value="bar2"/>' + '</form>');
      hashCheck(form, {});
      strCheck(form, '');
      emptyCheck(form, 'foo=');
      emptyCheckHash(form, {
          'foo': ''
      });
  });

  // in this case the radio buttons and checkboxes share a name key
  // the checkbox value should still be honored
  test('radio w/checkbox', function () {
      var form = domify('<form>' + '<input type="radio" name="foo" value="bar1" checked="checked"/>' + '<input type="radio" name="foo" value="bar2"/>' + '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' + '<input type="checkbox" name="foo" value="bar4"/>' + '</form>');
      hashCheck(form, {
          foo: ['bar1', 'bar3']
      });
      strCheck(form, 'foo=bar1&foo=bar3');

      // leading checkbox
      form = domify('<form>' + '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' + '<input type="radio" name="foo" value="bar1" checked="checked"/>' + '<input type="radio" name="foo" value="bar2"/>' + '<input type="checkbox" name="foo" value="bar4"/>' + '<input type="checkbox" name="foo" value="bar5" checked="checked"/>' + '</form>');
      hashCheck(form, {
          foo: ['bar3', 'bar1', 'bar5']
      });
      strCheck(form, 'foo=bar3&foo=bar1&foo=bar5');
  });

  test('bracket notation - hashes', function () {
      var form = domify('<form>' + '<input type="email" name="account[name]" value="Foo Dude">' + '<input type="text" name="account[email]" value="foobar@example.org">' + '<input type="text" name="account[address][city]" value="Qux">' + '<input type="text" name="account[address][state]" value="CA">' + '<input type="text" name="account[address][empty]" value="">' + '</form>');

      hashCheck(form, {
          account: {
              name: 'Foo Dude',
              email: 'foobar@example.org',
              address: {
                  city: 'Qux',
                  state: 'CA'
              }
          }
      });

      emptyCheckHash(form, {
          account: {
              name: 'Foo Dude',
              email: 'foobar@example.org',
              address: {
                  city: 'Qux',
                  state: 'CA',
                  empty: ''
              }
          }
      });
  });

  test('bracket notation - hashes with a digit as the first symbol in a key', function () {
      var form = domify('<form>' + '<input type="text" name="somekey[123abc][first]" value="first_value">' + '<input type="text" name="somekey[123abc][second]" value="second_value">' + '</form>');

      hashCheck(form, {
          'somekey': {
              '123abc': {
                  'first': 'first_value',
                  'second': 'second_value'
              }
          }
      });

      emptyCheckHash(form, {
          'somekey': {
              '123abc': {
                  'first': 'first_value',
                  'second': 'second_value'
              }
          }
      });
  });

  test('bracket notation - select multiple', function () {
      var form = domify('<form>' + '<select name="foo" multiple>' + '  <option value="bar" selected>Bar</option>' + '  <option value="baz">Baz</option>' + '  <option value="qux" selected>Qux</option>' + '</select>' + '</form>');

      hashCheck(form, {
          foo: ['bar', 'qux']
      });

      // Trailing notation on select.name.
      form = domify('<form>' + '<select name="foo[]" multiple>' + '  <option value="bar" selected>Bar</option>' + '  <option value="baz">Baz</option>' + '  <option value="qux" selected>Qux</option>' + '</select>' + '</form>');

      hashCheck(form, {
          foo: ['bar', 'qux']
      });
  });

  test('bracket notation - select multiple, nested', function () {
      var form = domify('<form>' + '<select name="foo[bar]" multiple>' + '  <option value="baz" selected>Baz</option>' + '  <option value="qux">Qux</option>' + '  <option value="norf" selected>Norf</option>' + '</select>' + '</form>');

      hashCheck(form, {
          foo: {
              bar: ['baz', 'norf']
          }
      });
  });

  test('bracket notation - select multiple, empty values', function () {
      var form = domify('<form>' + '<select name="foo[bar]" multiple>' + '  <option selected>Default value</option>' + '  <option value="" selected>Empty value</option>' + '  <option value="baz" selected>Baz</option>' + '  <option value="qux">Qux</option>' + '  <option value="norf" selected>Norf</option>' + '</select>' + '</form>');

      hashCheck(form, {
          foo: {
              bar: ['Default value', 'baz', 'norf']
          }
      });

      emptyCheckHash(form, {
          foo: {
              bar: ['Default value', '', 'baz', 'norf']
          }
      });
  });

  test('bracket notation - non-indexed arrays', function () {
      var form = domify('<form>' + '<input name="people[][name]" value="fred" />' + '<input name="people[][name]" value="bob" />' + '<input name="people[][name]" value="bubba" />' + '</form>');

      hashCheck(form, {
          people: [{ name: 'fred' }, { name: 'bob' }, { name: 'bubba' }]
      });
  });

  test('bracket notation - nested, non-indexed arrays', function () {
      var form = domify('<form>' + '<input name="user[tags][]" value="cow" />' + '<input name="user[tags][]" value="milk" />' + '</form>');

      hashCheck(form, {
          user: {
              tags: ['cow', 'milk']
          }
      });
  });

  test('bracket notation - indexed arrays', function () {
      var form = domify('<form>' + '<input name="people[2][name]" value="bubba" />' + '<input name="people[2][age]" value="15" />' + '<input name="people[0][name]" value="fred" />' + '<input name="people[0][age]" value="12" />' + '<input name="people[1][name]" value="bob" />' + '<input name="people[1][age]" value="14" />' + '<input name="people[][name]" value="frank">' + '<input name="people[3][age]" value="2">' + '</form>');

      hashCheck(form, {
          people: [{
              name: 'fred',
              age: '12'
          }, {
              name: 'bob',
              age: '14'
          }, {
              name: 'bubba',
              age: '15'
          }, {
              name: 'frank',
              age: '2'
          }]
      });
  });

  test('bracket notation - bad notation', function () {
      var form = domify('<form>' + '<input name="[][foo]" value="bar" />' + '<input name="[baz][qux]" value="norf" />' + '</form>');

      hashCheck(form, {
          _values: [{ foo: 'bar' }],
          baz: { qux: 'norf' }
      });
  });

  test('custom serializer', function () {
      var form = domify('<form><input type="text" name="node" value="zuul" /></form>');

      assert.deepEqual(serialize(form, {
          serializer: function serializer(curry, k, v) {
              curry[k] = 'ZUUL';
              return curry;
          }
      }), {
          'node': 'ZUUL'
      });
  });

  test('deserialize', function () {
      // We don't include `keygen` as on way out
      var form = domify('\n<form>\n    <input type="text" name="textBox" />\n    <input type="checkbox" name="checkBox1" />\n    <input type="checkbox" name="checkBox2" />\n    <input type="radio" name="radio1" value="a" />\n    <input type="radio" name="radio1" value="b" />\n    <textarea name="textarea1"></textarea>\n    <select name="select1">\n        <option value="opt1">Option 1</option>\n        <option value="opt2">Option 2</option>\n        <option value="opt3">Option 3</option>\n    </select>\n    <select name="selectMultiple1" multiple="multiple">\n        <option value="opt1">Option 1</option>\n        <option value="opt2">Option 2</option>\n        <option value="opt3">Option 3</option>\n        <option>Option 4</option>\n    </select>\n</form>\n');
      var hash = {
          textBox: 'xyz',
          checkBox1: 'on',
          radio1: 'b',
          textarea1: 'some text',
          select1: 'opt2',
          selectMultiple1: ['opt3', 'Option 4']
      };
      // console.log(serialize(form, {hash: true, empty: true}));
      deserialize(form, hash);
      assert.deepEqual(form.textBox.value, 'xyz');
      assert.deepEqual(form.checkBox1.checked, true);
      assert.deepEqual(form.checkBox2.checked, false);
      assert.deepEqual(form.radio1.value, 'b');
      assert.deepEqual(form.textarea1.value, 'some text');
      assert.deepEqual(form.select1.value, 'opt2');
      assert.deepEqual([].concat(toConsumableArray(form.selectMultiple1.selectedOptions)).map(function (o) {
          return o.value;
      }), ['opt3', 'Option 4']);
      // assert.deepEqual(serialize(form, {hash: true}), hash);
  });

  test('deserialize arrays', function () {
      // We don't include `keygen` as on way out
      var form = domify('\n<form>\n    <input type="text" name="arr1[]" id="textBox" value="initial1" />\n    <input type="checkbox" name="arr1[]" id="checkBox1" value="initial2" />\n    <input type="checkbox" name="arr1[]" id="checkBox2" value="initial3" />\n    <input type="radio" name="arr2[]" value="a" id="radio1" checked="checked" />\n    <input type="radio" name="arr2[]" value="b" id="radio2" />\n    <textarea name="arr1[]" id="textarea1">initial4</textarea>\n    <select name="arr1[]" id="select1">\n        <option value="opt1">Option 1</option>\n        <option value="opt2">Option 2</option>\n        <option value="opt3">Option 3</option>\n    </select>\n    <select name="arr3[]" multiple="multiple" id="selectMultiple1">\n        <option value="opt1">Option 1</option>\n        <option value="opt2">Option 2</option>\n        <option value="opt3">Option 3</option>\n        <option>Option 4</option>\n    </select>\n</form>\n');
      var hash = {
          arr1: ['text1', '', 'on', 'Text 2', 'opt2'],
          arr2: 'b',
          arr3: ['opt1', 'opt3']
      };
      function $(sel) {
          return form.querySelector(sel);
      }
      // console.log(serialize(form, {hash: true, empty: true}));
      deserialize(form, hash);
      // assert.deepEqual(form.arr1, 'xyz');
      assert.deepEqual($('#textBox').value, 'text1');
      assert.deepEqual($('#checkBox1').checked, false);
      assert.deepEqual($('#checkBox2').checked, true);
      assert.deepEqual($('#radio1').checked, false);
      assert.deepEqual($('#radio2').checked, true);
      assert.deepEqual($('#textarea1').value, 'Text 2');
      assert.deepEqual($('#select1').value, 'opt2');
      assert.deepEqual([].concat(toConsumableArray($('#selectMultiple1').selectedOptions)).map(function (o) {
          return o.value;
      }), ['opt1', 'opt3']);
  });

})));
