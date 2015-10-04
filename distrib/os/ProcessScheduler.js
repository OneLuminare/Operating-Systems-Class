///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
/* ------------
     ProcessScheduler.ts

     This class is used by the kernel to create process control blocks, run processes,
     manage running processes for concurrent execution, and termination of processes.
     It also manages what memory partion each process lives in.
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
        // Inits data. For future use.
        ProcessScheduler.prototype.init = function () {
        };
        // Creates a PCB for a process, and loads it into memory.
        // At this moment its only made to run one process at time.
        //
        // Params: processCode <string> - program input.
        // Returns: PCB of created process.
        ProcessScheduler.prototype.createProcess = function (processCode) {
            // Inits - create pcb
            var pcb = new TSOS.ProcessControlBlock(0, 0, 256);
            // This will change, but at the moment with only one running process
            // I set it here
            this.runningProcess = pcb;
            // Set next avaible pid
            this.nextPID++;
            // Load program input to memory
            _Memory.loadMemory(processCode);
            // Update memory display
            TSOS.Control.updateMemoryDisplay();
            // Send trace message
            _Kernel.krnTrace("Creating process PID: " + this.runningProcess.pid);
            // Return pcb created
            return pcb;
        };
        // Execute a running process based on pid.
        // At the moment it just runs the process created
        // in createProcess()
        //
        // Params: pid <number> - pid of loaded process
        // Returns: True if executed, false if invlaid pid
        ProcessScheduler.prototype.executeProcess = function (pid) {
            // Inits
            var ret = false;
            // This will change when I implement multiple processes
            if (this.runningProcess != null) {
                // Check if pid is one load. This will change.
                if (this.runningProcess.pid == pid) {
                    // Set cpu values
                    _CPU.PC = 0;
                    _CPU.Acc = 0;
                    _CPU.Xreg = 0;
                    _CPU.Yreg = 0;
                    _CPU.Zflag = 0;
                    _CPU.base = this.runningProcess.base;
                    _CPU.limit = this.runningProcess.limit;
                    _CPU.isExecuting = true;
                    // Update cpu display
                    TSOS.Control.updateCPUDisplay();
                    // Set return value
                    ret = true;
                    // Send trace message
                    _Kernel.krnTrace("Executing process PID: " + this.runningProcess.pid);
                }
            }
            return ret;
        };
        ProcessScheduler.prototype.handleReadyQueue = function () {
            /* TODO */
        };
        ProcessScheduler.prototype.updateRunningProcess = function () {
            /* TODO */
        };
        // Exits running process. Identfied by base incase process
        // switches before error or exit system call gets processed
        //
        // Params: base <number> - Identifies process, as cpu doesn't know pid
        // Returns: Process control block copy of exiting process.
        ProcessScheduler.prototype.exitProcess = function (pid) {
            // Inits
            var pcb = this.runningProcess;
            // Reset running process
            this.runningProcess = null;
            // Set next pid available
            this.nextPID--;
            // Set last values for trace. Will change, onl
            // will save these when switching processes
            pcb.base = _CPU.base;
            pcb.limit = _CPU.limit;
            pcb.PC = _CPU.PC;
            pcb.xReg = _CPU.Xreg;
            pcb.yReg = _CPU.Yreg;
            pcb.zFlag = _CPU.Zflag;
            pcb.Acc = _CPU.Acc;
            pcb.running = false;
            // Set trace message
            _Kernel.krnTrace("Terminating process PID: " + pcb.pid);
            // Trace pcb data
            _Kernel.krnTrace("PCB: " + pcb.toString());
            // Return pcb
            return pcb;
        };
        // Retrieves PID of process by given base, as running process might switch before termination
        // interrupt gets handled. Will change with multiple processes added.
        //
        // Params: base <number> - memory base of process
        // Returns: PID or -1 on error
        ProcessScheduler.prototype.findPID = function (base) {
            // Init PID at failure, -1
            var pid = -1;
            // Since only one running process at a time,
            // just return pid of running process
            if (this.runningProcess != null)
                pid = this.runningProcess.pid;
            // Return pid, or -1 if not found
            return pid;
        };
        return ProcessScheduler;
    })();
    TSOS.ProcessScheduler = ProcessScheduler;
})(TSOS || (TSOS = {}));
