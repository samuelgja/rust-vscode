var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/syn/dist/cjs/synthetic.js
var require_synthetic = __commonJS({
  "node_modules/syn/dist/cjs/synthetic.js"(exports2, module2) {
    var opts = window.syn ? window.syn : {};
    var extend = function(d, s) {
      var p;
      for (p in s) {
        d[p] = s[p];
      }
      return d;
    };
    var browser = {
      msie: !!(window.attachEvent && !window.opera) || navigator.userAgent.indexOf("Trident/") > -1,
      opera: !!window.opera,
      webkit: navigator.userAgent.indexOf("AppleWebKit/") > -1,
      safari: navigator.userAgent.indexOf("AppleWebKit/") > -1 && navigator.userAgent.indexOf("Chrome/") === -1,
      gecko: navigator.userAgent.indexOf("Gecko") > -1,
      mobilesafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
      rhino: navigator.userAgent.match(/Rhino/) && true,
      chrome: !!window.chrome && !!window.chrome.webstore
    };
    var createEventObject = function(type2, options, element2) {
      var event = element2.ownerDocument.createEventObject();
      return extend(event, options);
    };
    var data = {};
    var id = 1;
    var expando = "_synthetic" + (/* @__PURE__ */ new Date()).getTime();
    var bind;
    var unbind;
    var schedule;
    var key = /keypress|keyup|keydown/;
    var page = /load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll/;
    var activeElement;
    var syn2 = function(type2, element2, options, callback) {
      return new syn2.init(type2, element2, options, callback);
    };
    syn2.config = opts;
    syn2.__tryFocus = function tryFocus(element2) {
      try {
        element2.focus();
      } catch (e) {
      }
    };
    bind = function(el, ev, f) {
      return el.addEventListener ? el.addEventListener(ev, f, false) : el.attachEvent("on" + ev, f);
    };
    unbind = function(el, ev, f) {
      return el.addEventListener ? el.removeEventListener(ev, f, false) : el.detachEvent("on" + ev, f);
    };
    schedule = syn2.config.schedule || function(fn, ms) {
      setTimeout(fn, ms);
    };
    extend(syn2, {
      init: function(type2, element2, options, callback) {
        var args = syn2.args(options, element2, callback), self = this;
        this.queue = [];
        this.element = args.element;
        if (typeof this[type2] === "function") {
          this[type2](args.element, args.options, function(defaults, el) {
            if (args.callback) {
              args.callback.apply(self, arguments);
            }
            self.done.apply(self, arguments);
          });
        } else {
          this.result = syn2.trigger(args.element, type2, args.options);
          if (args.callback) {
            args.callback.call(this, args.element, this.result);
          }
        }
      },
      jquery: function(el, fast) {
        if (window.FuncUnit && window.FuncUnit.jQuery) {
          return window.FuncUnit.jQuery;
        }
        if (el) {
          return syn2.helpers.getWindow(el).jQuery || window.jQuery;
        } else {
          return window.jQuery;
        }
      },
      args: function() {
        var res = {}, i2 = 0;
        for (; i2 < arguments.length; i2++) {
          if (typeof arguments[i2] === "function") {
            res.callback = arguments[i2];
          } else if (arguments[i2] && arguments[i2].jquery) {
            res.element = arguments[i2][0];
          } else if (arguments[i2] && arguments[i2].nodeName) {
            res.element = arguments[i2];
          } else if (res.options && typeof arguments[i2] === "string") {
            res.element = document.getElementById(arguments[i2]);
          } else if (arguments[i2]) {
            res.options = arguments[i2];
          }
        }
        return res;
      },
      click: function(element2, options, callback) {
        syn2("click!", element2, options, callback);
      },
      defaults: {
        focus: function focus() {
          if (!syn2.support.focusChanges) {
            var element2 = this, nodeName2 = element2.nodeName.toLowerCase();
            syn2.data(element2, "syntheticvalue", element2.value);
            if (nodeName2 === "input" || nodeName2 === "textarea") {
              bind(element2, "blur", function blur() {
                if (syn2.data(element2, "syntheticvalue") !== element2.value) {
                  syn2.trigger(element2, "change", {});
                }
                unbind(element2, "blur", blur);
              });
            }
          }
        },
        submit: function() {
          syn2.onParents(this, function(el) {
            if (el.nodeName.toLowerCase() === "form") {
              el.submit();
              return false;
            }
          });
        }
      },
      changeOnBlur: function(element2, prop, value) {
        bind(element2, "blur", function onblur() {
          if (value !== element2[prop]) {
            syn2.trigger(element2, "change", {});
          }
          unbind(element2, "blur", onblur);
        });
      },
      closest: function(el, type2) {
        while (el && el.nodeName.toLowerCase() !== type2.toLowerCase()) {
          el = el.parentNode;
        }
        return el;
      },
      data: function(el, key2, value) {
        var d;
        if (!el[expando]) {
          el[expando] = id++;
        }
        if (!data[el[expando]]) {
          data[el[expando]] = {};
        }
        d = data[el[expando]];
        if (value) {
          data[el[expando]][key2] = value;
        } else {
          return data[el[expando]][key2];
        }
      },
      onParents: function(el, func) {
        var res;
        while (el && res !== false) {
          res = func(el);
          el = el.parentNode;
        }
        return el;
      },
      focusable: /^(a|area|frame|iframe|label|input|select|textarea|button|html|object)$/i,
      isFocusable: function(elem) {
        var attributeNode;
        if (elem.getAttributeNode) {
          attributeNode = elem.getAttributeNode("tabIndex");
        }
        return this.focusable.test(elem.nodeName) || attributeNode && attributeNode.specified && syn2.isVisible(elem);
      },
      isVisible: function(elem) {
        return elem.offsetWidth && elem.offsetHeight || elem.clientWidth && elem.clientHeight;
      },
      tabIndex: function(elem) {
        var attributeNode = elem.getAttributeNode("tabIndex");
        return attributeNode && attributeNode.specified && (parseInt(elem.getAttribute("tabIndex")) || 0);
      },
      bind,
      unbind,
      schedule,
      browser,
      helpers: {
        createEventObject,
        createBasicStandardEvent: function(type2, defaults, doc) {
          var event;
          try {
            event = doc.createEvent("Events");
          } catch (e2) {
            event = doc.createEvent("UIEvents");
          } finally {
            event.initEvent(type2, true, true);
            extend(event, defaults);
          }
          return event;
        },
        inArray: function(item, array) {
          var i2 = 0;
          for (; i2 < array.length; i2++) {
            if (array[i2] === item) {
              return i2;
            }
          }
          return -1;
        },
        getWindow: function(element2) {
          if (element2.ownerDocument) {
            return element2.ownerDocument.defaultView || element2.ownerDocument.parentWindow;
          }
        },
        extend,
        scrollOffset: function(win, set) {
          var doc = win.document.documentElement, body = win.document.body;
          if (set) {
            window.scrollTo(set.left, set.top);
          } else {
            return {
              left: (doc && doc.scrollLeft || body && body.scrollLeft || 0) + (doc.clientLeft || 0),
              top: (doc && doc.scrollTop || body && body.scrollTop || 0) + (doc.clientTop || 0)
            };
          }
        },
        scrollDimensions: function(win) {
          var doc = win.document.documentElement, body = win.document.body, docWidth = doc.clientWidth, docHeight = doc.clientHeight, compat = win.document.compatMode === "CSS1Compat";
          return {
            height: compat && docHeight || body.clientHeight || docHeight,
            width: compat && docWidth || body.clientWidth || docWidth
          };
        },
        addOffset: function(options, el) {
          var jq = syn2.jquery(el), off;
          if (typeof options === "object" && options.clientX === void 0 && options.clientY === void 0 && options.pageX === void 0 && options.pageY === void 0 && jq) {
            el = jq(el);
            off = el.offset();
            options.pageX = off.left + el.width() / 2;
            options.pageY = off.top + el.height() / 2;
          }
        }
      },
      key: {
        ctrlKey: null,
        altKey: null,
        shiftKey: null,
        metaKey: null
      },
      dispatch: function(event, element2, type2, autoPrevent) {
        if (element2.dispatchEvent && event) {
          var preventDefault = event.preventDefault, prevents = autoPrevent ? -1 : 0;
          if (autoPrevent) {
            bind(element2, type2, function ontype(ev) {
              ev.preventDefault();
              unbind(this, type2, ontype);
            });
          }
          event.preventDefault = function() {
            prevents++;
            if (++prevents > 0) {
              preventDefault.apply(this, []);
            }
          };
          element2.dispatchEvent(event);
          return prevents <= 0;
        } else {
          try {
            window.event = event;
          } catch (e) {
          }
          return element2.sourceIndex <= 0 || element2.fireEvent && element2.fireEvent("on" + type2, event);
        }
      },
      create: {
        page: {
          event: function(type2, options, element2) {
            var doc = syn2.helpers.getWindow(element2).document || document, event;
            if (doc.createEvent) {
              event = doc.createEvent("Events");
              event.initEvent(type2, true, true);
              return event;
            } else {
              try {
                event = createEventObject(type2, options, element2);
              } catch (e) {
              }
              return event;
            }
          }
        },
        focus: {
          event: function(type2, options, element2) {
            syn2.onParents(element2, function(el) {
              if (syn2.isFocusable(el)) {
                if (el.nodeName.toLowerCase() !== "html") {
                  syn2.__tryFocus(el);
                  activeElement = el;
                } else if (activeElement) {
                  var doc = syn2.helpers.getWindow(element2).document;
                  if (doc !== window.document) {
                    return false;
                  } else if (doc.activeElement) {
                    doc.activeElement.blur();
                    activeElement = null;
                  } else {
                    activeElement.blur();
                    activeElement = null;
                  }
                }
                return false;
              }
            });
            return true;
          }
        }
      },
      support: {
        clickChanges: false,
        clickSubmits: false,
        keypressSubmits: false,
        mouseupSubmits: false,
        radioClickChanges: false,
        focusChanges: false,
        linkHrefJS: false,
        keyCharacters: false,
        backspaceWorks: false,
        mouseDownUpClicks: false,
        tabKeyTabs: false,
        keypressOnAnchorClicks: false,
        optionClickBubbles: false,
        pointerEvents: false,
        touchEvents: false,
        ready: 0
      },
      trigger: function(element2, type2, options) {
        if (!options) {
          options = {};
        }
        var create = syn2.create, setup = create[type2] && create[type2].setup, kind = key.test(type2) ? "key" : page.test(type2) ? "page" : "mouse", createType = create[type2] || {}, createKind = create[kind], event, ret, autoPrevent, dispatchEl = element2;
        if (syn2.support.ready === 2 && setup) {
          setup(type2, options, element2);
        }
        autoPrevent = options._autoPrevent;
        delete options._autoPrevent;
        if (createType.event) {
          ret = createType.event(type2, options, element2);
        } else {
          options = createKind.options ? createKind.options(type2, options, element2) : options;
          if (!syn2.support.changeBubbles && /option/i.test(element2.nodeName)) {
            dispatchEl = element2.parentNode;
          }
          event = createKind.event(type2, options, dispatchEl);
          ret = syn2.dispatch(event, dispatchEl, type2, autoPrevent);
        }
        if (ret && syn2.support.ready === 2 && syn2.defaults[type2]) {
          syn2.defaults[type2].call(element2, options, autoPrevent);
        }
        return ret;
      },
      eventSupported: function(eventName) {
        var el = document.createElement("div");
        eventName = "on" + eventName;
        var isSupported = eventName in el;
        if (!isSupported) {
          el.setAttribute(eventName, "return;");
          isSupported = typeof el[eventName] === "function";
        }
        el = null;
        return isSupported;
      }
    });
    extend(syn2.init.prototype, {
      then: function(type2, element2, options, callback) {
        if (syn2.autoDelay) {
          this.delay();
        }
        var args = syn2.args(options, element2, callback), self = this;
        this.queue.unshift(function(el, prevented) {
          if (typeof this[type2] === "function") {
            this.element = args.element || el;
            this[type2](this.element, args.options, function(defaults, el2) {
              if (args.callback) {
                args.callback.apply(self, arguments);
              }
              self.done.apply(self, arguments);
            });
          } else {
            this.result = syn2.trigger(args.element, type2, args.options);
            if (args.callback) {
              args.callback.call(this, args.element, this.result);
            }
            return this;
          }
        });
        return this;
      },
      delay: function(timeout, callback) {
        if (typeof timeout === "function") {
          callback = timeout;
          timeout = null;
        }
        timeout = timeout || 600;
        var self = this;
        this.queue.unshift(function() {
          schedule(function() {
            if (callback) {
              callback.apply(self, []);
            }
            self.done.apply(self, arguments);
          }, timeout);
        });
        return this;
      },
      done: function(defaults, el) {
        if (el) {
          this.element = el;
        }
        if (this.queue.length) {
          this.queue.pop().call(this, this.element, defaults);
        }
      },
      "_click": function(element2, options, callback, force) {
        syn2.helpers.addOffset(options, element2);
        if (syn2.support.pointerEvents) {
          syn2.trigger(element2, "pointerdown", options);
        }
        if (syn2.support.touchEvents) {
          syn2.trigger(element2, "touchstart", options);
        }
        syn2.trigger(element2, "mousedown", options);
        schedule(function() {
          if (syn2.support.pointerEvents) {
            syn2.trigger(element2, "pointerup", options);
          }
          if (syn2.support.touchEvents) {
            syn2.trigger(element2, "touchend", options);
          }
          syn2.trigger(element2, "mouseup", options);
          if (!syn2.support.mouseDownUpClicks || force) {
            syn2.trigger(element2, "click", options);
            callback(true);
          } else {
            syn2.create.click.setup("click", options, element2);
            syn2.defaults.click.call(element2);
            schedule(function() {
              callback(true);
            }, 1);
          }
        }, 1);
      },
      "_rightClick": function(element2, options, callback) {
        syn2.helpers.addOffset(options, element2);
        var mouseopts = extend(extend({}, syn2.mouse.browser.right.mouseup), options);
        if (syn2.support.pointerEvents) {
          syn2.trigger(element2, "pointerdown", mouseopts);
        }
        syn2.trigger(element2, "mousedown", mouseopts);
        schedule(function() {
          if (syn2.support.pointerEvents) {
            syn2.trigger(element2, "pointerup", mouseopts);
          }
          syn2.trigger(element2, "mouseup", mouseopts);
          if (syn2.mouse.browser.right.contextmenu) {
            syn2.trigger(element2, "contextmenu", extend(extend({}, syn2.mouse.browser.right.contextmenu), options));
          }
          callback(true);
        }, 1);
      },
      "_dblclick": function(element2, options, callback) {
        syn2.helpers.addOffset(options, element2);
        var self = this;
        this._click(element2, options, function() {
          schedule(function() {
            self._click(element2, options, function() {
              syn2.trigger(element2, "dblclick", options);
              callback(true);
            }, true);
          }, 2);
        });
      }
    });
    var actions = [
      "click",
      "dblclick",
      "move",
      "drag",
      "key",
      "type",
      "rightClick"
    ];
    var makeAction = function(name) {
      syn2[name] = function(element2, options, callback) {
        return syn2("_" + name, element2, options, callback);
      };
      syn2.init.prototype[name] = function(element2, options, callback) {
        return this.then("_" + name, element2, options, callback);
      };
    };
    var i = 0;
    for (; i < actions.length; i++) {
      makeAction(actions[i]);
    }
    module2.exports = syn2;
  }
});

