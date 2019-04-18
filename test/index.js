/* eslint-env node, mocha */
/* eslint-disable import/no-commonjs, require-jsdoc */

import {serialize, deserialize} from '../src/index.js';

const assert = require('assert');
const {JSDOM} = require('jsdom');

const {document} = (new JSDOM()).window; // eslint-disable-line no-shadow
// Needed by `domify` (or could pass in as its second argument)
global.document = document;

// import assert from 'assert';
// import domify from 'domify';

const domify = require('domify');

function hashCheck (form, exp) {
  assert.deepStrictEqual(serialize(form, {hash: true}), exp);
}

function strCheck (form, exp) {
  assert.deepStrictEqual(serialize(form), exp);
}

function disabledCheck (form, exp) {
  assert.deepStrictEqual(serialize(form, {
    hash: false, disabled: true
  }), exp);
}

function emptyCheck (form, exp) {
  assert.deepStrictEqual(serialize(form, {
    hash: false, disabled: true, empty: true
  }), exp);
}

function emptyCheckHash (form, exp) {
  assert.deepStrictEqual(serialize(form, {
    hash: true, disabled: true, empty: true
  }), exp);
}

test('null form', function () {
  hashCheck(null, {});
  strCheck(null, '');
  emptyCheck(null, '');
  emptyCheckHash(null, {});
});

test('bad form', function () {
  const form = {};
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, '');
  emptyCheckHash(form, {});
});

test('empty form', function () {
  const form = domify('<form></form>');
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, '');
  emptyCheckHash(form, {});
});

// basic form with single input
test('single element', function () {
  const form = domify(
    '<form><input type="text" name="foo" value="bar"/></form>'
  );
  hashCheck(form, {
    foo: 'bar'
  });
  strCheck(form, 'foo=bar');
  emptyCheck(form, 'foo=bar');
  emptyCheckHash(form, {
    foo: 'bar'
  });
});

test('ignore no value', function () {
  const form = domify('<form><input type="text" name="foo"/></form>');
  hashCheck(form, {});
  strCheck(form, '');
});

test('do not ignore no value when empty option', function () {
  const form = domify('<form><input type="text" name="foo"/></form>');
  emptyCheck(form, 'foo=');
  emptyCheckHash(form, {
    foo: ''
  });
});

test('multi inputs', function () {
  const form = domify('<form>' +
    '<input type="text" name="foo" value="bar 1"/>' +
    '<input type="text" name="foo.bar" value="bar 2"/>' +
    '<input type="text" name="baz.foo" value="bar 3"/>' +
    '</form>');
  hashCheck(form, {
    foo: 'bar 1',
    'foo.bar': 'bar 2',
    'baz.foo': 'bar 3'
  });
  strCheck(form, 'foo=bar+1&foo.bar=bar+2&baz.foo=bar+3');
});

test('handle disabled', function () {
  const form = domify('<form>' +
    '<input type="text" name="foo" value="bar 1"/>' +
    '<input type="text" name="foo.bar" value="bar 2" disabled/>' +
    '</form>');
  hashCheck(form, {
    foo: 'bar 1'
  });
  strCheck(form, 'foo=bar+1');
  disabledCheck(form, 'foo=bar+1&foo.bar=bar+2');
});

