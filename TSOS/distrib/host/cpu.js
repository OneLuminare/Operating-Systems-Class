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
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        };
        Cpu.prototype.LDA = function (value) {
            _Kernel.krnTrace('Executing LDA : A9 with value ' + value);
            if (value < 0 || value > 255)
                return false;
            this.Acc = value;
            this.PC += 2;
            return true;
        };
        Cpu.prototype.LDA2 = function (address) {
            _Kernel.krnTrace('Executing LDA : AD with address ' + address);
            var rawAddress = this.base + address;
            if (rawAddress < this.limit) {
                this.Acc = _Memory.getAddress(address);
            }
            else
                return false;
            this.PC += 3;
            return true;
        };
        Cpu.prototype.STA = function (address) {
            _Kernel.krnTrace('Executing STA : 8D with address ' + address);
            var rawAddress = this.base + address;
            if (rawAddress < this.limit) {
                _Kernel.krnTrace("address: " + address.toString(16) + "acc: " + this.Acc.toString(16));
                _Memory.setAddress(address, this.Acc);
            }
            else
                return false;
            this.PC += 3;
            return true;
        };
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            var address = this.base + this.PC;
            var inst = _Memory.getAddress(address).toString(16);
            var dword = null;
            switch (inst) {
                case "a9":
                    this.LDA(_Memory.getAddress(address + 1));
                    break;
                case "ad":
                    dword = _Memory.getDWordBigEndian(address + 1);
                    if (!this.LDA2(dword)) {
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));
                        this.isExecuting = false;
                    }
                    break;
                case "8d":
                    dword = _Memory.getDWordBigEndian(address + 1);
                    if (!this.STA(dword)) {
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(this.base, dword)));
                        this.isExecuting = false;
                    }
                    break;
                case "0":
                    _Kernel.krnTrace('Executing break.');
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(EXIT_PROCESS_IRQ, new Array(this.base, this.PC)));
                    this.isExecuting = false;
                    break;
                default:
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(UNKNOWN_OP_CODE_IRQ, new Array(this.base, this.PC)));
                    this.isExecuting = false;
                    break;
            }
            TSOS.Control.updateCPUDisplay();
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
