# Ronnie

Ronnie is a tiny JavaScript Loader that asynchronously loads your scripts based on the dependencies declared inside an external configuration file.

## Usage

``` html
<script data-app-config="my-config.json" src="ronnie.js"></script>
```

## JSON configuration format

A Ronnie configuration file is a JSON `object` with 2 properties: `modules` and `main`.

`modules` is an `array` of `object`s, each one describing a `module`.

A `module` is just a named collection of zero or more JavaScript files with zero or more dependencies. Thus, a `module` description is made of a `name` property (of type `string`), a
`contains` property (an `array` of `string`s) and optionally a `requires` property (another `array` of `string`s).

Values in the `contains` `array` are URLs, while values in the `requires` `array` are module names.

The `main` property is a `string` indicating the name of the main module of your app.

Here is a sample configuration for a trivial [AngularJS](https://angularjs.org/) app:

``` json
{
    "modules": [
    	{
    		"name": "angular",
			"contains": [ "https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js" ]
		},
		{
    		"name": "myapp",
			"contains": [ "scripts/myapp.js" ],
			"requires": [ "angular" ]
		}
	],
	"main": "myapp"
}
```

Scripts inside the same module are loaded simultaneously. A module is never loaded before any of its required modules.

Ronnie also detects circular dependencies and reacts by throwing an exception.
