///<reference path="../globals.ts" />
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
    var Memory = (function () {
        //public static _MemMax = 256;
        function Memory(programMemory) {
            if (programMemory === void 0) { programMemory = new Array(256); }
            this.programMemory = programMemory;
            this.programMemory = new Array();
            TSOS.Control.updateHostStatus("Constructor");
            this.zeroMemory();
        }
        Memory.prototype.zeroMemory = function () {
            for (var i = 0; i < 256; i++) {
                this.programMemory[i] = 0;
                TSOS.Control.updateHostStatus(i.toString());
            }
        };
        Memory.prototype.setAddress = function (address, value) {
            if (address > 255 || address < 0)
                return false;
            if (value > 255 || value < 0)
                return false;
            this.programMemory[address] = value;
            TSOS.Control.updateMemoryDisplay();
            return true;
        };
        Memory.prototype.setAddressHexStr = function (address, valueHex) {
            var value = parseInt(valueHex, 16);
            if (address > 255 || address < 0)
                return false;
            if (value > 255 || value < 0)
                return false;
            this.programMemory[address] = value;
            return true;
        };
        Memory.prototype.getAddress = function (address) {
            var ret = -1;
            if (address >= 0 && address < 256)
                ret = this.programMemory[address];
            return ret;
        };
        Memory.prototype.getAddressHexStr = function (address) {
            var ret = "";
            if (address >= 0 && address < 256)
                ret = TSOS.Utils.padString(this.programMemory[address].toString(16), 2);
            return ret.toUpperCase();
        };
        Memory.prototype.getDWordBigEndian = function (address) {
            var dword = -1;
            if (address + 1 < 256 && address > 0) {
                dword = parseInt(this.programMemory[address + 1].toString(16) + this.programMemory[address].toString(16), 16);
            }
            return dword;
        };
        Memory.prototype.loadMemory = function (source) {
            var s = new RegExp("[ ]+");
            var data = source.toUpperCase().split(s);
            for (var i = 0; (i < data.length) && (i < 256); i++) {
                this.programMemory[i] = parseInt(data[i], 16);
            }
        };
        return Memory;
    })();
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
