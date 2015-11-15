///<reference path="../globals.ts" />
///<reference path="fileblock.ts" />

module TSOS
{
    // Encapsulates a hard drive driver. Creates memory in session storage
    // with size based on given parameters. Contains an API to manage files.
    // First block is reserved for boot record. File directory is remaining
    // blocks on track 0.
	export class HardDriveDriver
	{
		// Creates HardDriveDriver object, and allocates
		// session storage based on supplied track, sector, 
		// and block data.
		//
		// Params:  tracks <number> - number of tracks
        //          sectors <number> - number of sectors
        //          blocksPerSector <number> - number of blocks per sector
        //          blockSize <number> - size in bytes of block
        //          formated <number> - flag signifying drive has been formated
		constructor(public tracks : number,
					public sectors : number,
					public blocksPerSector : number,
					public blockSize : number, 
					public formated : boolean = false)
		{
			this.InitializeMemory()
		}
		
		// Creates session storage representing 
		// hardive data, using key value pairs of
		// Track.Sector.Block to a number arrray 
		// of size this.blockSize.
		public InitializeMemory() : void
		{
			//Inits
			var key : string;
			var data : Array = null;
			var d : number = 0;		
			

				// Cycle through tracks
				for( var t = 0; t < this.tracks; t++)
				{
					// Cycle through sectors
					for( var s = 0; s < this.sectors; s++)
					{
						// Cycle through blocks
						for( var b = 0; b < this.blocksPerSector; b++)
						{
							// Create key
							key = t.toString() + '.' + s.toString() + '.' +  b.toString();
							
							// Create data array
							data = new Array();

							// Populate rest of data
							for( var a = 0; a < this.blockSize; a++)
							{
								data.push(0);
							}
							
							// Create key value pair
							sessionStorage.setItem(key,JSON.stringify(data));
						}
					}
				}
		}

