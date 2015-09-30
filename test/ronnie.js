(function() {
  describe('Ronnie', function() {
    it('finds the main module in your app config', function() {
      var app_config, app_config_string, main_module, modules, ref;
      app_config = {
        main: 'foo',
        modules: [
          {
            name: 'foo'
          }
        ]
      };
      app_config_string = JSON.stringify(app_config);
      ref = Ronnie.parse(app_config_string), modules = ref.modules, main_module = ref.main_module;
      expect(modules).toEqual(app_config.modules);
      return expect(main_module.name).toEqual('foo');
    });
    it('knows how to fetch a module given its name', function() {
      var app_config, app_config_string, bar, foo, main_module, modules, ref;
      app_config = {
        main: 'foo',
        modules: [
          {
            name: 'foo'
          }
        ]
      };
      app_config_string = JSON.stringify(app_config);
      ref = Ronnie.parse(app_config_string), modules = ref.modules, main_module = ref.main_module;
      foo = Ronnie.module(modules, 'foo');
      expect(foo).toEqual(main_module);
      expect(foo.name).toEqual('foo');
      bar = Ronnie.module(modules, 'bar');
      return expect(bar).not.toBeDefined();
    });
    it('knows how to fetch a module\'s dependencies', function() {
      var app_config, app_config_string, bar, foo, main_module, modules, ref;
      foo = {
        name: 'foo',
        requires: ['bar']
      };
      bar = {
        name: 'bar'
      };
      app_config = {
        main: 'foo',
        modules: [foo, bar]
      };
      app_config_string = JSON.stringify(app_config);
      ref = Ronnie.parse(app_config_string), modules = ref.modules, main_module = ref.main_module;
      expect(Ronnie.dependencies(modules, foo)).toEqual([bar]);
      return expect(Ronnie.dependencies(modules, bar)).toEqual([]);
    });
    it('throws an error when you have circular dependencies', function() {
      var app_config, app_config_string, bar, error, foo, main_module, module, modules, ref, ref1;
      foo = {
        name: 'foo',
        requires: ['bar']
      };
      bar = {
        name: 'bar',
        requires: ['foo']
      };
      app_config = {
        main: 'foo',
        modules: [foo, bar]
      };
      app_config_string = JSON.stringify(app_config);
      ref = Ronnie.parse(app_config_string), modules = ref.modules, main_module = ref.main_module;
      expect(function() {
        return Ronnie.circularDependenciesCheck(modules, main_module);
      }).toThrowError('Ronnie: Circular Dependency: foo -> bar -> foo');
      try {
        Ronnie.circularDependenciesCheck(modules, main_module);
      } catch (_error) {
        error = _error;
        expect(error.data.circular_dependency).toEqual(true);
        expect((function() {
          var i, len, ref1, results;
          ref1 = error.data.sequence;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            module = ref1[i];
            results.push(module.name);
          }
          return results;
        })()).toEqual(['foo', 'bar', 'foo']);
      }
      bar = {
        name: 'bar'
      };
      app_config = {
        main: 'foo',
        modules: [foo, bar]
      };
      app_config_string = JSON.stringify(app_config);
      ref1 = Ronnie.parse(app_config_string), modules = ref1.modules, main_module = ref1.main_module;
      return expect(function() {
        return Ronnie.circularDependenciesCheck(modules, main_module);
      }).not.toThrow();
    });
    it('knows how to asynchronously load a script given its url', function(done) {
      expect(typeof s0 !== "undefined" && s0 !== null).toEqual(false);
      return Ronnie.loadScript('base/test/s0.js').then(function() {
        expect(typeof s0 !== "undefined" && s0 !== null).toEqual(true);
        expect(s0).toEqual('s0');
        return done();
      });
    });
    it('knows how to load all the scripts inside a module (in parallel)', function(done) {
      var m1;
      m1 = {
        contains: ['base/test/s1_m1.js', 'base/test/s2_m1.js', 'base/test/s3_m1.js']
      };
      expect(typeof s1_m1 !== "undefined" && s1_m1 !== null).toEqual(false);
      expect(typeof s2_m1 !== "undefined" && s2_m1 !== null).toEqual(false);
      expect(typeof s3_m1 !== "undefined" && s3_m1 !== null).toEqual(false);
      return Ronnie.loadModule(m1).then(function() {
        expect(typeof s1_m1 !== "undefined" && s1_m1 !== null).toEqual(true);
        expect(s1_m1).toEqual('s1_m1');
        expect(typeof s2_m1 !== "undefined" && s2_m1 !== null).toEqual(true);
        expect(s2_m1).toEqual('s2_m1');
        expect(typeof s3_m1 !== "undefined" && s3_m1 !== null).toEqual(true);
        expect(s3_m1).toEqual('s3_m1');
        return done();
      });
    });
    it('can load a module and / after its dependencies', function(done) {
      var m2, m3;
      m2 = {
        name: 'm2',
        contains: ['base/test/s1_m2.js', 'base/test/s2_m2.js', 'base/test/s3_m2.js'],
        requires: ['m3']
      };
      m3 = {
        name: 'm3',
        contains: ['base/test/s1_m3.js', 'base/test/s2_m3.js', 'base/test/s3_m3.js']
      };
      expect(typeof s1_m2 !== "undefined" && s1_m2 !== null).toEqual(false);
      expect(typeof s2_m2 !== "undefined" && s2_m2 !== null).toEqual(false);
      expect(typeof s3_m2 !== "undefined" && s3_m2 !== null).toEqual(false);
      expect(typeof s1_m3 !== "undefined" && s1_m3 !== null).toEqual(false);
      expect(typeof s2_m3 !== "undefined" && s2_m3 !== null).toEqual(false);
      expect(typeof s3_m3 !== "undefined" && s3_m3 !== null).toEqual(false);
      return Ronnie.loadModuleWithDependencies([m2, m3], m2, []).then(function() {
        expect(typeof s1_m2 !== "undefined" && s1_m2 !== null).toEqual(true);
        expect(s1_m2).toEqual('s1_m2');
        expect(typeof s2_m2 !== "undefined" && s2_m2 !== null).toEqual(true);
        expect(s2_m2).toEqual('s2_m2');
        expect(typeof s3_m2 !== "undefined" && s3_m2 !== null).toEqual(true);
        expect(s3_m2).toEqual('s3_m2');
        expect(typeof s1_m3 !== "undefined" && s1_m3 !== null).toEqual(true);
        expect(s1_m3).toEqual('s1_m3');
        expect(typeof s2_m3 !== "undefined" && s2_m3 !== null).toEqual(true);
        expect(s2_m3).toEqual('s2_m3');
        expect(typeof s3_m3 !== "undefined" && s3_m3 !== null).toEqual(true);
        expect(s3_m3).toEqual('s3_m3');
        return done();
      });
    });
    it('properly deals with modules required multiple times', function(done) {
      var m4, m5, m6;
      m4 = {
        name: 'm4',
        contains: ['base/test/s1_m4.js'],
        requires: ['m5', 'm6']
      };
      m5 = {
        name: 'm5',
        contains: ['base/test/s1_m5.js'],
        requires: ['m6']
      };
      m6 = {
        name: 'm6',
        contains: ['base/test/s1_m6.js']
      };
      expect(typeof s1_m4 !== "undefined" && s1_m4 !== null).toEqual(false);
      expect(typeof s2_m5 !== "undefined" && s2_m5 !== null).toEqual(false);
      expect(typeof s3_m6 !== "undefined" && s3_m6 !== null).toEqual(false);
      return Ronnie.loadModuleWithDependencies([m4, m5, m6], m4, []).then(function() {
        expect(typeof s1_m4 !== "undefined" && s1_m4 !== null).toEqual(true);
        expect(s1_m4).toEqual('s1_m4');
        expect(typeof s1_m5 !== "undefined" && s1_m5 !== null).toEqual(true);
        expect(s1_m5).toEqual('s1_m5');
        expect(typeof s1_m6 !== "undefined" && s1_m6 !== null).toEqual(true);
        expect(s1_m6).toEqual('s1_m6');
        return done();
      });
    });
    it('knows how to load an entire app based on its config', function() {
      var config, m7, m8;
      m7 = {
        name: 'm7',
        contains: ['base/test/s1_m7.js'],
        requires: ['m8']
      };
      m8 = {
        name: 'm8',
        contains: ['base/test/s1_m8.js']
      };
      config = JSON.stringify({
        modules: [m7, m8],
        main: 'm7'
      });
      spyOn(Ronnie, 'loadModuleWithDependencies');
      Ronnie.loadApp(config);
      return expect(Ronnie.loadModuleWithDependencies).toHaveBeenCalledWith([m7, m8], m7, []);
    });
    it('knows how to fetch your app\'s JSON config', function(done) {
      $(document.head).append('<script data-app-config="base/test/test-config.json"></script>');
      return Ronnie.loadConfig().then(function(config) {
        config = JSON.parse(config);
        expect(config.modules).toContain({
          name: 'm7',
          contains: ['base/test/s1_m7.js'],
          requires: ['m8']
        });
        expect(config.modules).toContain({
          name: 'm8',
          contains: ['base/test/s1_m8.js']
        });
        expect(config.main).toEqual('m7');
        return done();
      });
    });
    return it('on document ready bootstraps your app', function() {
      spyOn(document, 'addEventListener').and.callThrough();
      expect(document.addEventListener).not.toHaveBeenCalled();
      Ronnie.bootstrap();
      return expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', jasmine.any(Function));
    });
  });

}).call(this);
