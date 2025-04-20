// file to record the constant variables for the pearl game
const COLUMNS = 10; 
const ROWS = 20; 
const BLOCK_SIZE = 30; 

const keys = {
    left: 37, 
    up: 38, 
    right: 39, 
    down: 40, 
    space: 32,
}; 

const points = {
    soft_drop: 1,
    hard_drop: 2, 
}; 
Object.freeze(points); 

const amountPoints = {
    1: 100, 
    2: 300, 
    3: 500, 
    4: 800, 
    5: 1300
};
Object.freeze(amountPoints); 

const lines_per_level = 1; 
const level = {
    0: 800,
    1: 720, 
    2: 630,
    3: 550,
    4: 470, 
    5: 380,
    6: 300,
    7: 300,
    8: 220,
    9: 130,
    10: 80,
    11: 80,
    12: 80, 
    13: 70,
    14: 70,
    15: 70,
    16: 50,
    17: 50,
    18: 50,
    19: 30,
    20: 30
}; 
Object.freeze(level); 


const moves = {
    [keys.left]: (p) => ({ ...p, x: p.x - 1}),
    [keys.right]: (p) => ({ ...p, x: p.x + 1}),
    [keys.down]: (p) => ({ ...p, y: p.y + 1}), 
    [keys.space]: (p) => ({...p, y: p.y + 1}),
    [keys.up]: (p) => rotatePiece(p),
}

function rotatePiece(piece) {
    let p = JSON.parse(JSON.stringify(piece)); 

    for (let y = 0; y < p.shape.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]]; 
        }
    }

    p.shape.forEach((row) => row.reverse());
    return p; 
}