QUnit.test( "Simple counter", function( assert ) {
    var Record = cls.class({
        private :{
            counter : 0
        },
        init : function(initCount)
        {
            this.counter = initCount;
        },
        add : function()
        {
            this.counter++;
        },
        counter : function()
        {
            return this.counter;
        }
    });

    var c1 = new Record(10);
    var c2 = new Record(20);

    for(var i=1; i<=1000; i++){
        c1.add();
        c2.add();
    }

    assert.ok(c1.counter() === 1010);
    assert.ok(c2.counter() === 1020);
});

QUnit.test( "Complex counter", function( assert ) {
    var Record = cls.class({
        protected : {
            counter : 0
        },
        add : function()
        {
            this.counter++;
            return this;
        },
        counter : function()
        {
            return this.counter;
        }
    });

    var R1 = cls.class({
        extends : Record
    });

    var R2 = cls.class({
        extends : Record,
        protected : {
            counter : 10
        }
    });

    var R3 = cls.class({
        extends : Record,
        protected : {
            counter : 20
        },
        add : function()
        {
            this.supper();
            return this;
        },
    });

    var r1 = new R1();
    var r2 = new R2();
    var r3 = new R3();

    for(var i=1; i<=500; i++){
        r1.add()
          .add()
        ;

        r2.add()
          .add()
        ;

        r3.add()
          .add()
        ;
    }

    assert.ok(r1.counter() === 1000);
    assert.ok(r2.counter() === 1010);
    assert.ok(r3.counter() === 1020);
});

QUnit.test("Return this", function(assert) {
    var Record = cls.class({
        getThis : function(){
            return this;
        }
    });

    var R1 = cls.class({
        extends : Record
    });

    var R2 = cls.class({
        extends : Record,
        getThis : function()
        {
            return this;
        }
    });

    var r1 = new R1();
    var r2 = new R2();

    assert.ok(r1 === r1.getThis());
    assert.ok(r2 === r2.getThis());
});

QUnit.test("Change protected and call", function(assert) {
    var Record = cls.class({
        protected : {
            table : null,
            fetch : function()
            {
                return this.table;
            }
        },
    });

    var R1 = cls.class({
        extends : Record,
        run : function()
        {
            this.table = 'workers';
            return this.fetch();
        }
    });

    var R2 = cls.class({
        extends : Record,
        run : function()
        {
            this.table = 'games';
            return this.fetch();
        }
    });

    var r1 = new R1();
    var r2 = new R2();

    assert.ok(r1.run() === "workers");
    assert.ok(r2.run() === "games");
});


