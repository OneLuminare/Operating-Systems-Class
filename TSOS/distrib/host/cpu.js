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
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu(PC, Acc, Xreg, Yreg, Zflag, isExecuting, base, limit) {
            if (PC === void 0) { PC = 0; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (isExecuting === void 0) { isExecuting = false; }
            if (base === void 0) { base = 0; }
            if (limit === void 0) { limit = 0; }
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
            this.base = base;
            this.limit = limit;
        }
        // Inits values
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
            this.base = 0;
            this.limit = 0;
        };
        // Load immediate instruction. Loads a constant into accumulator.
        //
        // Params: value <number> - base 10 number one byte long (0 - 255)
        // Returns: true on success, false on too large a constant
        Cpu.prototype.LDA = function (value) {
            // Trace
            _Kernel.krnTrace('Executing LDA : A9 with value ' + value.toString(16));
            // Return false if value is not one unsigned byte
            if (value < 0 || value > 255)
                return false;
            // Set accumlator
            this.Acc = value;
            // Update program counter
            this.PC += 2;
            // Return success
            return true;
        };
        // Loads inderect instruction. Loads accumlator with value at address.
        // Must be taken out of little endian form first.
        //
        // Params: address <number> - base 10 address, converted from little endian form
        // Returns: true on success, false on address outside limit.
        Cpu.prototype.LDA2 = function (address) {
            // Trace
            _Kernel.krnTrace('Executing LDA : AD with address ' + address.toString(16));
            // Find raw address
            var rawAddress = this.base + address;
            // Verify raw addres within limit, and set accumlator with value
            if (rawAddress < this.limit) {
                this.Acc = _Memory.getAddress(address);
            }
            else
                return false;
            // Update program counter
            this.PC += 3;
            // Return sucess
            return true;
        };
        // Stores accumulator to location in memory.
        //
        // Params: address <number> - base 10 address, converted from little endian form
        // Returns: true on success, false on address outside limit.
        Cpu.prototype.STA = function (address) {
            // Kernel trace
            _Kernel.krnTrace('Executing STA : 8D with address ' + address.toString(16));
            // Get actual address
            var rawAddress = this.base + address;
            // Set address with accumlator if within limit
            if (rawAddress < this.limit) {
                _Memory.setAddress(address, this.Acc);
            }
            else
                return false;
            // Update program counter
            this.PC += 3;
            // Return sucess
            return true;
        };
        // Simulates clock cycle, process instruction based on registers and memory.
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            // Inits
            var address = this.base + this.PC;
            var inst = _Memory.getAddress(address).toString(16);
            var dword = null;
            // Switch on instruction
            switch (inst) {
                // LDA immediate
                case "a9":
                    this.LDA(_Memory.getAddress(address + 1));
                    break;
                // LDA indirect
                case "ad":
                    // Convert little endian address to base 10 address
                    dword = _Memory.getDWordLittleEndian(address + 1);
                    // Run instruction, and check for failure
                    if (!this.LDA2(dword)) {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));
                        // Stop executing
                        this.isExecuting = false;
                    }
                    break;
                // STA
                case "8d":
                    // Convert little endian address to base 10 address
                    dword = _Memory.getDWordLittleEndian(address + 1);
                    // Run instruction, and check for failure
                    if (!this.STA(dword)) {
                        // Send memory violation interrupt
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));
                        // Stop executing
                        this.isExecuting = false;
                    }
                    break;
                // Break instruction
                case "0":
                    // Trace
                    _Kernel.krnTrace('Executing break.');
                    // Send exit process interrupt
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(EXIT_PROCESS_IRQ, new Array(this.base, this.PC)));
                    // Stop executing
                    this.isExecuting = false;
                    break;
                // Else unknown op code
                default:
                    // Send unknown op code interrupt
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(UNKNOWN_OP_CODE_IRQ, new Array(this.base, this.PC)));
                    // Stop executing
                    this.isExecuting = false;
                    break;
            }
            // Update cput display
            TSOS.Control.updateCPUDisplay();
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
