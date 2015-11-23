///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />


/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // date
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "- Displays current date and time.");
            this.commandList[this.commandList.length] = sc;

            // whereami
            sc = new ShellCommand(this.shellWhereAmI,
                "whereami",
                "- Displays users current location...");
            this.commandList[this.commandList.length] = sc;

            // openthepodbaydoorshal
            sc = new ShellCommand(this.shellOpenThePodBayDoors,
                "openthepodbaydoorshal",
                "- Command HAL 9000...");
            this.commandList[this.commandList.length] = sc;

            // status
            sc = new ShellCommand(this.shellStatus,
                "status",
                "<string> - Updates status message in host status bar.");
            this.commandList[this.commandList.length] = sc;

            // error
            sc = new ShellCommand(this.shellError,
                "error",
                "<string> - Triggers an OS error.");
            this.commandList[this.commandList.length] = sc;

            // load
            sc = new ShellCommand(this.shellLoad,
                "load",
                "- Loads validates and loads program input into memory.");
            this.commandList[this.commandList.length] = sc;

            // run
            sc = new ShellCommand(this.shellRun,
                "run",
                "<int> - Runs a process in memory.");
            this.commandList[this.commandList.length] = sc;

            // clearmem
            sc = new ShellCommand(this.shellClrmem,
                "clrmem",
                "- Clears all processes in memory.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellClrpart,
                "clrpart",
                "<int> - Clears specific parttion in memory.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRunall,
                "runall",
                "- Executes all loaded processes.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellQuantum,
                "quantum",
                "<int> - Executes all loaded processes.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellPS,
                "ps",
                "- Lists all active process.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellKill,
                "kill",
                "<int> - Executes all loaded processes.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellLoadAll,
                "loadall",
                "- Loads process into all available partitions.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellFormat,
                "format",
                "- Formats hard drive.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellCreateFile,
                "create",
                "<string> - creates a file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellWriteFile,
                "write",
                "<string> \"<string>\" - writes to a file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellReadFile,
                "read",
                "<string> - prints file content.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellDeleteFile,
                "delete",
                "<string> - delete a file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellListFiles,
                "ls",
                "Lists all files");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            //
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public putPromptOutput() {
            _StdOut.putText(_OutputPrompt);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }

            // Dont draw prompt on kernel crash
            if( !_KernelCrash )
                // ... and finally write the prompt again.
                this.putPrompt();
        }

        public parseInput(buffer): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }


        // Outputs message and restores useer input if any
        public outputMessage(msg : string) : void
        {
            if( _StdOut.buffer.length > 0 )
            {
                var buff : string = _StdOut.buffer;
                _StdOut.clearLine();
                _StdOut.putText(msg)
                _StdOut.advanceLine();
                this.putPrompt();
                _StdOut.putText(buff);
                _StdOut.buffer = buff;
            }
            else
            {
                _StdOut.putText(msg)
                _StdOut.advanceLine();
                this.putPrompt();
            }

        }

        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        public shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
            _StdOut.advanceLine();
            _StdOut.putText("Author: " + AUTHOR);
            _StdOut.advanceLine();
            _StdOut.putText("Framework Author (Instructor): " + FRAME_AUTHOR);
        }

        public shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }



        // Note: I used advanceLine() as word wrap is not yet implementd.
        // Will remove advanceLines() one word wrap completed.
        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the running version of the OS.");
                        _StdOut.advanceLine();
                        _StdOut.putText("Also shows author information.")
                        break;
                    case "shutdown":
                        _StdOut.putText("Shutdown the command line interface (shell), but leaves ");
                        _StdOut.advanceLine();
                        _StdOut.putText("the kernal running. Click the Reset button then the ");
                        _StdOut.advanceLine();
                        _StdOut.putText("Start button to restart the OS to access the command line.");
                        break;
                    case "cls":
                        _StdOut.putText("Clears display of all previously entered commands and ");
                        _StdOut.advanceLine();
                        _StdOut.putText("messages. Displays and empty command prompt ready for ");
                        _StdOut.advanceLine();
                        _StdOut.putText("input.");
                        break;
                    // Line Width ---------------------------------------------------------------->
                    case "trace":
                        _StdOut.putText("Trace 'on' or 'off' enables or disables kernal status ");
                        _StdOut.advanceLine();
                        _StdOut.putText("messages, displayed in the 'Host Log' display.");
                        break;
                    case "rot13":
                        _StdOut.putText("Performs a rot13 encryption/decryption on given text. ");
                        _StdOut.advanceLine();
                        _StdOut.putText("This is a Caesar type cypher, which replaces each ");
                        _StdOut.advanceLine();
                        _StdOut.putText("letter with one 13 places ahead in the alphabet.");
                        break;
                    case "prompt":
                        _StdOut.putText("Replaces current command prompt character or text ");
                        _StdOut.advanceLine();
                        _StdOut.putText("(default '>'), with given character or text.");
                        break;
                    case "man":
                        _StdOut.putText("Display manual info of given command, which is more ");
                        _StdOut.advanceLine();
                        _StdOut.putText("detailed then command description in help.");
                        break;
                    case "date":
                        _StdOut.putText("Displays current date and time, eastern standard time.");
                        break;
                    case "whereami":
                        _StdOut.putText("A joke command, which displays user location.");
                        break;
                    case "openthepodbaydoorshal":
                        _StdOut.putText("A joke command, which relives a famous scene from ");
                        _StdOut.advanceLine();
                        _StdOut.putText("'2001: A Space Odyssey'.");
                        break;
                    case "status":
                        _StdOut.putText("Updates message in status bar with given text. Will not change until OS status changes, or another status command is entered.");
                        break;
                    case "error":
                        _StdOut.putText("Triggers an os error, with given message. For testing purposes.");
                        break;
                    case "load":
                        _StdOut.putText("Loads and validates program input into memory. Displays PID of newly created PCB.");
                        break;
                    case "run":
                        _StdOut.putText("Runs loaded process, identified by givin PID returned at load.");
                        break;
                    case "clrmem":
                        _StdOut.putText("Clears all memory partitions.");
                        break;
                    case "clrpart":
                        _StdOut.putText("Clears a specific partition.");
                        break;
                    case "runall":
                        _StdOut.putText("Executes all loaded processess.");
                        break;
                    case "quantum":
                        _StdOut.putText("Changes scheduling quantum to given value.");
                        break;
                    case "ps":
                        _StdOut.putText("Lists all active processes, loaded and running.");
                        break;
                    case "kill":
                        _StdOut.putText("Terminates a processs with given pid.");
                        break;
                    case "loadall":
                        _StdOut.putText("Loads program input into all available partitions.");
                        break;
                    case "format":
                        _StdOut.putText("Formats hard drive. Must be done before any file operations are performed.");
                        break;
                    case "create":
                        _StdOut.putText("Creates an empty file with given file name.");
                        break;
                    case "write":
                        _StdOut.putText("Writes given text to an existing file. Must put data in quotes.");
                        break;
                    case "read":
                        _StdOut.putText("Reads and displays file text.");
                        break;
                    case "delete":
                        _StdOut.putText("Deletes a file.");
                        break;
                    case "ls":
                        _StdOut.putText("Lists all active files.");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                        break;
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        // date command method
        public shellDate(args)
        {
            var curDate = new Date();
            _StdOut.putText(Utils.dateString());
        }

        // whereami command method
        public shellWhereAmI(args)
        {
            _StdOut.putText("Podunkville, USA");
        }

        // openthepodbaydoors command method
        public shellOpenThePodBayDoors(args)
        {
            _StdOut.putText("I am sorry dave, I am afraid I can't do that.");
            _StdOut.advanceLine();
            _StdOut.putText("This mission is too important to allow me to jeopardize it.");
        }

        // Updates host status bar message
        public shellStatus(args)
        {
            if( args.length > 0)
                Control.updateHostStatus(args.join(' '));
            else
                _StdOut.putText("Usage: status <string> - Please provide a string status message.");
        }

        // Forces an error for testing purposes
        public shellError(args)
        {
            if( args.length > 0)
                _Kernel.krnTrapError(args.join(' '));
            else
                _StdOut.putText("Usage: error <string> - Please provide a string error message.");
        }

        // Validates and loads a process in memory. When interrupt is processed pid is returned.
        public shellLoad(args)
        {
            // Inits
            var programInput : string = (<HTMLInputElement>document.getElementById("taProgramInput")).value;


            // Check if empty input
            if( programInput.length == 0 )
                _StdOut.putText("Empty program input.")
            // Check if valid characters
            else if( programInput.match("[^a-f|A-F|0-9| |\n|\r]+") )
                _StdOut.putText("Invalid program input, only hex values and spaces allowed.");
            // Else valid input
            else
            {
                // Remove white space and carrieg returns
                var reg = new RegExp("[ |\n\r]+");
                var hex = programInput.split(reg);
                var input = hex.join('');

                // Verify inputs not over 256 bytes
                if( input.length > 512)
                {
                    _StdOut.putText("Program is valid, but over 256 bytes.")
                }
                // Else send create process interupt
                else
                {

                    // Create process
                    _Kernel.CreateProcess(input);
                }
            }

        }

        // Runs a given process. If not a valid pid, later a message is returned.
        public shellRun(args)
        {
            // Verify at least one pid given
            if( args.length > 0)
            {
                if( !isNaN(args[0]))
                    // Send interupt to run process
                    _Kernel.ExecuteProcess(args[0]);
                else
                    _StdOut.putText("usage: run <int> - Please provide a PID.");
            }
            // Else message user of usage
            else
                _StdOut.putText("usage: run <int> - Please provide a PID.");
        }

        public shellClrmem(args)
        {
             _Kernel.ClearMemory();

        }

        public shellClrpart(args)
        {
            if( args.length > 0)
            {
                if( !isNaN(args[0]))
                    _Kernel.ClearMemory(args[0]);
                else
                    _StdOut.putText("usage: clrpart <int> - Please enter a partition index.");
            }
            else
            {
                _StdOut.putText("usage: clrpart <int> - Please enter a partition index.");
            }
        }

        public shellRunall(args)
        {
            _Kernel.ExecuteAllProcessess();
        }

        public shellQuantum(args)
        {
            if( args.length > 0)
            {
                if( !isNaN(args[0]))
                    _Kernel.ChangeQuantum(args[0]);
                else
                    _StdOut.putText("usage: quantum <int> - Please enter a quantum.");

            }
            else
            {
                _StdOut.putText("usage: quantum <int> - Please enter a quantum.");
            }
        }

        public shellPS(args)
        {
            _Kernel.ListAllProcessess();
        }

        public shellKill(args)
        {
            if( args.length > 0)
            {
                if( !isNaN(args[0]))
                    _Kernel.TerminateProcessByPID(args[0]);
                else
                    _StdOut.putText("usage: kill <int> - Please enter a pid of a running processs.");
            }
            else
            {
                _StdOut.putText("usage: kill <int> - Please enter a pid of a running processs.");
            }
        }

        public shellLoadAll(args)
        {
            // Inits
            var programInput : string = (<HTMLInputElement>document.getElementById("taProgramInput")).value;


            // Check if empty input
            if( programInput.length == 0 )
                _StdOut.putText("Empty program input.")
            // Check if valid characters
            else if( programInput.match("[^a-f|A-F|0-9| |\n|\r]+") )
                _StdOut.putText("Invalid program input, only hex values and spaces allowed.");
            // Else valid input
            else
            {
                // Remove white space and carrieg returns
                var reg = new RegExp("[ |\n\r]+");
                var hex = programInput.split(reg);
                var input = hex.join('');

                // Verify inputs not over 256 bytes
                if( input.length > 512)
                {
                    _StdOut.putText("Program is valid, but over 256 bytes.")
                }
                // Else send create process interupt
                else
                {

                    // Create process
                    _Kernel.LoadAllProcesses(input);
                }
            }

        }

        public shellFormat(args)
        {
            _Kernel.FormatHD();
        }

        public shellCreateFile(args)
        {
            if( args.length > 0 )
            {
                _Kernel.CreateFile(args[0]);
            }
            else
                _StdOut.putText("Usage - createfile <string : fileName>");

        }

        public shellWriteFile(args)
        {

            if( args.length > 1 )
            {
                var fargs = [];

                for( var i = 1; i < args.length; i++)
                    fargs.push(args[i]);

                var str = fargs.join(' ');
                var sindex = -1;
                var valid = false;

                if( str[0] == '"' )
                {
                    for( var s = 1; (s < str.length) && sindex == -1; s++ )
                    {
                        if( str[s] == '"')
                            sindex = s;
                    }

                    if( sindex != -1) {

                        str = str.substr(1, sindex - 1);
                        valid = true;
                    }

                }

                if( valid )
                    _Kernel.WriteToFile(args[0],str);
                else
                    _StdOut.putText("Text to be written must be enclosed in quotes(\"text here\")");
            }
            else
                _StdOut.putText("Usage - writefile <string : fileName> \"<string : text>\"");

        }

        public shellReadFile(args)
        {

            if( args.length > 0 )
            {
                _Kernel.ReadFile(args[0]);
            }
            else
                _StdOut.putText("Usage - readfile <string : fileName>");

        }

        public shellDeleteFile(args)
        {

            if( args.length > 0 )
            {
                _Kernel.DeleteFile(args[0]);
            }
            else
                _StdOut.putText("Usage - deletefile <string : fileName>");

        }

        public shellListFiles(args)
        {
            _Kernel.ListFiles();
        }
    }
}