// node_modules/syn/dist/cjs/keyboard-event-keys.js
var require_keyboard_event_keys = __commonJS({
  "node_modules/syn/dist/cjs/keyboard-event-keys.js"() {
    var syn2 = require_synthetic();
    syn2.key.keyboardEventKeys = {
      "\b": "Backspace",
      "	": "Tab",
      "\r": "Enter",
      "shift": "Shift",
      "ctrl": "Control",
      "alt": "Alt",
      "meta": "Meta",
      "pause-break": "Pause",
      "caps": "CapsLock",
      "escape": "Escape",
      "num-lock": "NumLock",
      "scroll-lock": "ScrollLock",
      "print": "Print",
      "page-up": "PageUp",
      "page-down": "PageDown",
      "end": "End",
      "home": "Home",
      "left": "ArrowLeft",
      "up": "ArrowUp",
      "right": "ArrowRight",
      "down": "ArrowDown",
      "insert": "Insert",
      "delete": "Delete",
      "f1": "F1",
      "f2": "F2",
      "f3": "F3",
      "f4": "F4",
      "f5": "F5",
      "f6": "F6",
      "f7": "F7",
      "f8": "F8",
      "f9": "F9",
      "f10": "F10",
      "f11": "F11",
      "f12": "F12"
    };
  }
});

