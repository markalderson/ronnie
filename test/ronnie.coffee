describe 'Ronnie', ->
  it 'finds the main module in your app config', ->
  	app_config = { main: 'foo', modules: [ { name: 'foo' } ] }
  	app_config_string = JSON.stringify app_config
  	{ modules, main_module } = Ronnie.parse app_config_string
  	expect(modules).toEqual app_config.modules
  	expect(main_module.name).toEqual 'foo'
  it 'knows how to fetch a module given its name', ->
  	app_config = { main: 'foo', modules: [ { name: 'foo' } ] }
  	app_config_string = JSON.stringify app_config
  	{ modules, main_module } = Ronnie.parse app_config_string
  	foo = Ronnie.module modules, 'foo'
  	expect(foo).toEqual main_module
  	expect(foo.name).toEqual 'foo'
  	bar = Ronnie.module modules, 'bar'
  	expect(bar).not.toBeDefined()
  it 'knows how to fetch a module\'s dependencies', ->
  	foo = { name: 'foo', requires: ['bar'] }
  	bar = { name: 'bar' }
  	app_config =
  		main: 'foo'
  		modules: [ foo, bar ]
  	app_config_string = JSON.stringify app_config
  	{ modules, main_module } = Ronnie.parse app_config_string
  	expect(Ronnie.dependencies modules, foo).toEqual [bar]
  	expect(Ronnie.dependencies modules, bar).toEqual []
  it 'throws an error when you have circular dependencies', ->
  	foo = { name: 'foo', requires: ['bar'] }
  	bar = { name: 'bar', requires: ['foo'] }
  	app_config =
  		main: 'foo'
  		modules: [ foo, bar ]
  	app_config_string = JSON.stringify app_config
  	{ modules, main_module } = Ronnie.parse app_config_string
  	expect(-> Ronnie.circularDependenciesCheck modules, main_module).toThrowError 'Ronnie:
  		Circular Dependency: foo -> bar -> foo'
  	try
  		Ronnie.circularDependenciesCheck modules, main_module
  	catch error
  		expect(error.data.circular_dependency).toEqual true
  		expect(module.name for module in error.data.sequence).toEqual ['foo', 'bar', 'foo']
  	# Remove the circular dependency to avoid errors
  	bar = { name: 'bar' } # no more foo-dependent
  	app_config =
  		main: 'foo'
  		modules: [ foo, bar ]
  	app_config_string = JSON.stringify app_config
  	{ modules, main_module } = Ronnie.parse app_config_string
  	expect(-> Ronnie.circularDependenciesCheck modules, main_module).not.toThrow()
  it 'knows how to asynchronously load a script given its url', (done) ->
    expect(s0?).toEqual false
    Ronnie.loadScript('base/test/s0.js').then ->
      expect(s0?).toEqual true
      expect(s0).toEqual 's0'
      done()
  it 'knows how to load all the scripts inside a module (in parallel)', (done) ->
    m1 =
      contains: [ 'base/test/s1_m1.js', 'base/test/s2_m1.js', 'base/test/s3_m1.js' ]
    expect(s1_m1?).toEqual false
    expect(s2_m1?).toEqual false
    expect(s3_m1?).toEqual false
    Ronnie.loadModule(m1).then ->
      expect(s1_m1?).toEqual true
      expect(s1_m1).toEqual 's1_m1'
      expect(s2_m1?).toEqual true
      expect(s2_m1).toEqual 's2_m1'
      expect(s3_m1?).toEqual true
      expect(s3_m1).toEqual 's3_m1'
      done()
  it 'can load a module and / after its dependencies', (done) ->
    m2 =
      name: 'm2'
      contains: [ 'base/test/s1_m2.js', 'base/test/s2_m2.js', 'base/test/s3_m2.js' ]
      requires: [ 'm3' ]
    m3 =
      name: 'm3',
      contains: [ 'base/test/s1_m3.js', 'base/test/s2_m3.js', 'base/test/s3_m3.js' ]
    expect(s1_m2?).toEqual false
    expect(s2_m2?).toEqual false
    expect(s3_m2?).toEqual false
    expect(s1_m3?).toEqual false
    expect(s2_m3?).toEqual false
    expect(s3_m3?).toEqual false
    Ronnie.loadModuleWithDependencies([m2, m3], m2, []).then ->
      # m2
      expect(s1_m2?).toEqual true
      expect(s1_m2).toEqual 's1_m2'
      expect(s2_m2?).toEqual true
      expect(s2_m2).toEqual 's2_m2'
      expect(s3_m2?).toEqual true
      expect(s3_m2).toEqual 's3_m2'
      # m3
      expect(s1_m3?).toEqual true
      expect(s1_m3).toEqual 's1_m3'
      expect(s2_m3?).toEqual true
      expect(s2_m3).toEqual 's2_m3'
      expect(s3_m3?).toEqual true
      expect(s3_m3).toEqual 's3_m3'
      done()
  it 'properly deals with modules required multiple times', (done) ->
    m4 =
      name: 'm4'
      contains: [ 'base/test/s1_m4.js' ]
      requires: [ 'm5', 'm6' ]
    m5 =
      name: 'm5'
      contains: [ 'base/test/s1_m5.js' ]
      requires: [ 'm6' ]
    m6 =
      name: 'm6'
      contains: [ 'base/test/s1_m6.js' ]
    expect(s1_m4?).toEqual false
    expect(s2_m5?).toEqual false
    expect(s3_m6?).toEqual false
    Ronnie.loadModuleWithDependencies([m4, m5, m6], m4, []).then ->
      # m4
      expect(s1_m4?).toEqual true
      expect(s1_m4).toEqual 's1_m4'
      # m5
      expect(s1_m5?).toEqual true
      expect(s1_m5).toEqual 's1_m5'
      # m6
      expect(s1_m6?).toEqual true
      expect(s1_m6).toEqual 's1_m6'
      done()
  it 'knows how to load an entire app based on its config', ->
    m7 =
      name: 'm7'
      contains: [ 'base/test/s1_m7.js' ]
      requires: [ 'm8' ]
    m8 =
      name: 'm8'
      contains: [ 'base/test/s1_m8.js' ]
    config = JSON.stringify
      modules: [m7, m8]
      main: 'm7'
    spyOn Ronnie, 'loadModuleWithDependencies'
    Ronnie.loadApp config
    expect(Ronnie.loadModuleWithDependencies).toHaveBeenCalledWith [m7, m8], m7, []
  it 'knows how to fetch your app\'s JSON config', (done) ->
    $(document.head).append '<script data-app-config="base/test/test-config.json"></script>'
    Ronnie.loadConfig().then (config) ->
      # see test/test-config.json
      config = JSON.parse config
      expect(config.modules).toContain
        name: 'm7'
        contains: [ 'base/test/s1_m7.js' ]
        requires: [ 'm8' ]
      expect(config.modules).toContain
        name: 'm8'
        contains: [ 'base/test/s1_m8.js' ]
      expect(config.main).toEqual 'm7'
      done()
  it 'on document ready bootstraps your app', ->
    spyOn(document, 'addEventListener').and.callThrough()
    expect(document.addEventListener).not.toHaveBeenCalled()
    Ronnie.bootstrap()
    expect(document.addEventListener).toHaveBeenCalledWith 'DOMContentLoaded', jasmine.any Function
    spyOn(Ronnie, 'loadConfig').and.callThrough()
    expect(Ronnie.loadConfig).not.toHaveBeenCalled()
    $(document).trigger 'DOMContentLoaded'
    expect(Ronnie.loadConfig).toHaveBeenCalled()