(function () {
	function inArray(array, element) {
		return array.indexOf(element) > -1;
	}

	function moduleWithName(modules, name) {
		for (var i = 0; i < modules.length; i++) {
			var module = modules[i];
			if (module.name === name) return module;
		}
	}

	function createScriptElement(url) {
		var script = document.createElement('script');
		script.src = url;
		return script;
	}

	function createScriptElementsForModule(module) {
		var script_elements = [];
		var scripts = module.contains;
		if (scripts) for (var i = 0; i < scripts.length; i++) {
			script_elements.push(createScriptElement(scripts[i]));
		}
		return script_elements;
	}

	function createScriptElementsForSequence(sequence) {
		var script_elements = [];
		for (var i = 0; i < sequence.length; i++) {
			var module = sequence[i];
			script_elements = script_elements.concat(createScriptElementsForModule(module));
		}
		return script_elements;
	}

	function prepareChainedScriptLoading(script_elements) {
		for (var i = 0; i < script_elements.length; i++) {
			if (i !== script_elements.length - 1) {
				var current = script_elements[i];
				var next = script_elements[i+1];
				current.onload = function () {
					document.head.appendChild(next);
				}
			}
		}
	}

	function startScriptLoading(script_elements) {
		if (script_elements.length !== 0) document.head.appendChild(script_elements[0]);
	}

	function loadSequence(sequence) {
		var script_elements = createScriptElementsForSequence(sequence);
		prepareChainedScriptLoading(script_elements);
		startScriptLoading(script_elements);
	}

	function dependencies(modules, module) {
		var dep_names = module.requires;
		if (dep_names) {
			var deps = [];
			for (var i = 0; i < dep_names.length; i++) {
				var name = dep_names[i];
				deps.push(moduleWithName(modules, name));
			}
			return deps;
		}
	}

	function checkForCircularDependenciesRecursively(modules, module, sequence) {
		var deps = dependencies(modules, module);
		if (deps) for (var i = 0; i < deps.length; i++) {
			var dep = deps[i];
			if (inArray(sequence, dep)) {
				sequence.push(dep);
				throw 'RonnieJS: Circular Dependency: ' + errorMessage({
					circular_dependency: true,
					sequence: sequence
				});
			}
			var new_sequence = sequence.concat([dep]);
			checkForCircularDependenciesRecursively(modules, dep, new_sequence);
		}
	}

	function errorMessage(error) {
		var message;
		if (error.circular_dependency) {
			message = '';
			var sequence = error.sequence;
			for (var i = 0; i < sequence.length; i++) {
				var module = sequence[i];
				console.log(module);
				message += module.name + ' -> ';
			}
			var stop = message.length - 4;
			message = message.substring(0, stop);
		}
		return message;
	}

	function calculateSequenceRecursively(modules, module, sequence) {
		var deps = dependencies(modules, module);
		if (deps) for (var i = 0; i < deps.length; i++) {
			var dep = deps[i];
			var rec = calculateSequenceRecursively(modules, dep, sequence);
			sequence.concat(rec);
		}
		if (!inArray(sequence, module)) sequence.push(module);
		return sequence;
	}

	function loadingSequence(modules, main_module) {
		checkForCircularDependenciesRecursively(modules, main_module, [main_module]);
		return calculateSequenceRecursively(modules, main_module, []);
	}

	function loadStructure(declaration_location, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', declaration_location, true);
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				var structure = JSON.parse(request.responseText);
				callback(structure);
			}
		};
		request.send();
	};

	var ronnie_element = document.querySelector('[data-ronniejs-structure]');
	var structure_location = ronnie_element.getAttribute('data-ronniejs-structure');
	loadStructure(structure_location, function (structure) {
		var modules = structure.modules;
		var main_name = structure.main;
		var main_module = moduleWithName(modules, main_name);
		var sequence = loadingSequence(modules, main_module);
		loadSequence(sequence);
	});
})();