// node_modules/syn/dist/cjs/mouse.js
var require_mouse = __commonJS({
  "node_modules/syn/dist/cjs/mouse.js"(exports, module) {
    var syn = require_synthetic();
    var h = syn.helpers;
    var getWin = h.getWindow;
    syn.mouse = {};
    h.extend(syn.defaults, {
      mousedown: function(options) {
        syn.trigger(this, "focus", {});
      },
      click: function() {
        var element = this, href, type, createChange, radioChanged, nodeName, scope;
        try {
          href = element.href;
          type = element.type;
          createChange = syn.data(element, "createChange");
          radioChanged = syn.data(element, "radioChanged");
          scope = getWin(element);
          nodeName = element.nodeName.toLowerCase();
        } catch (e) {
          return;
        }
        if (!syn.support.linkHrefJS && /^\s*javascript:/.test(href)) {
          var code = href.replace(/^\s*javascript:/, "");
          if (code !== "//" && code.indexOf("void(0)") === -1) {
            if (window.selenium) {
              eval("with(selenium.browserbot.getCurrentWindow()){" + code + "}");
            } else {
              eval("with(scope){" + code + "}");
            }
          }
        }
        if (!syn.support.clickSubmits && ((nodeName === "input" || nodeName === "button") && type === "submit")) {
          var form = syn.closest(element, "form");
          if (form) {
            syn.trigger(form, "submit", {});
          }
        }
        if (nodeName === "a" && element.href && !/^\s*javascript:/.test(href)) {
          scope.location.href = href;
        }
        if (nodeName === "input" && type === "checkbox") {
          if (!syn.support.clickChanges) {
            syn.trigger(element, "change", {});
          }
        }
        if (nodeName === "input" && type === "radio") {
          if (radioChanged && !syn.support.radioClickChanges) {
            syn.trigger(element, "change", {});
          }
        }
        if (nodeName === "option" && createChange) {
          syn.trigger(element.parentNode, "change", {});
          syn.data(element, "createChange", false);
        }
      }
    });
    h.extend(syn.create, {
      mouse: {
        options: function(type2, options, element2) {
          var doc = document.documentElement, body = document.body, center = [
            options.pageX || 0,
            options.pageY || 0
          ], left = syn.mouse.browser && syn.mouse.browser.left[type2], right = syn.mouse.browser && syn.mouse.browser.right[type2];
          return h.extend({
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: 1,
            screenY: 1,
            clientX: options.clientX || center[0] - (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0),
            clientY: options.clientY || center[1] - (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0),
            ctrlKey: !!syn.key.ctrlKey,
            altKey: !!syn.key.altKey,
            shiftKey: !!syn.key.shiftKey,
            metaKey: !!syn.key.metaKey,
            button: left && left.button !== null ? left.button : right && right.button || (type2 === "contextmenu" ? 2 : 0),
            relatedTarget: document.documentElement
          }, options);
        },
        event: function(type2, defaults, element2) {
          var doc = getWin(element2).document || document, event;
          if (doc.createEvent) {
            try {
              defaults.view = doc.defaultView;
              event = doc.createEvent("MouseEvents");
              event.initMouseEvent(type2, defaults.bubbles, defaults.cancelable, defaults.view, defaults.detail, defaults.screenX, defaults.screenY, defaults.clientX, defaults.clientY, defaults.ctrlKey, defaults.altKey, defaults.shiftKey, defaults.metaKey, defaults.button, defaults.relatedTarget);
            } catch (e) {
              event = h.createBasicStandardEvent(type2, defaults, doc);
            }
            event.synthetic = true;
            return event;
          } else {
            try {
              event = h.createEventObject(type2, defaults, element2);
            } catch (e) {
            }
            return event;
          }
        }
      },
      click: {
        setup: function(type2, options, element2) {
          var nodeName2 = element2.nodeName.toLowerCase();
          if (!syn.support.clickChecks && !syn.support.changeChecks && nodeName2 === "input") {
            type2 = element2.type.toLowerCase();
            if (type2 === "checkbox") {
              element2.checked = !element2.checked;
            }
            if (type2 === "radio") {
              if (!element2.checked) {
                try {
                  syn.data(element2, "radioChanged", true);
                } catch (e) {
                }
                element2.checked = true;
              }
            }
          }
          if (nodeName2 === "a" && element2.href && !/^\s*javascript:/.test(element2.href)) {
            syn.data(element2, "href", element2.href);
          }
          if (/option/i.test(element2.nodeName)) {
            var child = element2.parentNode.firstChild, i = -1;
            while (child) {
              if (child.nodeType === 1) {
                i++;
                if (child === element2) {
                  break;
                }
              }
              child = child.nextSibling;
            }
            if (i !== element2.parentNode.selectedIndex) {
              element2.parentNode.selectedIndex = i;
              syn.data(element2, "createChange", true);
            }
          }
        }
      },
      mousedown: {
        setup: function(type2, options, element2) {
          var nn = element2.nodeName.toLowerCase();
          if (syn.browser.safari && (nn === "select" || nn === "option")) {
            options._autoPrevent = true;
          }
        }
      }
    });
  }
});

// node_modules/syn/dist/cjs/mouse.support.js
var require_mouse_support = __commonJS({
  "node_modules/syn/dist/cjs/mouse.support.js"() {
    var syn2 = require_synthetic();
    require_mouse();
    (function checkSupport() {
      if (!document.body) {
        return syn2.schedule(checkSupport, 1);
      }
      window.__synthTest = function() {
        syn2.support.linkHrefJS = true;
      };
      var div = document.createElement("div"), checkbox, submit, form2, select;
      div.innerHTML = "<form id='outer'><input name='checkbox' type='checkbox'/><input name='radio' type='radio' /><input type='submit' name='submitter'/><input type='input' name='inputter'/><input name='one'><input name='two'/><a href='javascript:__synthTest()' id='synlink'></a><select><option></option></select></form>";
      document.documentElement.appendChild(div);
      form2 = div.firstChild;
      checkbox = form2.childNodes[0];
      submit = form2.childNodes[2];
      select = form2.getElementsByTagName("select")[0];
      syn2.trigger(form2.childNodes[6], "click", {});
      checkbox.checked = false;
      checkbox.onchange = function() {
        syn2.support.clickChanges = true;
      };
      syn2.trigger(checkbox, "click", {});
      syn2.support.clickChecks = checkbox.checked;
      checkbox.checked = false;
      syn2.trigger(checkbox, "change", {});
      syn2.support.changeChecks = checkbox.checked;
      form2.onsubmit = function(ev) {
        if (ev.preventDefault) {
          ev.preventDefault();
        }
        syn2.support.clickSubmits = true;
        return false;
      };
      syn2.trigger(submit, "click", {});
      form2.childNodes[1].onchange = function() {
        syn2.support.radioClickChanges = true;
      };
      syn2.trigger(form2.childNodes[1], "click", {});
      syn2.bind(div, "click", function onclick() {
        syn2.support.optionClickBubbles = true;
        syn2.unbind(div, "click", onclick);
      });
      syn2.trigger(select.firstChild, "click", {});
      syn2.support.changeBubbles = syn2.eventSupported("change");
      div.onclick = function() {
        syn2.support.mouseDownUpClicks = true;
      };
      syn2.trigger(div, "mousedown", {});
      syn2.trigger(div, "mouseup", {});
      document.documentElement.removeChild(div);
      syn2.support.pointerEvents = syn2.eventSupported("pointerdown");
      syn2.support.touchEvents = syn2.eventSupported("touchstart");
      syn2.support.ready++;
    })();
  }
});

// node_modules/syn/dist/cjs/browsers.js
var require_browsers = __commonJS({
  "node_modules/syn/dist/cjs/browsers.js"() {
    var syn2 = require_synthetic();
    require_mouse();
    syn2.key.browsers = {
      webkit: {
        "prevent": {
          "keyup": [],
          "keydown": [
            "char",
            "keypress"
          ],
          "keypress": ["char"]
        },
        "character": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            "char",
            "char"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "specialChars": {
          "keydown": [
            0,
            "char"
          ],
          "keyup": [
            0,
            "char"
          ]
        },
        "navigation": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "special": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "tab": {
          "keydown": [
            0,
            "char"
          ],
          "keyup": [
            0,
            "char"
          ]
        },
        "pause-break": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "caps": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "escape": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "num-lock": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "scroll-lock": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "print": {
          "keyup": [
            0,
            "key"
          ]
        },
        "function": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "\r": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            "char",
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        }
      },
      gecko: {
        "prevent": {
          "keyup": [],
          "keydown": ["char"],
          "keypress": ["char"]
        },
        "character": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            "char",
            0
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "specialChars": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "navigation": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "special": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "	": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "pause-break": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "caps": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "escape": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "num-lock": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "scroll-lock": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "print": {
          "keyup": [
            0,
            "key"
          ]
        },
        "function": {
          "keydown": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        },
        "\r": {
          "keydown": [
            0,
            "key"
          ],
          "keypress": [
            0,
            "key"
          ],
          "keyup": [
            0,
            "key"
          ]
        }
      },
      msie: {
        "prevent": {
          "keyup": [],
          "keydown": [
            "char",
            "keypress"
          ],
          "keypress": ["char"]
        },
        "character": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "specialChars": {
          "keydown": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "char"
          ]
        },
        "navigation": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "special": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "tab": {
          "keydown": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "char"
          ]
        },
        "pause-break": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "caps": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "escape": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "num-lock": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "scroll-lock": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "print": {
          "keyup": [
            null,
            "key"
          ]
        },
        "function": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "\r": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        }
      },
      opera: {
        "prevent": {
          "keyup": [],
          "keydown": [],
          "keypress": ["char"]
        },
        "character": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "specialChars": {
          "keydown": [
            null,
            "char"
          ],
          "keypress": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "char"
          ]
        },
        "navigation": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ]
        },
        "special": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "tab": {
          "keydown": [
            null,
            "char"
          ],
          "keypress": [
            null,
            "char"
          ],
          "keyup": [
            null,
            "char"
          ]
        },
        "pause-break": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "caps": {
          "keydown": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "escape": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ]
        },
        "num-lock": {
          "keyup": [
            null,
            "key"
          ],
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ]
        },
        "scroll-lock": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "print": {},
        "function": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        },
        "\r": {
          "keydown": [
            null,
            "key"
          ],
          "keypress": [
            null,
            "key"
          ],
          "keyup": [
            null,
            "key"
          ]
        }
      }
    };
    syn2.mouse.browsers = {
      webkit: {
        "right": {
          "mousedown": {
            "button": 2,
            "which": 3
          },
          "mouseup": {
            "button": 2,
            "which": 3
          },
          "contextmenu": {
            "button": 2,
            "which": 3
          }
        },
        "left": {
          "mousedown": {
            "button": 0,
            "which": 1
          },
          "mouseup": {
            "button": 0,
            "which": 1
          },
          "click": {
            "button": 0,
            "which": 1
          }
        }
      },
      opera: {
        "right": {
          "mousedown": {
            "button": 2,
            "which": 3
          },
          "mouseup": {
            "button": 2,
            "which": 3
          }
        },
        "left": {
          "mousedown": {
            "button": 0,
            "which": 1
          },
          "mouseup": {
            "button": 0,
            "which": 1
          },
          "click": {
            "button": 0,
            "which": 1
          }
        }
      },
      msie: {
        "right": {
          "mousedown": { "button": 2 },
          "mouseup": { "button": 2 },
          "contextmenu": { "button": 0 }
        },
        "left": {
          "mousedown": { "button": 1 },
          "mouseup": { "button": 1 },
          "click": { "button": 0 }
        }
      },
      chrome: {
        "right": {
          "mousedown": {
            "button": 2,
            "which": 3
          },
          "mouseup": {
            "button": 2,
            "which": 3
          },
          "contextmenu": {
            "button": 2,
            "which": 3
          }
        },
        "left": {
          "mousedown": {
            "button": 0,
            "which": 1
          },
          "mouseup": {
            "button": 0,
            "which": 1
          },
          "click": {
            "button": 0,
            "which": 1
          }
        }
      },
      gecko: {
        "left": {
          "mousedown": {
            "button": 0,
            "which": 1
          },
          "mouseup": {
            "button": 0,
            "which": 1
          },
          "click": {
            "button": 0,
            "which": 1
          }
        },
        "right": {
          "mousedown": {
            "button": 2,
            "which": 3
          },
          "mouseup": {
            "button": 2,
            "which": 3
          },
          "contextmenu": {
            "button": 2,
            "which": 3
          }
        }
      }
    };
    syn2.key.browser = function() {
      if (syn2.key.browsers[window.navigator.userAgent]) {
        return syn2.key.browsers[window.navigator.userAgent];
      }
      for (var browser in syn2.browser) {
        if (syn2.browser[browser] && syn2.key.browsers[browser]) {
          return syn2.key.browsers[browser];
        }
      }
      return syn2.key.browsers.gecko;
    }();
    syn2.mouse.browser = function() {
      if (syn2.mouse.browsers[window.navigator.userAgent]) {
        return syn2.mouse.browsers[window.navigator.userAgent];
      }
      for (var browser in syn2.browser) {
        if (syn2.browser[browser] && syn2.mouse.browsers[browser]) {
          return syn2.mouse.browsers[browser];
        }
      }
      return syn2.mouse.browsers.gecko;
    }();
  }
});

