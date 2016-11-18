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

var defaultCriteria = function(o)
{
    return (typeof o === 'number' || typeof o === 'string');
};

var criteria = defaultCriteria;

var createTraverser = function(func)
{
    return function(o, previousKey)
    {
        traverser(o, previousKey, func);
    };
};

var traverser = function(o, previousKey, func)
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
            var f = createTraverser(func);
            array_traverser(objects, f);
        }
    }
    if(o && criteria(o))
    {
        func(previousKey, o);
    }
};

var traverse = function(o, c)
{
    if(c)
    {
        criteria = c;
    }
    var m = {};
    var createMap = function(key, value)
    {
        m[key] = value;
    };

    var t = createTraverser(createMap);
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
                console.error('Routes directory(folder) is not configured. ');
                console.error('Please pass the directory path '
                    +' as second parameter: '
                    +' var routesloader = require(\'koa-folder-routes\');'
                    +' routesloader(app, \'../controllers\');'
                    +' (OR) \n'
                    +'Please configure routes directory: '
                    +' "router": {\n'
                    +' "directory": "controllers" \n'
                    +'}\n'
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
                    app.use(r.allowedMethods(r.allowedMethodsObject));
                }
            }
        }catch(e)
        {
            console.log('Please check the routes folder(directory) path \n', e);
        }
    }
};

module.exports = routesloader;
