/* --------
   Utils.ts

   Utility functions.
   -------- */
var TSOS;
(function (TSOS) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.trim = function (str) {
            // Use a regular expression to remove leading and trailing spaces.
            return str.replace(/^\s+ | \s+$/g, "");
            /*
            Huh? WTF? Okay... take a breath. Here we go:
            - The "|" separates this into two expressions, as in A or B.
            - "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
            - "\s+$" is the same thing, but at the end of the string.
            - "g" makes is global, so we get all the whitespace.
            - "" is nothing, which is what we replace the whitespace with.
            */
        };
        Utils.rot13 = function (str) {
            /*
               This is an easy-to understand implementation of the famous and common Rot13 obfuscator.
               You can do this in three lines with a complex regular expression, but I'd have
               trouble explaining it in the future.  There's a lot to be said for obvious code.
            */
            var retVal = "";
            for (var i in str) {
                var ch = str[i];
                var code = 0;
                if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) + 13; // It's okay to use 13.  It's not a magic number, it's called rot13.
                    retVal = retVal + String.fromCharCode(code);
                }
                else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) - 13; // It's okay to use 13.  See above.
                    retVal = retVal + String.fromCharCode(code);
                }
                else {
                    retVal = retVal + ch;
                }
            }
            return retVal;
        };
        // Get formated current date and time
        Utils.dateString = function () {
            var date = new Date();
            var Day = date.getDay().toString();
            var Month = date.getMonth().toString();
            var Year = date.getFullYear().toString();
            var Hours = date.getHours().toString();
            var HoursNum = date.getHours();
            var Minutes = date.getMinutes().toString();
            var AMPM = "AM";
            if (HoursNum >= 12) {
                AMPM = "PM";
            }
            if (HoursNum > 12)
                Hours = (HoursNum % 12).toString();
            if (Day.length == 1)
                Day = '0' + Day;
            if (Month.length == 1)
                Month = '0' + Month;
            if (Hours.length == 1)
                Hours = '0' + Hours;
            if (Minutes.length == 1)
                Minutes = '0' + Minutes;
            return (Month + '/' + Day + '/' + Year + ' ' + Hours + ':' + Minutes + ' ' + AMPM);
        };
        // Get time string from date object
        Utils.timeString = function (date) {
            var Hours = date.getHours().toString();
            var HoursNum = date.getHours();
            var Minutes = date.getMinutes().toString();
            var Seconds = date.getSeconds().toString();
            var AMPM = "AM";
            if (HoursNum >= 12) {
                AMPM = "PM";
            }
            if (HoursNum > 12)
                Hours = (HoursNum % 12).toString();
            if (Hours.length == 1)
                Hours = '0' + Hours;
            if (Minutes.length == 1)
                Minutes = '0' + Minutes;
            if (Seconds.length == 1)
                Seconds = '0' + Seconds;
            return (Hours + ':' + Minutes + ':' + Seconds + ' ' + AMPM);
        };
        // Pads string with 00 to length
        Utils.padString = function (str, num) {
            var ret = str;
            if (str.length < num) {
                while (ret.length < num) {
                    ret = '0' + ret;
                }
            }
            return ret;
        };
        // Returns ASCII string based on value
        Utils.getASCIIChar = function (value) {
            var char = "";
            if ((value >= 65 && value <= 90) ||
                (value >= 97 && value <= 122)) {
                char = this.asciiChars[value];
            }
            return char;
        };
        Utils.asciiChars = {
            65: 'A',
            66: 'B',
            67: 'C',
            68: 'D',
            69: 'E',
            70: 'F',
            71: 'G',
            72: 'H',
            73: 'I',
            74: 'J',
            75: 'K',
            76: 'L',
            77: 'M',
            78: 'N',
            79: 'O',
            80: 'P',
            81: 'Q',
            82: 'R',
            83: 'S',
            84: 'T',
            85: 'U',
            86: 'V',
            87: 'W',
            88: 'X',
            89: 'Y',
            90: 'Z',
            97: 'a',
            98: 'b',
            99: 'c',
            100: 'd',
            101: 'e',
            102: 'f',
            103: 'g',
            104: 'h',
            105: 'i',
            106: 'j',
            107: 'k',
            108: 'l',
            109: 'm',
            110: 'n',
            111: 'o',
            112: 'p',
            113: 'q',
            114: 'r',
            115: 's',
            116: 't',
            117: 'u',
            118: 'v',
            119: 'w',
            120: 'x',
            121: 'y',
            122: 'z'
        };
        return Utils;
    })();
    TSOS.Utils = Utils;
})(TSOS || (TSOS = {}));