// node_modules/syn/dist/cjs/typeable.js
var require_typeable = __commonJS({
  "node_modules/syn/dist/cjs/typeable.js"() {
    var syn2 = require_synthetic();
    var typeables = [];
    var __indexOf = [].indexOf || function(item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) {
          return i;
        }
      }
      return -1;
    };
    syn2.typeable = function(fn) {
      if (__indexOf.call(typeables, fn) === -1) {
        typeables.push(fn);
      }
    };
    syn2.typeable.test = function(el) {
      for (var i = 0, len = typeables.length; i < len; i++) {
        if (typeables[i](el)) {
          return true;
        }
      }
      return false;
    };
    var type2 = syn2.typeable;
    var typeableExp = /input|textarea/i;
    type2(function(el) {
      return typeableExp.test(el.nodeName);
    });
    type2(function(el) {
      return __indexOf.call([
        "",
        "true"
      ], el.getAttribute("contenteditable")) !== -1;
    });
  }
});

// node_modules/syn/dist/cjs/key.js
var require_key = __commonJS({
  "node_modules/syn/dist/cjs/key.js"() {
    var syn2 = require_synthetic();
    require_typeable();
    require_browsers();
    var h2 = syn2.helpers;
    var formElExp = /input|textarea/i;
    var supportsSelection = function(el) {
      var result;
      try {
        result = el.selectionStart !== void 0 && el.selectionStart !== null;
      } catch (e) {
        result = false;
      }
      return result;
    };
    var getSelection = function(el) {
      var real, r, start;
      if (supportsSelection(el)) {
        if (document.activeElement && document.activeElement !== el && el.selectionStart === el.selectionEnd && el.selectionStart === 0) {
          return {
            start: el.value.length,
            end: el.value.length
          };
        }
        return {
          start: el.selectionStart,
          end: el.selectionEnd
        };
      } else {
        try {
          if (el.nodeName.toLowerCase() === "input") {
            real = h2.getWindow(el).document.selection.createRange();
            r = el.createTextRange();
            r.setEndPoint("EndToStart", real);
            start = r.text.length;
            return {
              start,
              end: start + real.text.length
            };
          } else {
            real = h2.getWindow(el).document.selection.createRange();
            r = real.duplicate();
            var r2 = real.duplicate(), r3 = real.duplicate();
            r2.collapse();
            r3.collapse(false);
            r2.moveStart("character", -1);
            r3.moveStart("character", -1);
            r.moveToElementText(el);
            r.setEndPoint("EndToEnd", real);
            start = r.text.length - real.text.length;
            var end = r.text.length;
            if (start !== 0 && r2.text === "") {
              start += 2;
            }
            if (end !== 0 && r3.text === "") {
              end += 2;
            }
            return {
              start,
              end
            };
          }
        } catch (e) {
          var prop = formElExp.test(el.nodeName) ? "value" : "textContent";
          return {
            start: el[prop].length,
            end: el[prop].length
          };
        }
      }
    };
    var getFocusable = function(el) {
      var document2 = h2.getWindow(el).document, res = [];
      var els = document2.getElementsByTagName("*"), len = els.length;
      for (var i = 0; i < len; i++) {
        if (syn2.isFocusable(els[i]) && els[i] !== document2.documentElement) {
          res.push(els[i]);
        }
      }
      return res;
    };
    var textProperty = function() {
      var el = document.createElement("span");
      return el.textContent != null ? "textContent" : "innerText";
    }();
    var getText = function(el) {
      if (formElExp.test(el.nodeName)) {
        return el.value;
      }
      return el[textProperty];
    };
    var setText = function(el, value) {
      if (formElExp.test(el.nodeName)) {
        el.value = value;
      } else {
        el[textProperty] = value;
      }
    };
    h2.extend(syn2, {
      keycodes: {
        "\b": 8,
        "	": 9,
        "\r": 13,
        "shift": 16,
        "ctrl": 17,
        "alt": 18,
        "meta": 91,
        "pause-break": 19,
        "caps": 20,
        "escape": 27,
        "num-lock": 144,
        "scroll-lock": 145,
        "print": 44,
        "page-up": 33,
        "page-down": 34,
        "end": 35,
        "home": 36,
        "left": 37,
        "up": 38,
        "right": 39,
        "down": 40,
        "insert": 45,
        "delete": 46,
        " ": 32,
        "0": 48,
        "1": 49,
        "2": 50,
        "3": 51,
        "4": 52,
        "5": 53,
        "6": 54,
        "7": 55,
        "8": 56,
        "9": 57,
        "a": 65,
        "b": 66,
        "c": 67,
        "d": 68,
        "e": 69,
        "f": 70,
        "g": 71,
        "h": 72,
        "i": 73,
        "j": 74,
        "k": 75,
        "l": 76,
        "m": 77,
        "n": 78,
        "o": 79,
        "p": 80,
        "q": 81,
        "r": 82,
        "s": 83,
        "t": 84,
        "u": 85,
        "v": 86,
        "w": 87,
        "x": 88,
        "y": 89,
        "z": 90,
        "num0": 96,
        "num1": 97,
        "num2": 98,
        "num3": 99,
        "num4": 100,
        "num5": 101,
        "num6": 102,
        "num7": 103,
        "num8": 104,
        "num9": 105,
        "*": 106,
        "+": 107,
        "subtract": 109,
        "decimal": 110,
        "divide": 111,
        ";": 186,
        "=": 187,
        ",": 188,
        "dash": 189,
        "-": 189,
        "period": 190,
        ".": 190,
        "forward-slash": 191,
        "/": 191,
        "`": 192,
        "[": 219,
        "\\": 220,
        "]": 221,
        "'": 222,
        "left window key": 91,
        "right window key": 92,
        "select key": 93,
        "f1": 112,
        "f2": 113,
        "f3": 114,
        "f4": 115,
        "f5": 116,
        "f6": 117,
        "f7": 118,
        "f8": 119,
        "f9": 120,
        "f10": 121,
        "f11": 122,
        "f12": 123
      },
      selectText: function(el, start, end) {
        if (supportsSelection(el)) {
          if (!end) {
            syn2.__tryFocus(el);
            el.setSelectionRange(start, start);
          } else {
            el.selectionStart = start;
            el.selectionEnd = end;
          }
        } else if (el.createTextRange) {
          var r = el.createTextRange();
          r.moveStart("character", start);
          end = end || start;
          r.moveEnd("character", end - el.value.length);
          r.select();
        }
      },
      getText: function(el) {
        if (syn2.typeable.test(el)) {
          var sel = getSelection(el);
          return el.value.substring(sel.start, sel.end);
        }
        var win = syn2.helpers.getWindow(el);
        if (win.getSelection) {
          return win.getSelection().toString();
        } else if (win.document.getSelection) {
          return win.document.getSelection().toString();
        } else {
          return win.document.selection.createRange().text;
        }
      },
      getSelection
    });
    h2.extend(syn2.key, {
      data: function(key) {
        if (syn2.key.browser[key]) {
          return syn2.key.browser[key];
        }
        for (var kind in syn2.key.kinds) {
          if (h2.inArray(key, syn2.key.kinds[kind]) > -1) {
            return syn2.key.browser[kind];
          }
        }
        return syn2.key.browser.character;
      },
      isSpecial: function(keyCode) {
        var specials = syn2.key.kinds.special;
        for (var i = 0; i < specials.length; i++) {
          if (syn2.keycodes[specials[i]] === keyCode) {
            return specials[i];
          }
        }
      },
      options: function(key, event) {
        var keyData = syn2.key.data(key);
        if (!keyData[event]) {
          return null;
        }
        var charCode = keyData[event][0], keyCode = keyData[event][1], result = { key };
        if (keyCode === "key") {
          result.keyCode = syn2.keycodes[key];
        } else if (keyCode === "char") {
          result.keyCode = key.charCodeAt(0);
        } else {
          result.keyCode = keyCode;
        }
        if (charCode === "char") {
          result.charCode = key.charCodeAt(0);
        } else if (charCode !== null) {
          result.charCode = charCode;
        }
        if (result.keyCode) {
          result.which = result.keyCode;
        } else {
          result.which = result.charCode;
        }
        return result;
      },
      kinds: {
        special: [
          "shift",
          "ctrl",
          "alt",
          "meta",
          "caps"
        ],
        specialChars: ["\b"],
        navigation: [
          "page-up",
          "page-down",
          "end",
          "home",
          "left",
          "up",
          "right",
          "down",
          "insert",
          "delete"
        ],
        "function": [
          "f1",
          "f2",
          "f3",
          "f4",
          "f5",
          "f6",
          "f7",
          "f8",
          "f9",
          "f10",
          "f11",
          "f12"
        ]
      },
      getDefault: function(key) {
        if (syn2.key.defaults[key]) {
          return syn2.key.defaults[key];
        }
        for (var kind in syn2.key.kinds) {
          if (h2.inArray(key, syn2.key.kinds[kind]) > -1 && syn2.key.defaults[kind]) {
            return syn2.key.defaults[kind];
          }
        }
        return syn2.key.defaults.character;
      },
      defaults: {
        "character": function(options, scope2, key, force, sel) {
          if (/num\d+/.test(key)) {
            key = key.match(/\d+/)[0];
          }
          if (force || !syn2.support.keyCharacters && syn2.typeable.test(this)) {
            var current = getText(this), before = current.substr(0, sel.start), after = current.substr(sel.end), character = key;
            setText(this, before + character + after);
            var charLength = character === "\n" && syn2.support.textareaCarriage ? 2 : character.length;
            syn2.selectText(this, before.length + charLength);
          }
        },
        "c": function(options, scope2, key, force, sel) {
          if (syn2.key.ctrlKey) {
            syn2.key.clipboard = syn2.getText(this);
          } else {
            syn2.key.defaults.character.apply(this, arguments);
          }
        },
        "v": function(options, scope2, key, force, sel) {
          if (syn2.key.ctrlKey) {
            syn2.key.defaults.character.call(this, options, scope2, syn2.key.clipboard, true, sel);
          } else {
            syn2.key.defaults.character.apply(this, arguments);
          }
        },
        "a": function(options, scope2, key, force, sel) {
          if (syn2.key.ctrlKey) {
            syn2.selectText(this, 0, getText(this).length);
          } else {
            syn2.key.defaults.character.apply(this, arguments);
          }
        },
        "home": function() {
          syn2.onParents(this, function(el) {
            if (el.scrollHeight !== el.clientHeight) {
              el.scrollTop = 0;
              return false;
            }
          });
        },
        "end": function() {
          syn2.onParents(this, function(el) {
            if (el.scrollHeight !== el.clientHeight) {
              el.scrollTop = el.scrollHeight;
              return false;
            }
          });
        },
        "page-down": function() {
          syn2.onParents(this, function(el) {
            if (el.scrollHeight !== el.clientHeight) {
              var ch = el.clientHeight;
              el.scrollTop += ch;
              return false;
            }
          });
        },
        "page-up": function() {
          syn2.onParents(this, function(el) {
            if (el.scrollHeight !== el.clientHeight) {
              var ch = el.clientHeight;
              el.scrollTop -= ch;
              return false;
            }
          });
        },
        "\b": function(options, scope2, key, force, sel) {
          if (!syn2.support.backspaceWorks && syn2.typeable.test(this)) {
            var current = getText(this), before = current.substr(0, sel.start), after = current.substr(sel.end);
            if (sel.start === sel.end && sel.start > 0) {
              setText(this, before.substring(0, before.length - 1) + after);
              syn2.selectText(this, sel.start - 1);
            } else {
              setText(this, before + after);
              syn2.selectText(this, sel.start);
            }
          }
        },
        "delete": function(options, scope2, key, force, sel) {
          if (!syn2.support.backspaceWorks && syn2.typeable.test(this)) {
            var current = getText(this), before = current.substr(0, sel.start), after = current.substr(sel.end);
            if (sel.start === sel.end && sel.start <= getText(this).length - 1) {
              setText(this, before + after.substring(1));
            } else {
              setText(this, before + after);
            }
            syn2.selectText(this, sel.start);
          }
        },
        "\r": function(options, scope2, key, force, sel) {
          var nodeName2 = this.nodeName.toLowerCase();
          if (nodeName2 === "input") {
            syn2.trigger(this, "change", {});
          }
          if (!syn2.support.keypressSubmits && nodeName2 === "input") {
            var form2 = syn2.closest(this, "form");
            if (form2) {
              syn2.trigger(form2, "submit", {});
            }
          }
          if (!syn2.support.keyCharacters && nodeName2 === "textarea") {
            syn2.key.defaults.character.call(this, options, scope2, "\n", void 0, sel);
          }
          if (!syn2.support.keypressOnAnchorClicks && nodeName2 === "a") {
            syn2.trigger(this, "click", {});
          }
        },
        "	": function(options, scope2) {
          var focusEls = getFocusable(this), current = null, i = 0, el, firstNotIndexed, orders = [];
          for (; i < focusEls.length; i++) {
            orders.push([
              focusEls[i],
              i
            ]);
          }
          var sort = function(order1, order2) {
            var el1 = order1[0], el2 = order2[0], tab1 = syn2.tabIndex(el1) || 0, tab2 = syn2.tabIndex(el2) || 0;
            if (tab1 === tab2) {
              return order1[1] - order2[1];
            } else {
              if (tab1 === 0) {
                return 1;
              } else if (tab2 === 0) {
                return -1;
              } else {
                return tab1 - tab2;
              }
            }
          };
          orders.sort(sort);
          var ordersLength = orders.length;
          for (i = 0; i < ordersLength; i++) {
            el = orders[i][0];
            if (this === el) {
              var nextIndex = i;
              if (syn2.key.shiftKey) {
                nextIndex--;
                current = nextIndex >= 0 && orders[nextIndex][0] || orders[ordersLength - 1][0];
              } else {
                nextIndex++;
                current = nextIndex < ordersLength && orders[nextIndex][0] || orders[0][0];
              }
            }
          }
          if (!current) {
            current = firstNotIndexed;
          } else {
            syn2.__tryFocus(current);
          }
          return current;
        },
        "left": function(options, scope2, key, force, sel) {
          if (syn2.typeable.test(this)) {
            if (syn2.key.shiftKey) {
              syn2.selectText(this, sel.start === 0 ? 0 : sel.start - 1, sel.end);
            } else {
              syn2.selectText(this, sel.start === 0 ? 0 : sel.start - 1);
            }
          }
        },
        "right": function(options, scope2, key, force, sel) {
          if (syn2.typeable.test(this)) {
            if (syn2.key.shiftKey) {
              syn2.selectText(this, sel.start, sel.end + 1 > getText(this).length ? getText(this).length : sel.end + 1);
            } else {
              syn2.selectText(this, sel.end + 1 > getText(this).length ? getText(this).length : sel.end + 1);
            }
          }
        },
        "up": function() {
          if (/select/i.test(this.nodeName)) {
            this.selectedIndex = this.selectedIndex ? this.selectedIndex - 1 : 0;
          }
        },
        "down": function() {
          if (/select/i.test(this.nodeName)) {
            syn2.changeOnBlur(this, "selectedIndex", this.selectedIndex);
            this.selectedIndex = this.selectedIndex + 1;
          }
        },
        "shift": function() {
          return null;
        },
        "ctrl": function() {
          return null;
        },
        "alt": function() {
          return null;
        },
        "meta": function() {
          return null;
        }
      }
    });
    h2.extend(syn2.create, {
      keydown: {
        setup: function(type2, options, element2) {
          if (h2.inArray(options, syn2.key.kinds.special) !== -1) {
            syn2.key[options + "Key"] = element2;
          }
        }
      },
      keypress: {
        setup: function(type2, options, element2) {
          if (syn2.support.keyCharacters && !syn2.support.keysOnNotFocused) {
            syn2.__tryFocus(element2);
          }
        }
      },
      keyup: {
        setup: function(type2, options, element2) {
          if (h2.inArray(options, syn2.key.kinds.special) !== -1) {
            syn2.key[options + "Key"] = null;
          }
        }
      },
      key: {
        options: function(type2, options, element2) {
          options = typeof options !== "object" ? { character: options } : options;
          options = h2.extend({}, options);
          if (options.character) {
            h2.extend(options, syn2.key.options(options.character, type2));
            delete options.character;
          }
          options = h2.extend({
            ctrlKey: !!syn2.key.ctrlKey,
            altKey: !!syn2.key.altKey,
            shiftKey: !!syn2.key.shiftKey,
            metaKey: !!syn2.key.metaKey
          }, options);
          return options;
        },
        event: function(type2, options, element2) {
          var doc = h2.getWindow(element2).document || document, event;
          if (typeof KeyboardEvent !== "undefined") {
            var keyboardEventKeys = syn2.key.keyboardEventKeys;
            if (options.key && keyboardEventKeys[options.key]) {
              options.key = keyboardEventKeys[options.key];
            }
            event = new KeyboardEvent(type2, options);
            event.synthetic = true;
            return event;
          } else if (doc.createEvent) {
            try {
              event = doc.createEvent("KeyEvents");
              event.initKeyEvent(type2, true, true, window, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.keyCode, options.charCode);
            } catch (e) {
              event = h2.createBasicStandardEvent(type2, options, doc);
            }
            event.synthetic = true;
            return event;
          } else {
            try {
              event = h2.createEventObject.apply(this, arguments);
              h2.extend(event, options);
            } catch (e) {
            }
            return event;
          }
        }
      }
    });
    var convert = {
      "enter": "\r",
      "backspace": "\b",
      "tab": "	",
      "space": " "
    };
    h2.extend(syn2.init.prototype, {
      _key: function(element2, options, callback) {
        if (/-up$/.test(options) && h2.inArray(options.replace("-up", ""), syn2.key.kinds.special) !== -1) {
          syn2.trigger(element2, "keyup", options.replace("-up", ""));
          return callback(true, element2);
        }
        var activeElement = h2.getWindow(element2).document.activeElement, caret = syn2.typeable.test(element2) && getSelection(element2), key = convert[options] || options, runDefaults = syn2.trigger(element2, "keydown", key), getDefault = syn2.key.getDefault, prevent = syn2.key.browser.prevent, defaultResult, keypressOptions = syn2.key.options(key, "keypress");
        if (runDefaults) {
          if (!keypressOptions) {
            defaultResult = getDefault(key).call(element2, keypressOptions, h2.getWindow(element2), key, void 0, caret);
          } else {
            if (activeElement !== h2.getWindow(element2).document.activeElement) {
              element2 = h2.getWindow(element2).document.activeElement;
            }
            runDefaults = syn2.trigger(element2, "keypress", keypressOptions);
            if (runDefaults) {
              defaultResult = getDefault(key).call(element2, keypressOptions, h2.getWindow(element2), key, void 0, caret);
            }
          }
        } else {
          if (keypressOptions && h2.inArray("keypress", prevent.keydown) === -1) {
            if (activeElement !== h2.getWindow(element2).document.activeElement) {
              element2 = h2.getWindow(element2).document.activeElement;
            }
            syn2.trigger(element2, "keypress", keypressOptions);
          }
        }
        if (defaultResult && defaultResult.nodeName) {
          element2 = defaultResult;
        }
        if (defaultResult !== null) {
          syn2.schedule(function() {
            if (key === "\r" && element2.nodeName.toLowerCase() === "input") {
            } else if (syn2.support.oninput) {
              syn2.trigger(element2, "input", syn2.key.options(key, "input"));
            }
            syn2.trigger(element2, "keyup", syn2.key.options(key, "keyup"));
            callback(runDefaults, element2);
          }, 1);
        } else {
          callback(runDefaults, element2);
        }
        return element2;
      },
      _type: function(element2, options, callback) {
        var parts = (options + "").match(/(\[[^\]]+\])|([^\[])/g), self = this, runNextPart = function(runDefaults, el) {
          var part = parts.shift();
          if (!part) {
            callback(runDefaults, el);
            return;
          }
          el = el || element2;
          if (part.length > 1) {
            part = part.substr(1, part.length - 2);
          }
          self._key(el, part, runNextPart);
        };
        runNextPart();
      }
    });
  }
});

