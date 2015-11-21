/* --------
   Utils.ts

   Utility functions.
   -------- */

module TSOS {

    export class Utils {

        private static asciiChars =
        {
            32: ' ',

            33: '!',
            34: '\"',
            35: '#',
            36: '$',
            37: '%',
            38: '&',
            39: '\'',
            40: '(',
            41: ')',
            42: '*',
            43: '+',
            44: ',',
            45: '-',
            46: '.',
            47: '/',

            48: '0',
            49: '1',
            50: '2',
            51: '3',
            52: '4',
            53: '5',
            54: '6',
            55: '7',
            56: '8',
            57: '9',

            58: ':',
            59: ';',
            60: '<',
            61: '=',
            62: '>',
            63: '?',
            64: '@',

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

            91: '[',
            92: '\\',
            93: ']',
            94: '^',
            95: '_',
            96: '`',
			
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
            122: 'z',

            123: '{',
            124: '|',
            125: '}',
            126: '~'

        }

        private static asciiValues =
        {
            ' ' : 32,

            '!' : 33,
            '"' : 34,
            '#': 35,
            '$': 36,
            '%': 37,
            '&': 38,
            '\'': 39,
            '(': 40,
            ')': 41,
            '*': 42,
            '+': 43,
            ',': 44,
            '-': 45,
            '.': 46,
            '/': 47,

            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,

            ':': 58,
            ';': 59,
            '<': 60,
            '=': 61,
            '>': 62,
            '?': 63,
            '@': 64,

            'A': 65,
            'B': 66,
            'C': 67,
            'D': 68,
            'E': 69,
            'F': 70,
            'G': 71,
            'H': 72,
            'I': 73,
            'J': 74,
            'K': 75,
            'L': 76,
            'M': 77,
            'N': 78,
            'O': 79,
            'P': 80,
            'Q': 81,
            'R': 82,
            'S': 83,
            'T': 84,
            'U': 85,
            'V': 86,
            'W': 87,
            'X': 88,
            'Y': 89,
            'Z': 90,

            '[': 91,
            '\\': 92,
            ']': 93,
            '^': 94,
            '_': 95,
            '`': 96,

            'a': 97,
            'b': 98,
            'c': 99,
            'd': 100,
            'e': 101,
            'f': 102,
            'g': 103,
            'h': 104,
            'i': 105,
            'j': 106,
            'k': 107,
            'l': 108,
            'm': 109,
            'n': 110,
            'o': 111,
            'p': 112,
            'q': 113,
            'r': 114,
            's': 115,
            't': 116,
            'u': 117,
            'v': 118,
            'w': 119,
            'x': 120,
            'y': 121,
            'z': 122,

            '{': 123,
            '|': 124,
            '}': 125,
            '~': 126
        }

        public static asciiValue(char) : number
        {
            //if( char.length != 1)
                //return -1;

            _Kernel.krnTrace(this.asciiValues[char]);

            return this.asciiValues[char];
        }

        public static asciiChar(val : number) : string
        {
            if( (val < 32) || (val > 126))
                return '';

            return this.asciiChars[val];
        }

        public static asciiValueHex(char : string, pad : boolean = true) : string
        {
            var val : string;

            if( char.length != 1)
                return '';

            val = this.asciiValues[char].toString(16);

            if( pad && val.length == 1)
                val = '0' + val;

            return val;
        }

        public static asciiCharHex(val : string) : string
        {
            var num = parseInt(val,16);

            if( (num < 32) || (num > 126))
                return '';

            return this.asciiChars[num];
        }



        public static trim(str): string {
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
        }

        public static rot13(str: string): string {
            /*
               This is an easy-to understand implementation of the famous and common Rot13 obfuscator.
               You can do this in three lines with a complex regular expression, but I'd have
               trouble explaining it in the future.  There's a lot to be said for obvious code.
            */
            var retVal: string = "";
            for (var i in <any>str) {    // We need to cast the string to any for use in the for...in construct.
                var ch: string = str[i];
                var code: number = 0;
                if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
                    retVal = retVal + String.fromCharCode(code);
                } else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
                    retVal = retVal + String.fromCharCode(code);
                } else {
                    retVal = retVal + ch;
                }
            }
            return retVal;
        }

        // Get formated current date and time
        public static dateString() : string
        {
            var date = new Date();
            var Day = date.getDay().toString();
            var Month = date.getMonth().toString();
            var Year = date.getFullYear().toString();
            var Hours  = date.getHours().toString();
            var HoursNum = date.getHours();
            var Minutes = date.getMinutes().toString();
            var AMPM = "AM";

            if( HoursNum >= 12 )
            {
                AMPM = "PM";

            }

            if( HoursNum > 12)
                Hours = (HoursNum % 12).toString();

            if( Day.length == 1 )
                Day = '0' + Day;

            if( Month.length == 1 )
                Month = '0' + Month;

            if( Hours.length == 1 )
                Hours = '0' + Hours;

            if( Minutes.length == 1 )
                Minutes = '0' + Minutes;


            return (Month + '/' + Day + '/' + Year + ' ' + Hours + ':' + Minutes + ' ' + AMPM);
        }

        // Get time string from date object
        public static timeString(date : Date) : string
        {
            var Hours  = date.getHours().toString();
            var HoursNum = date.getHours();
            var Minutes = date.getMinutes().toString();
            var Seconds = date.getSeconds().toString();
            var AMPM = "AM";

            if( HoursNum >= 12 )
            {
                AMPM = "PM";

            }

            if( HoursNum > 12)
                Hours = (HoursNum % 12).toString();

            if( Hours.length == 1 )
                Hours = '0' + Hours;

            if( Minutes.length == 1 )
                Minutes = '0' + Minutes;

            if( Seconds.length == 1)
                Seconds = '0' + Seconds;


            return (Hours + ':' + Minutes + ':' + Seconds + ' ' + AMPM);
        }

        public static secondsString(date : Date) : string
        {
            var min = date.getMinutes().toString();
            var sec = date.getSeconds().toString();
            var mil = date.getMilliseconds().toString();


            if( min.length == 1)
                min = '0' + min;

            if( sec.length == 1)
                sec = '0' + sec;

            if( mil.length == 1)
                mil = '0' + mil;

            return (min + ':' + sec + ':' + mil);
        }

        // Pads string with 00 to length
        public static padString(str : string, num : number)
        {
            var ret : string = str;

            if( str.length < num )
            {
                while (ret.length < num) {
                    ret = '0' + ret;
                }
            }

            return ret;
        }

        // Returns ASCII string based on value
        // I accept all puncuation and small characters
        // in my print string system call
        public static getASCIIChar(value : number) : string
        {
            var char : string = "";

            /*
            if( (value >= 48 && value <= 57) ||
                (value >= 65 && value <= 90) ||
                (value >= 97 && value <= 122) ||
                (value == 32))
                */
            if( value >= 32 && value <= 126)
            {
                char = this.asciiChars[value];
            }

            return char;
        }
    }
}
