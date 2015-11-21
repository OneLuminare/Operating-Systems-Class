///<reference path="../globals.ts" />

module TSOS
{
	// Ecapsulates a file block. Includes track, sector and block, but also
	// the data in the block. Data is stored as a number array.
	// Includes functionality to load the blocks data, write block headers,
	// and write data to block.
	export class FileBlock
	{
		// Basic constructor, creates public memebers,
		// Then loads block from session storage.
		constructor(public track:number,
					public sector:number,
					public block:number,
					loadOnCreate : boolean = true,
					public data:number[] = null)

		{
			if(loadOnCreate)
				this.loadBlock(this.track,this.sector,this.block);
		}

		// Gets the session storage key for this block,
		// in form "<track>.<sector>.<block>" .
		public getKey() : string
		{
			return this.track.toString() + '.' + this.sector.toString() + '.' + this.block.toString();
		}

		// Loads a block from memory, given track sector and block index.
		// Cannot load 0.0.0, as its boot record.
		//
		// Params: 	track <number> - track number, 0 - 7
		//			sector <number> - sector number, 0 - 7
		// 			block <number> - block number, 0 - 7
		// Returns: True on success, False on invalid indices, or access 0.0.0
		public loadBlock(track : number, sector : number, block : number) : boolean
		{
			// If accessing boot record return false
			if( (track == 0 && sector == 0 && block == 0))
				return false;

			// If indices out of range, return false
			if( (track < 0 || track > 7) || (sector < 0 || sector > 7) || (block < 0 || block > 7) )
				return false;

			// Set track, sector, and block
			this.track = track;
			this.sector = sector;
			this.block = block;

			// Get data from session storage, making sure to turn back into array
			this.data = JSON.parse(sessionStorage.getItem(this.getKey()));

			// Return success
			return true;

		}

		// Writes block header to memory. First byte is in use flag, next 3 are
		// track, sector, and block of next block pointer.
		//
		// Params: 	track <number> - track number, 0 - 7
		//			sector <number> - sector number, 0 - 7
		// 			block <number> - block number, 0 - 7
		// Returns: False on no data loaded, invalid indices, or next points to 0.0.0
		public writeFileHeader(inUse : boolean, track : number, sector : number, block : number) : boolean
		{
			// Return false if no data loaded
			if( this.data == null)
				return false;

			// If accessing boot record return false
			if( (track == 0 && sector == 0 && block == 0))
				return false;

			// Write in use byte
			this.data[0] = (inUse == true) ? 1 : 0;

			// Write next block pointer
			this.data[1] = track;
			this.data[2] = sector;
			this.data[3] = block;


			// Write data, storing array in JSON
			sessionStorage.setItem(this.getKey(),JSON.stringify(this.data));

			// Return sucess
			return true;
		}

		// Gets data text from file. Returns all data until null character,
		// and converts from ascii codes into characters.
		//
		// Returns: Text from data.
		public getDataText() : string
		{
			// Inits
			var text = "";
			var eof = false;

			var data;

			// Return "" if data not loaded
			if( this.data == null)
				return '';


			// Cycle through data section
			for( var i = 4; (i < 64) && !eof; i++)
			{
				// If data is null , set eof flag
				if( this.data[i] == 0)
					eof = true;
				// Else get data, and convert to char from ascii value
				else
				{
					data = TSOS.Utils.asciiChar(this.data[i]);
					text += data;
				}
			}

			// Return text
			return text;
		}

		// Writes data into block in memory. Overwrites existing data.
		// String is converted into ascii values.
		//
		// Params:	data <string> : text to store
		// Returns: False on no data loaded or string greater than 60 chars
		public writeData(data : string) : boolean
		{
			// If data too long, return false
			if( data.length > 60 || this.data == null)
				return false;

			_Kernel.krnTrace("Passed write data test.");

			// Cycle through data section
			for( var i = 4; i < 64; i++)
			{
				// If more chars to write, write ascii value to data
				if( (i - 4) < data.length )
				{
					this.data[i] = TSOS.Utils.asciiValue(data[i - 4]);

				}
				// Else write null byte
				else
				{
					this.data[i] = 0;
				}
			}

			// Write data, converting to JSON string
			sessionStorage.setItem(this.getKey(),JSON.stringify(this.data));

			// Return sucess
			return true;
		}

