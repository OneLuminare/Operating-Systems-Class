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
            if ( rawAddress < (this. base + this.limit) )
            {
                this.Acc = _Memory.getAddress(rawAddress);
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
            if ( rawAddress < (this. base + this.limit) )
            {
                _Memory.setAddress(rawAddress,this.Acc);
            }
            // Else memory access violation return false
            else
                return false;


            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // Add with carry. Currently doesn't implement carry#3
        public ADC(address : number) : boolean
        {
            // Vars
            var value : number = 0;

            // Kernel trace
            _Kernel.krnTrace('Executing ADC : 6D with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Check if address is within program range
            if ( rawAddress < (this. base + this.limit) )
            {
                // Get memory value
                value = _Memory.getAddress(rawAddress);

                // Add value to accumulator
                this.Acc += value;

                // Check for overflow
                if( this.Acc > 255 )
                {
                    // Set accumlator to FF
                    this.Acc = 255;

                    // Send overflow interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(ARITHMATIC_OVERFLOW_IRQ, new Array(this.base,this.PC)));

                    return false;

                }
            }
            // Else memory access violation return false
            else
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, address)));

                return false;
            }


            // Increment pc
            this.PC += 3;

            // Return success
            return true;
        }

        // LDX Immediate
        public LDX1(value : number) : boolean
        {
            // Kernel trace
            _Kernel.krnTrace('Executing LDX : A2 with value ' + value.toString(16));

            // Check if constant over a byte
            if( value > 255 )
            {
                return false;
            }

            // Load x register with constant
            this.Xreg = value;

            // Inc PC
            this.PC += 2;

            // Return success
            return true;
        }

        // LDX Indirect
        public LDX2(address : number) : boolean
        {
            // Kernel trace
            _Kernel.krnTrace('Executing LDX : AE with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Set address with accumlator if within limit
            if ( rawAddress < (this. base + this.limit) )
            {
                this.Xreg = _Memory.getAddress(rawAddress);
            }
            // Else memory access violation return false
            else
                return false;


            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // LDY Immediate
        public LDY1(value : number) : boolean
        {
            // Kernel trace
            _Kernel.krnTrace('Executing LDY : A0 with value ' + value.toString(16));

            // Check if constant over a byte
            if( value > 255 )
            {
                return false;
            }

            // Load x register with constant
            this.Yreg = value;

            // Inc PC
            this.PC += 2;

            // Return success
            return true;
        }

        // LDY Indirect
        public LDY2(address : number) : boolean
        {
            // Kernel trace
            _Kernel.krnTrace('Executing LDY : AC with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Set address with accumlator if within limit
            if ( rawAddress < (this. base + this.limit) )
            {
                this.Yreg = _Memory.getAddress(rawAddress);
            }
            // Else memory access violation return false
            else
                return false;


            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // CPX
        public CPX(address: number) : boolean
        {
            // Inits
            var value : number = 0;

            // Kernel trace
            _Kernel.krnTrace('Executing CPX : EC with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Check if address within limit
            if ( rawAddress < (this. base + this.limit) )
            {
                // Get value at address
                value = _Memory.getAddress(rawAddress);

                // If equal to xReg, set ZFlag to 0
                if( this.Xreg == value)
                    this.Zflag = 1;
                // Else set zFlag to 1
                else
                {
                    this.Zflag = 0;

                }

                _Kernel.krnTrace('Value : ' + value.toString(16) + ' XReg :' + this.Xreg.toString(16) + ' ZFlag : ' + this.Zflag);
            }
            // Else memory access violation return false
            else
                return false;


            // If equal to xReg, set ZFlag to 0
            if( this.Xreg == value)
                this.Zflag = 1;
            // Else set zFlag to 1
            else
            {
                this.Zflag = 0;

            }

            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // BNE
        public BNE(value : number) : boolean
        {
            // Inits
            var newPc : number = 0;

            // Kernel trace
            _Kernel.krnTrace('Executing BNE : B0 with value ' + value.toString(16));

            // Check if constant over a byte
            if( value > 255 )
            {
                return false;
            }

            // Inc PC
            this.PC += 2;

            // Check if zFlag 0
            if( this.Zflag == 0)
            {
                // Get new PC
                newPc = this.PC + value;

                // If over partition size, cycle to begining
                if( newPc > (_MemoryPartitionSize - 1) )
                    newPc = newPc - _MemoryPartitionSize;

                // Set new pc
                this.PC = newPc;
            }
        }

        // INC
        public INC(address : number) : boolean
        {
            // Inits
            var value : number = 0;

            // Kernel trace
            _Kernel.krnTrace('Executing INC : EE with address ' + address.toString(16));

            // Get actual address
            var rawAddress = this.base + address;

            // Check if address is within limi
            if ( rawAddress < (this. base + this.limit) )
            {
                // Get value
                value = _Memory.getAddress(rawAddress);

                // Inc by 1
                value++;

                // If over a byte, set to 0
                if( value > 255)
                    value = 0;

                // Set new value
                _Memory.setAddress(rawAddress,value);
            }
            // Else memory access violation return false
            else
                return false;


            // Update program counter
            this.PC += 3;

            // Return sucess
            return true;
        }

        // Performs system call given by index in XReg.
        //
        // Returns: true on success, false on invalid index
        public SYSCALL() : boolean
        {
            // Get value in xReg
            var call : number = this.Xreg;
            var ret : boolean = true;

            // Trace
            _Kernel.krnTrace('Executing SYSCALL ' + call.toString(16));

            // Switch input
            switch(call)
            {
                case 1:
                    _Kernel.PrintInteger();
                    break;

                case 2:
                    _Kernel.PrintString();
                    break

                default:
                    ret = false;
                    break;
            }

            this.PC += 1;

            return ret;
        }

        public getParamCount(inst : string) : number
        {
            var count = 0;

            // Switch on instruction
            switch (inst) {
                // LDA immediate
                case "a9":
                    count = 1;
                    break;

                // LDA indirect
                case "ad":
                    count = 2;
                    break;

                // STA
                case "8d":
                    count = 2;
                    break;

                // ADC
                case "6d":
                    count = 2;
                    break;

                // LDX immediate
                case "a2":
                    count = 1;
                    break;

                // LDX indirect
                case "ae":
                    count = 2;
                    break;

                // LDY immediate
                case "a0":
                    count = 1;
                    break;

                // LDY indirect
                case "ac":
                    count = 2;
                    break;

                // No op EA
                case "ea":
                    count = 0;
                    break;

                // CPX
                case "ec":
                    count = 2;
                    break;

                // BNE
                case "d0":
                    count = 1;
                    break;

                // INC
                case "ee":
                    count = 2;
                    break;

                case "ff":
                    count = 0;
                    break;

                // Break instruction
                case "0":
                    count = 0;
                    break;

                // Else unknown op code
                default:
                    count = 0;
                    break;
            }

            return count;
        }

        // Simulates clock cycle, process instruction based on registers and memory.
        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            // Inits
            var address : number = this.base + this.PC;
            var limitAddress : number = this.base + this.limit;
            var nextAddress : number = address + 1;
            var inst : string = _Memory.getAddress(address).toString(16);
            var dword : number = 0;



            // Switch on instruction
            switch (inst)
            {
                // LDA immediate
                case "a9":
                    // Check if next address is over limit
                    if( nextAddress >= limitAddress )
                    {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                        // Stop executing
                        this.isExecuting = false;
                    }
                    // Else execute instruction
                    else
                        this.LDA(_Memory.getAddress(address + 1));

                    break;

                // LDA indirect
                case "ad":
                    // Check if next dword is out of limit
                    if( (address + 2) >= limitAddress)
                    {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                        // Stop executing
                        this.isExecuting = false;
                    }
                    // Else get dword and run instruction
                    else
                    {
                        // Convert little endian address to base 10 address
                        dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                        // Run instruction
                        if(!this.LDA2(dword))
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                    }
                    break;


                    // STA
                    case "8d":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.STA(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    // ADC
                    case "6d":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.ADC(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    // LDX immediate
                    case "a2":
                        // Check if next address is over limit
                        if( nextAddress >= limitAddress )
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        // Else execute instruction
                        else
                            this.LDX1(_Memory.getAddress(address + 1));

                        break;

                    // LDX indirect
                    case "ae":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.LDX2(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    // LDY immediate
                    case "a0":
                        // Check if next address is over limit
                        if( nextAddress >= limitAddress )
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        // Else execute instruction
                        else
                            this.LDY1(_Memory.getAddress(address + 1));;

                        break;

                    // LDY indirect
                    case "ac":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.LDY2(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    // No op EA
                    case "ea":
                        _Kernel.krnTrace("Executing EA : no op.");
                        break;

                    // CPX
                    case "ec":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.CPX(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    // BNE
                    case "d0":
                        this.BNE(_Memory.getAddress(address + 1));

                        break;

                    // INC
                    case "ee":
                        // Check if next dword is out of limit
                        if( (address + 2) >= limitAddress)
                        {
                            // Send memory violation interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, nextAddress)));

                            // Stop executing
                            this.isExecuting = false;
                        }
                        else
                        {
                            // Convert little endian address to base 10 address
                            dword = _MemoryManager.getDWordLittleEndian(address + 1,limitAddress);

                            // Run instruction
                            if(!this.INC(dword))
                            {
                                // Send memory violation interrupt
                                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));

                                // Stop executing
                                this.isExecuting = false;
                            }
                        }

                        break;

                    case "ff":


                        // Run instruction and check for failure
                        if (!this.SYSCALL()) {
                            // Send unknown syscall interrupt
                            _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_SYSCALL_IRQ, new Array(this.base, this.PC)));
                        }

                        // Stop executing (either on failure or success)
                        this.isExecuting = false;

                        break;

                    // Break instruction
                    case "0":
                        // Trace
                        _Kernel.krnTrace('Executing break.');

                        // Send exit process interrupt
                        _Kernel.TerminateProcess(this.base);

                        // Stop executing
                        this.isExecuting = false;
                        break;

                    // Else unknown op code
                    default:
                        // Send unknown op code interrupt
                        _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_OP_CODE_IRQ, new Array(this.base, this.PC)));

                        // Stop executing
                        this.isExecuting = false;
                        break;
                }

            // Get next instruction address
            address = this.base + this.PC;

            // check if this address is with in memory, and update mem with highlight code
            if( (address < limitAddress) && ((_TimerCounter + 1) != _Quantum) )
            {
                    inst = _Memory.getAddress(address).toString(16);

                    // Update memory display with highlighted code
                    TSOS.Control.updateMemoryDisplay(address, this.getParamCount(inst));
            }
            // Else update mem with out highlight code
            else
            {
                _Kernel.krnTrace("test");

                TSOS.Control.updateMemoryDisplay();
            }



            // Update cput display
            TSOS.Control.updateCPUDisplay();
        }
    }
}
