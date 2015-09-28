///<reference path="../globals.ts" />
/* ------------
 CPU.ts

 Requires global.ts.
 Requires memory.ts

 Routines for the host CPU simulation, NOT for the OS itself.
 In this manner, it's A LITTLE BIT like a hypervisor,
 in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
 that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
 TypeScript/JavaScript in both the host and client environments.

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */
var TSOS;
(function (TSOS) {
    var ProcessControlBlock = (function () {
        function ProcessControlBlock(pid, base, limit, PC, running) {
            if (PC === void 0) { PC = 0; }
            if (running === void 0) { running = true; }
            this.pid = pid;
            this.base = base;
            this.limit = limit;
            this.PC = PC;
            this.running = running;
            this.init();
        }
        ProcessControlBlock.prototype.init = function () {
        };
        return ProcessControlBlock;
    })();
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
