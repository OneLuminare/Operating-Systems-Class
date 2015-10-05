///<reference path="../globals.ts" />
/* ------------
Memory.ts

Emulates hardware memory. All access to memory is mangaged here.
 ------------ */
var TSOS;
(function (TSOS) {
    var Memory = (function () {
        function Memory(programMemory) {
            if (programMemory === void 0) { programMemory = new Array(_MemoryMax); }
            this.programMemory = programMemory;
            this.programMemory = new Array();
            this.init();
        }
        Memory.prototype.init = function () {
            // Cycle through mem positions
            for (var i = 0; i < _MemoryMax; i++) {
                // Set to 0
                this.programMemory[i] = 0;
            }
        };
        // Sets an address in memory, given a base 10 value.
        //
        // Params: address <number> - Address to change
        //         value <number> - base 10 value to set.
        // Returns: true on set, false on invalid address or number larger than a byte
        Memory.prototype.setAddress = function (address, value) {
            // Return false if address is not in range
            if (address > (_MemoryMax - 1) || address < 0)
                return false;
            // Return false if value greater than a byte
            if (value > (_MemoryMax - 1) || value < 0)
                return false;
            // Set value
            this.programMemory[address] = value;
            // Return success
            return true;
        };
        // Sets an address in memory, given a base 10 value.
        //
        // Params: address <number> - Address to change
        //         value <string> - base 16 string value to set.
        // Returns: true on set, false on invalid address or number larger than a byte
        Memory.prototype.setAddressHexStr = function (address, valueHex) {
            // Turn hex string into a number
            var value = parseInt(valueHex, 16);
            // Return false if address is not in range
            if (address > (_MemoryMax - 1) || address < 0)
                return false;
            // Return false if value greater than a byte
            if (value > (_MemoryMax - 1) || value < 0)
                return false;
            // Set value
            this.programMemory[address] = value;
            // Return sucess
            return true;
        };
        // Return base 10 value at adress.
        //
        // Params: address <number> - address to get
        // Returns: Value base 10, or -1 on invalid address
        Memory.prototype.getAddress = function (address) {
            // Init return value to fail
            var ret = -1;
            // If address in range, set return value to mem value
            if (address >= 0 && address < _MemoryMax)
                ret = this.programMemory[address];
            // Return value or -1 on error
            return ret;
        };
        // Return base 16 value at adress.
        //
        // Params: address <number> - address to get
        // Returns: Value base 16 string, or "" on invalid address
        Memory.prototype.getAddressHexStr = function (address) {
            // Init return value to fail
            var ret = "";
            // If address in range, set return value to mem value
            if (address >= 0 && address < _MemoryMax)
                ret = TSOS.Utils.padString(this.programMemory[address].toString(16), 2);
            // Return base 16 string, or "" on fail
            return ret.toUpperCase();
        };
        return Memory;
    })();
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
