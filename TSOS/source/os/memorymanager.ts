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
    export class MemoryManager {
        // Properties
        partitionsLoaded:Array<boolean>;
        partitionBaseAddress:Array<number>;
        partitionPIDs:Array<number>;
        hdLoadedPIDs:Array<number>;
        hdLoadedFNames:string[];

        // Constructor just zeros all memory
        constructor() {
            // Init arrays
            this.partitionsLoaded = new Array<boolean>(_MemoryPartitions);
            this.partitionBaseAddress = new Array<number>(_MemoryPartitions);
            this.partitionPIDs = new Array<number>(_MemoryPartitions);
            this.hdLoadedPIDs = [];
            this.hdLoadedFNames = [];

            // Populate arrays
            this.populateArrays();

            // Zero memory
            this.zeroAllMemory();
        }

        // Populate arrays
        private populateArrays():void {
            // Set loaded to false
            this.partitionsLoaded[0] = false;
            this.partitionsLoaded[1] = false;
            this.partitionsLoaded[2] = false;

            // Set partition pids
            this.partitionPIDs[0] = 0;
            this.partitionPIDs[1] = 0;
            this.partitionPIDs[2] = 0;

            // Init base addresses
            var nextAddress:number = 0;
            for (var i = 0; i < _MemoryPartitions; i++) {
                this.partitionBaseAddress[i] = nextAddress;

                nextAddress += _MemoryPartitionSize;
            }
        }

        // Sets all memory to 0.
        //
        // Returns: Always true.
        public zeroAllMemory():boolean {

            // Cycle through mem positions
            for (var i = 0; i < _MemoryMax; i++) {
                // Set to 0
                _Memory.programMemory[i] = 0;
            }

            // Always return true
            return true;
        }

        // Sets partition memory to 0
        //
        // Params: partition <number> - 0 based index of partition
        // Returns: true on valid partition
        public zeroMemory(partition:number):boolean {
            // Return if invalid partition index
            if (partition < 0 || partition >= _MemoryPartitions)
                return false;

            // Get base
            var base:number = this.partitionBaseAddress[partition];
            var limit:number = base + _MemoryPartitionSize;

            // Cycle through mem positions
            for (var i = base; i < limit; i++) {
                // Set to 0
                _Memory.programMemory[i] = 0;
            }

            // Return sucess
            return true;
        }

        // Returns true if partition available.
        //
        // Returns: true if memory available
        public isMemoryAvailable():boolean {
            // Inits
            var ret = false;

            // Check if partition available
            for (var i = 0; (i < _MemoryPartitions) && !ret; i++)
                if (this.partitionsLoaded[i] == false)
                    ret = true;

            // Return true if memory available
            return ret;
        }

        // Gets index of next available partition.
        // Returns -1 if none avialable.
        //
        // Returns: partition available, or -1 if memory full
        public nextPartitionAvailable():number
        {
            // Inits
            var next : number = -1;

            // Check if partition available
            for (var i = 0; (i < _MemoryPartitions) && (next == -1); i++)
                if (this.partitionsLoaded[i] == false)
                    next = i;

            // Return true if memory available
            return next;
        }

        // Gets partition index by base
        //
        // Params: base
        // Returns partition index or -1 on not found
        public partitionFromBase(base:number) : number
        {
            var partition = -1;

            for(var i = 0; (i < this.partitionBaseAddress.length) && (partition == -1); i++)
            {
                if( this.partitionBaseAddress[i] == base)
                    partition = i;
            }

            return partition;
        }


        // Mark partition as available.
        //
        // Params: partition <number> - index of partition
        //         zeroMemory <boolean> - flag to zero memory if desired. Default false.
        // Returns: true on valid partition
        public freePartition(partition : number, zeroMemory : boolean = false) : boolean
        {
            // Return if invalid partition index
            if (partition < 0 || partition >= _MemoryPartitions)
                return false;

            // Set partition not in use
            this.partitionsLoaded[partition] = false;

            // Zero memory if told to
            if( zeroMemory )
                this.zeroMemory(partition);

            // Update memory display
            TSOS.Control.updateMemoryDisplay();

            // Return success
            return true;
        }

        // Clears all memory partitions
        public freeAllPartitions(zeroMemory:boolean = false) : void
        {
            for( var i = 0; i < _MemoryPartitions; i++)
            {
                this.freePartition(i,zeroMemory);
            }

            // Update memory display
            TSOS.Control.updateMemoryDisplay();
        }

        // Gets base address at given partition, or -1 on invalid partition
        //
        // Params: partition <number> - 0 based index of partition
        // Returns: true on valid partition
        public getPartitionBaseAddress(partition : number) : number
        {
            // Return if invalid partition index
            if (partition < 0 || partition >= _MemoryPartitions)
                return -1;

            // Return base
            return this.partitionBaseAddress[partition];
        }

        /*
        // Gets limit at given partition, or -1 on invalid partition
        //
        // Params: partition <number> - 0 based index of partition
        // Returns: true on valid partition
        public partitionLimit(partition : number)
        {
            // Return if invalid partition index
            if (partition < 0 || partition >= _MemoryPartitions)
                return -1;

            // Return limit
            return this.partitionBaseAddress[partition] + _MemoryPartitionSize;
        }
        */

        // Get dword number value at start of two byte dword little endian address
        //
        // Params: address <number> - start byte of two byte little endian address
        // Returns: converted dword <number>
        // Throws: RangeError on read past limit
        public getDWordLittleEndian(address:number,limit:number):number
        {
            // Init return value to fail
            var dword = -1;


            if( (address < limit) && (address + 1 < limit))
            {
                // Convert value , remembering a number represents a byte
                dword = (_Memory.programMemory[address + 1] * 256) + _Memory.programMemory[address];

            }
            else
            {
                // Send memory violation interrupt
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, new Array(limit - _MemoryPartitionSize, address)));

                throw new RangeError("Memory past limit.");
            }

            // Return dword value fliped, or -1 on invalid start address
            return dword;
        }

        //          CR_FILE_NOT_FOUND on file not found,
        //          CR_DRIVE_NOT_FORMATED if drive not formatted,
        //          CR_DID_NOT_WRITE_ALL_DATA  if text uses more space than available.
        //          CR_CORRUPTED_FILE_BLOCK if missing a file block

        //          CR_FILE_LENGTH_TO_LONG if file name to long,
        //          CR_EMPTY_FILE_NAME if empty file name,
        //          CR_FILE_DIRECTORY_FULL  if no more space in file directory,
        //          CR_DRIVE_FULL if no free blocks.

        //          CR_FILE_NOT_FOUND if file not in directory
        public loadToHDDBytes(data : number[],pid:number) : any[]
        {
            // Inits
            var fname : string;
            var ret : number;
            var error : boolean = false;
            var val : string;
            var wdata : number[] = [];

            // Create swap file name
            fname = "~proc-" + pid.toString();

            // Try to create file
            ret = _HDDriver.createFile(fname);


            // Keep trying until file created or error,
            // while adding a ~ to fname to avoid duplicates
            while( (ret != CR_SUCCESS) && !error)
            {
                // IF duplicate, add ~ to fname and try again
                if( ret == CR_DUPLICATE_FILE_NAME)
                {
                    fname = "~" + fname;
                    ret = _HDDriver.createFile(fname);
                }
                // Else error stop
                else
                    error = true;
            }

            // Check if no error
            if( !error )
            {
                // Load data into memory splitting on hex pairs.
                // Makes sure its 256 bytes.
                for (var i = 0; i < _MemoryPartitionSize; i++)
                {
                    if( i < data.length)
                    {
                        wdata.push(data[i]);
                    }
                    else
                        wdata.push(0);
                }


                // Write to file
                ret = _HDDriver.writeToFileBytes(fname,wdata);

                // If not error, put pid on loaded hdd pid array
                if( ret == CR_SUCCESS)
                {
                    this.addHDLoaded(pid,fname);
                    _Kernel.krnTrace("Created swap file: " + fname);
                }
            }


            // Return array of [ret value, fname]
            return [ret,fname];
        }

        public loadToHDD(source:string,pid : number) : any[]
        {
            // Inits
            var fname : string;
            var ret : number;
            var error : boolean = false;
            var val : string;
            var data : number[] = [];
            var sindex = 0;

            // Create swap file name
            fname = "~proc-" + pid.toString();

            // Try to create file
            ret = _HDDriver.createFile(fname);


            // Keep trying until file created or error,
            // while adding a ~ to fname to avoid duplicates
            while( (ret != CR_SUCCESS) && !error)
            {
                // IF duplicate, add ~ to fname and try again
                if( ret == CR_DUPLICATE_FILE_NAME)
                {

                    fname = "~" + fname;
                    ret = _HDDriver.createFile(fname);
                }
                // Else error stop
                else
                    error = true;
            }

            // Check if no error
            if( !error )
            {

                // Load data into memory splitting on hex pairs.
                // Makes sure its 256 bytes.
                for (var i = 0; i < _MemoryPartitionSize; i++)
                {
                    if( sindex < source.length)
                    {
                        if (source.length > sindex + 1)
                            val = source[sindex] + source[sindex + 1];
                        else
                            val = source[sindex] + '0';

                        sindex += 2;

                        data.push(parseInt(val, 16));
                    }
                    else
                        data.push(0);
                }

                // Write to file
                ret = _HDDriver.writeToFileBytes(fname,data);

                // If not error, put pid on loaded hdd pid array
                if( ret == CR_SUCCESS)
                {
                    this.addHDLoaded(pid,fname);

                    _Kernel.krnTrace("Created swap file: " + fname);
                }
            }

            // Return array of [ret value, fname]
            return [ret,fname];
        }

        public addHDLoaded(pid : number, fname : string) : void
        {
            this.hdLoadedPIDs.push(pid);
            this.hdLoadedFNames.push(fname);
        }

        public removeHDLoaded(pid : number) : boolean
        {
            var ret = false;
            var temp : number[] = [];
            var temps : string[] = [];

            for( var i = 0; i < this.hdLoadedPIDs.length; i++)
            {
                if (this.hdLoadedPIDs[i] != pid) {
                    temp.push(this.hdLoadedPIDs[i]);
                    temps.push(this.hdLoadedFNames[i]);
                }
                else
                    ret = true;
            }

            if( ret )
            {
                this.hdLoadedPIDs = temp;
                this.hdLoadedFNames = temps;
            }

            return ret;
        }


        public findHDLoadedPID(pid : number) : number
        {
            var ret = -1;

            for( var i = 0; (i < this.hdLoadedPIDs.length) && (ret == -1); i++)
                if( this.hdLoadedPIDs[i] == pid)
                    ret = i;

            return ret;
        }

        public findHDLoadedFName(pid : number) : string
        {
            var index = this.findHDLoadedPID(pid);
            if( index != -1 )
                return this.hdLoadedFNames[index];
            else
                return null;
        }

        public getPartitionBytes(part : number) : number[]
        {
            var data : number[] = [];
            var len = 0;

            // Check if valid partition
            if( part < 0 || part >= _MemoryPartitions)
                return null;

            len = this.partitionBaseAddress[part] + _MemoryPartitionSize;
            for( var i = this.partitionBaseAddress[part]; i < len; i++)
            {
                data.push(_Memory.programMemory[i]);
            }

            return data;
        }

        public loadPartitionBytes(part : number, data : number[]) : boolean
        {

            // Check if valid partition
            if( part < 0 || part >= _MemoryPartitions)
                return false;

            this.zeroMemory(part);


            var mem = this.partitionBaseAddress[part];

            for( var i = 0; (i < data.length) && (i < _MemoryPartitionSize); i++)
            {
                _Memory.programMemory[mem] = data[i];
                mem++;
            }


            return true;
        }

        public swapFile(partition : number, hdpid : number) : number
        {
            // Inits
            var data : number[];
            var aret : any[];
            var oldfname : string;
            var oldpid : number;
            var swappid : number;
            var savePartToHD : boolean = false;

            // Check if valid partition
            if( partition < 0 || partition >= _MemoryPartitions)
                return CR_INVALID_PARTITION;

            // Check if hdpid is currently on hd
            if( this.findHDLoadedPID(hdpid) == -1 )
                return CR_SWAP_FILE_NOT_LOADED;

            // Check if partition is free
            if( this.partitionsLoaded[partition] )
            {

                // Get partition bytes
                data = this.getPartitionBytes(partition);

                // Create swap file
                aret = this.loadToHDDBytes(data, this.partitionPIDs[partition]);


                // Return error if could not load
                if (aret[0] < 0)
                    return aret[0];


                // Get swap fname if error occurs and need to delete
                oldfname = aret[1];
                oldpid = this.partitionPIDs[partition];

                // Set save to hd flag
                savePartToHD = true;
            }
            else
                oldpid = CR_MEMORY_SWAP_FILE_NOT_NEEDED;

            // Get hd swap file bytes
            aret = _HDDriver.readFileBytes(this.findHDLoadedFName(hdpid));

            // Verify valid data
            if( aret[0] < 0)
            {
                // Remove created swap file if one created
                if( savePartToHD )
                     _HDDriver.deleteFile(oldfname);

                // Return error
                return aret[0];
            }


            // Load into partition
            if( !this.loadPartitionBytes(partition,aret[1]) )
            {
                // Remove created swap file
                if( savePartToHD )
                    _HDDriver.deleteFile(oldfname);

                // Return error
                return CR_PARTITION_NOT_LOADED;
            }

            // Set partition in use
            this.partitionsLoaded[partition] = true;

            // Change loaded pid
            this.partitionPIDs[partition] = hdpid;

            // Remove old swap file
            this.removeSwapFile(hdpid);

            return oldpid;
        }

        public removeSwapFile(pid : number) : boolean
        {
            // Inits
            var index;
            var ret = false;

            index = this.findHDLoadedPID(pid);
            if( index != -1)
            {
                _HDDriver.deleteFile(this.hdLoadedFNames[index]);

                this.removeHDLoaded(pid);

                ret = true;
            }

            _Kernel.krnTrace("Removed swap file : " + this.hdLoadedFNames[index]);

            return ret;
        }

        // Loads program into memory. Will change, only one partion at the moment.
        // Implies data was validated before hand, with no spaces or carriage returns
        //
        // Params: source <string> - program input
        public loadMemory(source:string,pid:number): number
        {
            // Inits
            var nextPart : number = this.nextPartitionAvailable();
            var val:string;
            var mem = 0;

            // Return -1 if no partition avialable
            if( nextPart == -1 )
                return -1;

            // Set mem to base
            mem = this.partitionBaseAddress[nextPart];

            // Zeros the memory first
            this.zeroMemory(nextPart);

            // Load data into memory splitting on hex pairs
            for (var i = 0; (i < source.length) && (mem < _MemoryMax); i = i + 2) {
                if (source.length > i + 1)
                    val = source[i] + source[i + 1];
                else
                    val = source[i] + '0';

                _Memory.programMemory[mem] = parseInt(val, 16);
                mem++;
            }

            // Flag partition in use
            this.partitionsLoaded[nextPart] = true;

            // Set pid
            this.partitionPIDs[nextPart] = pid;

            // Return partition added
            return nextPart;
        }

        // Get pid of loaded process.
        //
        // Params: base <number> - base address of process
        // Returns: pid on success
        //          -1 on invalid base
        //          -2 on no process loaded at base
        public getLoadedPID(base:number) : number
        {
            var index: number = 0;
            var found: boolean = false;

            for( var i = 0; (i < _MemoryPartitions) && !found; i++)
            {
                if( base == this.partitionBaseAddress[i])
                {
                    index = i;
                    found = true;
                }
            }

            if(!found)
                return -1;

            if(this.partitionsLoaded[index] == false)
                return -2;

            return this.partitionPIDs[index];
        }

        // Get pid of loaded process.
        //
        // Params: base <number> - base address of process
        // Returns: pid on success
        //          -1 on invalid base
        public getBasePID(base : number) : number
        {
            var index: number = 0;
            var found: boolean = false;

            for( var i = 0; (i < _MemoryPartitions) && !found; i++)
            {
                if( base == this.partitionBaseAddress[i])
                {
                    index = i;
                    found = true;
                }
            }

            if(!found)
                return -1;


            return this.partitionPIDs[index];
        }

        // Returns all available partition indicies.
        //
        // Returns: Array<number> - list of  available partition indicies
        public availablePartitions() : Array<number>
        {
            var availParts : Array<number> = Array();

            for( var i = 0; (i < _MemoryPartitions); i++)
            {
                if( this.partitionsLoaded[i] == false)
                    availParts.push(i);
            }

            return availParts;
        }

        // Returns total available partition indicies.
        //
        // Returns: number - total  available partition indicies
        public totalAvailablePartitions() : number
        {
            var availParts : number = 0;

            for( var i = 0; (i < _MemoryPartitions); i++)
            {
                if( this.partitionsLoaded[i] == false)
                    availParts++;
            }

            return availParts;
        }

        // Get pid of loaded process, based on partition index.
        //
        // Params: part <number> - partition index
        // Returns: pid on success
        //          -1 on invalid base
        //          -2 on no process loaded at base
        public getLoadedPIDFromPartitionIndex(part:number): number
        {
            if( part < 0 || (part > ( _MemoryPartitions - 1)))
                return -1;

            if(this.partitionsLoaded[part] == false)
                return -2;

            return this.partitionPIDs[part];
        }

        // Gets string from memory. Reads until 00.
        //
        // Params: address <number> - address to start reading from
        // Returns: string in memory
        // Throws: RangeError - on memory address out of range
        //         Error - on read past end of partition
        public getString(address:number, base : number):string
        {
            // Inits
            var ret:string = "";
            var found:boolean = false;
            var limit : number = base + _MemoryPartitionSize;
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