// node_modules/syn/dist/cjs/key.support.js
var require_key_support = __commonJS({
  "node_modules/syn/dist/cjs/key.support.js"() {
    var syn2 = require_synthetic();
    require_key();
    if (!syn2.config.support) {
      (function checkForSupport() {
        if (!document.body) {
          return syn2.schedule(checkForSupport, 1);
        }
        var div = document.createElement("div"), checkbox, submit, form2, anchor, textarea, inputter, one, doc;
        doc = document.documentElement;
        div.innerHTML = "<form id='outer'><input name='checkbox' type='checkbox'/><input name='radio' type='radio' /><input type='submit' name='submitter'/><input type='input' name='inputter'/><input name='one'><input name='two'/><a href='#abc'></a><textarea>1\n2</textarea></form>";
        doc.insertBefore(div, doc.firstElementChild || doc.children[0]);
        form2 = div.firstChild;
        checkbox = form2.childNodes[0];
        submit = form2.childNodes[2];
        anchor = form2.getElementsByTagName("a")[0];
        textarea = form2.getElementsByTagName("textarea")[0];
        inputter = form2.childNodes[3];
        one = form2.childNodes[4];
        form2.onsubmit = function(ev) {
          if (ev.preventDefault) {
            ev.preventDefault();
          }
          syn2.support.keypressSubmits = true;
          ev.returnValue = false;
          return false;
        };
        syn2.__tryFocus(inputter);
        syn2.trigger(inputter, "keypress", "\r");
        syn2.trigger(inputter, "keypress", "a");
        syn2.support.keyCharacters = inputter.value === "a";
        inputter.value = "a";
        syn2.trigger(inputter, "keypress", "\b");
        syn2.support.backspaceWorks = inputter.value === "";
        inputter.onchange = function() {
          syn2.support.focusChanges = true;
        };
        syn2.__tryFocus(inputter);
        syn2.trigger(inputter, "keypress", "a");
        syn2.__tryFocus(form2.childNodes[5]);
        syn2.trigger(inputter, "keypress", "b");
        syn2.support.keysOnNotFocused = inputter.value === "ab";
        syn2.bind(anchor, "click", function(ev) {
          if (ev.preventDefault) {
            ev.preventDefault();
          }
          syn2.support.keypressOnAnchorClicks = true;
          ev.returnValue = false;
          return false;
        });
        syn2.trigger(anchor, "keypress", "\r");
        syn2.support.textareaCarriage = textarea.value.length === 4;
        syn2.support.oninput = "oninput" in one;
        doc.removeChild(div);
        syn2.support.ready++;
      })();
    } else {
      syn2.helpers.extend(syn2.support, syn2.config.support);
    }
  }
});

