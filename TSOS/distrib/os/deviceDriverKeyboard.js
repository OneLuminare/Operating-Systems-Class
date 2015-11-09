///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    // Char map for punctuations
    var charMap = [];
    // Extends DeviceDriver
    var DeviceDriverKeyboard = (function (_super) {
        __extends(DeviceDriverKeyboard, _super);
        function DeviceDriverKeyboard() {
            // Override the base method pointers.
            _super.call(this, this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
        }
        // Creates charmap symbol array
        DeviceDriverKeyboard.prototype.createCharMap = function () {
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
        };
        DeviceDriverKeyboard.prototype.krnKbdDriverEntry = function () {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
            this.createCharMap();
        };
        DeviceDriverKeyboard.prototype.krnKbdDispatchKeyPress = function (params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||
                ((keyCode >= 97) && (keyCode <= 123))) {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            }
            else if (((keyCode >= 48) && (keyCode <= 57)) ||
                (keyCode == 32) ||
                (keyCode == 13) ||
                (keyCode == 61)) {
                // If shifted use char from map
                if (isShifted) {
                    chr = charMap[keyCode];
                }
                else {
                    chr = String.fromCharCode(keyCode);
                }
                _KernelInputQueue.enqueue(chr);
            }
            else if (((keyCode >= 190) && (keyCode <= 192)) ||
                ((keyCode >= 219) && (keyCode <= 222)) ||
                (keyCode == 173) ||
                (keyCode == 188) ||
                (keyCode == 59)) {
                switch (keyCode) {
                    case 59:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = ';';
                        break;
                    case 173:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '-';
                        break;
                    case 188:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = ',';
                        break;
                    case 190:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '.';
                        break;
                    case 191:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '/';
                        break;
                    case 192:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '`';
                        break;
                    case 219:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '[';
                        break;
                    case 220:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = '\\';
                        break;
                    case 221:
                        if (isShifted)
                            chr = charMap[keyCode];
                        else
                            chr = ']';
                        break;
                    case 222:
                        if (isShifted)
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
            else if (keyCode == 8) {
                chr = String.fromCharCode(8);
                _KernelInputQueue.enqueue(chr);
            }
            else if (keyCode == 9) {
                // Had to call from the driver, as
                // I can't put the tab key code in the buffer
                _Console.completeCommand();
            }
            else if (keyCode == 38) {
                chr = String.fromCharCode(38);
                _KernelInputQueue.enqueue(chr);
            }
            else if (keyCode == 40) {
                chr = String.fromCharCode(40);
                _KernelInputQueue.enqueue(chr);
            }
        };
        return DeviceDriverKeyboard;
    })(TSOS.DeviceDriver);
    TSOS.DeviceDriverKeyboard = DeviceDriverKeyboard;
})(TSOS || (TSOS = {}));
