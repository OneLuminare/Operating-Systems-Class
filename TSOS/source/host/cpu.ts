///<reference path="../globals.ts" />
///<reference path="../os/pcb.ts" />

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

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false,
                    public base: number = 0,
                    public limit: number = 0) {

        }

        // Inits values
        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
            this.base = 0;
            this.limit = 0;
        }

        // Load immediate instruction. Loads a constant into accumulator.
        //
        // Params: value <number> - base 10 number one byte long (0 - 255)
        // Returns: true on success, false on too large a constant
        public LDA(value : number) : boolean
        {
            // Trace
            _Kernel.krnTrace('Executing LDA : A9 with value ' + value.toString(16));

            // Return false if value is not one unsigned byte
            if( value < 0 || value > 255)
                return false;

            // Set accumlator
            this.Acc = value;

            // Update program counter
            this.PC += 2;

            // Return success
            return true;
        }

        // Loads inderect instruction. Loads accumlator with value at address.
        // Must be taken out of little endian form first.
        //
        // Params: address <number> - base 10 address, converted from little endian form
        // Returns: true on success, false on address outside limit.
        public LDA2(address : number ) : boolean
        {
            // Trace
            _Kernel.krnTrace('Executing LDA : AD with address ' + address.toString(16));

            // Find raw address
            var rawAddress = this.base + address;

            // Verify raw addres within limit, and set accumlator with value
            if ( rawAddress < this.limit )
            {
                this.Acc = _Memory.getAddress(address);
            }
            // Else memory access violation
            else
                return false;

            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // Stores accumulator to location in memory.
        //
        // Params: address <number> - base 10 address, converted from little endian form
        // Returns: true on success, false on address outside limit.
        public STA(address : number ) : boolean
        {
            // Kernel trace
            _Kernel.krnTrace('Executing STA : 8D with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Set address with accumlator if within limit
            if ( rawAddress < this.limit )
            {
                _Memory.setAddress(address,this.Acc);
            }
            // Else memory access violation return false
            else
                return false;

            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // Simulates clock cycle, process instruction based on registers and memory.
        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            // Inits
            var address = this.base + this.PC;
            var inst = _Memory.getAddress(address).toString(16);
            var dword = null;

            // Switch on instruction
            switch(inst)
            {
                // LDA immediate
                case "a9":
                    this.LDA(_Memory.getAddress(address + 1));
                    break;

                // LDA indirect
                case "ad":
                    // Convert little endian address to base 10 address
                    dword = _Memory.getDWordLittleEndian(address + 1);

                    // Run instruction, and check for failure
                    if( !this.LDA2(dword) )
                    {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                        // Stop executing
                        this.isExecuting = false;
                    }

                    break;

                // STA
                case "8d":
                    // Convert little endian address to base 10 address
                    dword = _Memory.getDWordLittleEndian(address + 1);

                    // Run instruction, and check for failure
                    if( !this.STA(dword) )
                    {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ,new Array(this.base, dword)));

                        // Stop executing
                        this.isExecuting = false;
                    }
                    break;

                // Break instruction
                case "0":
                    // Trace
                    _Kernel.krnTrace('Executing break.');

                    // Send exit process interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(EXIT_PROCESS_IRQ,new Array(this.base,this.PC)));

                    // Stop executing
                    this.isExecuting = false;
                    break;

                // Else unknown op code
                default:
                    // Send unknown op code interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_OP_CODE_IRQ,new Array(this.base ,this.PC)));

                    // Stop executing
                    this.isExecuting = false;
                    break;
            }

            // Update cput display
            TSOS.Control.updateCPUDisplay();
        }
    }
}