// node_modules/syn/dist/cjs/drag.js
var require_drag = __commonJS({
  "node_modules/syn/dist/cjs/drag.js"() {
    var syn2 = require_synthetic();
    var elementFromPoint = function(point, win) {
      var clientX = point.clientX;
      var clientY = point.clientY;
      if (point == null) {
        return null;
      }
      if (syn2.support.elementFromPage) {
        var off = syn2.helpers.scrollOffset(win);
        clientX = clientX + off.left;
        clientY = clientY + off.top;
      }
      return win.document.elementFromPoint(Math.round(clientX), Math.round(clientY));
    };
    var DragonDrop = {
      html5drag: false,
      focusWindow: null,
      dragAndDrop: function(focusWindow, fromPoint, toPoint, duration, callback) {
        this.currentDataTransferItem = null;
        this.focusWindow = focusWindow;
        this._mouseOver(fromPoint);
        this._mouseEnter(fromPoint);
        this._mouseMove(fromPoint);
        this._mouseDown(fromPoint);
        this._dragStart(fromPoint);
        this._drag(fromPoint);
        this._dragEnter(fromPoint);
        this._dragOver(fromPoint);
        DragonDrop.startMove(fromPoint, toPoint, duration, function() {
          DragonDrop._dragLeave(fromPoint);
          DragonDrop._dragEnd(fromPoint);
          DragonDrop._mouseOut(fromPoint);
          DragonDrop._mouseLeave(fromPoint);
          DragonDrop._drop(toPoint);
          DragonDrop._dragEnd(toPoint);
          DragonDrop._mouseOver(toPoint);
          DragonDrop._mouseEnter(toPoint);
          DragonDrop._mouseMove(toPoint);
          DragonDrop._mouseOut(toPoint);
          DragonDrop._mouseLeave(toPoint);
          callback();
          DragonDrop.cleanup();
        });
      },
      _dragStart: function(node) {
        var options = {
          bubbles: false,
          cancelable: false
        };
        this.createAndDispatchEvent(node, "dragstart", options);
      },
      _drag: function(node) {
        var options = {
          bubbles: true,
          cancelable: true
        };
        this.createAndDispatchEvent(node, "drag", options);
      },
      _dragEnter: function(node) {
        var options = {
          bubbles: true,
          cancelable: true
        };
        this.createAndDispatchEvent(node, "dragenter", options);
      },
      _dragOver: function(node) {
        var options = {
          bubbles: true,
          cancelable: true
        };
        this.createAndDispatchEvent(node, "dragover", options);
      },
      _dragLeave: function(node) {
        var options = {
          bubbles: true,
          cancelable: false
        };
        this.createAndDispatchEvent(node, "dragleave", options);
      },
      _drop: function(node) {
        var options = {
          bubbles: true,
          cancelable: true,
          buttons: 1
        };
        this.createAndDispatchEvent(node, "drop", options);
      },
      _dragEnd: function(node) {
        var options = {
          bubbles: true,
          cancelable: false
        };
        this.createAndDispatchEvent(node, "dragend", options);
      },
      _mouseDown: function(node, options) {
        this.createAndDispatchEvent(node, "mousedown", options);
      },
      _mouseMove: function(node, options) {
        this.createAndDispatchEvent(node, "mousemove", options);
      },
      _mouseEnter: function(node, options) {
        this.createAndDispatchEvent(node, "mouseenter", options);
      },
      _mouseOver: function(node, options) {
        this.createAndDispatchEvent(node, "mouseover", options);
      },
      _mouseOut: function(node, options) {
        this.createAndDispatchEvent(node, "mouseout", options);
      },
      _mouseLeave: function(node, options) {
        this.createAndDispatchEvent(node, "mouseleave", options);
      },
      createAndDispatchEvent: function(point, eventName, options) {
        if (point) {
          var targetElement = elementFromPoint(point, this.focusWindow);
          syn2.trigger(targetElement, eventName, options);
        }
      },
      getDataTransferObject: function() {
        if (!this.currentDataTransferItem) {
          return this.currentDataTransferItem = this.createDataTransferObject();
        } else {
          return this.currentDataTransferItem;
        }
      },
      cleanup: function() {
        this.currentDataTransferItem = null;
        this.focusWindow = null;
      },
      createDataTransferObject: function() {
        var dataTransfer = {
          dropEffect: "none",
          effectAllowed: "uninitialized",
          files: [],
          items: [],
          types: [],
          data: [],
          setData: function(dataFlavor, value) {
            var tempdata = {};
            tempdata.dataFlavor = dataFlavor;
            tempdata.val = value;
            this.data.push(tempdata);
          },
          getData: function(dataFlavor) {
            for (var i = 0; i < this.data.length; i++) {
              var tempdata = this.data[i];
              if (tempdata.dataFlavor === dataFlavor) {
                return tempdata.val;
              }
            }
          }
        };
        return dataTransfer;
      },
      startMove: function(start, end, duration, callback) {
        var startTime = /* @__PURE__ */ new Date();
        var distX = end.clientX - start.clientX;
        var distY = end.clientY - start.clientY;
        var win = this.focusWindow;
        var current = start;
        var cursor = win.document.createElement("div");
        var calls = 0;
        var move;
        move = function onmove() {
          var now = /* @__PURE__ */ new Date();
          var scrollOffset = syn2.helpers.scrollOffset(win);
          var fraction = (calls === 0 ? 0 : now - startTime) / duration;
          var options = {
            clientX: distX * fraction + start.clientX,
            clientY: distY * fraction + start.clientY
          };
          calls++;
          if (fraction < 1) {
            syn2.helpers.extend(cursor.style, {
              left: options.clientX + scrollOffset.left + 2 + "px",
              top: options.clientY + scrollOffset.top + 2 + "px"
            });
            current = DragonDrop.mouseMove(options, current);
            syn2.schedule(onmove, 15);
          } else {
            current = DragonDrop.mouseMove(end, current);
            win.document.body.removeChild(cursor);
            callback();
          }
        };
        syn2.helpers.extend(cursor.style, {
          height: "5px",
          width: "5px",
          backgroundColor: "red",
          position: "absolute",
          zIndex: 19999,
          fontSize: "1px"
        });
        win.document.body.appendChild(cursor);
        move();
      },
      mouseMove: function(thisPoint, previousPoint) {
        var thisElement = elementFromPoint(thisPoint, this.focusWindow);
        var previousElement = elementFromPoint(previousPoint, this.focusWindow);
        var options = syn2.helpers.extend({}, thisPoint);
        if (thisElement !== previousElement) {
          options.relatedTarget = thisElement;
          this._dragLeave(previousPoint, options);
          options.relatedTarget = previousElement;
          this._dragEnter(thisPoint, options);
        }
        this._dragOver(thisPoint, options);
        return thisPoint;
      }
    };
    function createDragEvent(eventName, options, element2) {
      var dragEvent = syn2.create.mouse.event(eventName, options, element2);
      dragEvent.dataTransfer = DragonDrop.getDataTransferObject();
      return syn2.dispatch(dragEvent, element2, eventName, false);
    }
    syn2.create.dragstart = { event: createDragEvent };
    syn2.create.dragenter = { event: createDragEvent };
    syn2.create.dragover = { event: createDragEvent };
    syn2.create.dragleave = { event: createDragEvent };
    syn2.create.drag = { event: createDragEvent };
    syn2.create.drop = { event: createDragEvent };
    syn2.create.dragend = { event: createDragEvent };
    (function dragSupport() {
      if (!document.body) {
        syn2.schedule(dragSupport, 1);
        return;
      }
      var div = document.createElement("div");
      document.body.appendChild(div);
      syn2.helpers.extend(div.style, {
        width: "100px",
        height: "10000px",
        backgroundColor: "blue",
        position: "absolute",
        top: "10px",
        left: "0px",
        zIndex: 19999
      });
      document.body.scrollTop = 11;
      if (!document.elementFromPoint) {
        return;
      }
      var el = document.elementFromPoint(3, 1);
      if (el === div) {
        syn2.support.elementFromClient = true;
      } else {
        syn2.support.elementFromPage = true;
      }
      document.body.removeChild(div);
      document.body.scrollTop = 0;
    })();
    var mouseMove = function(point, win, last) {
      var el = elementFromPoint(point, win);
      if (last !== el && el && last) {
        var options = syn2.helpers.extend({}, point);
        options.relatedTarget = el;
        if (syn2.support.pointerEvents) {
          syn2.trigger(last, "pointerout", options);
          syn2.trigger(last, "pointerleave", options);
        }
        syn2.trigger(last, "mouseout", options);
        syn2.trigger(last, "mouseleave", options);
        options.relatedTarget = last;
        if (syn2.support.pointerEvents) {
          syn2.trigger(el, "pointerover", options);
          syn2.trigger(el, "pointerenter", options);
        }
        syn2.trigger(el, "mouseover", options);
        syn2.trigger(el, "mouseenter", options);
      }
      if (syn2.support.pointerEvents) {
        syn2.trigger(el || win, "pointermove", point);
      }
      if (syn2.support.touchEvents) {
        syn2.trigger(el || win, "touchmove", point);
      }
      if (DragonDrop.html5drag) {
        if (!syn2.support.pointerEvents) {
          syn2.trigger(el || win, "mousemove", point);
        }
      } else {
        syn2.trigger(el || win, "mousemove", point);
      }
      return el;
    };
    var createEventAtPoint = function(event, point, win) {
      var el = elementFromPoint(point, win);
      syn2.trigger(el || win, event, point);
      return el;
    };
    var startMove = function(win, start, end, duration, callback) {
      var startTime = /* @__PURE__ */ new Date(), distX = end.clientX - start.clientX, distY = end.clientY - start.clientY, current = elementFromPoint(start, win), cursor = win.document.createElement("div"), calls = 0, move;
      move = function onmove() {
        var now = /* @__PURE__ */ new Date(), scrollOffset = syn2.helpers.scrollOffset(win), fraction = (calls === 0 ? 0 : now - startTime) / duration, options = {
          clientX: distX * fraction + start.clientX,
          clientY: distY * fraction + start.clientY
        };
        calls++;
        if (fraction < 1) {
          syn2.helpers.extend(cursor.style, {
            left: options.clientX + scrollOffset.left + 2 + "px",
            top: options.clientY + scrollOffset.top + 2 + "px"
          });
          current = mouseMove(options, win, current);
          syn2.schedule(onmove, 15);
        } else {
          current = mouseMove(end, win, current);
          win.document.body.removeChild(cursor);
          callback();
        }
      };
      syn2.helpers.extend(cursor.style, {
        height: "5px",
        width: "5px",
        backgroundColor: "red",
        position: "absolute",
        zIndex: 19999,
        fontSize: "1px"
      });
      win.document.body.appendChild(cursor);
      move();
    };
    var startDrag = function(win, fromPoint, toPoint, duration, callback) {
      if (syn2.support.pointerEvents) {
        createEventAtPoint("pointerover", fromPoint, win);
        createEventAtPoint("pointerenter", fromPoint, win);
      }
      createEventAtPoint("mouseover", fromPoint, win);
      createEventAtPoint("mouseenter", fromPoint, win);
      if (syn2.support.pointerEvents) {
        createEventAtPoint("pointermove", fromPoint, win);
      }
      createEventAtPoint("mousemove", fromPoint, win);
      if (syn2.support.pointerEvents) {
        createEventAtPoint("pointerdown", fromPoint, win);
      }
      if (syn2.support.touchEvents) {
        createEventAtPoint("touchstart", fromPoint, win);
      }
      createEventAtPoint("mousedown", fromPoint, win);
      startMove(win, fromPoint, toPoint, duration, function() {
        if (syn2.support.pointerEvents) {
          createEventAtPoint("pointerup", toPoint, win);
        }
        if (syn2.support.touchEvents) {
          createEventAtPoint("touchend", toPoint, win);
        }
        createEventAtPoint("mouseup", toPoint, win);
        if (syn2.support.pointerEvents) {
          createEventAtPoint("pointerleave", toPoint, win);
        }
        createEventAtPoint("mouseleave", toPoint, win);
        callback();
      });
    };
    var center = function(el) {
      var j = syn2.jquery()(el), o = j.offset();
      return {
        pageX: o.left + j.outerWidth() / 2,
        pageY: o.top + j.outerHeight() / 2
      };
    };
    var convertOption = function(option, win, from) {
      var page = /(\d+)[x ](\d+)/, client = /(\d+)X(\d+)/, relative = /([+-]\d+)[xX ]([+-]\d+)/, parts;
      if (typeof option === "string" && relative.test(option) && from) {
        var cent = center(from);
        parts = option.match(relative);
        option = {
          pageX: cent.pageX + parseInt(parts[1]),
          pageY: cent.pageY + parseInt(parts[2])
        };
      }
      if (typeof option === "string" && page.test(option)) {
        parts = option.match(page);
        option = {
          pageX: parseInt(parts[1]),
          pageY: parseInt(parts[2])
        };
      }
      if (typeof option === "string" && client.test(option)) {
        parts = option.match(client);
        option = {
          clientX: parseInt(parts[1]),
          clientY: parseInt(parts[2])
        };
      }
      if (typeof option === "string") {
        option = syn2.jquery()(option, win.document)[0];
      }
      if (option.nodeName) {
        option = center(option);
      }
      if (option.pageX != null) {
        var off = syn2.helpers.scrollOffset(win);
        option = {
          clientX: option.pageX - off.left,
          clientY: option.pageY - off.top
        };
      }
      return option;
    };
    var adjust = function(from, to, win) {
      if (from.clientY < 0) {
        var off = syn2.helpers.scrollOffset(win);
        var top = off.top + from.clientY - 100, diff = top - off.top;
        if (top > 0) {
        } else {
          top = 0;
          diff = -off.top;
        }
        from.clientY = from.clientY - diff;
        to.clientY = to.clientY - diff;
        syn2.helpers.scrollOffset(win, {
          top,
          left: off.left
        });
      }
    };
    syn2.helpers.extend(syn2.init.prototype, {
      _move: function(from, options, callback) {
        var win = syn2.helpers.getWindow(from);
        var sourceCoordinates = convertOption(options.from || from, win, from);
        var destinationCoordinates = convertOption(options.to || options, win, from);
        DragonDrop.html5drag = syn2.support.pointerEvents;
        if (options.adjust !== false) {
          adjust(sourceCoordinates, destinationCoordinates, win);
        }
        startMove(win, sourceCoordinates, destinationCoordinates, options.duration || 500, callback);
      },
      _drag: function(from, options, callback) {
        var win = syn2.helpers.getWindow(from);
        var sourceCoordinates = convertOption(options.from || from, win, from);
        var destinationCoordinates = convertOption(options.to || options, win, from);
        if (options.adjust !== false) {
          adjust(sourceCoordinates, destinationCoordinates, win);
        }
        DragonDrop.html5drag = from.draggable;
        if (DragonDrop.html5drag) {
          DragonDrop.dragAndDrop(win, sourceCoordinates, destinationCoordinates, options.duration || 500, callback);
        } else {
          startDrag(win, sourceCoordinates, destinationCoordinates, options.duration || 500, callback);
        }
      }
    });
  }
});

