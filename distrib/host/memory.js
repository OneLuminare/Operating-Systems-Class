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
            TSOS.Control.updateHostStatus("Constructor");
            this.zeroMemory();
        }
        // Sets all memory to 0. This will change to allow partions zeroed.
        Memory.prototype.zeroMemory = function () {
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
            // Update memory display in hmtl
            TSOS.Control.updateMemoryDisplay();
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
        // Get dword number value at start of two byte dword little endian address
        //
        // Params: address <number> - start byte of two byte little endian address
        // Returns: value on success, or -1 on invalid address
        Memory.prototype.getDWordLittleEndian = function (address) {
            // Init return value to fail
            var dword = -1;
            if (address + 1 < _MemoryMax && address > 0) {
                // Convert value , remembering a number represents a byte
                dword = (this.programMemory[address + 1] * 256) + this.programMemory[address];
            }
            // Return dword value fliped, or -1 on invalid start address
            return dword;
        };
        // Loads program into memory. Will change, only one partion at the moment.
        // Implies data was validated before hand, with no spaces or carriage returns
        //
        // Params: source <string> - program input
        Memory.prototype.loadMemory = function (source) {
            // Inits
            var val;
            var mem = 0;
            // Zeros the memory first
            this.zeroMemory();
            // Load data into memory splitting on hex pairs
            for (var i = 0; (i < source.length) && (mem < _MemoryMax); i = i + 2) {
                if (source.length > i + 1)
                    val = source[i] + source[i + 1];
                else
                    val = source[i] + '0';
                this.programMemory[mem] = parseInt(val, 16);
                mem++;
            }
        };
        // Gets string from memory. Reads until 00.
        //
        // Params: address <number> - address to start reading from
        // Returns: string in memory
        // Throws: RangeError - on memory address out of range
        //         Error - on read past end of partition
        Memory.prototype.getString = function (address, limit) {
            // Inits
            var ret = "";
            var found = false;
            var curAddress = address;
            // Check if address is out of range
            if (address >= 0 && address < _MemoryMax) {
                // Cycle through addresss until 00 or end of partion
                while (!found && (curAddress < limit)) {
                    // Check for null character, and sound found flag
                    if (this.programMemory[curAddress] == 0)
                        found = true;
                    else {
                        // Add char to string
                        ret = ret + TSOS.Utils.getASCIIChar(this.programMemory[curAddress]);
                        // Inc current address
                        curAddress++;
                    }
                }
                // If not found read past limit, throw exception
                if (!found)
                    throw new Error("Read past end of partion.");
            }
            else
                throw new RangeError("Memory address out of bounds.");
            // Return string, or null on error
            return ret;
        };
        return Memory;
    })();
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
