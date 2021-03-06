"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _dotenvDefaults = _interopRequireDefault(require("dotenv-defaults"));

var _fs = _interopRequireDefault(require("fs"));

var _webpack = require("webpack");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Mostly taken from here: https://github.com/motdotla/dotenv-expand/blob/master/lib/main.js#L4
var interpolate = function interpolate(env, vars) {
  var matches = env.match(/\$([a-zA-Z0-9_]+)|\${([a-zA-Z0-9_]+)}/g) || [];
  matches.forEach(function (match) {
    var key = match.replace(/\$|{|}/g, '');
    var variable = vars[key] || '';
    variable = interpolate(variable, vars);
    env = env.replace(match, variable);
  });
  return env;
};

var Dotenv = /*#__PURE__*/function () {
  /**
   * The dotenv-webpack plugin.
   * @param {Object} options - The parameters.
   * @param {String} [options.path=./.env] - The location of the environment variable.
   * @param {Boolean|String} [options.safe=false] - If false ignore safe-mode, if true load `'./.env.example'`, if a string load that file as the sample.
   * @param {Boolean} [options.systemvars=false] - If true, load system environment variables.
   * @param {Boolean} [options.silent=false] - If true, suppress warnings, if false, display warnings.
   * @returns {webpack.DefinePlugin}
   */
  function Dotenv() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Dotenv);

    this.config = Object.assign({}, {
      path: './.env'
    }, config);
    this.checkDeprecation();
    return new _webpack.DefinePlugin(this.formatData(this.gatherVariables()));
  }

  _createClass(Dotenv, [{
    key: "checkDeprecation",
    value: function checkDeprecation() {
      var _this$config = this.config,
          sample = _this$config.sample,
          safe = _this$config.safe,
          silent = _this$config.silent; // Catch older packages, but hold their hand (just for a bit)

      if (sample) {
        if (safe) {
          this.config.safe = sample;
        }

        this.warn('dotenv-webpack: "options.sample" is a deprecated property. Please update your configuration to use "options.safe" instead.', silent);
      }
    }
  }, {
    key: "gatherVariables",
    value: function gatherVariables() {
      var _this$config2 = this.config,
          safe = _this$config2.safe,
          allowEmptyValues = _this$config2.allowEmptyValues;
      var vars = this.initializeVars();

      var _this$getEnvs = this.getEnvs(),
          env = _this$getEnvs.env,
          blueprint = _this$getEnvs.blueprint;

      Object.keys(blueprint).forEach(function (key) {
        var value = Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : env[key];
        var isMissing = typeof value === 'undefined' || value === null || !allowEmptyValues && value === '';

        if (safe && isMissing) {
          throw new Error("Missing environment variable: ".concat(key));
        } else {
          vars[key] = value;
        }
      }); // add the leftovers

      if (safe) {
        Object.keys(env).forEach(function (key) {
          if (!Object.prototype.hasOwnProperty.call(vars, key)) {
            vars[key] = env[key];
          }
        });
      }

      return vars;
    }
  }, {
    key: "initializeVars",
    value: function initializeVars() {
      return this.config.systemvars ? Object.assign({}, process.env) : {};
    }
  }, {
    key: "getEnvs",
    value: function getEnvs() {
      var _this$config3 = this.config,
          path = _this$config3.path,
          silent = _this$config3.silent,
          safe = _this$config3.safe;

      var env = _dotenvDefaults["default"].parse(this.loadFile({
        file: path,
        silent: silent
      }), this.getDefaults());

      var blueprint = env;

      if (safe) {
        var file = './.env.example';

        if (safe !== true) {
          file = safe;
        }

        blueprint = _dotenvDefaults["default"].parse(this.loadFile({
          file: file,
          silent: silent
        }));
      }

      return {
        env: env,
        blueprint: blueprint
      };
    }
  }, {
    key: "getDefaults",
    value: function getDefaults() {
      var _this$config4 = this.config,
          silent = _this$config4.silent,
          defaults = _this$config4.defaults;

      if (defaults) {
        return this.loadFile({
          file: defaults === true ? './.env.defaults' : defaults,
          silent: silent
        });
      }

      return '';
    }
  }, {
    key: "formatData",
    value: function formatData() {
      var vars = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var expand = this.config.expand;
      var formatted = Object.keys(vars).reduce(function (obj, key) {
        var v = vars[key];
        var vKey = "process.env.".concat(key);
        var vValue;

        if (expand) {
          if (v.substring(0, 2) === '\\$') {
            vValue = v.substring(1);
          } else if (v.indexOf('\\$') > 0) {
            vValue = v.replace(/\\\$/g, '$');
          } else {
            vValue = interpolate(v, vars);
          }
        } else {
          vValue = v;
        }

        obj[vKey] = JSON.stringify(vValue);
        return obj;
      }, {}); // fix in case of missing
      // formatted['process.env'] = '{}'

      return formatted;
    }
    /**
     * Load a file.
     * @param {String} config.file - The file to load.
     * @param {Boolean} config.silent - If true, suppress warnings, if false, display warnings.
     * @returns {Object}
     */

  }, {
    key: "loadFile",
    value: function loadFile(_ref) {
      var file = _ref.file,
          silent = _ref.silent;

      try {
        return _fs["default"].readFileSync(file, 'utf8');
      } catch (err) {
        this.warn("Failed to load ".concat(file, "."), silent);
        return {};
      }
    }
    /**
     * Displays a console message if 'silent' is falsey
     * @param {String} msg - The message.
     * @param {Boolean} silent - If true, display the message, if false, suppress the message.
     */

  }, {
    key: "warn",
    value: function warn(msg, silent) {
      !silent && console.warn(msg);
    }
  }]);

  return Dotenv;
}();

var _default = Dotenv;
exports["default"] = _default;