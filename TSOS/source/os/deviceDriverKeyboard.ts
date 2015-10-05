///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {


    // Char map for punctuations
    var charMap = [];

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver
    {


        constructor() {
            // Override the base method pointers.
            super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
       }

        // Creates charmap symbol array
        public createCharMap() : void
        {
            charMap[48] = ')';
            charMap[49] = '!';
            charMap[50] = '@';
            charMap[51] = '#';
            charMap[52] = '$';
            charMap[53] = '%';
            charMap[54] = '^';
            charMap[55] = '&';
            charMap[56] = '*';
            charMap[57] = '(';
            charMap[59] = ':';
            charMap[61] = '+';
            charMap[188] = '<';
            charMap[173] = '_';
            charMap[190] = '>';
            charMap[191] = '?';
            charMap[192] = '~';
            charMap[219] = '{';
            charMap[220] = '|';
            charMap[221] = '}';
            charMap[222] = '"';
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
           this.createCharMap();
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr  = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32)                     ||   // space
                        (keyCode == 13)                     ||  // enter
                        (keyCode == 61))                        // equals
            {
                // If shifted use char from map
                if( isShifted)
                {
                    chr = charMap[keyCode];
                }
                // Else use fromCharCode
                else {

                    chr = String.fromCharCode(keyCode);
                }

                _KernelInputQueue.enqueue(chr);
            }
            // Had to manually put in these symbols, as String.fromCharCode returns nothing
            // for these keycodes
            else if( ((keyCode >= 190) && (keyCode <= 192))  || // Punctuations
                ((keyCode >= 219) && (keyCode <= 222)) ||
                (keyCode == 173  ) ||
                (keyCode == 188) ||
                (keyCode == 59))
            {

                switch (keyCode) {
                    case 59:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = ';';
                        break;
                    case 173:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '-';
                        break;
                    case 188:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = ',';
                        break;
                    case 190:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '.';
                        break;
                    case 191:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '/';
                        break;
                    case 192:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '`';
                        break;
                    case 219:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '[';
                        break;
                    case 220:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '\\';
                        break;
                    case 221:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = ']';
                        break;
                    case 222:
                        if( isShifted )
                            chr = charMap[keyCode];
                        else
                            chr = '\'';
                        break;
                    default:
                        chr = '';
                        break;
                }

                _KernelInputQueue.enqueue(chr);
            }
            else if( keyCode == 8 ) // Backspace
            {
                chr = String.fromCharCode(8);

                _KernelInputQueue.enqueue(chr);
            }
            else if( keyCode == 9) // Tab
            {
                // Had to call from the driver, as
                // I can't put the tab key code in the buffer
                _Console.completeCommand();
                //chr = String.fromCharCode(9);
                //_KernelInputQueue.engueue(chr);
            }
            else if( keyCode == 38 ) // Up arrow
            {
                chr = String.fromCharCode(38);
                _KernelInputQueue.enqueue(chr);
            }
            else if( keyCode == 40 ) // Up arrow
            {
                chr = String.fromCharCode(40);
                _KernelInputQueue.enqueue(chr);
            }
        }
    }
}
