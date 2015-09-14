describe 'Ronnie', ->
  it 'finds the main module in your JSON structure', ->
  	structure = { main: 'foo', modules: [ { name: 'foo' } ] }
  	structure_string = JSON.stringify structure
  	{ modules, main_module } = Ronnie.parse structure_string
  	expect(modules).toEqual structure.modules
  	expect(main_module.name).toEqual 'foo'
  it 'knows how to fetch a module given its name', ->
  	structure = { main: 'foo', modules: [ { name: 'foo' } ] }
  	structure_string = JSON.stringify structure
  	{ modules, main_module } = Ronnie.parse structure_string
  	foo = Ronnie.module modules, 'foo'
  	expect(foo).toEqual main_module
  	expect(foo.name).toEqual 'foo'
  	bar = Ronnie.module modules, 'bar'
  	expect(bar).not.toBeDefined()
  it 'knows how to fetch a module\'s dependencies', ->
  	foo = { name: 'foo', requires: ['bar'] }
  	bar = { name: 'bar' }
  	structure =
  		main: 'foo'
  		modules: [ foo, bar ]
  	structure_string = JSON.stringify structure
  	{ modules, main_module } = Ronnie.parse structure_string
  	expect(Ronnie.dependencies modules, foo).toEqual [bar]
  	expect(Ronnie.dependencies modules, bar).toEqual []
  it 'throws an error when you have circular dependencies', ->
  	foo = { name: 'foo', requires: ['bar'] }
  	bar = { name: 'bar', requires: ['foo'] }
  	structure =
  		main: 'foo'
  		modules: [ foo, bar ]
  	structure_string = JSON.stringify structure
  	{ modules, main_module } = Ronnie.parse structure_string
  	expect(-> Ronnie.circularDependenciesCheck modules, main_module).toThrowError 'Ronnie:
  		Circular Dependency: foo -> bar -> foo'
  	try
  		Ronnie.circularDependenciesCheck modules, main_module
  	catch error
  		expect(error.data.circular_dependency).toEqual true
  		expect(module.name for module in error.data.sequence).toEqual ['foo', 'bar', 'foo']
  	# Remove the circular dependency to avoid errors
  	bar = { name: 'bar' } # no more foo-dependant
  	structure =
  		main: 'foo'
  		modules: [ foo, bar ]
  	structure_string = JSON.stringify structure
  	{ modules, main_module } = Ronnie.parse structure_string
  	expect(-> Ronnie.circularDependenciesCheck modules, main_module).not.toThrow()