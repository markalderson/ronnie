Ronnie =
	parse: (config) ->
		config = JSON.parse config
		modules = config.modules
		main_module_name = config.main
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
	loadModule: (module) ->
		promises = []
		promises.push @loadScript s for s in module.contains
		return QLite.all promises
	loadModuleWithDependencies: (modules, module, already_loaded_modules) ->
		deferred = QLite.defer()
		if module.requires?
			promises = []
			for dependency_name in module.requires
				dependency = @module modules, dependency_name
				promises.push @loadModuleWithDependencies modules, dependency, already_loaded_modules
			if promises.length > 0
				QLite.all(promises).then ->
					if not (module in already_loaded_modules)
						Ronnie.loadModule(module).then ->
							already_loaded_modules.push module
							deferred.resolve()
					else deferred.resolve()
		else
			if not (module in already_loaded_modules)
				@loadModule(module).then ->
					already_loaded_modules.push module
					deferred.resolve()
			else deferred.resolve()
		return deferred.promise
	loadApp: (config) ->
		{ modules, main_module } = @parse config
		return @loadModuleWithDependencies modules, main_module, []
	loadConfig: ->
		deferred = QLite.defer()
		ronnie_script = document.querySelector '[data-app-config]'
		if ronnie_script?
			config_url = ronnie_script.getAttribute 'data-app-config'
			request = new XMLHttpRequest();
			request.open 'GET', config_url, true
			request.onreadystatechange = ->
				if request.readyState == 4 && request.status == 200
					deferred.resolve request.responseText
			request.send()
		return deferred.promise
	bootstrap: ->
		document.addEventListener 'DOMContentLoaded', ->
			Ronnie.loadConfig().then (config) -> Ronnie.loadApp config
window.Ronnie = Ronnie
Ronnie.bootstrap()