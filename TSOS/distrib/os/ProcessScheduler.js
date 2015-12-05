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
                    found = pcb;
            }
            // Copy temp array back into queue
            for (var i = 0; i < tempArr.length; i++) {
                this.readyQueue.enqueue(tempArr[i]);
            }
            // Return pcb or null
            return found;
        };
        ProcessScheduler.prototype.getReadyQueueItem = function (index) {
            var ret = null;
            if (index >= 0 && index < this.readyQueue.getSize()) {
                ret = this.readyQueue.q[index];
            }
            return ret;
        };
        ProcessScheduler.prototype.findReadyQueueIndex = function (pid) {
            var ret = -1;
            for (var i = 0; (i < this.readyQueue.q.length) && (ret == -1); i++) {
                if (this.readyQueue.q[i].pid == pid)
                    ret = i;
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
        ProcessScheduler.prototype.createProcess = function (processCode, priority) {
            if (priority === void 0) { priority = 10; }
            // Inits - create pcb
            var pcb = new TSOS.ProcessControlBlock(this.nextPID);
            var part = 0;
            var aret;
            var swapfile = false;
            // Load program input to memory
            part = _MemoryManager.loadMemory(processCode, this.nextPID);
            // Check if parition wasn't  loaded
            if (part == -1) {
                // Check if drive formated
                if (_HDDriver.formated == true) {
                    // Try to create swap file
                    aret = _MemoryManager.loadToHDD(processCode, this.nextPID);
                    // Return on failure to create swap file
                    if (aret[0] < 0)
                        return null;
                    // Set swap file flag
                    swapfile = true;
                }
                else {
                    // Return null
                    return null;
                }
            }
            // Set next avaible pid
            this.nextPID++;
            if (swapfile) {
                pcb.base = -1;
                pcb.limit = -1;
                pcb.onHD = true;
                pcb.hdFileName = aret[1];
            }
            else {
                // Set base and limit of pcb
                pcb.base = _MemoryManager.getPartitionBaseAddress(part);
                pcb.limit = _MemoryPartitionSize;
                pcb.onHD = false;
            }
            // Set priority
            pcb.priority = priority;
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
                // Check if method is priority
                if (_ScheduleMethod == SM_PRIORITY) {
                    if (this.isHigherPriorityProcess(this.runningProcess.priority)) {
                        this.contextSwitch();
                    }
                    else {
                        TSOS.Control.updateReadyQueueDisplay();
                    }
                }
                else
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
                    // Check if pcb has a swap file
                    if (!pcb.onHD) {
                        // Set partition free
                        var part = _MemoryManager.partitionFromBase(pcb.base);
                        _MemoryManager.freePartition(part);
                    }
                    else {
                        // Remove swap file
                        _MemoryManager.removeSwapFile(pid);
                    }
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
        ProcessScheduler.prototype.findLastInQueueLoadedPartition = function () {
            var part = -1;
            for (var i = this.readyQueue.q.length - 1; (i >= 0) && part == -1; i--) {
                if (!this.readyQueue.q[i].onHD)
                    part = _MemoryManager.partitionFromBase(this.readyQueue.q[i].base);
            }
            if (part == -1)
                part = 0;
            return part;
        };
        // Switches running procesess.
        // If no more running process, stops
        // timer and sets is executing false just in case.
        ProcessScheduler.prototype.contextSwitch = function () {
            // Inits
            var pcb = null;
            var date = new Date();
            var part = 0;
            var oldpid = 0;
            var index = 0;
            var tempPCB = null;
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
                    if (_ScheduleMethod != SM_PRIORITY) {
                        // Get next process
                        pcb = this.readyQueue.dequeue();
                    }
                    else {
                        // Get lowest (highest) priority process
                        pcb = this.highestPriorityInReadyQueue();
                        this.removeFromReadyQueue(pcb.pid);
                    }
                    // Check if swap file
                    if (pcb.onHD) {
                        // Check if memory partition available
                        part = _MemoryManager.nextPartitionAvailable();
                        if (part == -1) {
                            part = this.findLastInQueueLoadedPartition();
                        }
                        oldpid = _MemoryManager.swapFile(part, pcb.pid);
                        _Kernel.krnTrace("Swapping process pid " + pcb.pid + " from hd.");
                        if (oldpid == CR_MEMORY_SWAP_FILE_NOT_NEEDED) {
                            pcb.base = _MemoryManager.partitionBaseAddress[part];
                            pcb.limit = _MemoryPartitionSize;
                            pcb.onHD = false;
                        }
                        else if (oldpid < 0) {
                            _Kernel.krnTrace("Swap error occured swapping pid " + pcb.pid + " from hd.");
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SWAP_ERROR_IRQ, oldpid));
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERMINATE_PROCESS_IRQ, pcb.pid));
                        }
                        else {
                            _Kernel.krnTrace("Swapping process pid " + oldpid + " to hd.");
                            index = this.findReadyQueueIndex(oldpid);
                            tempPCB = this.getReadyQueueItem(index);
                            tempPCB.base = -1;
                            tempPCB.limit = -1;
                            tempPCB.onHD = true;
                            tempPCB.hdFileName = _MemoryManager.findHDLoadedFName(oldpid);
                            pcb.base = _MemoryManager.partitionBaseAddress[part];
                            pcb.limit = _MemoryPartitionSize;
                            pcb.onHD = false;
                        }
                    }
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
                        document.getElementById("scrollMemory").scrollTop = ((pcb.base) / 8) * scrollPoints;
                    }
                    // Start executing again
                    _CPU.isExecuting = true;
                }
            }
            else {
                // Check if residents
                if (this.readyQueue.getSize() > 0) {
                    if (_ScheduleMethod != SM_PRIORITY) {
                        // Get next process
                        pcb = this.readyQueue.dequeue();
                    }
                    else {
                        // Get lowest (highest) priority process
                        pcb = this.highestPriorityInReadyQueue();
                        this.removeFromReadyQueue(pcb.pid);
                    }
                    pcb.waitCycles += _OSclock - pcb.lastContextSwitchCycle;
                    // Check if swap file
                    if (pcb.onHD) {
                        // Check if memory partition available
                        part = _MemoryManager.nextPartitionAvailable();
                        if (part == -1) {
                            part = this.findLastInQueueLoadedPartition();
                        }
                        oldpid = _MemoryManager.swapFile(part, pcb.pid);
                        _Kernel.krnTrace("Swapping process pid " + pcb.pid + " from hd.");
                        if (oldpid == CR_MEMORY_SWAP_FILE_NOT_NEEDED) {
                            pcb.base = _MemoryManager.partitionBaseAddress[part];
                            pcb.limit = _MemoryPartitionSize;
                            pcb.onHD = false;
                        }
                        else if (oldpid < 0) {
                            _Kernel.krnTrace("Swap error occured swapping pid " + pcb.pid + " from hd.");
                            //          CR_FILE_DIRECTORY_FULL  if no more space in file directory,
                            //          CR_DRIVE_FULL if no free blocks.
                            //          CR_CORRUPTED_FILE_BLOCK if missing a file block
                            //          CR_FILE_NOT_FOUND on file not found,
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SWAP_ERROR_IRQ, oldpid));
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TERMINATE_PROCESS_IRQ, pcb.pid));
                        }
                        else {
                            _Kernel.krnTrace("Swapping process pid " + oldpid + " to hd.");
                            index = this.findReadyQueueIndex(oldpid);
                            tempPCB = this.getReadyQueueItem(index);
                            tempPCB.base = -1;
                            tempPCB.limit = -1;
                            tempPCB.onHD = true;
                            tempPCB.hdFileName = _MemoryManager.findHDLoadedFName(oldpid);
                            pcb.base = _MemoryManager.partitionBaseAddress[part];
                            pcb.limit = _MemoryPartitionSize;
                            pcb.onHD = false;
                        }
                    }
                    // Set cpu values
                    _CPU.base = pcb.base;
                    _CPU.limit = pcb.limit;
                    _CPU.Xreg = pcb.xReg;
                    _CPU.Yreg = pcb.yReg;
                    _CPU.Zflag = pcb.zFlag;
                    _CPU.Acc = pcb.Acc;
                    _CPU.PC = pcb.PC;
                    // Check if
                    // Update cput display
                    TSOS.Control.updateCPUDisplay();
                    // Set as running process
                    this.runningProcess = pcb;
                    if (pcb.PC < pcb.limit) {
                        var address = pcb.base + pcb.PC;
                        var inst = _Memory.getAddress(address).toString(16);
                        // Update memory display with highlighted code
                        TSOS.Control.updateMemoryDisplay(address, _CPU.getParamCount(inst));
                        document.getElementById("scrollMemory").scrollTop = ((pcb.base) / 8) * scrollPoints;
                    }
                    if (_ScheduleMethod == SM_ROUND_ROBIN) {
                        // Turn on timer
                        _TimerOn = true;
                        // Reset counter
                        _TimerCounter = 0;
                    }
                    // Set is executing flag
                    _CPU.isExecuting = true;
                }
                else {
                    // Update memory display with no highlighted next instruction
                    TSOS.Control.updateMemoryDisplay();
                    if (_ScheduleMethod == SM_ROUND_ROBIN) {
                        // Turn on timer
                        _TimerOn = false;
                        // Reset counter
                        _TimerCounter = 0;
                    }
                    // Stop executing
                    _CPU.isExecuting = false;
                }
            }
            // Update running processes nd ready queue tables
            TSOS.Control.updateRunningProcessDisplay();
            TSOS.Control.updateReadyQueueDisplay();
        };
        ProcessScheduler.prototype.highestPriorityInReadyQueue = function () {
            var low = 9999;
            var pcb = null;
            var curPcb = null;
            var pri = 0;
            for (var i = this.readyQueue.q.length - 1; i >= 0; i--) {
                curPcb = this.readyQueue.q[i];
                pri = curPcb.priority;
                if (curPcb.priority <= low) {
                    pcb = curPcb;
                    low = curPcb.priority;
                }
            }
            return pcb;
        };
        ProcessScheduler.prototype.isHigherPriorityProcess = function (priority) {
            var found = false;
            for (var i = 0; (i < this.readyQueue.q.length) && !found; i++) {
                if (this.readyQueue.q[i].priority < priority)
                    found = true;
            }
            return found;
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