		// Appends string to existing block data.
		// String is converted to ascii values.
		//
		// Params:	data <string> : text to store
		// Returns: Number of bytes written
		public appendData(data : string) : number
		{
			// Return false if block not loaded
			if( this.data == null)
				return 0;

			// Find eof
			var eof : number = this.findEOF();
			var written : number = 0;

			// If data too long, return false
			if( data.length > (64 - eof))
				return 0;

			// Cycle through remaining bytes
			for( var i = eof; i < 64; i++)
			{
				// If more chars, write char in ascii format
				if( (i - eof) < data.length )
				{
					this.data[i] = TSOS.Utils.asciiValue(data[i - eof]);
					written++;
				}
				// Else write null byte
				else
				{
					this.data[i] = 0;
				}
			}

			// Write data, converting to JSON string
			sessionStorage.setItem(this.getKey(),JSON.stringify(this.data));

			// Return success
			return written;
		}

		// Clear data in block.
		//
		// Returns: False if data is not loaded.
		public clearData() : boolean
		{
			// If data too long, return false
			if( this.data == null)
				return false;

			// Write null to all data bytes
			for( var i = 4; i < 64; i++)
			{
				this.data[i] = 0;
			}

			// Write data, converting to JSON string
			sessionStorage.setItem(this.getKey(),JSON.stringify(this.data));

			// Return success
			return true;
		}

		// Find index in data of first null byte.
		//
		// Returns: Index of first null byte, or 0 if data not loaded
		public findEOF() : number
		{
			// Return -1 if data not loaded
			if( this.data == null)
				return 0;

			// Inits
			var eof = 64;

			// Cycle through data
			for( var i = 4; ((i < 64) && (eof == 64)); i++)
			{
				// If null byte, set flag
				if( this.data[i] == 0 )
					eof = i;
			}

			// Return index of first null byte
			return eof;
		}

		// Find total free (null) bytes in data.
		//
		// Returns: Total free bytes, or -1 if data not loaded
		public findFreeBytes() : number
		{
			// Return -1 if data not loaded
			if( this.data == null)
				return -1;

			// Return total free bytes
			return (64 - this.findEOF());
		}

		// Determines if block's in use flag
		// is true or false.
		//
		// Returns: True if in use, False if not in use or data not loaded
		public isInUse() : boolean
		{
			// Return false if data not loaded
			if( this.data == null)
				return false;

			var inUse = false;
			if( this.data[0] == 1)
				inUse = true;

			// Return in use
			return inUse;
		}

		// Sets in use flag, preserving tsb pointer,
		// and saves data.
		//
		// Params: inUse <boolean> - in use or not
		// Returns: false on data not loaded.
		public setInUse(inUse : boolean) : boolean
		{
			// Return false if data not loaded
			if( this.data == null)
				return false;

			// Set in use byte
			if( inUse )
				this.data[0] = 1;
			else
				this.data[0] = 0;

			// Write data, converting to JSON string
			sessionStorage.setItem(this.getKey(),JSON.stringify(this.data));

			// Return success
			return true;
		}


		// Returns next block based on block pointer.
		//
		// Returns: Next block, or null if pointer is not set or data not loaded.
		public nextBlock() : FileBlock
		{
			// Return null if data not loaded
			if( this.data == null)
				return null;

			// Return null if pointer not set (or invalid)
			if( this.data[1] < 0 || this.data[2] < 0 || this.data[3] < 0)
				return null;

			// Return next block
			return new FileBlock(this.data[1],this.data[2],this.data[3]);
		}

		// Returns next last block in chain of blocks
		//
		// Returns: Last block in chain, or null if pointer is not set or data not loaded.
		public lastBlock() : FileBlock
		{
			// Return null if data not loaded
			if( this.data == null)
				return null;

			// Return null if pointer not set (or invalid)
			if( this.data[1] < 0 || this.data[2] < 0 || this.data[3] < 0)
				return null;

			// Load next block
			var fblock = this.nextBlock();

			// Cycle through blocks until end of chain
			while( !(fblock.data[1] < 0 || fblock.data[2] < 0 || fblock.data[3] < 0))
			{
				fblock = fblock.nextBlock();
			}

			// Return last block
			return fblock;
		}
	}
}