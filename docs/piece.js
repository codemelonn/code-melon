
const shapes = [
    // P 
    [
        [2, 2, 0],
        [2, 2, 0],
        [2, 0, 0]
    ], 
    // E
    [
        [3, 3, 0], 
        [3, 0, 0],
        [3, 3, 0]
    ],
    // A 
    [
        [0, 4, 0],
        [4, 4, 4],
        [4, 0, 4]
    ],
    //R
    [
        [5, 5, 0, 0],
        [5, 5, 0, 0], 
        [5, 0, 0, 0],
        [0, 5, 5, 0]
    ], 
    // L 
    [
        [6, 0, 0], 
        [6, 0, 0], 
        [6, 6, 0]
    ],
    // I
    [
        [0, 0, 0, 0], 
        [2, 2, 2, 2], 
        [0, 0, 0, 0], 
        [0, 0, 0, 0] 
    ], 
    // Z 
    [
        [2, 2, 0], 
        [0, 2, 2], 
        [0, 0, 0]
    ],
    // accommodation 
    [
        [0, 0, 2], 
        [0, 0, 2],
        [0, 2, 2]
    ], 
    // r
    [
        [2, 2, 0], 
        [2, 0, 0],
        [0, 0, 0]
    ], 
    // accommodation
    [
        [0, 2, 0], 
        [2, 2, 2],
        [0, 0, 0]
    ], 
    [
        [0, 2, 2], 
        [2, 2, 0], 
        [0, 0, 0]
    ]
    

]

// function to retrieve custom CSS colors
function getCustomColor(piece) {
    return getComputedStyle(document.documentElement).getPropertyValue(piece).trim();
}

// name the colors
const colors = [
    getCustomColor('--deep-red'), 
    getCustomColor('--ruby'), 
    getCustomColor('--puce'), 
    getCustomColor('--pink-pearl'), 
    getCustomColor('--almond')
]; 

/* -------------- Piece -------------- */ 
class Piece {

    /*
        creates a new piece with random shape and color, 
        starts at (0, 0)
    */
    constructor(context) {
        this.context = context; 

        // selects random shape
        const randID = this.randomPearl(shapes.length);
        this.color = colors[randID];    // assigns color 
        this.shape = shapes[randID]; 

        // hard code placements
        this.x = 0; 
        this.y = 0; 
    }

    /*
        loops through the shape array, 
        draws each block on the canvas
    */
    draw() {
        this.context.fillStyle = this.color; 
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    // paints the individual squares
                    this.context.fillRect(this.x + x, this.y + y, 1, 1);
                }
            });
        });
    }

    /*
        updates piece position
    */
    move(p) {
        this.x = p.x; 
        this.y = p.y; 
        this.shape = p.shape; 
    }

    /*
        selects a random shape
    */
    randomPearl(max) {
        return Math.floor(Math.random() * max); 
    }
}

