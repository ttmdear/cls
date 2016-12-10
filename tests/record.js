var Record = cls.class({
    // The word "abstract" indicates whether the object can be created that
    // class.  If the value is not defined, it will be set to "false".
    abstract : true,

    // The following attributes are defined static.  All attributes are public.
    static : {
        records : [],
        numOfRecords : function()
        {
            return this.records.length;
        },
        allRecords : function()
        {
            return this.records;
        },
        registerRecord : function(record)
        {
            if (!(record instanceof this.self)) {
                throw("Record must be instance of Record class");
            }

            this.records.push(record);
        },
        positionOf : function(toCheck)
        {
            // Each static method is called in the context of a static object.
            var records = this.allRecords();
            var position = null;

            records.forEach(function(record, index){
                if (record === toCheck) {
                    position = index;
                }
            });

            return position;
        }
    },

    // Private space object is defined by the word "private". IN
    // the definition should not be objects. So, the following definition is
    // incorrect:
    // private : {
    //     owner : new Owner('Max')
    // }
    //
    // Objects in the private space should be initiated by the constructor
    // ("init"); This assumption stems from the specificity of the language.
    private : {
        data : null,
        validateData : function(data)
        {
            if (data[this.idAttribute] === undefined) {
                throw("Data do not contain ID attribute");
            }

            return true;
        }
    },
    // Space "protected" is similar to "private" except that it is shared by
    // all objects inherit. Here, as for the "private" do not initiate objects
    // in the definition. So this definition is incorrect :
    // protected : {
    //     table : new Table('workers')
    // }
    protected : {
        table : null,
        idAttribute : null,
    },

    // Any method which was not declared in the "private", "static",
    // "protected" will be treated as a public.

    // public
    // It is the object constructor.
    init : function(data)
    {
        data = data === undefined ? {} : data;

        this.validateData(data);

        this.data = data;

        // The method is invoked in the context of private space object, not
        // that the same thing is an instance of an object. The object instance
        // is available under the variable "instance"
        this.static.registerRecord(this.instance);
    },
    save : function()
    {
        console.log('Save data of ' + this + ' at ' + this.table);
        return this;
    },
    delete : function()
    {
        console.log('Delete data at ' + this.table);
        return this;
    },
    get : function(name)
    {
        return this.data[name];
    },
    set : function(name, value)
    {
        this.data[name] = value;
    }
});

var Owner = cls.class({
    private : {
        name : null
    },
    init : function(name)
    {
        this.name = name;
    },
    toString : function()
    {
        return this.name;
    }
});

var Animal = cls.class({
    extends : Record,
    private : {
        owner : null,
    },
    init : function(owner, data)
    {
        this.supper(data);
        this.owner = owner;
    },
    save : function()
    {
        console.log(this.owner + ' agree to save ' + this);
        this.supper();
        return this;
    },
    toString : function()
    {
        return this.get('name');
    },
    position : function()
    {
        // In this version, there is no inheritance static. Therefore, such a
        // provision will not work.this.static.positionOf(this.instance)
        // But you can reference by class definition.
        return Record.positionOf(this.instance);
    }
});

var Cat = cls.class({
    extends : Animal,
    protected : {
        table : 'cats',
        idAttribute : 'id'
    }
});

var Dog = cls.class({
    extends : Animal,
    protected : {
        table : 'dogs',
        idAttribute : 'idOfDog'
    }
});

// creating objects
var dog1 = new Dog(new Owner("John"), {
    'name' : 'Rex',
    'age' : 10,
    'idOfDog' : 18,
});

var dog2 = new Dog(new Owner("Max"), {
    'name' : 'Max',
    'age' : 5,
    'idOfDog' : 14,
});

var cat1 = new Cat(new Owner("Jay"), {
    'name' : 'Tigger',
    'age' : 2,
    'id' : 10
});

var cat2 = new Cat(new Owner("Mike"), {
    'name' : 'Molly',
    'age' : 1,
    'id' : 11
});

dog1.save();
// John agree to save Rex
// Save data of Rex at dogs

dog2.save();
// Max agree to save Max
// Save data of Max at dogs

cat1.save();
// Jay agree to save Tigger
// Save data of Tigger at cats

cat2.save();
// Mike agree to save Molly
// Save data of Molly at cats

// Static scope
// Record.registerRecord(new Owner("Janek"));
// Uncaught Record must be instance of Record class

Record.numOfRecords();
// 4

// instanceof
console.log(dog1 instanceof Record);// true
console.log(dog1 instanceof Animal);// true
console.log(dog1 instanceof Dog);// true
console.log(dog1 instanceof Cat);// false
