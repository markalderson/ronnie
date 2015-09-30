(function() {
  var QLite;

  QLite = {
    "private": {
      delay: function(what) {
        return setTimeout(what, 0);
      }
    },
    isPromise: function(value) {
      return ((value != null ? value.then : void 0) != null) && typeof value.then === 'function';
    },
    defer: function() {
      var deferred;
      return deferred = {
        "private": {
          chaineds: [],
          settleChained: function(which, how) {
            return function() {
              return which.deferred[how.with_operation](how.with_argument);
            };
          },
          settle: function(how) {
            var c1, c2, callback, callback_result, chained, error, j, len, ref, results;
            ref = this.chaineds;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              chained = ref[j];
              try {
                switch (how.with_operation) {
                  case 'resolve':
                    callback = chained.resolve_callback;
                    break;
                  case 'reject':
                    callback = chained.reject_callback;
                }
                if (callback != null) {
                  callback_result = callback(how.with_argument);
                  if (QLite.isPromise(callback_result)) {
                    c1 = this.settleChained(chained, {
                      with_operation: how.with_operation,
                      with_argument: callback_result
                    });
                    c2 = this.settleChained(chained, {
                      with_operation: 'reject',
                      with_argument: callback_result
                    });
                    results.push(callback_result.then(c1, c2));
                  } else {
                    results.push(this.settleChained(chained, {
                      with_operation: how.with_operation,
                      with_argument: callback_result
                    })());
                  }
                } else {
                  results.push(void 0);
                }
              } catch (_error) {
                error = _error;
                results.push(this.settleChained(chained, {
                  with_operation: 'reject',
                  with_argument: error
                })());
              }
            }
            return results;
          }
        },
        resolve: function(value) {
          var myself;
          if (!this.promise.settled) {
            this.promise.settled = true;
            myself = this;
            return QLite["private"].delay(function() {
              return myself["private"].settle({
                with_operation: 'resolve',
                with_argument: value
              });
            });
          }
        },
        reject: function(reason) {
          var myself;
          if (!this.promise.settled) {
            this.promise.settled = true;
            myself = this;
            return QLite["private"].delay(function() {
              return myself["private"].settle({
                with_operation: 'reject',
                with_argument: reason
              });
            });
          }
        },
        promise: {
          settled: false,
          then: function(onFulfilled, onRejected) {
            var chained;
            chained = {
              deferred: QLite.defer()
            };
            if (onFulfilled != null) {
              chained.resolve_callback = onFulfilled;
            }
            chained.reject_callback = onRejected != null ? onRejected : function(reason) {
              return reason;
            };
            deferred["private"].chaineds.push(chained);
            return chained.deferred.promise;
          },
          fail: function(onRejected) {
            return this.then(void 0, onRejected);
          },
          fin: function(onSettled) {
            return this.then(onSettled, onSettled);
          }
        }
      };
    },
    all: function(promises) {
      var combined, fn, implementation, j, len, notifyFulfillment, notifyRejection, promise;
      combined = QLite.defer();
      implementation = {
        values: [],
        fulfilled: 0
      };
      notifyFulfillment = function(promise, value) {
        var i;
        implementation.fulfilled++;
        i = promises.indexOf(promise);
        implementation.values[i] = value;
        if (implementation.fulfilled === promises.length) {
          return combined.resolve(implementation.values);
        }
      };
      notifyRejection = function(reason) {
        return combined.reject(reason);
      };
      fn = function(promise) {
        return promise.then((function(value) {
          return notifyFulfillment(promise, value);
        }), notifyRejection);
      };
      for (j = 0, len = promises.length; j < len; j++) {
        promise = promises[j];
        fn(promise);
      }
      return combined.promise;
    },
    any: function(promises) {
      var combined, fn, j, len, notifyFulfillment, notifyRejection, promise, rejected;
      combined = QLite.defer();
      rejected = 0;
      notifyFulfillment = function(value) {
        return combined.resolve(value);
      };
      notifyRejection = function() {
        rejected++;
        if (rejected === promises.length) {
          return combined.reject(void 0);
        }
      };
      fn = function(promise) {
        return promise.then(notifyFulfillment, notifyRejection);
      };
      for (j = 0, len = promises.length; j < len; j++) {
        promise = promises[j];
        fn(promise);
      }
      return combined.promise;
    }
  };

  switch (false) {
    case (typeof module !== "undefined" && module !== null ? module.exports : void 0) == null:
      module.exports = function() {
        return QLite;
      };
      break;
    case typeof define === "undefined" || define === null:
      define(function() {
        return QLite;
      });
      break;
    case typeof window === "undefined" || window === null:
      window.QLite = QLite;
  }

}).call(this);

