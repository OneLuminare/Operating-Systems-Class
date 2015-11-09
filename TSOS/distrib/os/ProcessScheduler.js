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
        function ProcessScheduler(readyQueue, residentList, runningProcess, terminatedQueue, nextPID) {
            if (readyQueue === void 0) { readyQueue = new TSOS.Queue(); }
            if (residentList === void 0) { residentList = new Array(0); }
            if (runningProcess === void 0) { runningProcess = null; }
            if (terminatedQueue === void 0) { terminatedQueue = new TSOS.Queue(); }
            if (nextPID === void 0) { nextPID = 0; }
            this.readyQueue = readyQueue;
            this.residentList = residentList;
            this.runningProcess = runningProcess;
            this.terminatedQueue = terminatedQueue;
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
        // Clears resident list.
        ProcessScheduler.prototype.clearResidentList = function () {
            while (this.residentList.length > 0)
                this.residentList.pop();
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
        ProcessScheduler.prototype.getReadyQueueItem = function (index) {
            var ret = null;
            _Kernel.krnTrace("index " + index.toString() + " size " + this.readyQueue.getSize().toString());
            if (index >= 0 && index < this.readyQueue.getSize()) {
                ret = this.readyQueue.q[index];
                _Kernel.krnTrace("good index");
                _Kernel.krnTrace(ret.toString());
            }
            return ret;
        };
        ProcessScheduler.prototype.readyQueueSize = function () { return this.readyQueue.getSize(); };
        // Returns true if running processes
        ProcessScheduler.prototype.areProcessesRunning = function () {
            return ((this.runningProcess != null) || (this.readyQueue.getSize() > 0));
        };
        // Lists all loaded procress pid, but not running.
        //
        // Returns: number[] - array of loaded pid's
        ProcessScheduler.prototype.listAllLoadedProcesses = function () {
            // Inits
            var procs = new Array();
            // Cycle through resident list
            for (var i = 0; i < this.residentList.length; i++)
                // Add pid to list
                procs.push(this.residentList[i].pid);
            // Return array
            return procs;
        };
        // Lists all running processs pid's, but not loaded
        //
        // Returns: number[] - array of running pid's
        ProcessScheduler.prototype.listAllRunningProcesses = function () {
            // Inits
            var procs = new Array();
            // If running proc add tthat too
            if (this.runningProcess)
                procs.push(this.runningProcess.pid);
            // Cycle through resident list
            for (var i = 0; i < this.readyQueue.q.length; i++)
                // Add pid to list
                procs.push(this.readyQueue.q[i].pid);
            // Return array
            return procs;
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
            // set start cycle
            pcb.startCycle = _OSclock;
            // If no running processess
            if (!this.areProcessesRunning()) {
                // Put in ready queue
                this.readyQueue.enqueue(pcb);
                pcb.lastContextSwitchCycle = _OSclock;
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
                pcb.lastContextSwitchCycle = _OSclock;
                TSOS.Control.updateReadyQueueDisplay();
            }
            // Set trace message
            _Kernel.krnTrace("Executing process PID: " + pcb.pid);
            // Return true
            return true;
        };
        // Executes all load processes, that are not running.
        //
        // Returns: <number> - number of process executed.
        ProcessScheduler.prototype.executeAllProcesses = function () {
            // Inits
            var procs = new Array();
            var pcb = null;
            // Cycle through resident list
            while (this.residentList.length > 0) {
                // Remove top element of list
                pcb = this.residentList.shift();
                // Enqueu on ready queue
                this.readyQueue.enqueue(pcb);
                pcb.startCycle = _OSclock;
                pcb.lastContextSwitchCycle = _OSclock;
                // Put pid on return value array
                procs.push(pcb.pid);
            }
            // If not running processs perform context switch
            if (this.runningProcess == null)
                this.contextSwitch();
            else
                TSOS.Control.updateReadyQueueDisplay();
            // Return procs executed
            return procs;
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
                    _Kernel.krnTrace("part:" + part);
                    _MemoryManager.freePartition(part);
                    // Set running process to null
                    this.runningProcess = null;
                    TSOS.Control.updateRunningProcessDisplay();
                    // Context switch
                    this.contextSwitch();
                }
                else {
                    _Kernel.krnTrace("here");
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
                // Compute turnaround time
                pcb.turnAroundCycles = _OSclock - pcb.startCycle;
                // Add to terminated queue
                this.terminatedQueue.enqueue(pcb);
                TSOS.Control.updateTerminatedQueueDisplay();
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
        };
        // Switches running procesess.
        // If no more running process, stops
        // timer and sets is executing false just in case.
        ProcessScheduler.prototype.contextSwitch = function () {
            // Inits
            var pcb = null;
            var date = new Date();
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
                    pcb.lastContextSwitchCycle = _OSclock;
                    // Get next process
                    pcb = this.readyQueue.dequeue();
                    pcb.waitCycles += _OSclock - pcb.lastContextSwitchCycle;
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
                    pcb.waitCycles += _OSclock - pcb.lastContextSwitchCycle;
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
                    if (pcb.PC < pcb.limit) {
                        var address = pcb.base + pcb.PC;
                        var inst = _Memory.getAddress(address).toString(16);
                        // Update memory display with highlighted code
                        TSOS.Control.updateMemoryDisplay(address, _CPU.getParamCount(inst));
                    }
                    // Turn on timer
                    _TimerOn = true;
                    // Reset counter
                    _TimerCounter = 0;
                    // Set is executing flag
                    _CPU.isExecuting = true;
                }
                else {
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
            // Update running processes nd ready queue tables
            TSOS.Control.updateRunningProcessDisplay();
            TSOS.Control.updateReadyQueueDisplay();
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
