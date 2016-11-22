# koa-folder-routes
Create [koa-router](https://github.com/alexmingoia/koa-router) objects with folder path appended.

Eg:

![](imgs/20161118-181607.png)

***Steps***

1.&nbsp;Create your [koa-router](https://github.com/alexmingoia/koa-router)  objects like below:
	
&nbsp;&nbsp;&nbsp;	***controllers/rest/v1/post/index.js***
	
```javascript
	'use strict';
	var router = require("koa-router")();

	router.get("post","/:id", function *(next) {
	  var id = parseInt(this.params.id);
	  var postsHelper = PostsHelper(this.mongo);
	  this.body = yield postsHelper.getPostById(id);
	});

	router.allowedMethodsObject = {
	  throw: true,
	  notImplemented: () => new Boom.notImplemented(),
	  methodNotAllowed: () => new Boom.methodNotAllowed()
	};

	module.exports = router;
	
```

Now this will be available at http://localhost:8080/rest/v1/post/10
	
2.&nbsp;The koa-router objects present under *controllers/root/* are put up directly to the context path.

&nbsp;&nbsp;&nbsp;	***controllers/root/index.js***

```javascript
'use strict';

var router = require("koa-router")();

router.get("/", function *(next) {
  this.render("index", {foo:"bar"});
});

router.allowedMethodsObject = {};

module.exports = router;

```
Now the index.jade will be available at http://localhost:8080/
	
3.&nbsp;Configuration:

&nbsp;&nbsp;&nbsp;	***app.js***
	
```javascript
	'use strict';
	const koa = require('koa');
	const app = koa();
	var routesloader = require('koa-folder-routes');
	routesloader(app);
	
```
&nbsp;&nbsp;&nbsp;	***config/default.json***

```javascript
		"routes": {
    			"directory": "controllers"
    		}
		
```
	
&nbsp;&nbsp;&nbsp;&nbsp; ***OR***

&nbsp;&nbsp;&nbsp;	***app.js***
	
```javascript
	'use strict';
	const koa = require('koa');
	const app = koa();
	var routesloader = require('koa-folder-routes');
	routesloader(app,'controllers'); 
	
```

***The folder path needs to be referenced from the project's directory (excluding project's directory name).***

4.&nbsp; **This module completely depends on [koa-router](https://github.com/alexmingoia/koa-router) and does not offer anything on it's own for routing.** This module only helps invoking `app.use` function by passing your [koa-router](https://github.com/alexmingoia/koa-router) objects as parameter and prefixing the directory path to the router. Also we can place in these directories any of the utility function files, modules or helper function modules that we need for the routers.