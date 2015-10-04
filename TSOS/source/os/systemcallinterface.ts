///<reference path="../globals.ts" />

/* ------------
 Control.ts

 Requires globals.ts.

 Routines for the hardware simulation, NOT for our client OS itself.
 These are static because we are never going to instantiate them, because they represent the hardware.
 In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
 is the "bare metal" (so to speak) for which we write code that hosts our client OS.
 But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
 in both the host and client environments.

 This (and other host/simulation scripts) is the only place that we should see "web" code, such as
 DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */

//
// Control Services
//
module TSOS {

    export class SystemCallInterface
    {
        constructor()
        {

        }

        public processSysCall(value : number) : void
        {
            // Inits
            var noStart : boolean = false;
            var str : string = "";

            // Stop cpu from executing
            _CPU.isExecuting = false;

            // Switch value
            switch(value)
            {
                case 1:
                    //_Kernel.PrintInteger(_CPU.Yreg);
                    break;

                case 2:
                    try
                    {
                        str = _Memory.getString(_CPU.Yreg,_CPU.limit);
                        //_Kernel.PrintString(str);
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
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ,new Array(_CPU.base, _CPU.Yreg)));
                        }
                    }
                    break;

                default:
                    // Send unknown syscall interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_SYSCALL_IRQ,new Array(_CPU.base, _CPU.PC)));

                    // Set noStart to true
                    noStart = true;
                    break;
            }

            // Continue executing if noStart false
            if( !noStart )
                _CPU.isExecuting = true;
        }
    }
}