(function() {
  var Ronnie,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Ronnie = {
    parse: function(config) {
      var i, len, main_module, main_module_name, module, modules;
      config = JSON.parse(config);
      modules = config.modules;
      main_module_name = config.main;
      for (i = 0, len = modules.length; i < len; i++) {
        module = modules[i];
        if (module.name === main_module_name) {
          main_module = module;
        }
      }
      return {
        modules: modules,
        main_module: main_module
      };
    },
    module: function(modules, name) {
      var i, len, m;
      for (i = 0, len = modules.length; i < len; i++) {
        m = modules[i];
        if (m.name === name) {
          return m;
        }
      }
    },
    dependencies: function(modules, module) {
      var dep_name, deps, i, len, ref;
      deps = [];
      if (module.requires != null) {
        ref = module.requires;
        for (i = 0, len = ref.length; i < len; i++) {
          dep_name = ref[i];
          deps.push(this.module(modules, dep_name));
        }
      }
      return deps;
    },
    errorMessage: function(error_data) {
      var message, module;
      message = 'Ronnie: ';
      if (error_data.circular_dependency) {
        message += 'Circular Dependency: ' + ((function() {
          var i, len, ref, results;
          ref = error_data.sequence;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            module = ref[i];
            results.push(module.name + " -> ");
          }
          return results;
        })()).join('');
        return message.substring(0, message.length - 4);
      }
    },
    circularDependenciesCheck: function(modules, main_module) {
      return this.recursiveCircularDependenciesCheck(modules, main_module, [main_module]);
    },
    recursiveCircularDependenciesCheck: function(modules, module, path) {
      var dep, deps, error, error_data, i, len, new_path, results;
      deps = Ronnie.dependencies(modules, module);
      results = [];
      for (i = 0, len = deps.length; i < len; i++) {
        dep = deps[i];
        if (indexOf.call(path, dep) >= 0) {
          error_data = {
            circular_dependency: true,
            sequence: path.concat([dep])
          };
          error = new Error(this.errorMessage(error_data));
          error.data = error_data;
          throw error;
        } else {
          new_path = path.concat([dep]);
          results.push(this.recursiveCircularDependenciesCheck(modules, dep, new_path));
        }
      }
      return results;
    },
    loadScript: function(url) {
      var deferred, script;
      deferred = QLite.defer();
      script = document.createElement('script');
      script.src = url;
      script.onload = function() {
        return deferred.resolve();
      };
      document.head.appendChild(script);
      return deferred.promise;
    },
    loadModule: function(module) {
      var i, len, promises, ref, s;
      promises = [];
      ref = module.contains;
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        promises.push(this.loadScript(s));
      }
      return QLite.all(promises);
    },
    loadModuleWithDependencies: function(modules, module, already_loaded_modules) {
      var deferred, dependency, dependency_name, i, len, promises, ref;
      deferred = QLite.defer();
      if (module.requires != null) {
        promises = [];
        ref = module.requires;
        for (i = 0, len = ref.length; i < len; i++) {
          dependency_name = ref[i];
          dependency = this.module(modules, dependency_name);
          promises.push(this.loadModuleWithDependencies(modules, dependency, already_loaded_modules));
        }
        if (promises.length > 0) {
          QLite.all(promises).then(function() {
            if (!(indexOf.call(already_loaded_modules, module) >= 0)) {
              return Ronnie.loadModule(module).then(function() {
                already_loaded_modules.push(module);
                return deferred.resolve();
              });
            } else {
              return deferred.resolve();
            }
          });
        }
      } else {
        if (!(indexOf.call(already_loaded_modules, module) >= 0)) {
          this.loadModule(module).then(function() {
            already_loaded_modules.push(module);
            return deferred.resolve();
          });
        } else {
          deferred.resolve();
        }
      }
      return deferred.promise;
    },
    loadApp: function(config) {
      var main_module, modules, ref;
      ref = this.parse(config), modules = ref.modules, main_module = ref.main_module;
      return this.loadModuleWithDependencies(modules, main_module, []);
    },
    loadConfig: function() {
      var config_url, deferred, request, ronnie_script;
      deferred = QLite.defer();
      ronnie_script = document.querySelector('[data-app-config]');
      if (ronnie_script != null) {
        config_url = ronnie_script.getAttribute('data-app-config');
        request = new XMLHttpRequest();
        request.open('GET', config_url, true);
        request.onreadystatechange = function() {
          if (request.readyState === 4 && request.status === 200) {
            return deferred.resolve(request.responseText);
          }
        };
        request.send();
      }
      return deferred.promise;
    },
    bootstrap: function() {
      return document.addEventListener('DOMContentLoaded', function() {
        return Ronnie.loadConfig().then(function(config) {
          return Ronnie.loadApp(config);
        });
      });
    }
  };

  window.Ronnie = Ronnie;

  Ronnie.bootstrap();

}).call(this);
