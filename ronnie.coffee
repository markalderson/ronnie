Ronnie =
	parse: (structure) ->
		structure = JSON.parse structure
		modules = structure.modules
		main_module_name = structure.main
		for module in modules
			main_module = module if module.name is main_module_name
		return { modules: modules, main_module: main_module }
	module: (modules, name) ->
		for m in modules
			return m if m.name is name
	dependencies: (modules, module) ->
		deps = []
		if module.requires?
			for dep_name in module.requires
				deps.push @module modules, dep_name
		return deps
	errorMessage: (error_data) ->
		message = 'Ronnie: '
		if error_data.circular_dependency
			message += 'Circular Dependency: ' + ("#{module.name} -> " for module in error_data.sequence).join ''
			return message.substring 0, message.length - 4
	circularDependenciesCheck: (modules, main_module) ->
		@recursiveCircularDependenciesCheck modules, main_module, [main_module]
	recursiveCircularDependenciesCheck: (modules, module, path) ->
		deps = Ronnie.dependencies modules, module
		for dep in deps
			if dep in path
				error_data =
					circular_dependency: true,
					sequence: path.concat [dep]
				error = new Error @errorMessage error_data
				error.data = error_data
				throw error
			else
				new_path = path.concat [dep]
				@recursiveCircularDependenciesCheck modules, dep, new_path
	loadScript: (url) ->
		deferred = QLite.defer()
		script = document.createElement 'script'
		script.src = url
		script.onload = -> deferred.resolve()
		document.head.appendChild script
		return deferred.promise
window.Ronnie = Ronnie