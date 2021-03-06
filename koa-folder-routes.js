module.exports = (function()
{

'use strict';

var path = require('path');
var KoaRouter = require('koa-router');
var requireDir = require('require-dir');
var config = require('config');

// ***************** Worst Array traverser *********************************
var f = function(arr)
{
    var p = function(i, func)
    {
        if(arr[i-1] !== undefined)
        {
            func(arr[i].value, arr[i].name);
            return ( p((i-1), func) );
        }
        else
        {
            func(arr[i].value, arr[i].name);
            return arr[i];
        }
    };
    return p;
};


var array_traverser = function(a, func)
{
    var g = f(a);
    g(a.length-1, func);
};

// **************** End of Array traverser *********************************

// ************************ Worst Object traverser ****************************

var createTraverser = function(func, criteria)
{
    return function(o, previousKey)
    {
        traverser(o, previousKey, func, criteria);
    };
};

var traverser = function(o, previousKey, func, criteria)
{
    if(o && typeof o === 'object' && !criteria(o))
    {
        var keys = Object.getOwnPropertyNames(o);
        if(keys && keys.length)
        {
            var objects = keys.map(
                function(k){
                    return {'name':previousKey+path.sep+k, 'value':o[k]};
                });
            var f = createTraverser(func, criteria);
            array_traverser(objects, f);
        }
    }
    if(o && criteria(o))
    {
        func(previousKey, o);
    }
};

var traverse = function(o, criteria)
{
    if(!criteria)
    {
        criteria = function(o) // this is default criteria
        {
            return (typeof o === 'number' || typeof o === 'string');
        };
    }
    var m = {};
    var createMap = function(key, value)
    {
        m[key] = value;
    };

    var t = createTraverser(createMap, criteria);
    t(o,'');
    return m;
};


// ******************* End of Object traverser *******************************


var criteria = function(o)
{
    return (o instanceof KoaRouter);
};

var routesloader = function(app, router_dir)
{
    if(__dirname.indexOf(path.sep+'node_modules') !== -1)
    {
        var project_dir = __dirname.substring(0, __dirname.indexOf(path.sep+'node_modules'));
        if(!router_dir)
        {
            try{
                router_dir = config.get('routes.directory');
            }catch(e)
            {
                console.error('\n\nRoutes directory(folder) is not configured. ');
                console.error('***************************\n'
                    .concat('Please pass the directory path ')
                    .concat(' as second parameter: \n')
                    .concat(' var routesloader ')
                    .concat('= require(\'koa-folder-routes\');\n')
                    .concat(' routesloader(app, \'../controllers\');\n')
                    .concat('(OR) \n')
                    .concat('Please configure routes directory: \n')
                    .concat(' "router": {\n')
                    .concat(' "directory": "controllers" \n')
                    .concat('}\n')
                    .concat('***************************\n\n\n')
                );
            }
        }
        router_dir = project_dir+path.sep+router_dir;
        try{
            var dir = requireDir(router_dir, {recurse: true});
            var m = traverse(dir, criteria);

            if(m && typeof m === 'object')
            {
                for(var key in m)
                {
                    var r = m[key];
                    var router_path = key.substring(0,key.lastIndexOf(path.sep));
                    if(router_path === path.sep+'root')
                    {
                        router_path = '/';
                    }
                    router_path = router_path.split(path.sep).join('/');
                    r.prefix(router_path);
                    app.use(r.routes());
                    var allowedMethodsObject = {};
                    if(r.allowedMethodsObject)
                    {
                        allowedMethodsObject = r.allowedMethodsObject;
                    }
                    app.use(r.allowedMethods(r.allowedMethodsObject));
                }
            }
        }catch(e)
        {
            console.log('Please check the routes folder(directory) path \n', e);
        }
    }
};
return routesloader;
})();
