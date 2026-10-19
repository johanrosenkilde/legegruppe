import { solve, solveMinRounds } from './solver.js';

onmessage = ({ data }) => postMessage(data.rounds ? solve(data) : solveMinRounds(data));
