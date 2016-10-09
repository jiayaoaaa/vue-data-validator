// Generated by CoffeeScript 1.11.1
(function() {
  var _, assignIfDifferently, empty, isArray, isBool, isNumber, isObject, isPromise, isString, isset;

  _ = require('./lodash.custom.coffee');

  isset = function(v) {
    return typeof v !== 'undefined';
  };

  isBool = function(v) {
    return Object.prototype.toString.call(v) === '[object Boolean]';
  };

  isString = function(v) {
    return Object.prototype.toString.call(v) === '[object String]';
  };

  isNumber = function(v) {
    return Object.prototype.toString.call(v) === '[object Number]';
  };

  isArray = function(v) {
    return Object.prototype.toString.call(v) === '[object Array]';
  };

  isObject = function(v) {
    return Object.prototype.toString.call(v) === '[object Object]';
  };

  isPromise = function(v) {
    return Object.prototype.toString.call(v) === '[object Promise]';
  };

  empty = function(v) {
    var i, k;
    if (!isset(v) || v === null) {
      return true;
    } else if (isset(v.length)) {
      return v.length === 0;
    } else if (isBool(v) || isNumber(v)) {
      return false;
    } else if (isNaN(v)) {
      return true;
    } else if (isObject(v)) {
      i = 0;
      for (k in v) {
        i++;
      }
      return i === 0;
    }
  };

  assignIfDifferently = function(obj, key, value) {
    if (obj[key] !== value) {
      return obj[key] = value;
    }
  };

  module.exports = {
    install: function(Vue, options) {
      var oldFunc;
      Vue.Validator = {
        options: options
      };
      Vue.prototype.$validate = function(name, fields) {
        var oldValidation, resolveRules, validateField, validation;
        resolveRules = function(field) {
          var arr, k, params, r, rule, rules;
          r = {};
          if (field.rules) {
            rules = field.rules.split('|');
            for (k in rules) {
              arr = rules[k].split(':');
              params = arr[1] ? arr[1].split(',') : [];
              rule = arr[0];
              if (field.ruleParams && field.ruleParams[rule]) {
                params = params.concat(field.ruleParams[rule]);
              }
              r[rule] = {
                name: rule,
                params: params
              };
            }
          }
          return r;
        };
        validateField = function(field) {
          var addError, compileMessage, queueId, validated;
          validated = function(valid) {
            var allValid;
            assignIfDifferently(field, 'valid', valid);
            _.pull(validation._validatingQueue, queueId);
            assignIfDifferently(validation, 'validating', validation._validatingQueue.length > 0);
            if (!valid) {
              return assignIfDifferently(validation, 'valid', valid);
            } else {
              allValid = _.findIndex(_.values(fields), function(field) {
                return !field.valid;
              }) === -1;
              return assignIfDifferently(validation, 'valid', allValid && !validation.validating);
            }
          };
          addError = function(ruleName, message) {
            var errors;
            errors = {};
            _.forIn(field._resolvedRules, function(v, key) {
              if (_.has(field.errors, key)) {
                errors[key] = field.errors[key];
              }
              if (key === ruleName) {
                return errors[ruleName] = {
                  name: ruleName,
                  message: message
                };
              }
            });
            return field.errors = errors;
          };
          compileMessage = function(rule) {
            var message, nameInMessage, ref, ref1;
            message = ((ref = field.messages) != null ? ref[rule.name] : void 0) || Vue.Validator.options.messages[rule.name] || 'No error message for :name.';
            nameInMessage = field.nameInMessage || ((ref1 = field.text) != null ? ref1.toString().toLowerCase() : void 0) || field.name;
            message = message.replace(/:name/g, nameInMessage);
            _.forIn(rule.params, function(v, i) {
              var reg;
              reg = new RegExp(':params\\[' + i + '\\]', 'g');
              return message = message.replace(reg, rule.params[i]);
            });
            return message;
          };
          queueId = {};
          validation._validatingQueue.push(queueId);
          assignIfDifferently(validation, 'validating', true);
          field.errors = {};
          return _.forIn(field._resolvedRules, function(rule) {
            var ref, ruleHandler, ruleObj, valid;
            ruleObj = ((ref = field.customRules) != null ? ref[rule.name] : void 0) || Vue.Validator.options.rules[rule.name];
            ruleHandler = ruleObj.handler || ruleObj;
            if (ruleObj.always || !empty(field.value)) {
              valid = ruleHandler(field.value, rule.params, field, fields);
              valid = isPromise(valid) ? valid : (valid ? Promise.resolve() : Promise.reject());
              return valid.then(function() {
                return validated(true);
              })["catch"](function() {
                validated(false);
                return addError(rule.name, compileMessage(rule));
              });
            }
          });
        };
        oldValidation = this[name];
        if ((oldValidation != null) && (oldValidation.clear != null)) {
          oldValidation.clear();
        }
        validation = {
          name: name,
          fields: fields,
          dirty: false,
          valid: false,
          validating: false,
          _validatingQueue: [],
          getValues: function() {
            return _.mapValues(this.fields, function(v) {
              return v.value;
            });
          },
          setDirty: function(to) {
            if (to == null) {
              to = true;
            }
            _.forIn(this.fields, function(v) {
              return assignIfDifferently(v, 'dirty', to);
            });
            assignIfDifferently(this, 'dirty', to);
            return this;
          },
          check: function() {
            return new Promise((function(_this) {
              return function(resolve, reject) {
                if (_this.validating) {
                  return reject();
                } else if (!_this.valid) {
                  _this.setDirty(true);
                  return reject();
                } else {
                  return resolve(_this.getValues());
                }
              };
            })(this));
          },
          clear: function() {
            _.forIn(this.fields, function(v) {
              var ref;
              return (ref = v.watcher) != null ? typeof ref.unwatch === "function" ? ref.unwatch() : void 0 : void 0;
            });
            return this.setDirty(false);
          }
        };
        this[name] = validation;
        _.forIn(fields, (function(_this) {
          return function(field, key) {
            var sensitiveFields, watcher;
            Vue.set(field, 'dirty', false);
            Vue.set(field, 'valid', false);
            Vue.set(field, 'errors', {});
            Vue.set(field, 'required', false);
            Vue.set(field, '_resolvedRules', resolveRules(field));
            sensitiveFields = [];
            _.forIn(field._resolvedRules, function(rule) {
              var ruleObj;
              ruleObj = (field.customRules && field.customRules[rule.name]) || Vue.Validator.options.rules[rule.name];
              if (ruleObj.sensitive) {
                sensitiveFields.push(field);
                return false;
              }
            });
            watcher = {
              path: function() {
                return field.value;
              },
              handler: function(val, newVal) {
                validateField(field);
                assignIfDifferently(field, 'dirty', true);
                assignIfDifferently(validation, 'dirty', true);
                return _.forEach(sensitiveFields, function(field) {
                  return validateField(field);
                });
              }
            };
            watcher.unwatch = _this.$watch(watcher.path, watcher.handler);
            return Vue.set(field, 'watcher', watcher);
          };
        })(this));
        return _.forIn(fields, function(field) {
          return validateField(field);
        });
      };
      if (Vue.prototype.$generateFields != null) {
        oldFunc = Vue.prototype.$generateFields;
      }
      return Vue.generateFields = Vue.prototype.$generateFields = function(fields) {
        var field, key, titleCase;
        titleCase = function(str) {
          var camelCase, camelToWords, studlyCase;
          studlyCase = function(str) {
            return str[0].toUpperCase() + str.substr(1);
          };
          camelCase = function(str) {
            var i, temp;
            temp = str.toString().split('_');
            i = 1;
            while (i < temp.length) {
              temp[i] = studlyCase(temp[i]);
              i++;
            }
            return temp.join('');
          };
          camelToWords = function(str) {
            return str.toString().trim().split(/(?=[A-Z])/);
          };
          return camelToWords(studlyCase(camelCase(str))).join(' ').replace(/\bid\b/ig, 'ID');
        };
        if (oldFunc != null) {
          fields = oldFunc(fields);
        }
        for (key in fields) {
          field = fields[key];
          field.name = key;
          if (field.text == null) {
            field.text = titleCase(field.name);
          }
          if (field.value == null) {
            field.value = null;
          }
        }
        return fields;
      };
    }
  };

}).call(this);
