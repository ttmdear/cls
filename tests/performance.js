function snow()
{
    var ui = {
        canvas : document.getElementById('canvas'),
        time : document.getElementById('time'),
        avtime : document.getElementById('avtime'),
        numberOfSnowflakes : document.getElementById('numberOfSnowflakes'),
        start : document.getElementById('start'),
        stop : document.getElementById('stop'),
    };

    var interval;

    var ctx = canvas.getContext("2d");

    var time = function()
    {
        return new Date().getTime();
    }

    var Snowflake = cls.class({
        abstract : true,
        private : {
            ctx : null,
            operator : null,
        },
        protected : {
            size : null,
            resistance  : null,
            x : null,
            y : null
        },

        init : function(operator, ctx, x, y)
        {
            x = x === undefined ? 0 : x;
            y = y === undefined ? 0 : y;

            this.operator = operator;
            this.ctx = ctx;
            this.x = x;
            this.y = y;
        },

        render : function()
        {
            var direct = this.operator.direct();
            var windSpeed = this.operator.windSpeed();
            var fallingSpeed = this.operator.fallingSpeed();

            this.x = this.x + (direct * windSpeed);
            this.y = this.y + (1 * fallingSpeed);

            if (this.y > this.operator.height()) {
                this.y = 0;
            }

            if (this.x < 0) {
                this.x = 0;
            }

            if (this.x > this.operator.width()) {
                this.x = this.operator.width();
            }

            this.ctx.fillStyle = "rgb(200,0,0)";
            this.ctx.fillRect (this.x, this.y, this.size, this.size);
        }
    });

    var Small = cls.class({
        extends : Snowflake,
        protected : {
            size : 5,
            resistance  : null,
        },
    });

    var Medium = cls.class({
        extends : Snowflake,
        protected : {
            size : 7,
            resistance  : null,
        },
    });

    var Big = cls.class({
        extends : Snowflake,
        protected : {
            size : 10,
            resistance  : null,
        },
    });

    var Snowflakes = cls.class({
        private : {
            snowflakes : null,
            operator : null,
            ctx : null,
        },

        init : function(operator, ctx)
        {
            this.snowflakes = [];
            this.operator = operator;
            this.ctx = ctx;
        },

        add : function(snowflake)
        {
            this.snowflakes.push(snowflake);

            return this;
        },

        count : function()
        {
            return this.snowflakes.length;
        },

        create : function(type)
        {
            var snowflake;

            var x = Math.floor(Math.random() * 500);
            var y = 0;

            switch (type) {
                case 'Small':
                    snowflake = new Small(this.operator, this.ctx, x, y);
                    break;
                case 'Medium':
                    snowflake = new Medium(this.operator, this.ctx, x, y);
                case 'Big':
                    snowflake = new Big(this.operator, this.ctx, x, y);
            }

            this.add(snowflake);
        },

        clear : function()
        {
            ctx.clearRect(0,0,1000,1000)
            this.snowflakes = [];
            return this;
        },

        render : function()
        {
            // clean canvas
            ctx.clearRect(0,0,1000,1000)

            // and repring
            for(var i in this.snowflakes){
                this.snowflakes[i].render();
            }
        }
    });

    var Interval = cls.class({
        private : {
            interval : null,
            snowflakes : null
        },

        init : function(snowflakes)
        {
            this.snowflakes = snowflakes;
        },

        start : function()
        {
            var $t = this;
            var lastTime;

            var i = 5;
            var times = 0;

            this.interval = setInterval(function(){

                for(var j=0; j<i; j++){
                    $t.snowflakes.create('Small');
                }

                lastTime = time();

                $t.snowflakes.render();

                ui.numberOfSnowflakes.value = $t.snowflakes.count();

                var tmpTime = time();
                var value = tmpTime - lastTime;
                ui.time.value = value;

                times += value;
                // console.log(times, $t.snowflakes.count());
                //console.log('times', (times/$t.snowflakes.count()));
                ui.avtime.value = times/$t.snowflakes.count();

            }, 50);
        },
        stop : function()
        {
            clearInterval(this.interval);
            this.snowflakes.clear();
        }
    });

    var Operator = cls.class({

        private : {
            lastDirect : 1,
            width : null,
            height : null
        },

        init : function(width, height)
        {
            this.width = width;
            this.height = height;
        },

        height : function()
        {
            return this.height;
        },

        width : function()
        {
            return this.width;
        },

        direct : function()
        {
            // return 1;
            var direct = Math.random();

            if (direct < 0.5) {
                direct = -1;
            }else{
                direct = 1;
            }

            return direct;
        },

        fallingSpeed : function()
        {
            return 1;
        },

        windSpeed : function()
        {
            return 10;
        },
    });

    var snowflakes = new Snowflakes(new Operator(ui.canvas.height, ui.canvas.width), ctx);

    ui.start.addEventListener('click', function(){
        interval = new Interval(snowflakes);
        interval.start();
    });

    ui.stop.addEventListener('click', function(){
        interval.stop();
    });

}


