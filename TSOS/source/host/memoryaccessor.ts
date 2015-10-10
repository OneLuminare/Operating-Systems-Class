///<reference path="../globals.ts" />

/* ------------
Memory.ts

Emulates hardware memory. All access to memory is mangaged here.
 ------------ */

module TSOS {

    export class MemoryAccessor {

        constructor(public programMemory  = new Array(_MemoryMax) ) {
            this.programMemory = new Array();
            this.init();
        }

        private init() : void
        {
            // Cycle through mem positions
            for( var i = 0; i < _MemoryMax; i++)
            {
                // Set to 0
                this.programMemory[i] = 0;
            }
        }

        // Sets an address in memory, given a base 10 value.
        //
        // Params: address <number> - Address to change
        //         value <number> - base 10 value to set.
        // Returns: true on set, false on invalid address or number larger than a byte
        public setAddress( address : number , value : number) : boolean
        {
            // Return false if address is not in range
            if( address > (_MemoryMax - 1) || address < 0)
                return false;

            // Return false if value greater than a byte
            if( value > (_MemoryMax - 1) || value < 0)
                return false;

            // Set value
            this.programMemory[address] = value;

            // Return success
            return true;
        }


        // Sets an address in memory, given a base 10 value.
        //
        // Params: address <number> - Address to change
        //         value <string> - base 16 string value to set.
        // Returns: true on set, false on invalid address or number larger than a byte
        public setAddressHexStr( address : number , valueHex : string) : boolean
        {
            // Turn hex string into a number
            var value : number = parseInt(valueHex,16);

            // Return false if address is not in range
            if( address > (_MemoryMax - 1) || address < 0)
                return false;

            // Return false if value greater than a byte
            if( value > (_MemoryMax - 1) || value < 0)
                return false;

            // Set value
            this.programMemory[address] = value;

            // Return sucess
            return true;
        }

        // Return base 10 value at adress.
        //
        // Params: address <number> - address to get
        // Returns: Value base 10, or -1 on invalid address
        public getAddress( address : number ) : number
        {
            // Init return value to fail
            var ret : number = -1;

            // If address in range, set return value to mem value
            if( address >= 0 && address < _MemoryMax )
                ret = this.programMemory[address];

            // Return value or -1 on error
            return ret;
        }

        // Return base 16 value at adress.
        //
        // Params: address <number> - address to get
        // Returns: Value base 16 string, or "" on invalid address
        public getAddressHexStr( address : number ) : string
        {
            // Init return value to fail
            var ret : string = "";

            // If address in range, set return value to mem value
            if( address >= 0 && address < _MemoryMax )
                ret = Utils.padString(this.programMemory[address].toString(16),2);

            // Return base 16 string, or "" on fail
            return ret.toUpperCase();
        }


    }
}