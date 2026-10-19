importScripts('solver.js');

onmessage = ({ data }) => postMessage(data.rounds ? Solver.solve(data) : Solver.solveMinRounds(data));
