///<reference path="../globals.ts" />
///<reference path="pcb.ts" />

/* ------------
     ProcessScheduler.ts

     This class is used by the kernel to create process control blocks, run processes,
     manage running processes for concurrent execution, and termination of processes.
     It also manages what memory partion each process lives in.
     ------------ */

module TSOS {

    export class ProcessScheduler {

        constructor(public readyQueue : Queue = new Queue(),
                    public runningProcesses = new Array(),
                    public runningProcess : TSOS.ProcessControlBlock = null,
                    public nextPID : number = 0,
                    public contextSwitch : boolean = false) {
            this.init();
        }

        // Inits data. For future use.
        public init():void {

        }

        // Creates a PCB for a process, and loads it into memory.
        // At this moment its only made to run one process at time.
        //
        // Params: processCode <string> - program input.
        // Returns: PCB of created process.
        public createProcess(processCode : string) : TSOS.ProcessControlBlock
        {
            // Inits - create pcb
            var pcb : TSOS.ProcessControlBlock = new TSOS.ProcessControlBlock(/*this.nextPID*/0,0,256);

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
        }

        // Execute a running process based on pid.
        // At the moment it just runs the process created
        // in createProcess()
        //
        // Params: pid <number> - pid of loaded process
        // Returns: True if executed, false if invlaid pid
        public executeProcess(pid : number) : boolean
        {
            // Inits
            var ret = false;

            // This will change when I implement multiple processes
            if( this.runningProcess != null)
            {
                // Check if pid is one load. This will change.
                if (this.runningProcess.pid == pid)
                {
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
                    Control.updateCPUDisplay();

                    // Set return value
                    ret = true;

                    // Send trace message
                    _Kernel.krnTrace("Executing process PID: " + this.runningProcess.pid);
                }
            }

            return ret;
        }

        public handleReadyQueue()
        {
            /* TODO */
        }

        public  updateRunningProcess()
        {
            /* TODO */
        }


        // Exits running process. Identfied by base incase process
        // switches before error or exit system call gets processed
        //
        // Params: base <number> - Identifies process, as cpu doesn't know pid
        // Returns: Process control block copy of exiting process.
        public exitProcess(base : number) : TSOS.ProcessControlBlock
        {
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
        }
    }
}
