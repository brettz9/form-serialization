# form-serialization [![Build Status](https://travis-ci.org/brettz9/form-serialization.png?branch=master)](https://travis-ci.org/brettz9/form-serialization)

Serialize form fields. A fork of
[form-serialize](https://github.com/defunctzombie/form-serialize).

## Special features

- Adds `deserialize`
- Offers a pre-made browser bundle
- Offers ESM distribution as well as UMD
- Offers [JSDoc](https://unpkg.com/form-serialization/docs/jsdoc/module-FormSerialization.html)

## Use cases

- Submit a form via `XMLHttpRequest`
- Retain settings in local storage
- Serialize to string for use within hash-based offlineable URLs
- Serialize for use within modifying [history state](https://developer.mozilla.org/en-US/docs/Web/API/History_API#Adding_and_modifying_history_entries)

## Install

```shell
npm install form-serialization
```

## Usage

`form-serialization` supports two output formats, URL encoding
(the default) or a hash (JavaScript objects).

Lets serialize the following HTML form:
```html
<form id="example-form">
	<input type="text" name="foo" value="bar"/>
	<input type="submit" value="do it!"/>
</form>
```

```js
const serialize = require('form-serialization');

const form = document.querySelector('#example-form');

const str = serialize(form);
// str -> "foo=bar"

const obj = serialize(form, {hash: true});
// obj -> { foo: 'bar' }
```

## API

### serialize(form \[, options])

Returns a serialized form of a `HTMLFormElement`. Output is determined by
the serializer used. The default serializer performs URL encoding.

arg | type | desc
:--- | :--- | :---
form | HTMLForm | must be an `HTMLFormElement`
options | Object | optional options object

#### Options

option | type | default | desc
:--- | :--- | :---: | :---
hash | boolean | false | If `true`, the hash serializer will be used for `serializer` option
serializer | function | url-encoding | Override the default serializer (hash or url-encoding)
disabled | boolean | false | If `true`, disabled fields will also be serialized
empty | boolean | false | If `true`, empty fields will also be serialized

### Custom serializer

Serializers take 3 arguments: `result`, `key`, `value` and should return a newly updated result.

See the example serializers in the `index.js` source file.

## Notes

Only [successful control](https://www.w3.org/TR/html401/interact/forms.html#h-17.13.2)
form fields are serialized (with the exception of disabled fields if disabled option
is set).

Multiselect fields with more than one value will result in an array of values
in the `hash` output mode using the default hash serializer

### Explicit array fields

Fields who's name ends with `[]` are **always** serialized as an array
field in `hash` output mode using the default hash serializer.
The field name also gets the brackets removed from its name.

This does not affect the URL encoding mode output in any way.

```html
<form id="example-form">
	<input type="checkbox" name="foo[]" value="bar" checked />
	<input type="checkbox" name="foo[]" value="baz" />
	<input type="submit" value="do it!"/>
</form>
```

```js
const serialize = require('form-serialization');

const form = document.querySelector('#example-form');

const obj = serialize(form, {hash: true});
// obj -> { foo: ['bar'] }

const str = serialize(form);
// str -> "foo[]=bar"

```

### Indexed arrays

Adding numbers between brackets for the array notation above will result
in a hash serialization with explicit ordering based on the index number
regardless of element ordering.

Like the "[explicit array fields](explicit-array-fields)" this does not
affect ULR encoding mode output in any way.

```html
<form id="todos-form">
	<input type="text" name="todos[1]" value="milk" />
	<input type="text" name="todos[0]" value="eggs" />
	<input type="text" name="todos[2]" value="flour" />
</form>
```

```js
const serialize = require('form-serialization');

const form = document.querySelector('#todos-form');

const obj = serialize(form, {hash: true});
// obj -> { todos: ['eggs', 'milk', 'flour'] }

const str = serialize(form);
// str -> "todos[1]=milk&todos[0]=eggs&todos[2]=flour"
```

### Nested objects

Similar to the indexed array notation, attribute names can be added by
inserting a string value between brackets. The notation can be used to
create deep objects and mixed with the array notation.

Like the "[explicit array fields](explicit-array-fields)" this does not
affect URL encoding mode output.

```html
<form id="nested-example">
	<input type="text" name="foo[bar][baz]" value="qux" />
	<input type="text" name="foo[norf][]" value="item 1" />
</form>
```

```js
const serialize = require('form-serialization');

const form = document.querySelector('#todos-form');

const obj = serialize(form, {hash: true});
// obj -> { foo: { bar: { baz: 'qux' } }, norf: [ 'item 1' ] }

```

## License

MIT
