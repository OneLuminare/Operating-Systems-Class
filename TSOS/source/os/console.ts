///<reference path="../globals.ts" />

/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "",
                    public commandQueue = [],
                    public cmdIndex = -1,
                    public movingIndex = 0) {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
            this.commandQueue[0] = "NULL";
            this.commandQueue[1] = "NULL";
            this.commandQueue[2] = "NULL";
            this.commandQueue[3] = "NULL";
            this.commandQueue[4] = "NULL";
            this.commandQueue[5] = "NULL";
            this.commandQueue[6] = "NULL";
            this.commandQueue[7] = "NULL";
            this.commandQueue[8] = "NULL";
            this.commandQueue[9] = "NULL";
        }


        private clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        private resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { //     Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);

                    //Add command to history
                    this.AddCommandToHistory(this.buffer);

                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if( chr == String.fromCharCode(8))
                {
                    // Call backspace
                    this.backSpace();

                }
                else if( chr == String.fromCharCode(9))
                {
                    // CANT PUT TAB ON BUFFER!!!!
                    // I HAD TO CALL COMPLETE COMMAND IN DEVICE DRIVER!!!!
                    // ALL OTHER KEYS USED UP, AND FOR SOME REAS ONLY
                    // UP AND DOWN KEYS WILL GO ON QUEUE, NOT FORWARD AND
                    // BACK WHICH I COULD HAVE USED IN STEAD. FRUSTRATED
                    // WITH THIS LANGUAGE!!!
                    this.completeCommand();
                    this.removeLastCharInQueue();

                }
                else if( chr == String.fromCharCode(38))
                {
                    //this.buffer = this.buffer.substr(0,this.buffer.length - 1);
                    this.RetrieveCommandHistory(true);
                }
                else if( chr == String.fromCharCode(40))
                {
                    //this.buffer = this.buffer.substr(0,this.buffer.length - 1);
                    this.RetrieveCommandHistory(false);
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        // Removes last char in queue
        public removeLastCharInQueue() : void{
            // Remove last command in buffer
            this.buffer = this.buffer.substr(0,this.buffer.length - 1);
        }

        // Retrieve command history going back(up), or foward(down).
        // Params: moveUp - true for up, false for down
        public RetrieveCommandHistory(moveUp : boolean) : void
        {
            // Inits
            var found : boolean = false;
            var startIndex : number = this.movingIndex;
            var foundIndex : number = 0;

            // Check if up key
            if( moveUp )
            {
                // Cycle through commands, but make sure you end if emtpy history
                do{
                    // Check if non null command
                    if( this.commandQueue[this.movingIndex] != "NULL")
                    {
                        // Set found flag true
                        found = true;

                        // Capture found index
                        foundIndex = this.movingIndex;
                    }

                    // Decrement moving index
                    this.movingIndex--;

                    // Cycle index if less than 0
                    if (this.movingIndex < 0)
                        this.movingIndex = 9;


                }while( (this.movingIndex != startIndex) && !found);


            }
            // Else down key
            else
            {
                // Cycle through commands, but make sure you end if emtpy history
                do{
                    if( this.commandQueue[this.movingIndex] != "NULL")
                    {
                        // Set found flag true
                        found = true;

                        // Capture found index
                        foundIndex = this.movingIndex;
                    }

                    // Increment moving index
                    this.movingIndex++;

                    // Cycle index if greater than 9
                    if (this.movingIndex > 9)
                        this.movingIndex = 0;


                }while( (this.movingIndex != startIndex) && !found);
            }

            // Check if found
            if( found )
            {
                // Clear line
                this.ClearLine();

                // Put command in buffer
                this.buffer = this.commandQueue[foundIndex];

                // Print text
                this.putText(this.commandQueue[foundIndex]);
            }
        }

        // Adds command to history. Keeps 10.
        // Params: cmd - command to add to history.
        public AddCommandToHistory( cmd : string) : void
        {
            // Increment command index (inits at -1)
            this.cmdIndex++;

            // Cycle index if over 9
            if( this.cmdIndex > 9)
               this.cmdIndex = 0;

            // Set moving index to command index
            this.movingIndex = this.cmdIndex;

            // Set cmd in array
            this.commandQueue[this.cmdIndex] = cmd;
        }

        // Clears line to prompt
        public ClearLine() : void
        {
            // Get dimensions. If buffer only contains backspace, clear rect will have 0 size stopping overwritting prompt
            var eraseWidth:number = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer);
            var yWidth:number = _DefaultFontSize + (2 * _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));

            // Move current x pos
            this.currentXPosition -= eraseWidth;

            // Erase block
            _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, eraseWidth, yWidth);

            // Remove backspace char from buffer
            this.buffer = "";
        }

        public putText(text : String): void {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== "")
            {
                // Get size of text
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                var extraText : String = "";

                // Check if drawn text will go over width of canvas
                while( (this.currentXPosition + offset) > _Canvas.width)
                {
                    // Copy last character from text, and store for later input
                    extraText = text.charAt(text.length - 1) + extraText;

                    // Remove last char from text
                    text = text.substr(0,text.length - 1);

                    // Recalculate offset
                    offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                }

                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);

                // Move the current X position.
                this.currentXPosition = this.currentXPosition + offset;

                // Check if more text to print (on new line)
                if( extraText.length > 0)
                {
                    // Advance line
                    this.advanceLine();

                    // call putText on leftover text
                    this.putText(extraText);
                }
            }
         }

        public advanceLine(): void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize + 
                                     _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                                     _FontHeightMargin;

            // Get line height
            var lineHeight : number = _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;

            // Check if current Y position is greater than height of canvas
            if( _Canvas.height < this.currentYPosition )
            {
                // Decrease Y position to previous
                this.currentYPosition -= lineHeight;

                // Copy whats on canvas, starting on line down from top
                var imgData = _DrawingContext.getImageData(0,lineHeight,_Canvas.width,this.currentYPosition);

                // Clear the screen
                this.clearScreen();

                // Put copyied image back on start of canvas
                _DrawingContext.putImageData(imgData,0,0);
            }
        }

        public backSpace() : void
        {
                // Get dimensions. If buffer only contains backspace, clear rect will have 0 size stopping overwritting prompt
                var eraseWidth:number = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
                var yWidth:number = _DefaultFontSize + (2 * _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));

                // Move current x pos
                this.currentXPosition -= eraseWidth;

                // Erase block
                _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, eraseWidth, yWidth);

            // Remove backspace char from buffer
            this.buffer = this.buffer.substr(0, this.buffer.length - 1);
        }

        // Completes command, searches for match in order their added to command list
        public completeCommand() : void
        {
            // Inits
            var found : boolean = false;
            var sc : ShellCommand = null;

            // Return if empty buffer
            if( this.buffer == "")
              return;

            // Cycle through shell commands
            for(var i = 0; (i < _OsShell.commandList.length) && !found; i++)
            {
                // Get command
                sc = _OsShell.commandList[i];

                // Check if matches start of command string
                // then set found flag if true
                if( sc.command.search(this.buffer) == 0)
                {
                    found = true;
                }
            }

            // If found, put text and set buffer
            if( found )
            {
                this.putText(sc.command.substr(this.buffer.length));
                this.buffer = sc.command;
            }
            /*
            else
            {
                // Remove tab char from buffer
                this.buffer = this.buffer.substr(0, this.buffer.length - 1);
            }
            */
        }
    }
 }
