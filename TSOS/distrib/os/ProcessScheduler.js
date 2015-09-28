///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
/* ------------
     CPU.ts

     Requires global.ts.

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
    var ProcessScheduler = (function () {
        function ProcessScheduler(readyQueue, runningProcesses, runningProcess, nextPID, contextSwitch) {
            if (readyQueue === void 0) { readyQueue = new TSOS.Queue(); }
            if (runningProcesses === void 0) { runningProcesses = new Array(); }
            if (runningProcess === void 0) { runningProcess = null; }
            if (nextPID === void 0) { nextPID = 0; }
            if (contextSwitch === void 0) { contextSwitch = false; }
            this.readyQueue = readyQueue;
            this.runningProcesses = runningProcesses;
            this.runningProcess = runningProcess;
            this.nextPID = nextPID;
            this.contextSwitch = contextSwitch;
            this.init();
        }
        ProcessScheduler.prototype.init = function () {
        };
        ProcessScheduler.prototype.createProcess = function (processCode) {
            _Kernel.krnTrace("cp1");
            var pcb = new TSOS.ProcessControlBlock(this.nextPID, 0, 256);
            _Kernel.krnTrace("cpx");
            this.contextSwitch = true;
            this.runningProcess = pcb;
            this.nextPID++;
            _Memory.loadMemory(processCode);
            TSOS.Control.updateMemoryDisplay();
            _Kernel.krnTrace("Creating process PID: " + this.runningProcess.pid);
        };
        ProcessScheduler.prototype.executeProcess = function () {
            if (this.contextSwitch) {
                if (this.runningProcess != null) {
                    _Kernel.krnTrace("Executing process PID: " + this.runningProcess.pid);
                    _CPU.PC = 0;
                    _CPU.Acc = 0;
                    _CPU.Xreg = 0;
                    _CPU.Yreg = 0;
                    _CPU.Zflag = 0;
                    _CPU.base = this.runningProcess.base;
                    _CPU.limit = this.runningProcess.limit;
                    _CPU.isExecuting = true;
                    TSOS.Control.updateCPUDisplay();
                }
                else {
                }
                this.contextSwitch = false;
            }
        };
        ProcessScheduler.prototype.handleReadyQueue = function () {
            /*
            while( this.readyQueue.getSize() > 0)
            {

            }
            */
        };
        ProcessScheduler.prototype.updateRunningProcess = function () {
        };
        ProcessScheduler.prototype.exitProcess = function () {
            var pid = this.runningProcess.pid;
            this.runningProcess = null;
            this.nextPID--;
            this.contextSwitch = true;
            _Kernel.krnTrace("Terminating process PID: " + pid);
        };
        return ProcessScheduler;
    })();
    TSOS.ProcessScheduler = ProcessScheduler;
})(TSOS || (TSOS = {}));
