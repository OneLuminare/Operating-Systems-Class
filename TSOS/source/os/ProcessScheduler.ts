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

module TSOS {

    export class ProcessScheduler {

        constructor(public readyQueue : Queue = new Queue(),
                    public runningProcesses = new Array(),
                    public runningProcess : TSOS.ProcessControlBlock = null,
                    public nextPID : number = 0,
                    public contextSwitch : boolean = false) {
            this.init();
        }

        public init():void {

        }

        public createProcess(processCode : string) : TSOS.ProcessControlBlock
        {
            var pcb : TSOS.ProcessControlBlock = new TSOS.ProcessControlBlock(/*this.nextPID*/0,0,256);

            //this.contextSwitch = true;

            this.runningProcess = pcb;

            this.nextPID++;

            _Memory.loadMemory(processCode);

            TSOS.Control.updateMemoryDisplay();

            _Kernel.krnTrace("Creating process PID: " + this.runningProcess.pid);

            return pcb;
        }

        public executeProcess(pid : number) : boolean
        {
            var ret = false;

            //if( this.contextSwitch )
            //{

                if( this.runningProcess != null)
                {

                    if( this.runningProcess.pid == pid) {
                        _Kernel.krnTrace("Executing process PID: " + this.runningProcess.pid);
                        _CPU.PC = 0;
                        _CPU.Acc = 0;
                        _CPU.Xreg = 0;
                        _CPU.Yreg = 0;
                        _CPU.Zflag = 0;
                        _CPU.base = this.runningProcess.base;
                        _CPU.limit = this.runningProcess.limit;
                        _CPU.isExecuting = true;
                        Control.updateCPUDisplay();

                        ret = true;
                    }
                }

            return ret;
        }

        public handleReadyQueue()
        {
            /*
            while( this.readyQueue.getSize() > 0)
            {

            }
            */
        }

        public  updateRunningProcess() {

        }

        public exitProcess(base : number) : TSOS.ProcessControlBlock
        {

            var pcb = this.runningProcess;

                this.runningProcess = null;
                this.nextPID--;

                this.contextSwitch = true;

                _Kernel.krnTrace("Terminating process PID: " + pcb.pid);

            return pcb;
        }
    }
}
