/* --------
   Utils.ts

   Utility functions.
   -------- */

module TSOS {

    export class Utils {

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
    }
}