// node_modules/syn/dist/cjs/syn.js
var require_syn = __commonJS({
  "node_modules/syn/dist/cjs/syn.js"(exports2, module2) {
    var syn2 = require_synthetic();
    require_keyboard_event_keys();
    require_mouse_support();
    require_browsers();
    require_key_support();
    require_drag();
    window.syn = syn2;
    module2.exports = syn2;
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);

// src/features/tests/index.ts
var vscode = __toESM(require("vscode"));
var import_syn = __toESM(require_syn());
function findTests(document2) {
  const fileText = document2.getText();
  const sourceFile = (0, import_syn.parse_file)(fileText);
  const tests = [];
  function visitTestFn(item) {
    const isTest = item.attrs && item.attrs.some((attr) => {
      const attrPath = attr.path.segments.map((segment) => segment.ident.name).join("::");
      return attrPath === "test" || attrPath === "tokio::test";
    });
    if (isTest) {
      const fnName = item.ident.name;
      const start = document2.positionAt(item.span.start);
      const end = document2.positionAt(item.span.end);
      const range = new vscode.Range(start, end);
      tests.push({ name: fnName, range });
    }
  }
  sourceFile.items.forEach(visitTestFn);
  return tests;
}
var TestCodeLensProvider = class {
  provideCodeLenses(document2) {
    const codeLenses = [];
    const tests = findTests(document2);
    for (const test of tests) {
      const runTestCommand = {
        title: "Run Test",
        command: "extension.bun.runTest",
        arguments: [document2.fileName, test.name]
      };
      const watchTestCommand = {
        title: "Watch Test",
        command: "extension.bun.watchTest",
        arguments: [document2.fileName, test.name]
      };
      const runReleaseTestCommand = {
        title: "Run Release Test",
        command: "extension.bun.runReleaseTest",
        arguments: [document2.fileName, test.name]
      };
      const watchReleaseTestCommand = {
        title: "Watch Release Test",
        command: "extension.bun.watchReleaseTest",
        arguments: [document2.fileName, test.name]
      };
      codeLenses.push(new vscode.CodeLens(test.range, runTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, watchTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, runReleaseTestCommand));
      codeLenses.push(new vscode.CodeLens(test.range, watchReleaseTestCommand));
    }
    return codeLenses;
  }
};
var DEFAULT_FILE_PATTERN = "**/*.{spec,test}.{js,jsx,ts,tsx}";
function registerTestCodeLens(context) {
  const codeLensProvider = new TestCodeLensProvider();
  const pattern = vscode.workspace.getConfiguration("bun.test").get("filePattern", DEFAULT_FILE_PATTERN);
  const options = { scheme: "file", pattern };
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "javascript" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "typescript" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "javascriptreact" },
      codeLensProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { ...options, language: "typescriptreact" },
      codeLensProvider
    )
  );
}
var activeTerminal = null;
function registerTestRunner(context) {
  const runTestCommand = vscode.commands.registerCommand(
    "extension.bun.runTest",
    async (fileName, testName, watchMode = false) => {
      const customFlag = vscode.workspace.getConfiguration("bun.test").get("customFlag", "").trim();
      const customScriptSetting = vscode.workspace.getConfiguration("bun.test").get("customScript", "bun test").trim();
      const customScript = customScriptSetting.length ? customScriptSetting : "bun test";
      if (!fileName) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          fileName = editor.document.fileName;
        }
      }
      if (activeTerminal) {
        activeTerminal.dispose();
        activeTerminal = null;
      }
      activeTerminal = vscode.window.createTerminal("Bun Test Runner");
      activeTerminal.show();
      let command = customScript;
      if (fileName.length) {
        command += ` ${fileName}`;
      }
      if (testName.length) {
        if (customScriptSetting.length) {
          command += ` -t \\"${testName}\\"`;
        } else {
          command += ` -t "${testName}"`;
        }
      }
      if (watchMode) {
        command += ` --watch`;
      }
      if (customFlag.length) {
        command += ` ${customFlag}`;
      }
      activeTerminal.sendText(command);
    }
  );
  const watchTestCommand = vscode.commands.registerCommand(
    "extension.bun.watchTest",
    async (fileName, testName) => {
      vscode.commands.executeCommand(
        "extension.bun.runTest",
        fileName,
        testName,
        true
      );
    }
  );
  context.subscriptions.push(runTestCommand);
  context.subscriptions.push(watchTestCommand);
}

// src/extension.ts
function activate(context) {
  registerTestRunner(context);
  registerTestCodeLens(context);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
