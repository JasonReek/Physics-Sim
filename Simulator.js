
// Simulator Dimensions
const SIM_WIDTH = 420;
const SIM_HEIGHT = 420;
const METER = 1;
// Gravity constant for Earth
const g = 9.8;

const canvas = document.querySelector('.SimCanvas');
const ctx = canvas.getContext('2d');
// Seconds
// ms
let frame_delay = 100;

let time_text = document.getElementById("time");
let output_text = document.getElementById("output");
let velocity_text = document.getElementById("velocity");
let acceleration_text = document.getElementById("acceleration");

// Starts grid at the bottom left side of the grid, as opposed to the
// default canvas settings that starts at the top left if (0, 0).
const GRID_ORIGIN_X = 0;
const GRID_ORIGIN_Y = SIM_HEIGHT;
// Creates a new instance of a space grid.
let space_grid = new SpaceBoxGrid(12, 12);
// Creates an instance of the ground for the simulator.
let ground = new Ground();
let ground_profile = ground.initFlatGround();
let time_counter = 0;
let impact_time = 0;
let compressed_ground = [SIM_WIDTH];
let log_text = "";
// Initiate World Objects Here:
let mass_obj = new MassObj(SIM_WIDTH/2, SIM_HEIGHT/2, 24, 24, 5, 50);
let source_origin_x_to_left = mass_obj.true_x()-1;
let source_origin_x_to_right = mass_obj.true_x()+1;
let intervalID;

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
// Start file download.
document.getElementById("dwn-btn").addEventListener("click", function(){
    // Generate download of hello.txt file with some content
    let filename = "log.txt";

    download(filename, log_text);
}, false);


function start()
{
    if (canvas.getContext)
    {
        canvas.width = (SIM_WIDTH+36);
        canvas.height = (SIM_HEIGHT+24);
        space_grid.drawSpace();
        ground.drawBoundary(ground_profile);
        drawAxis();
        mass_obj.draw();
        intervalID = window.setInterval(timeChange, frame_delay);
    }
}


// THE TIME ZONE (WHERE TIME HAPPENS!)
function timeChange()
{

    reDraw();
    time_counter +=1;

    if( ((mass_obj.y+(mass_obj.h/2)) < ground.elevation_boundary) && !mass_obj.ground_impact)
    {
        //mass_obj.acceleration = Math.abs(gaussianRand());
        mass_obj.acceleration += 1;
        mass_obj.y = mass_obj.y + mass_obj.y_velocity;
        mass_obj.y_velocity += mass_obj.acceleration;

        //for(let i =0; i<space_grid.air_res.length; i++)
        //{

        //}

        if(mass_obj.y+(mass_obj.h/2) > ground.elevation_boundary)
        {
            mass_obj.y = (ground.elevation_boundary-(mass_obj.h/2));
        }
        if(mass_obj.y+(mass_obj.h/2) >= ground.elevation_boundary)
            mass_obj.ground_impact = true;
        mass_obj.draw();
    }
    else if(mass_obj.ground_impact)
    {

        //ground magic happens here
        //true x is the center bottom surface mass of the falling mass


        //***Ground Zero

        // Change x from left
        if(impact_time === 0)
            compressed_ground = [SIM_WIDTH];
        source_origin_x_to_left = mass_obj.true_x()-1;
        source_origin_x_to_right = mass_obj.true_x()+1;


        compressed_ground[mass_obj.true_x] = ground.elevation + ground.impactCompression(mass_obj.mass, mass_obj.true_x, mass_obj.true_x, mass_obj.w+5000, impact_time);
        log_text += "Y_Origin"+compressed_ground[mass_obj.true_x].toString()+"\n\n";


        //this.impactCompression = function(m, m_x, x, t)
        while(source_origin_x_to_right < SIM_WIDTH+36)
        {
            compressed_ground[source_origin_x_to_left] = ground.elevation + ground.impactCompression(mass_obj.mass, mass_obj.true_x(), mass_obj.w+5000, source_origin_x_to_left, impact_time);
            compressed_ground[source_origin_x_to_right] = ground.elevation + ground.impactCompression(mass_obj.mass, mass_obj.true_x(), mass_obj.w+5000, source_origin_x_to_right, impact_time);
            log_text += "Final Left Y:"+compressed_ground[source_origin_x_to_left].toString()+", Initial Left Y: "+ground.elevation.toString()+", Delta Left Y: "+ground.impactCompression(mass_obj.mass, mass_obj.true_x(), mass_obj.w, source_origin_x_to_left, impact_time).toString()+", Left X: "+source_origin_x_to_left.toString()+", Time: "+impact_time.toString()+"\n";
            log_text += "Final Right Y:"+compressed_ground[source_origin_x_to_right].toString()+", Initial Right Y: "+ground.elevation.toString()+", Delta Right Y: "+ground.impactCompression(mass_obj.mass, mass_obj.true_x(), mass_obj.w, source_origin_x_to_right, impact_time).toString()+", Right X: "+source_origin_x_to_right.toString()+"\n\n";
            source_origin_x_to_left--;
            source_origin_x_to_right++;

            impact_time += 0.5;

            ground_profile = compressed_ground;
        }


        if(Math.abs(ground.impactCompression(mass_obj.mass, mass_obj.true_x(), source_origin_x_to_right, impact_time)) < 0.000001)
        {
            alert(Math.abs(ground.impactCompression(mass_obj.mass, mass_obj.true_x(), source_origin_x_to_right, impact_time)));
            window.clearInterval(intervalID);
        }



        //mass_obj.y = mass_obj.y-mass_obj.y_velocity;
        //if(mass_obj.y < 0)
        //{
        //    mass_obj.y = mass_obj.h/2;
        //    mass_obj.ground_impact = false;
        //}
        mass_obj.draw();
    }
    if(mass_obj.x+(mass_obj.w/2)<SIM_WIDTH && !mass_obj.right_wall_impact)
    {
        //mass_obj.x += mass_obj.x_velocity;
        if(mass_obj.x+(mass_obj.w/2) >= SIM_WIDTH)
            mass_obj.right_wall_impact = true;
    }
    else if(mass_obj.right_wall_impact)
    {
        //mass_obj.x -= mass_obj.x_velocity;
        if(mass_obj.x-(mass_obj.w/2) <= GRID_ORIGIN_X)
        {
            mass_obj.right_wall_impact = false;
        }
    }

    time_text.innerHTML = time_counter.toString();
    output_text.innerHTML = "X: "+mass_obj.true_x().toFixed(2)+" | "+"Y: "+mass_obj.true_y().toFixed(2);
    velocity_text.innerHTML = "X: "+mass_obj.x_velocity.toFixed(2)+" m/s "+" | Y: "+mass_obj.y_velocity.toFixed(2);


}

