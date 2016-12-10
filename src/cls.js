/*
 * (c) ttmdear <ttmdear@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function (scope, factory) {
    if (typeof define === "function" && define.amd) {
        define(function(){
            return factory();
        });

    } else if (typeof module === "object" && module.exports) {
        module.exports = function() {
            return factory();
        };

    } else {
        scope.cls = factory();
    }

}(this, function () {
    "use strict";

    var _ = {
        // prze
        protected : {},
        id : 0,
        modules : {

        }
    };

    /**
     * Generuje unikalne ID
     */
    function uniqueID()
    {
        _.id++;
        return 'id'+_.id;
    }

    function eachOwn(object, foreach, types)
    {
        types = types === undefined ? [] : types;

        for(var i in object){

            if (types.length) {
                for(var type in types){
                    if (isTypeOf(object[i], typs[type])) {
                        continue;
                    }
                }
            }

            if (object.hasOwnProperty(i)) {
                if(foreach(object[i], i, object) === false){
                    return;
                }
            }else{
            }
        }
    }

    function isTypeOf(variable, type)
    {
        switch(type){
            case 'Array' :
                return Array.isArray(variable);
            default :
                return typeof variable === type;
        }
    }

    function mixe(object, mixe, ommit, clean, block, only)
    {
        ommit = ommit === undefined ? [] : ommit;
        clean = clean === undefined ? false : clean;
        block = block === undefined ? false : block;
        only = only === undefined ? false : only;

        for(var attribute in mixe){
            if(mixe.hasOwnProperty(attribute)){
                if (ommit.indexOf(attribute) >= 0) {
                    continue;
                }

                if (only !== false) {
                    if (only.indexOf(attribute) === -1) {
                        continue;
                    }
                }

                if (block) {
                    df(object, attribute, mixe[attribute]);
                }else{
                    object[attribute] = mixe[attribute];
                }

                if (clean) {
                    delete mixe[attribute];
                }
            }
        }
    }

    function df(object, property, value)
    {
        Object.defineProperty(object, property, {
            configurable : false,
            enumerable : false,
            value : value,
            writable : false
        });
    }

    function isDefined(variable)
    {
        return !isUndefined(variable);
    }

    function isUndefined(variable)
    {
        return variable === undefined;
    }

    function createChain(object, attribute, begin)
    {
        if (object.__proto__) {
            var parentProto = createChain(object.__proto__, attribute, begin);

            if (object.hasOwnProperty(attribute)) {
                var tmp = Object.create(parentProto);

                mixe(tmp, object[attribute]);
                df(tmp, 'defID', object.defID);
                return tmp;
            }else{
                // nie mam takiego atrybutu wiec zwracam rodzica
                return parentProto;
            }

            var objectAttribute = Object.create(begin);
            mixe(objectAttribute, object[attribute]);

        }else{
            // doszedlem do konca
            if (object.hasOwnProperty(attribute)) {
                // obiekt ma taka wlasciwosc na postawie ktorej tworzony jest
                // chain
                var tmp = Object.create(begin);

                // kopiuje walsciwosci z tego atrybutu
                mixe(tmp, object[attribute]);
                return tmp;
            }else{
                // obiekt nie ma takiej wlasnyi, wiec zwracam poczatek
                return begin;
            }
        }
    }

    function moveToProto(object, own, ommit)
    {
        ommit = ommit === undefined ? [] : ommit;

        for(var attribute in object){
            if (object.hasOwnProperty(attribute)) {
                if (ommit.indexOf(attribute) !== -1) {
                    continue;
                }

                if (own.indexOf(attribute) === -1) {
                    object.__proto__[attribute] = object[attribute];
                    delete object[attribute];
                }
            }
        }
    }

    function wrapObjectMethods(at, chain)
    {
        chain = chain === undefined ? true : chain;

        if (!at.hasOwnProperty('wrappered')) {
            eachOwn(at, function(value, attribute){
                if (!isTypeOf(value, 'function')) {
                    // przepisuje wlasciwosc
                    at[attribute] = value;
                }else{
                    at[attribute] = function(){
                        // referencja na obiekt wywolujacy
                        var context;

                        if (this.hasOwnProperty('context')) {
                            // jesli metoda jest wywolana z context obiektu,
                            // czyli wywolanie metody publicznej ktora jest
                            // wywolywana na poczatku z contextu obiektu
                            context = this.context;
                        }else{
                            context = this;
                        }

                        // przepisanie wartosci z private
                        eachOwn(context.call, function(call, defID){
                            moveToProto(call, call.private, ['supper']);
                        });

                        var call;

                        // niema przestrzeni call wiec taka tworze
                        if (isUndefined(context.call[at.defID])) {
                            call = Object.create(context);

                            // kopiuje attrybuty prywatne do contextu
                            mixe(call, at.private);
                            df(call, 'private', Object.keys(at.private));

                            // zapisuje context do obiektu
                            context.call[at.defID] = call;

                            // do przestrzeni call zapisuje referencje
                            // contextu, wynika to stad ze jesli wywolam metode
                            // prywatna z poziomu metody prywatnej do musze
                            // miec referencje do contextu
                            df(call, 'context', context);
                            df(call, 'instance', context.instance);
                            // df(call, '_name', 'call');
                        }else{
                            call = context.call[at.defID];
                        }

                        if (call.suppers === undefined) {
                            call.suppers = [];
                        }

                        call.suppers.push(attribute);

                        // todo : trzeba zabezpieczyc sie przed operacjami
                        // asynchronicznymi
                        call.supper = function(){
                            var context = this;
                            var attribute = call.suppers[call.suppers.length-1];

                            if (isDefined(at.__proto__[attribute])) {
                                return at.__proto__[attribute].apply(this, arguments);
                            }else{
                                throw("There is no supper method "+attribute);
                            }
                        }

                        var result = value.apply(call, arguments);
                        call.suppers.pop();

                        if (result === call) {
                            return context.instance;
                        }

                        return result;
                    }
                }
            });
        }

        // dodaje flage wrappered okreslic ze dane metody w obiekcie zostaly
        // owrapowane, chodzi tutaj o metody publiczne ktore sa w proto, a dane
        // proto jest wspoldzielone przez wiele definicji
        df(at, 'wrappered', true);

        if (!at.hasOwnProperty('root') && chain) {
            return wrapObjectMethods(at.__proto__, true);
        }

        return true;
    }

    function imp(objectA, objectB)
    {
        var fnA = Object.keys(objectA);

        for(var attribute in objectB){
            var value = objectB[attribute];

            if (fnA.indexOf(attribute) === -1) {
                return false;
            }
        }

        return true;
    }

    function hashDef(def)
    {
        var string = "";

        for(var attribute in def){
            if (!def.hasOwnProperty(attribute)) {
                continue;
            }

            var value = def[attribute];

            if (isTypeOf(value, 'function')) {
                string += value.toString();
            }else{
                string += value;
            }
        }
    }

    function setupModules(proto, modules)
    {
        eachOwn(modules, function(module){
            module = module.prototype;

            // przenosze atrybuty private, protected, static oraz public
            mixe(proto.private, module.private);
            mixe(proto.protected, module.protected);
            mixe(proto.static, module.static);

            // public
            mixe(proto, module, [
                'abstract',
                'implements',
                'modules',

                'protected',
                'private',
                'static',
            ]);

            if (module.hasOwnProperty('modules')) {
                if (module.modules.length) {
                    setupModules(proto, module.__proto__.modules);
                }
            }
        });
    }

    // 1. Dla kazdej definicji musze okreslic wlasny protected chain
    function define(def)
    {
        // hashDef(def);
        var proto;

        def.protected = def.protected === undefined ? {} : def.protected;
        def.private = def.private === undefined ? {} : def.private;
        def.static = def.static === undefined ? {} : def.static;
        def.abstract = def.abstract === undefined ? false : def.abstract;
        def.modules = def.modules === undefined ? [] : def.modules;

        if (def.extends) {
            proto = Object.create(def.extends.prototype);
        }else{
            proto = Object.create(Object.prototype);
            df(proto, 'root', true);
        }

        // przypisuje defID
        var defID;

        if (isDefined(def.defID)) {
            defID = def.defID;
            delete def.defID;
        }else{
            defID = uniqueID();
        }

        df(proto, 'defID', defID);

        // przenoszenie informacji o klasie
        mixe(proto, def, [], true, true, [
            'abstract',
            'implements',
            'protected',
            'private',
            // 'modules',
            // 'extends',
        ]);

        // reszta atrybutow jest publiczna z wyjatkiem extends i static
        mixe(proto, def, ['static', 'extends'], true, false);

        // modules
        setupModules(proto, proto.modules);

        // dla kazdej klasy jest tworzony odpowidni protected chain, nastepnie
        // jest zapisywany w przestrzeni wspolnej
        var _protected = createChain(proto, 'protected', proto);

        // protected -> protected -> proto -> proto
        wrapObjectMethods(_protected, true);

        _.protected[defID] = _protected;

        // implements
        if (proto.hasOwnProperty('implements')) {
            for(var i in proto.implements){
                var def = proto.implements[i];

                if (!imp(proto, def.prototype)) {
                    throw("Not all methods are implemented");
                }
            }
        }

        // module

        // init
        var init = function()
        {
            if (this.abstract) {
                throw("The class can't not be created because is abstract.");
            }

            // dla kazdego obiektu tworzony jest jego context, w tym kontekscie
            // sa wywolywane metody
            var context = Object.create(_.protected[this.defID]);

            // w kontekscie jest zmienna call ktora przetrzymuje wywolania do
            df(context, 'call', {});
            df(context, 'instance', this);
            df(context, '_name', 'context');

            // referencja do contextu jest przetrzymywana w obiekcie
            df(this, 'context', context);

            if (isDefined(this.init)) {
                this.init.apply(this, arguments);
            }
        }

        // static
        if (def.static) {
            var dstatic = def.static;

            var _static;

            if(def.extends){
                _static = Object.create(def.extends.prototype.static);
            }else{
                _static = {};
            }

            mixe(_static, dstatic);

            eachOwn(_static, function(value, attribute){
                if (isTypeOf(value, 'function')) {
                    _static[attribute] = function(){
                        return value.apply(_static, arguments);
                    }
                }else{
                    return;
                }
            });

            df(_static, 'self', init);

            proto.static = _static;

            // metody statyczne binduje do constructora
            for(var attribute in _static){
                var value = _static[attribute];

                if (isTypeOf(value, 'function')) {
                    init[attribute] = value.bind(_static);
                }
            }
        }

        df(proto, 'constructor', init);
        init.prototype = proto;

        return init;
    }

    return {
        class : define
    };
}));