        // Sets all bytes to 0, and creates block header
        // which includes in first four bytes, an in use flag,
        // and tsb(three bytes) of block pointer. -1 indicates null.
		public formatDrive() : void
		{
            var data : Array = null;
            var key : string;

            // Cycle through tracks
            for( var t = 0; t < this.tracks; t++)
            {
                // Cycle through sectors
                for( var s = 0; s < this.sectors; s++)
                {
                    // Cycle through blocks
                    for( var b = 0; b < this.blocksPerSector; b++)
                    {
                        //Ignore first block, boot area
                        if( !((t == 0) && (s == 0) && (b == 0)))
                        {
                            // Create key
                            key = t.toString() + '.' + s.toString() + '.' + b.toString();

                            // Create data array
                            data = new Array();

                            // Create block header.
                            // In use flag, then track, sector, block pointer.
                            // -1 Indicates in not in use.
                            data.push(0);
                            data.push(-1);
                            data.push(-1);
                            data.push(-1);

                            // Populate rest of data
                            for( var a = 4; a < this.blockSize; a++)
                            {
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
		}

        // Creates an empty file. Finds if block available, creates entry in file directory,
        // sets pointer in entry to first block, sets in use flag to true, and writes file name
        // to remaining bits. File name can be no longer than 60 characters.
        //
        // Params:  fileName <string> - Name of file
        // Returns: CR_SUCCESS on success,
        //          CR_FILE_LENGTH_TO_LONG if file name to long,
        //          CR_FILE_DIRECTORY_FULL  if no more space in file directory,
        //          CR_DRIVE_FULL if no free blocks.
        public createFile(fileName : string) : number
        {
            // Inits
            var firstBlock : TSOS.FileBlock = null;
            var directoryBlock : TSOS.FileBlock = null;

            // If file name too long, report error
            if( fileName.length > 60 )
                return CR_FILE_LENGTH_TO_LONG;

            // Get next directory block
            directoryBlock = this.findNextFileDirectoryBlock();

            // Check if enties available in file directory
            if( directoryBlock == null)
                return CR_FILE_DIRECTORY_FULL;

            // Get next available file block
            firstBlock = this.findNextAvailableBlock();

            // If not block available, return error
            if( firstBlock == null )
                return CR_DRIVE_FULL;

            // Write file directory header
            directoryBlock.writeHeader(true,firstBlock.track,firstBlock.sector,firstBlock.block);

            // Write file name
            directoryBlock.writeData(fileName);

            // Write new file block header
            firstBlock.writeHeader(true,-1,-1,-1);

            // Clear data in file block
            firstBlock.clearData();

            // Return success value
            return CR_SUCCESS;
        }

        // Writes data to existing file. Appends data to it.
        //
        // Params:  fileName <string> - name of file
        //          text <string> - text to be written
        // Returns: CR_SUCCESS on success,
        //          CR_FILE_NOT_FOUND on file not found, or
        //          CR_DID_NOT_WRITE_ALL_DATA  if text uses more space than available.
        public writeToFile(fileName : string, text : string) : number
        {
            // Inits
            var block : TSOS.FileBlock = null;
            var curBlock : TSOS.FileBlock = null;
            var driveFull : boolean = false;
            var freeBytes : number = 0;
            var b = 0;

            // Cycle through directory sectors
            for( var s = 0; (s < this.sectors) && (block == null); s++)
            {
                // Check if first sector, if so set start block to 1.
                // This skips boot record
                if( s == 0)
                    b = 1;
                // Else not boot record change, set to 0
                else
                    b = 0;

                // Cycle through blocks
                for( b; b < (this.blocksPerSector) && (block == null); b++)
                {
                    // Get block from memory
                    curBlock = new TSOS.FileBlock(0,s,b);

                    // If in use flag 0, set as ret block
                    if( (curBlock.getDataText() == fileName) && (!curBlock.isInUse()))
                        block = curBlock;
                }
            }

            // If block not found, return file not found
            if( block == null)
                return CR_FILE_NOT_FOUND;

            // Write data until no more, or drive full
            while( text.length > 0 && !driveFull)
            {
                // Get available bytes in block
                freeBytes = block.findFreeBytes();

                // If string shorter than available bytes, just write string
                if( text.length <= freeBytes)
                {
                    block.appendData(text);

                    // Set text lenght to 0
                    text = "";
                }
                // Else write what can be fitted in block
                else
                {
                    block.appendData(text.substring(0, freeBytes));

                    // Remove this from text
                    text = text.substring(freeBytes);
                }

                // Check if more text to be written
                if( text.length > 0)
                {
                    // Get next available block
                    curBlock = this.findNextAvailableBlock();

                    // If not more, set drive full flag
                    if( curBlock == null )
                        driveFull = true;
                    // Else write next block header
                    else
                        block.writeHeader(1,curBlock.track,curBlock.section,curBlock.block);

                    // Set next block
                    block = curBlock;
                }
                // Else write current block header to nothing.
                else
                    block.writeHeader(1,-1,-1,-1);
            }

            // If drive full return CR_DID_NOT_WRITE_ALL_DATA
            if( driveFull )
                return CR_DID_NOT_WRITE_ALL_DATA;
            // Else return success value
            else
                return CR_SUCCESS;
        }

        // Finds next available file directory block.
        // All file directory records are on track 0,
        // after boot record. Loads file block with data.
        //
        // Returns: File block of directory entry, or null if full
        public findNextFileDirectoryBlock() : TSOS.FileBlock
        {
            // Inits
            var block : TSOS.FileBlock = null;
            var curBlock : TSOS.FileBlock = null;
            var b = 0;

            // Cycle through directory sectors
            for( var s = 0; (s < this.sectors) && (block == null); s++)
            {
                // Check if first sector, if so set start block to 1.
                // This skips boot record
                if( s == 0)
                    b = 1;
                // Else not boot record change, set to 0
                else
                    b = 0;

                // Cycle through blocks
                for( b; b < (this.blocksPerSector) && (block == null); b++)
                {
                     // Get block from memory
                    curBlock = new TSOS.FileBlock(0,s,b);

                    // If in use flag 0, set as ret block
                    if( !curBlock.isInUse() )
                        block = curBlock;
                }
            }

            // Return block, or null if no free
            return block;
        }

        // Finds next available free block. Data blocks are
        // in all tracks after 0.
        //
        // Returns: Free file block, or null if full
        public findNextAvailableBlock() : TSOS.FileBlock
        {
            // Inits
            var block : TSOS.FileBlock = null;
            var curBlock : TSOS.FileBlock = null;
            var b = 0;

            // Cycle through tracks, skipping track 0
            for( var t = 1; (t < this.tracks) && (block == null); t++)
            {
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
        }

        // Returns session storage key based on track sector and block.
        //
        // Params: 	track <number> - track number
        //			sector <number> - sector number
        // 			block <number> - block number
        // Returns: Key based on tsb.
        public makeKey(track : number, sector : number, block : number)
        {
            return track.toString() + '.' + sector.toString() + '.' + block.toString();
        }
	}
}