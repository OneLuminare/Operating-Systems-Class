///<reference path="../globals.ts" />
///<reference path="queue.ts" />
///<reference path="ProcessScheduler.ts" />

/* ------------
     Kernel.ts

     Requires globals.ts
              queue.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize process scheduler
            _ProcessScheduler = new ProcessScheduler();

            // Initalize memory manager
            _MemoryManager = new MemoryManager();

            // Initialize the console.
            _Console = new Console();          // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            // Creae new hard drive driver with:
            // 4 tracks, 8 sectors, and 8 blocks per sector. Sectors are 64 bytes long.
            // totals 16,384 bytes
            this.krnTrace("Loading the hard driver device driver.");
            _HDDriver = new TSOS.HardDriveDriver(4,8,8,64);

            this.krnTrace("Hard drive device driver loaded with " + _HDDriver.tracks.toString() + " tracks, "
                + _HDDriver.sectors.toString() + " sectors, " + _HDDriver.blocksPerSector.toString() + " blocks per sector, "
                + _HDDriver.blockSize.toString() + " byte block size, total space "
                + (_HDDriver.tracks * _HDDriver.sectors * _HDDriver.blocksPerSector * _HDDriver.blockSize ).toString() + " bytes");



            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();


            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                           */

            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting)  // If there are no interrupts then run one CPU cycle if there is anything being processed.
            {
                // Execute if not (trace mode on, and next instruction false)
                if( !(_TraceMode && !_NextInstruction) )
                {
                    //_TimerCounter++;


                    _CPU.cycle();

                    if( _TimerOn )
                        _KernelInterruptQueue.enqueue(new Interrupt(TIMER_IRQ,null));

                    // Set next instruction to false, for next step
                    _NextInstruction = false;
                }
            } else {                      // If there are no interrupts and there is nothing being executed then just be idle. {
                this.krnTrace("Idle");
            }

            // Update status bar time
            Control.updateHostStatusTime();
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {

            // Inits
            var pcb : TSOS.ProcessControlBlock = null;

            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);


            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();              // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    // This will change. Right now it waits until program execution terminates
                    // untill allowing input, due to output messages forcing me to
                    // constantly redraw prompt and current input, or draw output
                    // above input
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case CREATE_PROCESS_IRQ:
                    pcb = _ProcessScheduler.createProcess(params[0],params[1]);
                    if( pcb != null)
                        _OsShell.outputMessage("Loaded process with PID " + pcb.pid.toString() + ", with priority " + pcb.priority.toString() + ".");
                    else
                        _OsShell.outputMessage("Memory full. To load more process's, format drive to allow swapping.");
                    break;
                case EXECUTE_PROCESS_IRQ:
                    if( !_ProcessScheduler.executeProcess(params) )
                        _OsShell.outputMessage("No process with PID " + params.toString() + ".");
                    else
                        _OsShell.outputMessage("Executing process PID " + params.toString() + ".");
                    break;
                case TERMINATE_PROCESS_IRQ:
                    this.krnTrace("Terminate: " + params);
                    pcb = _ProcessScheduler.exitProcess(params);
                    if(pcb != null)
                        _OsShell.outputMessage("Exiting process with PID " + pcb.pid.toString() + ".");
                    else
                        _OsShell.outputMessage("No process with pid " + params.toString() + " is running.")
                    break;
                case UNKNOWN_OP_CODE_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Unknown op code " + params[2] + " at 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to unknown op code " + params[2] + " at 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + ".");
                    break;
                case MEMORY_ACCESS_VIOLATION_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Memory access violation to address 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to memory access violation to address 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + ".");
                    break;
                case ARITHMATIC_OVERFLOW_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Arithimatic overflow in instruction 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to arithmatic overflow in instruction 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + ".")
                    break;
                case UNKNOWN_SYSCALL_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Unknown system call at instruction 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to arithmatic overflow in instruction 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + ".")
                    break;
                case PRINT_INTEGER_IRQ:
                    this.krnTrace("Printing integer " + params);
                    _OsShell.outputMessage(params.toString());
                    _CPU.isExecuting = true;
                    break;
                case PRINT_STRING_IRQ:
                    this.krnTrace("Printing string " + params);
                    _OsShell.outputMessage(params);
                    _CPU.isExecuting = true;
                    break;
                case READ_PAST_EOP_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Read string past limit 0x" +TSOS.Utils.padString(params[1].toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to reading string past limit 0x" + TSOS.Utils.padString(params[1].toString(16),4) + ".");
                    break;
                case MEMORY_FULL_IRQ:
                    this.krnTrace("Memory full cannot load program.");
                    _OsShell.outputMessage("Cannot load program, memory full.");
                    break;
                case CONTEXT_SWITCH_IRQ:
                    _ProcessScheduler.contextSwitch();
                    break;

                case CLEAR_MEMORY_IRQ:
                    if( _ProcessScheduler.runningProcess != null )
                    {
                        _OsShell.outputMessage("Programs are running, cannot clear memory.");
                        break;
                    }

                    if( params < 0)
                    {
                        _MemoryManager.freeAllPartitions(true);
                        _OsShell.outputMessage("Cleared all memory of loaded processess.");
                        this.krnTrace("Cleared all memory of loaded processess.");
                        _ProcessScheduler.clearResidentList();
                    }
                    else
                    {
                        var lpid = _MemoryManager.getLoadedPIDFromPartitionIndex(params);
                        var ret = _MemoryManager.freePartition(params,true);
                        if( ret )
                        {

                            _OsShell.outputMessage("Cleared partition " + params.toString() + ".");
                            this.krnTrace("Cleared partition " + params.toString() + ".");
                            if(lpid >= 0)
                                _ProcessScheduler.removeFromResidentList(lpid);
                        }
                        else
                        {
                            _OsShell.outputMessage("Invalid partition size. Choose an index between 0 and " + _MemoryPartitions.toString() + ".");
                            this.krnTrace("Invalid partition size. Choose an index between 0 and " + _MemoryPartitions.toString() + ".");
                        }
                    }
                    break;
                case EXECUTE_ALL_IRQ :
                    var procs : number[] = _ProcessScheduler.executeAllProcesses();
                    var msg : string = "Executed " + procs.length.toString() + " processes with pid's: ";
                    for( var i = 0; i < procs.length; i++)
                    {
                        if( i != 0 )
                            msg += ',';
                        msg += procs[i].toString();
                    }
                    msg += ".";
                    _OsShell.outputMessage(msg);
                    this.krnTrace(msg);
                    break;
                case LIST_PROCESS_IRQ:
                    var running : number[] = _ProcessScheduler.listAllRunningProcesses();
                    var loaded : number[] = _ProcessScheduler.listAllLoadedProcesses();
                    var msg : string;
                    var i : number = 0;

                    msg = "Running Process PID's: ";
                    for( i = 0; i < running.length; i++)
                    {
                        if( i != 0 )
                            msg += " , ";
                        msg += running[i].toString();
                    }

                    _OsShell.outputMessage(msg);
                    this.krnTrace(msg);

                    msg = "Loaded Process PID's: ";
                    for( i = 0; i < loaded.length; i++)
                    {
                        if( i != 0 )
                            msg += " , ";
                        msg += loaded[i].toString();
                    }
                    for( i = 0; i < running.length; i++)
                    {
                        if( i != 0 )
                            msg += " , ";
                        msg += running[i].toString();
                    }

                    _OsShell.outputMessage(msg);
                    this.krnTrace(msg);

                    break;



                case CHANGE_QUANTUM_IRQ:
                    if( params < 0)
                    {
                        _OsShell.outputMessage("Cannot change quantum, invalid quantum " + params.toString() + " entered.");
                        this.krnTrace("Cannot change quantum, invalid quantum " + params.toString() + " entered.");
                    }
                    else
                    {

                        _Quantum = params;

                        _OsShell.outputMessage("Changed quantum to " + params.toString() + ".");
                        this.krnTrace("Changed quantum to " + params.toString() + ".");
                    }

                    break;

                case  FORMAT_HD_IRQ:
                    _HDDriver.formatDrive();
                    _OsShell.outputMessage("Formated hard drive.");
                    break;

                case CREATE_FILE_IRQ:
                    var hret = _HDDriver.createFile(params);

                    switch(hret)
                    {
                        case CR_SUCCESS:
                            _OsShell.outputMessage("Successfully create file.");
                            break;
                        case CR_DRIVE_NOT_FORMATED:
                            _OsShell.outputMessage("Hard drive not formatted, cannot create file.");
                            break;
                        case CR_FILE_LENGTH_TO_LONG:
                            _OsShell.outputMessage("File name to long, file name must be 60 character or less.");
                            break;
                        case CR_EMPTY_FILE_NAME:
                            _OsShell.outputMessage("Empty file name, file name must be 1 to 60 characters.");
                            break;
                        case CR_FILE_DIRECTORY_FULL:
                            _OsShell.outputMessage("File directory full, cannot create files.");
                            break;
                        case CR_DUPLICATE_FILE_NAME:
                            _OsShell.outputMessage("File already exists.");
                            break;
                        case CR_DRIVE_FULL:
                            _OsShell.outputMessage("Hard drive is full, cannot create file.");
                            break;
                        default:
                            _OsShell.outputMessage("Unknown return value for createFile().");
                            break;
                    }

                    break;

                case WRITE_FILE_IRQ:
                    var hret = _HDDriver.writeToFile(params[0],params[1]);

                    switch(hret)
                    {
                        case CR_SUCCESS:
                            _OsShell.outputMessage("Successfully wrote to file.");
                            break;
                        case CR_DRIVE_NOT_FORMATED:
                            _OsShell.outputMessage("Hard drive not formatted, cannot write to files.");
                            break;
                        case CR_FILE_NOT_FOUND:
                            _OsShell.outputMessage("File does not exist.");
                            break;
                        case CR_DID_NOT_WRITE_ALL_DATA:
                            _OsShell.outputMessage("All data could not be written, as drive is now full.");
                            break;
                        case CR_CORRUPTED_FILE_BLOCK:
                            _OsShell.outputMessage("Missing file block, file data corrupted.");
                            break;
                        default:
                            _OsShell.outputMessage("Unknown return value for writeToFile().");
                            break;
                    }

                    break;

                case READ_FILE_IRQ:
                    var hretArray = _HDDriver.readFile(params);

                    switch(hretArray[0])
                    {
                        case CR_SUCCESS:
                            _OsShell.outputMessage(hretArray[1]);
                            break;
                        case CR_DRIVE_NOT_FORMATED:
                            _OsShell.outputMessage("Hard drive not formatted, cannot read files.");
                            break;
                        case CR_FILE_NOT_FOUND:
                            _OsShell.outputMessage("File does not exist.");
                            break;
                        default:
                            _OsShell.outputMessage("Unknown return value for readFile().");
                            break;
                    }

                    break;

                case DELETE_FILE_IRQ:
                    var hret = _HDDriver.deleteFile(params);

                    switch(hret)
                    {
                        case CR_SUCCESS:
                            _OsShell.outputMessage("Successfully deleted file.");
                            break;
                        case CR_DRIVE_NOT_FORMATED:
                            _OsShell.outputMessage("Hard drive not formatted, cannot delete files.");
                            break;
                        case CR_FILE_NOT_FOUND:
                            _OsShell.outputMessage("File does not exist.");
                            break;
                        default:
                            _OsShell.outputMessage("Unknown return value for deleteFile().");
                            break;
                    }

                    break;

                case LIST_FILES_IRQ:
                    var hretArr = _HDDriver.listFiles();

                    switch(hretArr[0])
                    {
                        case CR_SUCCESS:
                            for( var i = 1; i < hretArr.length; i++ )
                            {
                                _OsShell.outputMessage(hretArr[i]);
                            }
                            _OsShell.outputMessage("Total files: " + (hretArr.length - 1).toString());
                            break;
                        case CR_DRIVE_NOT_FORMATED:
                            _OsShell.outputMessage("Hard drive not formatted, cannot delete files.");
                            break;
                        default:
                            _OsShell.outputMessage("Unknown return value for listFiles().");
                            break;
                    }
                    break;

                case SWAP_ERROR_IRQ:
                    switch(params)
                    {
                        case CR_FILE_DIRECTORY_FULL:
                            _OsShell.outputMessage("Could not create swap file, file directory full.");
                            break;

                        case CR_DRIVE_FULL:
                            _OsShell.outputMessage("Could not create swap file, hard drive full.");
                            break;

                        case CR_CORRUPTED_FILE_BLOCK:
                            _OsShell.outputMessage("Could not read swap file, corrupted file block.");
                            break;

                        case CR_FILE_NOT_FOUND:
                            _OsShell.outputMessage("Could not read swap file, file not found.");
                            break;

                        default:
                            _OsShell.outputMessage("File I/0 error occured when reading/writing to swap file.");
                            break;
                    }
                    break;

                case CHANGE_SCHEDULING_METHOD_IRQ:
                    switch(params)
                    {
                        case SM_ROUND_ROBIN:
                            _OsShell.outputMessage("Changed scheduling method to round robin.");
                            _TimerOn = true;
                            _TimerCounter = 0;
                            _ScheduleMethod = SM_ROUND_ROBIN;
                            break;

                        case SM_FJF:
                            _OsShell.outputMessage("Changed scheduling method to first job first.");
                            _TimerOn = false;
                            _TimerCounter = 0;
                            _ScheduleMethod = SM_FJF;
                            break;

                        case SM_PRIORITY:
                            _OsShell.outputMessage("Changed scheduling method to non-premptive priority.");
                            _TimerOn = false;
                            _TimerCounter = 0;
                            _ScheduleMethod = SM_PRIORITY;
                            break;

                        default:
                            _OsShell.outputMessage("Unknown scheduling method.");
                            break;
                    }
                    break;

                case GET_SCHEDULE_METHOD_IRQ:
                    switch(_ScheduleMethod)
                    {
                        case SM_ROUND_ROBIN:
                            _OsShell.outputMessage("Scheduling method is Round Robin.");
                            break;

                        case SM_FJF:
                            _OsShell.outputMessage("Scheduling method is First Job First.");
                            break;

                        case SM_PRIORITY:
                            _OsShell.outputMessage("Scheduling method is Priority.");
                            break;

                        default:
                            _OsShell.outputMessage("Unknown scheduling method.");
                            break;
                    }
                    break;

                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR()
        {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            //_ProcessScheduler.contextSwitch();
            _TimerCounter++;
            if( _TimerCounter >= _Quantum)
            {
                _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ,null));
                _TimerCounter = 0;
            }

        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile

        // Create Process
        public CreateProcess(program : string,priority : number = 10) : void
        {
            // Send create process interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(CREATE_PROCESS_IRQ, [program,priority]));
        }

        // Execute Process based on pid
        public ExecuteProcess(pid : number) : void
        {
            // Send interupt to run process
            _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_PROCESS_IRQ, pid));
        }

        // Executes all loaded process
        public ExecuteAllProcessess() : void
        {
            // Cycle through resident list
            for( var i = 0; i < _ProcessScheduler.residentList.length; i++)
                _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_PROCESS_IRQ, _ProcessScheduler.residentList[i].pid ));

            // Send interupt to run process
            //_KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_ALL_IRQ, null));
        }

        // Terminates process on base (cpu break)
        public TerminateProcess(base : number) : void
        {
            // Var pid
            var pid : number = _MemoryManager.getBasePID(base);

            // Send exit process interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,pid));
        }

        // Terminate process on pid
        public TerminateProcessByPID(pid : number)
        {
            // Send exit process interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,pid));
        }

        // Clears all memory if -1, or specific partition if part id.
        public ClearMemory(partition : number = -1)
        {
            // Send interrupt to clear mem
            _KernelInterruptQueue.enqueue(new Interrupt(CLEAR_MEMORY_IRQ,partition));
        }

        // Lists all activ processes
        public ListAllProcessess() : void
        {
            // Send interupt to run process
            _KernelInterruptQueue.enqueue(new Interrupt(LIST_PROCESS_IRQ, null));
        }

        // Changes quantum by value
        public ChangeQuantum(quantum : number) : void
        {
            // Send interupt to run process
            _KernelInterruptQueue.enqueue(new Interrupt(CHANGE_QUANTUM_IRQ, quantum));
        }

        public LoadAllProcesses(input : string, priority : number = 10) : void
        {
            var availPart = _MemoryManager.totalAvailablePartitions();

            for( var i = 0; i < availPart; i++)
                _KernelInterruptQueue.enqueue(new Interrupt(CREATE_PROCESS_IRQ,[input,priority]));

        }


        // Print integer value in YReg
        public PrintInteger() : void
        {
            _Kernel.krnTrace('Send Interrupt');
            _KernelInterruptQueue.enqueue(new Interrupt(PRINT_INTEGER_IRQ,_CPU.Yreg));
            _Kernel.krnTrace('Back from send Interrupt');
        }

        // Print string at address in YReg
        public PrintString() : void
        {
            var str : string = "";

            try
            {
                str = _MemoryManager.getString(_CPU.Yreg,_CPU.base);
                _KernelInterruptQueue.enqueue(new Interrupt(PRINT_STRING_IRQ,str));
            }

            catch(er)
            {
                if( er instanceof RangeError)
                {
                    // Send memory violation interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ,new Array(_CPU.base, _CPU.Yreg)));
                }
                else
                {
                    // Send memory violation interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(READ_PAST_EOP_IRQ,new Array(_CPU.base, _CPU.limit)));
                }
            }
        }

        // Formats drive
        public FormatHD() : void
        {
            // Send memory violation interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(FORMAT_HD_IRQ,null));
        }

        // Creates afile
        public CreateFile(fileName : string) : void
        {
            // Send memory violation interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(CREATE_FILE_IRQ,fileName));
        }

        public WriteToFile(fileName : string, text : string)
        {
            _KernelInterruptQueue.enqueue(new Interrupt(WRITE_FILE_IRQ,[fileName,text]));
        }

        public ReadFile(fileName : string)
        {
            _KernelInterruptQueue.enqueue(new Interrupt(READ_FILE_IRQ,fileName));
        }

        public DeleteFile(fileName : string)
        {
            _KernelInterruptQueue.enqueue(new Interrupt(DELETE_FILE_IRQ,fileName));
        }

        public ListFiles() : void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(LIST_FILES_IRQ,null));
        }

        public ChangeSchedulingMethod(method : number) : void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(CHANGE_SCHEDULING_METHOD_IRQ,method));
        }

        public GetSchedulingMethod() : void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(GET_SCHEDULE_METHOD_IRQ,null));
        }

        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);

            // Flag to tell shell not to draw prompt anymore
            _KernelCrash = true;

            // Call blue screen of death in console
            _Console.BSODMessage(msg);

            this.krnShutdown();
        }
    }
}
