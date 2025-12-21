import { Cube } from './src/cube.ts';
import { printCube } from './src/print-cube.ts';
import * as move from './src/move.ts';

const cube = new Cube();
console.log("Solved Cube:\n");
printCube(cube);
console.log(`\nCube is solved: ${cube.isSolved()}`)

move.doMove(cube, 'U');
console.log("\n\nCube after move U:\n");
printCube(cube);
console.log(`\nCube is solved: ${cube.isSolved()}`)


move.doMove(cube, 'R');
console.log("\n\nCube after move R:\n");
printCube(cube);
console.log(`\nCube is solved: ${cube.isSolved()}`)

move.doMove(cube, 'R_p');
move.doMove(cube, 'U_p');

console.log("\n\nCube after undoing those moves, should be solved:\n");
printCube(cube);
console.log(`\nCube is solved: ${cube.isSolved()}`)

cube.scramble()

console.log("\n\nCube after scrambling, should be scrambled:\n");
printCube(cube);
console.log(`\nCube is solved: ${cube.isSolved()}`)