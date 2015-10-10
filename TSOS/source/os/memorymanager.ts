///<reference path="../globals.ts" />
///<reference path="../host/memoryaccessor.ts" />
///<reference path="ProcessScheduler.ts" />

/*
    memorymanager.ts

    This class manipulates the physical memory in host. I am doing memory conversions here
    instead of in CPU/Process Scheduler with base and limit registers, as its a project requirment.
 */

module TSOS
{
    export class MemoryManager
    {

        // Constructor just zeros all memory
        constructor()
        {
            this.zeroMemory();
        }

        // Sets all memory to 0. This will change to allow partions zeroed.
        public zeroMemory(): void {

            // Cycle through mem positions
            for( var i = 0; i < _MemoryMax; i++)
            {
                // Set to 0
                _Memory.programMemory[i] = 0;
            }
        }

        // Get dword number value at start of two byte dword little endian address
        //
        // Params: address <number> - start byte of two byte little endian address
        // Returns: converted dword <number>
        // Throws: RangeError on read past limit
        public getDWordLittleEndian(address:number,base:number,limit:number):number
        {
            // Init return value to fail
            var dword = -1;

            var newAdd : number = base + address;


            if( (newAdd < limit) && (newAdd + 1 < limit))
            {
                // Convert value , remembering a number represents a byte
                dword = (_Memory.programMemory[address + 1] * 256) + _Memory.programMemory[address];

            }
            else
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(base, newAdd)));

                throw new RangeError("Memory past limit.");
            }

            // Return dword value fliped, or -1 on invalid start address
            return dword;
        }

        // Loads program into memory. Will change, only one partion at the moment.
        // Implies data was validated before hand, with no spaces or carriage returns
        //
        // Params: source <string> - program input
        public loadMemory(source:string):void
        {
            // Inits
            var val:string;
            var mem = 0;

            // Zeros the memory first
            this.zeroMemory();

            // Load data into memory splitting on hex pairs
            for (var i = 0; (i < source.length) && (mem < _MemoryMax); i = i + 2) {
                if (source.length > i + 1)
                    val = source[i] + source[i + 1];
                else
                    val = source[i] + '0';

                _Memory.programMemory[mem] = parseInt(val, 16);
                mem++;
            }
        }

        // Gets string from memory. Reads until 00.
        //
        // Params: address <number> - address to start reading from
        // Returns: string in memory
        // Throws: RangeError - on memory address out of range
        //         Error - on read past end of partition
        public getString(address:number):string
        {
            // Inits
            var ret:string = "";
            var found:boolean = false;
            var base : number = _ProcessScheduler.runningProcess.base;
            var limit : number = _ProcessScheduler.runningProcess.limit;
            var newAdd: number = base + address;
            var curAddress:number = newAdd;


            // Check if address is out of range
            if (newAdd >= 0 && newAdd < _MemoryMax) {
                // Cycle through addresss until 00 or end of partion
                while (!found && (curAddress < limit)) {
                    // Check for null character, and sound found flag
                    if (_Memory.programMemory[curAddress] == 0)
                        found = true;
                    // Else get char and inc address
                    else {
                        // Add char to string
                        ret = ret + TSOS.Utils.getASCIIChar(_Memory.programMemory[curAddress]);

                        // Inc current address
                        curAddress++;
                    }
                }


                // If not found read past limit, throw exception
                if (!found)
                    throw new Error("Read past end of partion.");

            }
            // Else throw address out of range exception
            else
                throw new RangeError("Memory address out of bounds.");

            // Return string, or null on error
            return ret;
        }

        /*
        // Converts virtual address to actual address. I used to due this
        // in the CPU with base and limit registers, but its a project
        // requirement to do it here.
        //
        // Params: address <number> - virtual address
        // Returns: Value at actual address <number>
        // Throws: RangeError on address over limit
        public getConvertedAddressLittleEndian(address : number) : number
        {
            // Convert address out of little endian
            var dword : number = this.getDWordLittleEndian(address);

            // Get base of running process
            var base : number = _ProcessScheduler.runningProcess.base;

            // Get converted address
            var newAdd : number = base + dword;

            // Get limit of running process
            var limit : number = _ProcessScheduler.runningProcess.limit;

            // Check if over limit
            if( newAdd >= limit)
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(base, newAdd)));

                throw new RangeError("Memory past limit.");
            }

            // Return value at new address
            return _Memory.programMemory[newAdd];

        }

        // Converts virtual address to actual address, and sets value at it. I used to due this
        // in the CPU with base and limit registers, but its a project
        // requirement to do it here.
        //
        // Params: address <number> - virtual address
        //         value <number> - new value
        // Returns: Value at actual address <number>
        // Throws: RangeError on address over limit
        public setConvertedAddressLittleEndian(address : number, value : number) : void
        {
            // Convert address out of little endian
            var dword : number = this.getDWordLittleEndian(address);

            // Get base of running process
            var base : number = _ProcessScheduler.runningProcess.base;

            // Get converted address
            var newAdd : number = base + dword;

            // Get limit of running process
            var limit : number = _ProcessScheduler.runningProcess.limit;

            // Check if over limit
            if( newAdd >= limit)
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(base, newAdd)));

                throw new RangeError("Memory past limit.");
            }

            // Set value at new address
            _Memory.programMemory[newAdd] = value;

        }
        */

        /*
        // Converts virtual address to actual address. I used to due this
        // in the CPU with base and limit registers, but its a project
        // requirement to do it here.
        //
        // Params: address <number> - virtual address
        // Returns: Value at actual address <number>
        // Throws: RangeError on address over limit
        public getConvertedAddress(address : number) : number
        {
            // Get base of running process
            var base : number = _ProcessScheduler.runningProcess.base;

            // Get converted address
            var newAdd : number = base + address;

            // Get limit of running process
            var limit : number = _ProcessScheduler.runningProcess.limit;

            // Check if over limit
            if( newAdd >= limit)
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(base, newAdd)));

                throw new RangeError("Memory past limit.");
            }

            // Return value at new address
            return _Memory.programMemory[newAdd];

        }

        // Converts virtual address to actual address, and sets value at it. I used to due this
        // in the CPU with base and limit registers, but its a project
        // requirement to do it here.
        //
        // Params: address <number> - virtual address
        //         value <number> - new value
        // Returns: Value at actual address <number>
        // Throws: RangeError on address over limit
        public setConvertedAddress(address : number, value : number) : void
        {
            // Get base of running process
            var base : number = _ProcessScheduler.runningProcess.base;

            // Get converted address
            var newAdd : number = base + address;

            // Get limit of running process
            var limit : number = _ProcessScheduler.runningProcess.limit;

            // Check if over limit
            if( newAdd >= limit)
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(base, newAdd)));

                throw new RangeError("Memory past limit.");
            }

            // Set value at new address
            _Memory.programMemory[newAdd] = value;

        }
        */
    }
}