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
                    public buffer = "") {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
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
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if( chr == String.fromCharCode(8))
                {
                    // Call backspace
                    this.backSpace();

                    // Remove backspace char from buffer
                    this.buffer = this.buffer.substr(0, this.buffer.length - 1);
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
            /*
            if( 1) {
                // Get width of last char
                var eraseWidth:number = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
                var yWidth:number = _DefaultFontSize +
                    _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                    _FontHeightMargin;

                // Move current x pos
                this.currentXPosition -= eraseWidth;


                // Erase block
                _DrawingContext.fillStyle("rgb(223,219,195)");
                _DrawingContext.fillRect(this.currentXPosition, this.currentYPosition - yWidth, eraseWidth, yWidth + _DrawingContext.fontDescent());
                _DrawingContext.fillStyle("black");
            }
            */
        }
    }
 }
