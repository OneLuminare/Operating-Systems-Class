///<reference path="../globals.ts" />
///<reference path="fileblock.ts" />
var TSOS;
(function (TSOS) {
    // Encapsulates a hard drive driver. Creates memory in session storage
    // with size based on given parameters. Contains an API to manage files.
    // First block is reserved for boot record. File directory is remaining
    // blocks on track 0.
    var HardDriveDriver = (function () {
        // Creates HardDriveDriver object, and allocates
        // session storage based on supplied track, sector, 
        // and block data.
        //
        // Params:  tracks <number> - number of tracks
        //          sectors <number> - number of sectors
        //          blocksPerSector <number> - number of blocks per sector
        //          blockSize <number> - size in bytes of block
        //          formated <number> - flag signifying drive has been formated
        function HardDriveDriver(tracks, sectors, blocksPerSector, blockSize, formated) {
            if (formated === void 0) { formated = false; }
            this.tracks = tracks;
            this.sectors = sectors;
            this.blocksPerSector = blocksPerSector;
            this.blockSize = blockSize;
            this.formated = formated;
            this.InitializeMemory();
        }
        // Creates session storage representing 
        // hardive data, using key value pairs of
        // Track.Sector.Block to a number arrray 
        // of size this.blockSize.
        HardDriveDriver.prototype.InitializeMemory = function () {
            //Inits
            var key;
            var data = null;
            var d = 0;
            // Cycle through tracks
            for (var t = 0; t < this.tracks; t++) {
                // Cycle through sectors
                for (var s = 0; s < this.sectors; s++) {
                    // Cycle through blocks
                    for (var b = 0; b < this.blocksPerSector; b++) {
                        // Create key
                        key = t.toString() + '.' + s.toString() + '.' + b.toString();
                        // Create data array
                        data = [];
                        // Populate rest of data
                        for (var a = 0; a < this.blockSize; a++) {
                            data.push(0);
                        }
                        // Create key value pair
                        sessionStorage.setItem(key, JSON.stringify(data));
                    }
                }
            }
        };
        // Sets all bytes to 0, and creates block header
        // which includes in first four bytes, an in use flag,
        // and tsb(three bytes) of block pointer. -1 indicates null.
        HardDriveDriver.prototype.formatDrive = function () {
            var data = null;
            var key;
            // Cycle through tracks
            for (var t = 0; t < this.tracks; t++) {
                // Cycle through sectors
                for (var s = 0; s < this.sectors; s++) {
                    // Cycle through blocks
                    for (var b = 0; b < this.blocksPerSector; b++) {
                        //Ignore first block, boot area
                        if (!((t == 0) && (s == 0) && (b == 0))) {
                            // Create key
                            key = t.toString() + '.' + s.toString() + '.' + b.toString();
                            // Create data array
                            data = [];
                            // Create block header.
                            // In use flag, then track, sector, block pointer.
                            // -1 Indicates in not in use.
                            data.push(0);
                            data.push(-1);
                            data.push(-1);
                            data.push(-1);
                            // Populate rest of data
                            for (var a = 4; a < this.blockSize; a++) {
                                data.push(0);
                            }
                            // Create key value pair
                            sessionStorage.setItem(key, JSON.stringify(data));
                        }
                    }
                }
            }
            // Set formated flag
            this.formated = true;
        };
        // Creates an empty file. Finds if block available, creates entry in file directory,
        // sets pointer in entry to first block, sets in use flag to true, and writes file name
        // to remaining bits. File name can be no longer than 60 characters.
        //
        // Params:  fileName <string> - Name of file
        // Returns: CR_SUCCESS on success,
        //          CR_DRIVE_NOT_FORMATED if drive not formated,
        //          CR_FILE_LENGTH_TO_LONG if file name to long,
        //          CR_EMPTY_FILE_NAME if empty file name,
        //          CR_FILE_DIRECTORY_FULL  if no more space in file directory,
        //          CR_DUPLICATE_FILE_NAME if duplicate file name,
        //          CR_DRIVE_FULL if no free blocks.
        HardDriveDriver.prototype.createFile = function (fileName) {
            // Inits
            var firstBlock = null;
            var directoryBlock = null;
            // Report error if not formated
            if (!this.formated)
                return CR_DRIVE_NOT_FORMATED;
            // Check if empty file name
            if (fileName.length == 0)
                return CR_EMPTY_FILE_NAME;
            // If file name too long, report error
            if (fileName.length > 60)
                return CR_FILE_LENGTH_TO_LONG;
            _Kernel.krnTrace("before findDirBl");
            // Get next directory block
            directoryBlock = this.findNextFileDirectoryBlock();
            _Kernel.krnTrace("b nextAvailBlock");
            // Check if enties available in file directory
            if (directoryBlock == null)
                return CR_FILE_DIRECTORY_FULL;
            // Get next available file block
            firstBlock = this.findNextAvailableBlock();
            _Kernel.krnTrace("b isDuplicate");
            // If not block available, return error
            if (firstBlock == null)
                return CR_DRIVE_FULL;
            // Check if duplicate file name
            if (this.isDuplicateFileName(fileName))
                return CR_DUPLICATE_FILE_NAME;
            _Kernel.krnTrace("db wfh");
            // Write file directory header
            directoryBlock.writeFileHeader(true, firstBlock.track, firstBlock.sector, firstBlock.block);
            _Kernel.krnTrace("db wd");
            // Write file name
            directoryBlock.writeData(fileName);
            _Kernel.krnTrace("fb wrh");
            // Write new file block header
            firstBlock.writeFileHeader(true, -1, -1, -1);
            _Kernel.krnTrace("fb cd");
            // Clear data in file block
            firstBlock.clearData();
            _Kernel.krnTrace("done");
            // Return success value
            return CR_SUCCESS;
        };
        // Writes data to existing file. Appends data to it.
        //
        // Params:  fileName <string> - name of file
        //          text <string> - text to be written
        // Returns: CR_SUCCESS on success,
        //          CR_FILE_NOT_FOUND on file not found,
        //          CR_DRIVE_NOT_FORMATED if drive not formatted,
        //          CR_DID_NOT_WRITE_ALL_DATA  if text uses more space than available.
        HardDriveDriver.prototype.writeToFile = function (fileName, text) {
            // Inits
            var block = null;
            var curBlock = null;
            var driveFull = false;
            var freeBytes = 0;
            var b = 0;
            // Report error if not formated
            if (!this.formated)
                return CR_DRIVE_NOT_FORMATED;
            // Cycle through directory sectors
            for (var s = 0; (s < this.sectors) && (block == null); s++) {
                // Check if first sector, if so set start block to 1.
                // This skips boot record
                if (s == 0)
                    b = 1;
                else
                    b = 0;
                // Cycle through blocks
                for (b; b < (this.blocksPerSector) && (block == null); b++) {
                    // Get block from memory
                    curBlock = new TSOS.FileBlock(0, s, b);
                    // If in use flag 0, set as ret block
                    if ((curBlock.getDataText() == fileName) && (!curBlock.isInUse()))
                        block = curBlock;
                }
            }
            // If block not found, return file not found
            if (block == null)
                return CR_FILE_NOT_FOUND;
            // Write data until no more, or drive full
            while (text.length > 0 && !driveFull) {
                // Get available bytes in block
                freeBytes = block.findFreeBytes();
                // If string shorter than available bytes, just write string
                if (text.length <= freeBytes) {
                    block.appendData(text);
                    // Set text lenght to 0
                    text = "";
                }
                else {
                    block.appendData(text.substring(0, freeBytes));
                    // Remove this from text
                    text = text.substring(freeBytes);
                }
                // Check if more text to be written
                if (text.length > 0) {
                    // Get next available block
                    curBlock = this.findNextAvailableBlock();
                    // If not more, set drive full flag
                    if (curBlock == null)
                        driveFull = true;
                    else
                        block.writeFileHeader(true, curBlock.track, curBlock.sector, curBlock.block);
                    // Set next block
                    block = curBlock;
                }
                else
                    block.writeFileHeader(true, -1, -1, -1);
            }
            // If drive full return CR_DID_NOT_WRITE_ALL_DATA
            if (driveFull)
                return CR_DID_NOT_WRITE_ALL_DATA;
            else
                return CR_SUCCESS;
        };
        // Reads data from a file, and returns text.
        //
        // Params: fileName <string> - name of file to read
        // Returns: An array of [<Return value>,<text>]
        //          Return values can include:
        //          CR_SUCCESS on success,
        //          CR_DRIVE_NOT_FORMATED if drive not formatted,
        //          CR_FILE_NOT_FOUND if file not in directory
        HardDriveDriver.prototype.readFile = function (fileName) {
            // Inits
            var dirBlock = null;
            var fBlock = null;
            var buffer = "";
            // Report error if not formated
            if (!this.formated)
                return [CR_DRIVE_NOT_FORMATED, buffer];
            // Find directory block
            dirBlock = this.findDirectoryBlock(fileName);
            // If not found return null
            if (dirBlock == null)
                return [CR_FILE_NOT_FOUND, buffer];
            // Load first file block
            fBlock = dirBlock.nextBlock();
            // Cycle through chain of file blocks
            while (fBlock != null) {
                // Add text to buffer
                buffer += fBlock.getDataText();
                // Get next block
                fBlock = fBlock.nextBlock();
            }
            // Return file text
            return [CR_SUCCESS, buffer];
        };
        // Deletes file. Sets chain of file blocks not in use,
        // then does the same for the directory block.
        //
        // Params: fileName <string> - name of file to read
        // Returns: CR_SUCCESS on success,
        //          CR_FILE_NOT_FOUND on no file found,
        //          CR_DRIVE_NOT_FORMATED if not formatted
        HardDriveDriver.prototype.deleteFile = function (fileName) {
            // Inits
            var dirBlock = null;
            var fBlock = null;
            // Report error if not formated
            if (!this.formated)
                return CR_DRIVE_NOT_FORMATED;
            // Find directory block
            dirBlock = this.findDirectoryBlock(fileName);
            // If not found return null
            if (dirBlock == null)
                return CR_FILE_NOT_FOUND;
            // Load first file block
            fBlock = dirBlock.nextBlock();
            // Cycle through chain of file blocks
            while (fBlock != null) {
                // Set in use flag false
                fBlock.setInUse(false);
                // Get next block
                fBlock = fBlock.nextBlock();
            }
            // Set directory block not in use
            dirBlock.setInUse(false);
            // Return success
            return CR_SUCCESS;
        };
        // Lists all file names in directory.
        //
        // Returns: String array of file names, with
        //          first element being return value.
        //          Ret value can be:
        //          CR_SUCCESS on success,
        //          CR_DRIVE_NOT_FORMATED on not formatted
        HardDriveDriver.prototype.listFiles = function () {
            // Inits
            var files = [CR_SUCCESS];
            var temp = 0;
            var found = false;
            var fBlock = new TSOS.FileBlock(0, 0, 0, false);
            // Report error if not formated
            if (!this.formated)
                return [CR_DRIVE_NOT_FORMATED];
            // Cycle through sectors
            for (var s = 0; (s < this.sectors) && !found; s++) {
                // Switch start block on 0.0.0
                if (s == 0)
                    temp = 1;
                else
                    temp = 0;
                // Cycle through blocks, ignoring 0.0.0 due to above if/else
                for (var b = temp; (b < this.blocksPerSector) && !found; b++) {
                    // Load directory block
                    fBlock.loadBlock(0, s, b);
                    // Check if in use
                    if (fBlock.isInUse()) {
                        // Add name to list of file
                        files.push(fBlock.getDataText());
                    }
                }
            }
            // Return files
            return files;
        };
        // Finds next available file directory block.
        // All file directory records are on track 0,
        // after boot record. Loads file block with data.
        //
        // Returns: File block of directory entry, or null if full
        HardDriveDriver.prototype.findNextFileDirectoryBlock = function () {
            // Inits
            var block = null;
            var curBlock = new TSOS.FileBlock(0, 0, 0, false);
            var temp = 0;
            // Cycle through directory sectors
            for (var s = 0; (s < this.sectors) && (block == null); s++) {
                // Check if first sector, if so set start block to 1.
                // This skips boot record
                if (s == 0)
                    temp = 1;
                else
                    temp = 0;
                // Cycle through blocks
                for (var b = temp; (b < (this.blocksPerSector)) && (block == null); b++) {
                    // Get block from memory
                    curBlock.loadBlock(0, s, b);
                    // If in use flag 0, set as ret block
                    if (!curBlock.isInUse())
                        block = curBlock;
                }
            }
            _Kernel.krnTrace("here 3");
            // Return block, or null if no free
            return block;
        };
        // Finds next available free block. Data blocks are
        // in all tracks after 0.
        //
        // Returns: Free file block, or null if full
        HardDriveDriver.prototype.findNextAvailableBlock = function () {
            // Inits
            var block = null;
            var curBlock = null;
            var b = 0;
            // Cycle through tracks, skipping track 0
            for (var t = 1; (t < this.tracks) && (block == null); t++) {
                // Cycle through directory sectors
                for (var s = 0; (s < this.sectors) && (block == null); s++) {
                    // Cycle through blocks
                    for (b = 0; b < (this.blocksPerSector) && (block == null); b++) {
                        // Get block from memory
                        curBlock = new TSOS.FileBlock(t, s, b);
                        // If in use flag 0, set as ret block
                        if (!curBlock.isInUse())
                            block = curBlock;
                    }
                }
            }
            // Return block, or null if no free
            return block;
        };
        // Searchs file directory for in use blocks, and compares
        // file name for duplicates.
        //
        // Params: fileName <string> - file name to compare to
        // Returns: True on duplicate file name in directory
        HardDriveDriver.prototype.isDuplicateFileName = function (fileName) {
            // Inits
            var found = false;
            var temp = 0;
            var fBlock = new TSOS.FileBlock(0, 0, 0, false);
            // Cycle through sectors
            for (var s = 0; (s < this.sectors) && !found; s++) {
                // Switch start block on 0.0.0
                if (s == 0)
                    temp = 1;
                else
                    temp = 0;
                // Cycle through blocks, ignoring 0.0.0 due to above if/else
                for (var b = temp; (b < this.blocksPerSector) && !found; b++) {
                    // Load directory block
                    fBlock.loadBlock(0, s, b);
                    // Check if in use
                    if (fBlock.isInUse()) {
                        _Kernel.krnTrace("data : " + fBlock.getDataText());
                        // Set found true if file names the same
                        if (fileName == fBlock.getDataText())
                            found = true;
                    }
                }
            }
            // Return true if duplicate fname
            return found;
        };
        // Finds file directory block with given file name.
        // Returns null if not in directory.
        //
        // Params: fileName <string> - name of file.
        // Returns: Directory file block, or null on not found.
        HardDriveDriver.prototype.findDirectoryBlock = function (fileName) {
            // Inits
            var found = false;
            var temp = 0;
            var fBlock = new TSOS.FileBlock(0, 0, 0, false);
            var foundBlock = null;
            // Cycle through sectors
            for (var s = 0; (s < this.sectors) && !found; s++) {
                // Switch start block on 0.0.0
                if (s == 0)
                    temp = 1;
                else
                    temp = 0;
                // Cycle through blocks, ignoring 0.0.0 due to above if/else
                for (var b = temp; (b < this.blocksPerSector) && !found; b++) {
                    // Load directory block
                    fBlock.loadBlock(0, s, b);
                    // Check if in use
                    if (fBlock.isInUse()) {
                        // Set found true if file names the same
                        if (fileName == fBlock.getDataText()) {
                            found = true;
                            foundBlock = fBlock;
                        }
                    }
                }
            }
            // Return dir block, or null if not found
            return foundBlock;
        };
        // Returns session storage key based on track sector and block.
        //
        // Params: 	track <number> - track number
        //			sector <number> - sector number
        // 			block <number> - block number
        // Returns: Key based on tsb.
        HardDriveDriver.prototype.makeKey = function (track, sector, block) {
            return track.toString() + '.' + sector.toString() + '.' + block.toString();
        };
        return HardDriveDriver;
    })();
    TSOS.HardDriveDriver = HardDriveDriver;
})(TSOS || (TSOS = {}));
