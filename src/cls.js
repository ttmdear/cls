(function (scope, factory) {
    if (typeof define === "function" && define.amd) {
        define(function(taskm){
            return factory(taskm);
        });

    } else if (typeof module === "object" && module.exports) {
        module.exports = function() {
            return factory();
        };

    } else {
        scope.cls = factory(scope.taskm);
    }

}(this, function () {
    "use strict";

    var modules = {
        base : {
            init : function(){},
            isInstanceOf : function(def)
            {
                if (this instanceof def) {
                    return true;
                }

                var thisReflect = new Reflect(this.contructor);
                var defReflect = new Reflect(def);

                var thisInterfaces = thisReflect.getInterfaces();
                var defReflect = defReflect.getInterfaces();

                if (thisInterfaces.indexOf(def) >= 0) {
                    return true;
                }

                return false;
            },
            assertInstanceOf : function(def)
            {
                if (!this.isInstanceOf(def)) {
                    throw("Is not instance of");
                }
            }
        },
        events : {
            init : function()
            {
                this.events = {};
            },
            on : function()
            {
            },
            trigger : function()
            {

            }
        }
    }

    function mixe(object, mixe, ommit, clean) {
        ommit = ommit === undefined ? [] : ommit;
        clean = clean === undefined ? false : clean;

        for(var attribute in mixe){
            if(mixe.hasOwnProperty(attribute)){
                if (ommit.indexOf(attribute) >= 0) {
                    continue;
                }

                object[attribute] = mixe[attribute];

                if (clean) {
                    delete mixe[attribute];
                }
            }
        }
    }

    function each(object, call, hasOwnProperty) {
        hasOwnProperty = hasOwnProperty === undefined ? true : false;
        for(var attribute in object){
            if (hasOwnProperty && object.hasOwnProperty(attribute)) {
                if(call.call(object, object[attribute], attribute) == false){
                    break;
                }
            }
        }

    }

    function isTypeOf(variable, type) {
        switch(type){
            case 'Array' :
                return Array.isArray(variable);
            default :
                return typeof variable === type;
        }
    }

    function assert(expresion, msg) {
        if (expresion === false) {
            throw(msg);
        }
    }

    function Reflect(def)
    {
        this.getMethods = function()
        {
            var api = [];

            for(var attribute in def.prototype){
                var value = def.prototype[attribute];

                if (isTypeOf(value, 'function')) {
                    api.push(attribute);
                }
            }

            for(var attribute in def.prototype.static){
                var value = def.prototype.static[attribute];

                if (isTypeOf(value, 'function')) {
                    api.push("static."+attribute);
                }
            }

            return api;
        }

        this.getInterfaces = function()
        {
            var api = [];

            function traverse(start)
            {
                var interfaces = [];

                if (start.hasOwnProperty('_implements')) {
                    Array.prototype.push.apply(interfaces, start._implements);
                }

                if (start.__proto__ !== null) {
                    Array.prototype.push.apply(interfaces,traverse(start.__proto__));
                }

                return interfaces;
            }

            var interfacesTmp = traverse(def.prototype);
            var interfaces = [];

            for(var i in interfacesTmp){
                if (interfaces.indexOf(interfacesTmp[i]) == -1) {
                    interfaces.push(interfacesTmp[i]);
                }
            }

            return interfaces;
        }

        this.isAbstract = function()
        {

        }
    };

    function cls(def)
    {
        // nasze proto
        var proto;

        def._extends = def._extends === undefined ? null : def._extends;
        def._abstract = def._abstract === undefined ? false : def._abstract;
        def._implements = def._implements === undefined ? [] : def._implements;
        def._static = def._static === undefined ? {} : def._static;
        def._private = def._private === undefined ? [] : def._private;

        if (def._extends !== null) {
            assert(isTypeOf(def._extends, 'function'), "_extends must be class");

            // dziedziczymy wiec tworze proto ktorego __proto__ jest rowne
            // prototype klasy z ktorej dziedzicze
            proto = Object.create(def._extends.prototype);
        }else{
            // nie ma dziedziczenia, wiec proto jest prototype Object
            // standardowe zachowanie dla tworzenia obiektu przez {}
            proto = Object.create(Object.prototype);
            proto.init = function(){};

            Object.defineProperty(proto, '_modules', {
                configurable : false,
                enumerable : false,
                value : [],
                writable : false
            });

            for(var model in modules){
                var model = modules[model];

                mixe(proto, model, ['init']);

                if (model.hasOwnProperty('init')) {
                    proto._modules.push(model.init);
                }
            }
        }

        // metadane ktore zostana zapisane w strukturze klasy
        var metadata = [
            '_extends',
            '_abstract',
            '_implements',
            '_private',
        ];

        // atrybutu ktore maja byc pominiete
        var ommit = [
            '_static'
        ];

        assert(isTypeOf(def._abstract, 'boolean'), "_abstract must be boolean");
        assert(isTypeOf(def._implements, 'Array'), "_implements must be array");

        // przechodze po wszystkich atrybutach z definicji
        for(var attribute in def){
            var value = def[attribute];

            if (def.hasOwnProperty(attribute) && ommit.indexOf(attribute) == -1) {

                if (metadata.indexOf(attribute) >= 0) {
                    // atrybutu informacyjne klasy
                    Object.defineProperty(proto, attribute, {
                        configurable : false,
                        enumerable : false,
                        value : value,
                        writable : false
                    });

                }else if(isTypeOf(value, 'function')) {
                    var wrapper = function(proto, value, attribute) {
                        proto[attribute] = function() {
                            var context = this;
                            var wrapperObj = Object.create(context);

                            wrapperObj.supper = function() {
                                mixe(context, wrapperObj, ['supper'], true);

                                if (proto.__proto__[attribute] !== undefined) {
                                    proto.__proto__[attribute].apply(context, arguments);
                                }
                            }

                            var result = value.apply(wrapperObj, arguments);
                            mixe(context, wrapperObj, ['supper'], true);

                            return result;
                        }
                    }

                    wrapper.bind(this, proto, value, attribute)();
                }else{
                    proto[attribute] = value;
                }
            }
        }


        var init = function(object){
            if (this._abstract === true) {
                throw("The abstract class can not be create.");
            }

            // init modules
            for(var i in this._modules){
                var module = this._modules[i];
                module.call(this);
            }

            this.private = {};
            if (this.__proto__.hasOwnProperty('_private')) {
                mixe(this.private, this._private);
            }

            this.init.apply(this, arguments);
        }

        // jedynie function.prototype dodaje contructor, tutaj musze dodac
        // recznie
        Object.defineProperty(proto, 'contructor', {
            configurable : false,
            enumerable : false,
            value : init,
            writable : false
        });

        // _static
        var staticProto = proto.static === undefined ? {} : proto.static;
        var staticScope = Object.create(staticProto);
        var staticDef = def._static;

        for(var attribute in staticDef){
            var value = staticDef[attribute];

            if (staticDef.hasOwnProperty(attribute)) {
                if(isTypeOf(value, 'function')) {
                    var wrapper = function(staticScope, value, attribute) {
                        staticScope[attribute] = function() {
                            var context = this;
                            var wrapperObj = Object.create(context);

                            wrapperObj.supper = function() {
                                mixe(context, wrapperObj, ['supper'], true);
                                if (staticScope.__proto__[attribute] !== undefined) {
                                    staticScope.__proto__[attribute].apply(context, arguments);
                                }
                            }

                            var result = value.apply(wrapperObj, arguments);
                            mixe(context, wrapperObj, ['supper'], true);

                            return result;
                        }
                    }

                    wrapper.bind(this, staticScope, value, attribute)();
                }else{
                    staticScope[attribute] = value;
                }
            }
        }

        Object.defineProperty(staticScope, 'self', {
            configurable : false,
            enumerable : false,
            value : init,
            writable : false
        });

        proto.static = staticScope;

        init.prototype = proto;

        // implements
        var reflection = new Reflect(init);
        var defApi = reflection.getMethods();
        var interfaces = reflection.getInterfaces();
        var notImplemented = [];

        for(var i in interfaces){
            var reflection = new Reflect(interfaces[i]);
            var methods = reflection.getMethods();

            for(var i in methods){
                var method = methods[i];

                if (defApi.indexOf(method) == -1) {
                    notImplemented.push(method);
                }
            }
        }

        if (notImplemented.length > 0) {
            throw("Class must implements methods "+notImplemented.join(','));
        }

        // console.log('static', proto.static);
        // attach static object
        for(var i in proto.static){
            init[i] = proto.static[i].bind(proto.static);
        }

        return init;
    }

    return {
        class : cls,
        loadModule : function(name, module){
            modules[name] = module;
        }
    };
}));