function reDraw()
{
    ctx.clearRect(0, 0,SIM_WIDTH, SIM_HEIGHT);
    space_grid.drawSpace();
    ground.drawBoundary(ground_profile);
}

// Draw line function
function drawLine(x1, y1, x2, y2)
{
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// Space Object
function SpaceBoxGrid(w, h, mass=1, e_field=1, h_field=1, C=0)
{
    this.C = C;
    this.w = w;
    this.h = h;
    this.mass = mass;
    this.e_field = e_field;
    this.h_field = h_field;
    this.air_res = [];

    this.drawSpace = function()
    {
        ctx.strokeStyle = "#eeeeee";
        // changes up to next row starting from the bottom defined origin (0, 0).
        for(let i=0; i<SIM_HEIGHT; i+=12)
        {
            // draws box in each column
            for (let j = 0; j < SIM_WIDTH; j += 12)
            {
                let air = {x: j, y: i, a_res: this.C+Math.abs(gaussianRand())};
                this.air_res.push(air);

                ctx.beginPath();
                // Draws bottom horizontal line of box
                //drawLine(GRID_ORIGIN_X, GRID_ORIGIN_Y, w, GRID_ORIGIN_Y);
                // Draws left vertical line of box
                drawLine(j, GRID_ORIGIN_Y-i, j, GRID_ORIGIN_Y-h-i);
                // Draws top horizontal line of box
                drawLine(j, GRID_ORIGIN_Y-h-i, w + j, GRID_ORIGIN_Y-h-i);
                // Draws left vertical line of box
                drawLine(w + j, GRID_ORIGIN_Y-i, w + j, GRID_ORIGIN_Y-h-i);
            }
        }
    }
}

// Mass Object
function MassObj(x, y, w, h, mass, x_velocity=1, y_velocity=1)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.acceleration = 0;
    this.mass = mass;
    this.x_velocity = x_velocity;
    this.y_velocity = y_velocity;
    this.ground_impact = false;
    this.right_wall_impact = false;
    this.current_elevation = 0;
    this.velocity_of_sound = 1000;

    this.true_x = function () {
      return this.x+(this.w/2);
    };
    this.true_y = function () {
        return this.y-(this.h/2);
    };

    this.draw = function ()
        {
            ctx.fillStyle = "#0039F2";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }

}

