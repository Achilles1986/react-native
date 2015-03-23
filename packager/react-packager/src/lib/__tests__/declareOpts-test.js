'use strict';

jest.autoMockOff();

var declareOpts = require('../declareOpts');

describe('declareOpts', function() {
  it('should declare and validate simple opts', function() {
    var validate = declareOpts({
      name: {
        required: true,
        type: 'string',
      },
      age: {
        type: 'number',
        default: 21,
      }
    });
    var opts = validate({ name: 'fooer' });

    expect(opts).toEqual({
      name: 'fooer',
      age: 21
    });
  });

  it('should work with complex types', function() {
    var validate = declareOpts({
      things: {
        required: true,
        type: 'array',
      },
      stuff: {
        type: 'object',
        required: true,
      }
    });

    var opts = validate({ things: [1, 2, 3], stuff: {hai: 1} });
    expect(opts).toEqual({
      things: [1,2,3],
      stuff: {hai: 1},
    });
  });

  it('should throw when a required option is not present', function() {
    var validate = declareOpts({
      foo: {
        required: true,
        type: 'number',
      }
    });

    expect(function() {
      validate({});
    }).toThrow('Error validating module options: foo is required');
  });

  it('should throw on invalid type', function() {
    var validate = declareOpts({
      foo: {
        required: true,
        type: 'number'
      }
    });

    expect(function() {
      validate({foo: 'lol'});
    }).toThrow('Error validating module options: foo must be a number');
  });

  it('should throw on extra options', function() {
    var validate = declareOpts({
      foo: {
        required: true,
        type: 'number',
      }
    });

    expect(function() {
      validate({foo: 1, lol: 1});
    }).toThrow('Error validating module options: lol is not allowed');
  });
});