test('handle disabled and empty', function () {
  const form = domify('<form>' +
    '<input type="text" name="foo" value=""/>' +
    '<input type="text" name="foo.bar" value="" disabled/>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
  disabledCheck(form, '');
  emptyCheck(form, 'foo=&foo.bar=');
  emptyCheckHash(form, {
    foo: '',
    'foo.bar': ''
  });
});

test('ignore buttons', function () {
  const form = domify('<form>' +
    '<input type="submit" name="foo" value="submit"/>' +
    '<input type="reset" name="foo.bar" value="reset"/>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
});

test('checkboxes', function () {
  const form = domify('<form>' +
    '<input type="checkbox" name="foo" checked/>' +
    '<input type="checkbox" name="bar"/>' +
    '<input type="checkbox" name="baz" checked/>' +
    '</form>');
  hashCheck(form, {
    foo: 'on',
    baz: 'on'
  });
  strCheck(form, 'foo=on&baz=on');
  emptyCheck(form, 'foo=on&bar=&baz=on');
  emptyCheckHash(form, {
    foo: 'on',
    bar: '',
    baz: 'on'
  });
});

test('checkboxes - array', function () {
  const form = domify('<form>' +
    '<input type="checkbox" name="foo[]" value="bar" checked/>' +
    '<input type="checkbox" name="foo[]" value="baz" checked/>' +
    '<input type="checkbox" name="foo[]" value="baz"/>' +
    '</form>');
  hashCheck(form, {
    foo: ['bar', 'baz']
  });
  strCheck(form, 'foo%5B%5D=bar&foo%5B%5D=baz');
  emptyCheck(form, 'foo%5B%5D=bar&foo%5B%5D=baz&foo%5B%5D=');
  emptyCheckHash(form, {
    foo: ['bar', 'baz', '']
  });
});

test('checkboxes - array with single item', function () {
  const form = domify('<form>' +
    '<input type="checkbox" name="foo[]" value="bar" checked/>' +
    '</form>');
  hashCheck(form, {
    foo: ['bar']
  });
  strCheck(form, 'foo%5B%5D=bar');
});

test('select - single', function () {
  const form = domify('<form>' +
    '<select name="foo">' +
    '<option value="bar">bar</option>' +
    '<option value="baz" selected>baz</option>' +
    '</select>' +
    '</form>');
  hashCheck(form, {
    foo: 'baz'
  });
  strCheck(form, 'foo=baz');
});

test('select - single - empty', function () {
  const form = domify('<form>' +
    '<select name="foo">' +
    '<option value="">empty</option>' +
    '<option value="bar">bar</option>' +
    '<option value="baz">baz</option>' +
    '</select>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, 'foo=');
  emptyCheckHash(form, {
    foo: ''
  });
});

test('select - multiple', function () {
  const form = domify('<form>' +
    '<select name="foo" multiple>' +
    '<option value="bar" selected>bar</option>' +
    '<option value="baz">baz</option>' +
    '<option value="cat" selected>cat</option>' +
    '</select>' +
    '</form>');
  hashCheck(form, {
    foo: ['bar', 'cat']
  });
  strCheck(form, 'foo=bar&foo=cat');
});

test('select - multiple - empty', function () {
  const form = domify('<form>' +
    '<select name="foo" multiple>' +
    '<option value="">empty</option>' +
    '<option value="bar">bar</option>' +
    '<option value="baz">baz</option>' +
    '<option value="cat">cat</option>' +
    '</select>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, 'foo=');
  emptyCheckHash(form, {
    foo: ''
  });
});

test('radio - no default', function () {
  const form = domify('<form>' +
    '<input type="radio" name="foo" value="bar1"/>' +
    '<input type="radio" name="foo" value="bar2"/>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, 'foo=');
  emptyCheckHash(form, {
    foo: ''
  });
});

test('radio - single default', function () {
  const form = domify('<form>' +
    '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
    '<input type="radio" name="foo" value="bar2"/>' +
    '</form>');
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
  const form = domify('<form>' +
    '<input type="radio" name="foo" value="" checked="checked"/>' +
    '<input type="radio" name="foo" value="bar2"/>' +
    '</form>');
  hashCheck(form, {});
  strCheck(form, '');
  emptyCheck(form, 'foo=');
  emptyCheckHash(form, {
    foo: ''
  });
});

// in this case the radio buttons and checkboxes share a name key
// the checkbox value should still be honored
test('radio w/checkbox', function () {
  let form = domify('<form>' +
    '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
    '<input type="radio" name="foo" value="bar2"/>' +
    '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' +
    '<input type="checkbox" name="foo" value="bar4"/>' +
    '</form>');
  hashCheck(form, {
    foo: ['bar1', 'bar3']
  });
  strCheck(form, 'foo=bar1&foo=bar3');

  // leading checkbox
  form = domify('<form>' +
    '<input type="checkbox" name="foo" value="bar3" checked="checked"/>' +
    '<input type="radio" name="foo" value="bar1" checked="checked"/>' +
    '<input type="radio" name="foo" value="bar2"/>' +
    '<input type="checkbox" name="foo" value="bar4"/>' +
    '<input type="checkbox" name="foo" value="bar5" checked="checked"/>' +
    '</form>');
  hashCheck(form, {
    foo: ['bar3', 'bar1', 'bar5']
  });
  strCheck(form, 'foo=bar3&foo=bar1&foo=bar5');
});

test('bracket notation - hashes', function () {
  const form = domify('<form>' +
    '<input type="email" name="account[name]" value="Foo Dude">' +
    '<input type="text" name="account[email]" value="foobar@example.org">' +
    '<input type="text" name="account[address][city]" value="Qux">' +
    '<input type="text" name="account[address][state]" value="CA">' +
    '<input type="text" name="account[address][empty]" value="">' +
    '</form>');

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

test(
  'bracket notation - hashes with a digit as the first symbol in a key',
  function () {
    const form = domify('<form>' +
      '<input type="text" name="somekey[123abc][first]" ' +
        'value="first_value">' +
      '<input type="text" name="somekey[123abc][second]" ' +
        'value="second_value">' +
      '</form>');

    hashCheck(form, {
      somekey: {
        '123abc': {
          first: 'first_value',
          second: 'second_value'
        }
      }
    });

    emptyCheckHash(form, {
      somekey: {
        '123abc': {
          first: 'first_value',
          second: 'second_value'
        }
      }
    });
  }
);

test('bracket notation - select multiple', function () {
  let form = domify('<form>' +
    '<select name="foo" multiple>' +
    '  <option value="bar" selected>Bar</option>' +
    '  <option value="baz">Baz</option>' +
    '  <option value="qux" selected>Qux</option>' +
    '</select>' +
    '</form>');

  hashCheck(form, {
    foo: ['bar', 'qux']
  });

  // Trailing notation on select.name.
  form = domify('<form>' +
    '<select name="foo[]" multiple>' +
    '  <option value="bar" selected>Bar</option>' +
    '  <option value="baz">Baz</option>' +
    '  <option value="qux" selected>Qux</option>' +
    '</select>' +
    '</form>');

  hashCheck(form, {
    foo: ['bar', 'qux']
  });
});

test('bracket notation - select multiple, nested', function () {
  const form = domify('<form>' +
    '<select name="foo[bar]" multiple>' +
    '  <option value="baz" selected>Baz</option>' +
    '  <option value="qux">Qux</option>' +
    '  <option value="norf" selected>Norf</option>' +
    '</select>' +
    '</form>');

  hashCheck(form, {
    foo: {
      bar: ['baz', 'norf']
    }
  });
});

test('bracket notation - select multiple, empty values', function () {
  const form = domify('<form>' +
    '<select name="foo[bar]" multiple>' +
    '  <option selected>Default value</option>' +
    '  <option value="" selected>Empty value</option>' +
    '  <option value="baz" selected>Baz</option>' +
    '  <option value="qux">Qux</option>' +
    '  <option value="norf" selected>Norf</option>' +
    '</select>' +
    '</form>');

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
  const form = domify('<form>' +
    '<input name="people[][name]" value="fred" />' +
    '<input name="people[][name]" value="bob" />' +
    '<input name="people[][name]" value="bubba" />' +
    '</form>');

  hashCheck(form, {
    people: [
      {name: 'fred'},
      {name: 'bob'},
      {name: 'bubba'}
    ]
  });
});

test('bracket notation - nested, non-indexed arrays', function () {
  const form = domify('<form>' +
    '<input name="user[tags][]" value="cow" />' +
    '<input name="user[tags][]" value="milk" />' +
    '</form>');

  hashCheck(form, {
    user: {
      tags: ['cow', 'milk']
    }
  });
});

test('bracket notation - indexed arrays', function () {
  const form = domify('<form>' +
    '<input name="people[2][name]" value="bubba" />' +
    '<input name="people[2][age]" value="15" />' +
    '<input name="people[0][name]" value="fred" />' +
    '<input name="people[0][age]" value="12" />' +
    '<input name="people[1][name]" value="bob" />' +
    '<input name="people[1][age]" value="14" />' +
    '<input name="people[][name]" value="frank">' +
    '<input name="people[3][age]" value="2">' +
    '</form>');

  hashCheck(form, {
    people: [
      {
        name: 'fred',
        age: '12'
      },
      {
        name: 'bob',
        age: '14'
      },
      {
        name: 'bubba',
        age: '15'
      },
      {
        name: 'frank',
        age: '2'
      }
    ]
  });
});

test('bracket notation - bad notation', function () {
  const form = domify('<form>' +
    '<input name="[][foo]" value="bar" />' +
    '<input name="[baz][qux]" value="norf" />' +
    '</form>');

  hashCheck(form, {
    _values: [
      {foo: 'bar'}
    ],
    baz: {qux: 'norf'}
  });
});

test('custom serializer', function () {
  const form = domify(
    '<form><input type="text" name="node" value="zuul" /></form>'
  );

  assert.deepStrictEqual(serialize(form, {
    serializer (curry, k, v) {
      curry[k] = 'ZUUL';
      return curry;
    }
  }), {
    node: 'ZUUL'
  });
});

test('deserialize', function () {
  // We don't include `keygen` as on way out
  const form = domify(`
<form>
  <input type="text" name="textBox" />
  <input type="checkbox" name="checkBox1" />
  <input type="checkbox" name="checkBox2" />
  <input type="radio" name="radio1" value="a" />
  <input type="radio" name="radio1" value="b" />
  <textarea name="textarea1"></textarea>
  <select name="select1">
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
    <option value="opt3">Option 3</option>
  </select>
  <select name="selectMultiple1" multiple="multiple">
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
    <option value="opt3">Option 3</option>
    <option>Option 4</option>
  </select>
</form>
`);
  const hash = {
    textBox: 'xyz',
    checkBox1: 'on',
    radio1: 'b',
    textarea1: 'some text',
    select1: 'opt2',
    selectMultiple1: ['opt3', 'Option 4']
  };
  // console.log(serialize(form, {hash: true, empty: true}));
  deserialize(form, hash);
  assert.deepStrictEqual(form.textBox.value, 'xyz');
  assert.deepStrictEqual(form.checkBox1.checked, true);
  assert.deepStrictEqual(form.checkBox2.checked, false);
  assert.deepStrictEqual(form.radio1.value, 'b');
  assert.deepStrictEqual(form.textarea1.value, 'some text');
  assert.deepStrictEqual(form.select1.value, 'opt2');
  assert.deepStrictEqual(
    [...form.selectMultiple1.selectedOptions].map(function (o) {
      return o.value;
    }), ['opt3', 'Option 4']
  );
  // assert.deepStrictEqual(serialize(form, {hash: true}), hash);
});

test('deserialize arrays', function () {
  // We don't include `keygen` as on way out
  const form = domify(`
<form>
  <input type="text" name="arr1[]" id="textBox" value="initial1" />
  <input type="checkbox" name="arr1[]" id="checkBox1" value="initial2" />
  <input type="checkbox" name="arr1[]" id="checkBox2" value="initial3" />
  <input type="radio" name="arr2[]" value="a" id="radio1" checked="checked" />
  <input type="radio" name="arr2[]" value="b" id="radio2" />
  <textarea name="arr1[]" id="textarea1">initial4</textarea>
  <select name="arr1[]" id="select1">
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
    <option value="opt3">Option 3</option>
  </select>
  <select name="arr3[]" multiple="multiple" id="selectMultiple1">
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
    <option value="opt3">Option 3</option>
    <option>Option 4</option>
  </select>
</form>
`);
  const hash = {
    arr1: ['text1', '', 'on', 'Text 2', 'opt2'],
    arr2: 'b',
    arr3: ['opt1', 'opt3']
  };
  function $ (sel) {
    return form.querySelector(sel);
  }
  // console.log(serialize(form, {hash: true, empty: true}));
  deserialize(form, hash);
  // assert.deepStrictEqual(form.arr1, 'xyz');
  assert.deepStrictEqual($('#textBox').value, 'text1');
  assert.deepStrictEqual($('#checkBox1').checked, false);
  assert.deepStrictEqual($('#checkBox2').checked, true);
  assert.deepStrictEqual($('#radio1').checked, false);
  assert.deepStrictEqual($('#radio2').checked, true);
  assert.deepStrictEqual($('#textarea1').value, 'Text 2');
  assert.deepStrictEqual($('#select1').value, 'opt2');
  assert.deepStrictEqual(
    [...$('#selectMultiple1').selectedOptions].map(
      function (o) {
        return o.value;
      }
    ),
    ['opt1', 'opt3']
  );
});