// Ground Object
function Ground(elevation=12)
{
    this.position_x = GRID_ORIGIN_X;
    // Elevation
    this.elevation = elevation;
    this.elevation_boundary = GRID_ORIGIN_Y-this.elevation;
    this.velocity_of_sound = 1000;
    this.d = 0.1;
    this.E = 10;

    this.initFlatGround = function () {
        let ground_ys = [SIM_WIDTH];
        for(let i = 0; i<SIM_WIDTH; i++)
            ground_ys[i] = this.elevation;
        return ground_ys;
    };

    this.impactCompression = function(m, m_x, m_w, x, t)
    {
        //function deltaY(v, d, E, l_s, x_0, x, t)
        return deltaY(this.velocity_of_sound, this.d, this.E, m_w, m_x, x, t);
    };

    this.drawBoundary = function (ground_ys)
    {
        for(let i = 0; i<SIM_WIDTH; i++)
            drawPixel(GRID_ORIGIN_X+i, GRID_ORIGIN_Y-ground_ys[i]);
    };
}

function drawPixel(x, y)
{
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, 1, 1);
}

// Circle Object
function Circle(x, y, r, stroke) {
    this.startingAngle = 0;
    this.endAngle = 2 * Math.PI;
    this.x = x;
    this.y = y;
    this.r = r;

    this.stroke = stroke;

    this.drawCir = function () {
        ctx.beginPath();
        // Treating r as a diameter to mimic java oval() function.
        // arc() method doesn't center to diameter, but builds out from origin.
        // I've added the radius to center the oval/circle object to grid.
        // -Jason
        ctx.arc(this.x+((this.r/2)), this.y+((this.r/2)), this.r/2, this.startingAngle, this.endAngle);
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.stroke;
        ctx.stroke();
    }
}

// Draw Axes and Labels for x, gravity value, and depth.
function drawAxis()
{
    ctx.font = "10px Arial";

    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    let counter = 0;
    // X axis
    drawLine(GRID_ORIGIN_X, GRID_ORIGIN_Y+12, SIM_WIDTH+1, GRID_ORIGIN_Y+12);
    drawLine(1, GRID_ORIGIN_Y+12, 1, GRID_ORIGIN_Y+3);
    for (let i = GRID_ORIGIN_X; i <= SIM_WIDTH; i += 10)
    {
        if(counter % 3 === 0)
        {
            ctx.fillText((i.toString()), GRID_ORIGIN_X+i, GRID_ORIGIN_Y+22);
            drawLine(i, GRID_ORIGIN_Y+12, i, GRID_ORIGIN_Y+3);
        }
        else
            drawLine(i, GRID_ORIGIN_Y+12, i, GRID_ORIGIN_Y+6);
        counter += 1;
    }
    ctx.fillText("(m)", SIM_WIDTH+20, GRID_ORIGIN_Y+20);
    counter = 0;
    // Y axis
    drawLine(SIM_WIDTH+12, GRID_ORIGIN_Y+1, SIM_WIDTH+12, 0);
    drawLine(SIM_WIDTH+12, 1, SIM_WIDTH+6, 1);
    ctx.fillText((SIM_HEIGHT.toString( )), SIM_WIDTH+16, 8);
    for (let i = 0; i <= SIM_HEIGHT; i += 10)
    {
        if(counter % 3 === 0)
        {
            if(i !== 0)
                ctx.fillText(((SIM_WIDTH-i).toString()), SIM_WIDTH+16, i+6);
            drawLine(SIM_WIDTH+12, i, SIM_WIDTH+6, i);
        }
        else
            drawLine(SIM_WIDTH+12, i, SIM_WIDTH+9, i);

        counter += 1;
    }


    ctx.stroke();
}

function gaussianRand()
{
    let x1, x2, rad, y1;
    do {
        x1 = 2 * Math.random() - 1;
        x2 = 2 * Math.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad >= 1 || rad === 0);
    let c = Math.sqrt(-2 * Math.log(rad) / rad);
    return (x1 * c);
}

// *** Delta y ***
// delta y - The change in y from the ground to the compressed ground.
// omega (w) - Angular frequency (radians / second).
// t - is for time.
// d - The viscous friction coefficient of the material.
// v - speed of sound (speed of compression).
// l_s - The length of the surface.
function deltaY(v, d, E, l_s, x_0, x, t)
{
    let k = 1/l_s;
    let w = k*v;
    return-(Math.exp(-d*t)*E*Math.sin(k*(x+x_0)+w*t));
}


