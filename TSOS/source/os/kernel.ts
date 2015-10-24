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

            //
            // ... more?
            //

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();
            this.krnTrace("cr sh");

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
                    if( !_ShellWaitForMessage ) {
                        _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                        _StdIn.handleInput();
                    }
                    break;
                case CREATE_PROCESS_IRQ:
                    pcb = _ProcessScheduler.createProcess(params);
                    if( pcb != null)
                        _OsShell.message("Loaded process with PID " + pcb.pid.toString() + ".");
                    break;
                case EXECUTE_PROCESS_IRQ:
                    if( !_ProcessScheduler.executeProcess(params) )
                        _OsShell.message("No process with PID " + params.toString() + ".");
                    else
                        _OsShell.message("Executing process PID " + params.toString() + ".");
                    break;
                case TERMINATE_PROCESS_IRQ:
                    pcb = _ProcessScheduler.exitProcess(params);
                    if(pcb != null)
                        _OsShell.outputMessage("Exiting process with PID " + pcb.pid.toString() + ".");
                    else
                        _OsShell.outputMessage("Cannot terminate process pid " + params.toString() + ", as it does not exist.")
                    break;
                case UNKNOWN_OP_CODE_IRQ:
                    //pcb =  _ProcessScheduler.runningProcess;
                    var pid : number = _MemoryManager.getLoadedPID(params[0]);
                    this.krnTrace("Unknown op code at 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + " in process PID " + pid.toString() + ".");
                    _ProcessScheduler.exitProcess(pid);
                    _OsShell.outputMessage("Process pid " + pid.toString() + " terminated due to unknown op code at 0x" + TSOS.Utils.padString((params[1]).toString(16),4) + ".");
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
                    _OsShell.message("Cannot load program, memory full.");
                    break;
                case CONTEXT_SWITCH_IRQ:
                    _ProcessScheduler.contextSwitch();
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
            if( _TimerCounter == _Quantum)
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
        public CreateProcess(program : string) : void
        {
            // Send create process interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(CREATE_PROCESS_IRQ, program));
        }

        // Terminate Process
        public ExecuteProcess(pid : number) : void
        {
            // Send interupt to run process
            _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_PROCESS_IRQ, pid));
        }

        public TerminateProcess(base : number) : void
        {
            // Var pid
            var pid : number = _MemoryManager.getLoadedPID(base);;

            // Send exit process interrupt
            _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,pid));
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
                str = _MemoryManager.getString(_CPU.Yreg);
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
