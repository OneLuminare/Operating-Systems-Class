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
        function ProcessScheduler(readyQueue, residentList, runningProcess, nextPID) {
            if (readyQueue === void 0) { readyQueue = new TSOS.Queue(); }
            if (residentList === void 0) { residentList = new Array(0); }
            if (runningProcess === void 0) { runningProcess = null; }
            if (nextPID === void 0) { nextPID = 0; }
            this.readyQueue = readyQueue;
            this.residentList = residentList;
            this.runningProcess = runningProcess;
            this.nextPID = nextPID;
            this.init();
        }
        // Inits data. For future use.
        ProcessScheduler.prototype.init = function () {
        };
        // Adds a process to resident list.
        //
        // Params: pcb : ProcessControlBlock - pcb to add
        // Returns: index in resident list.
        ProcessScheduler.prototype.addToResidentList = function (pcb) {
            // Put on bottom of list
            this.residentList.push(pcb);
            // Return index in list
            return this.residentList.length - 1;
        };
        // Removes process from resident list.
        //
        // Params: pid : number - pid of pcb
        // Returns: True on found pid
        ProcessScheduler.prototype.removeFromResidentList = function (pid) {
            // Inits
            var newArr = new Array(0);
            var pcb = null;
            var found = false;
            // Find index
            var index = this.findResidentListIndex(pid);
            // Return false if not found pid
            if (index == -1)
                return false;
            // Cycle through array
            while (this.residentList.length > 0) {
                // Pop item from list
                pcb = this.residentList.pop();
                // Check if not item to remove
                if (pcb.pid != pid) {
                    // Add to temp array
                    newArr.push(pcb);
                }
                else
                    found = true;
            }
            // Copy temp array
            this.residentList = newArr;
            // Return true if removed item
            return found;
        };
        // Finds index in resident list, or -1 if not found
        //
        // Params: pid : number - pid of pcb
        // Returns: index of pcb, or -1 if not found
        ProcessScheduler.prototype.findResidentListIndex = function (pid) {
            // Inits
            var pcb = null;
            var ret = -1;
            // Cycle through resident list
            for (var i = 0; (i < this.residentList.length) && (ret == -1); i++) {
                // Get pcb
                pcb = this.residentList[i];
                // If equal pid, set ret
                if (pcb.pid == pid)
                    ret = i;
            }
            // Return index, or -1 if not found
            return ret;
        };
        // Moves process from resident list to ready queue
        //
        // Params: pid : number - pid of pcb
        // Returns: True on found pid
        ProcessScheduler.prototype.moveToReadyQueue = function (pid) {
            // Inits
            var index = 0;
            var pcb = null;
            // Get index in resident list
            index = this.findResidentListIndex(pid);
            // If not found return false
            if (index == -1)
                return false;
            // Get pcb
            pcb = this.residentList[index];
            // Remove from resident list
            this.removeFromResidentList(pid);
            // Add to ready queue
            this.readyQueue.enqueue(pcb);
            // Return success
            return true;
        };
        // Removees items from ready queue
        //
        // Params: pid : number - pid of pcb
        // Returns: PCB removed or null if not found
        ProcessScheduler.prototype.removeFromReadyQueue = function (pid) {
            // Inits
            var tempArr = [];
            var pcb = null;
            var found = null;
            // Cycle through queue
            while (this.readyQueue.getSize() > 0) {
                // Get item in pcb
                pcb = this.readyQueue.dequeue();
                // Add to array if not one to be removed
                if (pcb.pid != pid) {
                    tempArr.push(pcb);
                }
                else
                    _Kernel.krnTrace("found");
                found = pcb;
            }
            // Copy temp array back into queue
            for (var i = 0; i < tempArr.length; i++) {
                _Kernel.krnTrace(tempArr[i].pid.toString());
                this.readyQueue.enqueue(tempArr[i]);
            }
            // Return pcb or null
            return found;
        };
        // Returns true if running processes
        ProcessScheduler.prototype.areProcessesRunning = function () {
            return ((this.runningProcess != null) || (this.readyQueue.getSize() > 0));
        };
        // Creates a PCB for a process, and loads it into memory.
        // At this moment its only made to run one process at time.
        //
        // Params: processCode <string> - program input.
        // Returns: PCB of created process, or null if mem full
        ProcessScheduler.prototype.createProcess = function (processCode) {
            // Inits - create pcb
            var pcb = new TSOS.ProcessControlBlock(this.nextPID);
            var part = 0;
            // Load program input to memory
            part = _MemoryManager.loadMemory(processCode, this.nextPID);
            // Set next avaible pid
            this.nextPID++;
            // Check if parition wasn't  loaded
            if (part == -1) {
                // Send interrupt
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_FULL_IRQ, this.nextPID - 1));
                // Return null
                return null;
            }
            // Set base and limit of pcb
            pcb.base = _MemoryManager.getPartitionBaseAddress(part);
            pcb.limit = _MemoryPartitionSize;
            // Add to resident list
            this.residentList.push(pcb);
            // Update memory display
            TSOS.Control.updateMemoryDisplay();
            // Send trace message
            _Kernel.krnTrace("Created process PID: " + pcb.pid);
            // Return pcb created
            return pcb;
            /*
            // Inits - create pcb
            var pcb : TSOS.ProcessControlBlock = new TSOS.ProcessControlBlock(this.nextPID,0,0,256);

            // This will change, but at the moment with only one running process
            // I set it here
            this.runningProcess = pcb;

            // Set next avaible pid
            this.nextPID++;

            // Load program input to memory
            _MemoryManager.loadMemory(processCode);

            // Update memory display
            TSOS.Control.updateMemoryDisplay();

            // Send trace message
            _Kernel.krnTrace("Creating process PID: " + this.runningProcess.pid);

            // Return pcb created
            return pcb;
            */
        };
        // Adds process to ready queue, to be executed when its its turn.
        // If nothing running, goes right on running process.
        //
        // Params: pid <number> - pid of loaded process
        // Returns: True if executed, false if invlaid pid
        ProcessScheduler.prototype.executeProcess = function (pid) {
            // Get index in list
            var index = this.findResidentListIndex(pid);
            // Return false if not found pid
            if (index == -1)
                return false;
            // Get pcb
            var pcb = this.residentList[index];
            // Remove from resident list
            this.removeFromResidentList(pid);
            // If no running processess
            if (!this.areProcessesRunning()) {
                // Put in ready queue
                this.readyQueue.enqueue(pcb);
                // !!! Might Change
                // !!! Might send interrupt to do context switch
                // !!! And start timer irq
                TSOS.Control.updateReadyQueueDisplay();
                // Perform context switch
                this.contextSwitch();
            }
            else {
                // Put in ready queue
                this.readyQueue.enqueue(pcb);
                TSOS.Control.updateReadyQueueDisplay();
            }
            // Set trace message
            _Kernel.krnTrace("Executing process PID: " + pcb.pid);
            // Return true
            return true;
            /*
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

                    // Update memory display with highlighted next instruction
                    TSOS.Control.updateMemoryDisplay(_CPU.base, _CPU.getParamCount(_Memory.getAddress(_CPU.base).toString(16)));

                    // Send trace message
                    _Kernel.krnTrace("Executing process PID: " + this.runningProcess.pid);
                }

            }

            return ret;
            */
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
            var pcb = null;
            // Check if process is in running process
            if (this.runningProcess != null) {
                if (this.runningProcess.pid == pid) {
                    // Get pcb
                    pcb = this.runningProcess;
                    // Set current cpu status
                    pcb.base = _CPU.base;
                    pcb.limit = _CPU.limit;
                    pcb.PC = _CPU.PC;
                    pcb.xReg = _CPU.Xreg;
                    pcb.yReg = _CPU.Yreg;
                    pcb.zFlag = _CPU.Zflag;
                    pcb.Acc = _CPU.Acc;
                    // Set partition free
                    var part = _MemoryManager.partitionFromBase(pcb.base);
                    _MemoryManager.freePartition(part);
                    // Set running process to null
                    this.runningProcess = null;
                    TSOS.Control.updateRunningProcessDisplay();
                    // Context switch
                    this.contextSwitch();
                }
                else {
                    // Removes from ready queue, or
                    // gets null for return value
                    pcb = this.removeFromReadyQueue(pid);
                    TSOS.Control.updateReadyQueueDisplay();
                    // Set partition free
                    var part = _MemoryManager.partitionFromBase(pcb.base);
                    _MemoryManager.freePartition(part);
                }
            }
            // Check if not null pcb
            if (pcb != null) {
                // Set trace message
                _Kernel.krnTrace("Terminating process PID: " + pcb.pid);
                // Trace pcb data
                _Kernel.krnTrace("PCB: " + pcb.toString());
            }
            else {
                // Set trace message
                _Kernel.krnTrace("Attempted to terminate process that does not exist, with PID: " + pid);
            }
            // Return pcb or null on not found
            return pcb;
            /*
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

            // Update memory display with no highlighted next instruction
            TSOS.Control.updateMemoryDisplay();

            // Set trace message
            _Kernel.krnTrace("Terminating process PID: " + pcb.pid);

            // Trace pcb data
            _Kernel.krnTrace("PCB: " + pcb.toString());

            // Return pcb
            return pcb;
            */
        };
        // Switches running procesess.
        // If no more running process, stops
        // timer and sets is executing false just in case.
        ProcessScheduler.prototype.contextSwitch = function () {
            // Inits
            var pcb = null;
            // Trace
            _Kernel.krnTrace("Context Switch");
            // Check if running process
            if (this.runningProcess != null) {
                // Check if residents
                if (this.readyQueue.getSize() > 0) {
                    // Get pcb of running process
                    pcb = this.runningProcess;
                    pcb.base = _CPU.base;
                    pcb.limit = _CPU.limit;
                    pcb.PC = _CPU.PC;
                    pcb.xReg = _CPU.Xreg;
                    pcb.yReg = _CPU.Yreg;
                    pcb.zFlag = _CPU.Zflag;
                    pcb.Acc = _CPU.Acc;
                    // Enqueue in ready queue
                    this.readyQueue.enqueue(pcb);
                    // Get next process
                    pcb = this.readyQueue.dequeue();
                    // Set registers back
                    _CPU.base = pcb.base;
                    _CPU.limit = pcb.limit;
                    _CPU.Xreg = pcb.xReg;
                    _CPU.Yreg = pcb.yReg;
                    _CPU.Zflag = pcb.zFlag;
                    _CPU.Acc = pcb.Acc;
                    _CPU.PC = pcb.PC;
                    // Update cput display
                    TSOS.Control.updateCPUDisplay();
                    // Set running process
                    this.runningProcess = pcb;
                    TSOS.Control.updateRunningProcessDisplay();
                    TSOS.Control.updateReadyQueueDisplay();
                    // check if this address is with in memory, and update mem with highlight code
                    if (pcb.PC < pcb.limit) {
                        var address = pcb.base + pcb.PC;
                        var inst = _Memory.getAddress(address).toString(16);
                        // Update memory display with highlighted code
                        TSOS.Control.updateMemoryDisplay(address, _CPU.getParamCount(inst));
                    }
                    // Start executing again
                    _CPU.isExecuting = true;
                }
            }
            else {
                // Check if residents
                if (this.readyQueue.getSize() > 0) {
                    // Get next resdient
                    pcb = this.readyQueue.dequeue();
                    // Set cpu values
                    _CPU.base = pcb.base;
                    _CPU.limit = pcb.limit;
                    _CPU.Xreg = pcb.xReg;
                    _CPU.Yreg = pcb.yReg;
                    _CPU.Zflag = pcb.zFlag;
                    _CPU.Acc = pcb.Acc;
                    _CPU.PC = pcb.PC;
                    // Update cput display
                    TSOS.Control.updateCPUDisplay();
                    // Set as running process
                    this.runningProcess = pcb;
                    TSOS.Control.updateRunningProcessDisplay();
                    TSOS.Control.updateReadyQueueDisplay();
                    if (pcb.PC < pcb.limit) {
                        var address = pcb.base + pcb.PC;
                        var inst = _Memory.getAddress(address).toString(16);
                        // Update memory display with highlighted code
                        TSOS.Control.updateMemoryDisplay(address, _CPU.getParamCount(inst));
                    }
                    //TSOS.Devices.startTimer();
                    // Turn on timer
                    _TimerOn = true;
                    // Reset counter
                    _TimerCounter = 0;
                    // Set is executing flag
                    _CPU.isExecuting = true;
                }
                else {
                    //TSOS.Devices.stopTimer();
                    // Update memory display with no highlighted next instruction
                    TSOS.Control.updateMemoryDisplay();
                    // Turn on timer
                    _TimerOn = false;
                    // Reset counter
                    _TimerCounter = 0;
                    // Stop executing
                    _CPU.isExecuting = false;
                }
            }
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
