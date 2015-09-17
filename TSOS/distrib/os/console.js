///<reference path="../globals.ts" />
/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    var Console = (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, buffer) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (buffer === void 0) { buffer = ""; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
        };
        Console.prototype.clearScreen = function () {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        };
        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };
        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) {
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr == String.fromCharCode(8)) {
                    // Call backspace
                    this.backSpace();
                    // Remove backspace char from buffer
                    this.buffer = this.buffer.substr(0, this.buffer.length - 1);
                }
                else if (chr == String.fromCharCode(9)) {
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
            }
        };
        Console.prototype.putText = function (text) {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== "") {
                // Get size of text
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                var extraText = "";
                // Check if drawn text will go over width of canvas
                while ((this.currentXPosition + offset) > _Canvas.width) {
                    // Copy last character from text, and store for later input
                    extraText = text.charAt(text.length - 1) + extraText;
                    // Remove last char from text
                    text = text.substr(0, text.length - 1);
                    // Recalculate offset
                    offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                }
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                this.currentXPosition = this.currentXPosition + offset;
                // Check if more text to print (on new line)
                if (extraText.length > 0) {
                    // Advance line
                    this.advanceLine();
                    // call putText on leftover text
                    this.putText(extraText);
                }
            }
        };
        Console.prototype.advanceLine = function () {
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
            var lineHeight = _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
            // Check if current Y position is greater than height of canvas
            if (_Canvas.height < this.currentYPosition) {
                // Decrease Y position to previous
                this.currentYPosition -= lineHeight;
                // Copy whats on canvas, starting on line down from top
                var imgData = _DrawingContext.getImageData(0, lineHeight, _Canvas.width, this.currentYPosition);
                // Clear the screen
                this.clearScreen();
                // Put copyied image back on start of canvas
                _DrawingContext.putImageData(imgData, 0, 0);
            }
        };
        Console.prototype.backSpace = function () {
            // Get dimensions. If buffer only contains backspace, clear rect will have 0 size stopping overwritting prompt
            var eraseWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
            var yWidth = _DefaultFontSize + (2 * _DrawingContext.fontDescent(this.currentFont, this.currentFontSize));
            // Move current x pos
            this.currentXPosition -= eraseWidth;
            // Erase block
            _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, eraseWidth, yWidth);
        };
        // Completes command, searches for match in order their added to command list
        Console.prototype.completeCommand = function () {
            // Inits
            var found = false;
            var sc = null;
            // Return if empty buffer
            if (this.buffer == "")
                return;
            // Cycle through shell commands
            for (var i = 0; (i < _OsShell.commandList.length) && !found; i++) {
                // Get command
                sc = _OsShell.commandList[i];
                // Check if matches start of command string
                // then set found flag if true
                if (sc.command.search(this.buffer) == 0) {
                    found = true;
                }
            }
            // If found, put text and set buffer
            if (found) {
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
        };
        return Console;
    })();
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
