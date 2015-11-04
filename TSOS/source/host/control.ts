///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
///<reference path="memoryaccessor.ts" />

/* ------------
     Control.ts

     Requires globals.ts.

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

//
// Control Services
//
module TSOS {

    export class Control {

        public static msg : string;

        public static hostInit(): void {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.

            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = <HTMLCanvasElement>document.getElementById('display');

            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");

            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            CanvasTextFunctions.enable(_DrawingContext);   // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.

            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("taHostLog")).value="";

            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("btnStartOS")).focus();


            // update host status bar
            this.updateHostStatus("OS not running.");


            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        }

        public static hostLog(msg: string, source: string = "?"): void {
            // Note the OS CLOCK.
            var clock: number = _OSclock;

            // Note the REAL clock in milliseconds since January 1, 1970.
            var now: number = new Date().getTime();

            // Build the log string.
            var str: string = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";

            // Update the log console.
            var taLog = <HTMLInputElement> document.getElementById("taHostLog");
            taLog.value = str + taLog.value;

            // TODO in the future: Optionally update a log database or some streaming service.
        }


        //
        // Host Events
        //
        public static hostBtnStartOS_click(btn): void {
            // Disable the (passed-in) start button...
            btn.disabled = true;

            // .. enable the Halt and Reset buttons ...
            (<HTMLButtonElement>document.getElementById("btnHaltOS")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnReset")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnTrace")).disabled = false;

            // .. set focus on the OS console display ...
            document.getElementById("display").focus();

            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new Cpu();  // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init();       //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.

            // Create new memory object
            _Memory = new TSOS.MemoryAccessor();

            // Create table
            this.createMemoryDisplay();
            this.createCPUDisplay();
            this.createRunningProcessDisplay();
            this.createReadyQueueDisplay();

            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new Kernel();

            // Set status
            this.updateHostStatus("OS running.");

            _Kernel.krnBootstrap();  // _GLaDOS.afterStartup() will get called in there, if configured.
        }

        public static hostBtnHaltOS_click(btn): void {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);

            this.updateHostStatus("OS halted.");

            (<HTMLButtonElement>document.getElementById("btnStartOS")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnTrace")).disabled = true;
            (<HTMLButtonElement>document.getElementById("btnStep")).disabled = true;

            btn.disabled = true;
            // TODO: Is there anything else we need to do here?
        }

        public static hostBtnReset_click(btn): void {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        }

        public static hostBtnTraceMode_click(btn) : void
        {
            // Toggle trace mode
            var tm = _TraceMode = !_TraceMode;

            // Enable or disable next button if trace mode is on
            if( _TraceMode )
            {
                (<HTMLButtonElement>document.getElementById("btnStep")).disabled = false;
                (<HTMLButtonElement>document.getElementById("btnTrace")).value = "Trace Off";

                _NextInstruction = false;
            }
            else
            {
                (<HTMLButtonElement>document.getElementById("btnStep")).disabled = true;
                (<HTMLButtonElement>document.getElementById("btnTrace")).value = "Trace On";

            }



        }

        public static hostBtnStep_click(btn) : void
        {
            // Set execute next instruction flag
            _NextInstruction = true;
        }



        // Updates status bar with msg
        public static updateHostStatus(msg : string ) : void
        {
            // Update internal msg
            this.msg = msg;

            // Update status bar
            document.getElementById("lblHostStatusBar").innerHTML = Utils.dateString() + " - " + msg;
        }

        // Update status bar time
        public static updateHostStatusTime() : void
        {
            // Update status bar
            document.getElementById("lblHostStatusBar").innerHTML = Utils.dateString() + " - " + this.msg;
        }

        // Creates memory display table
        public static createMemoryDisplay() : void
        {
            // Inits
            var header = 0;
            var tbl = (<HTMLTableElement>document.getElementById("tblMemory"));
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            // Create first header cell
            row.insertCell(0).innerHTML = "<b>0x" + TSOS.Utils.padString(header.toString(16),4) + "</b>";

            // Cycle through memory
            for( var i = 0; i < _MemoryMax; i++)
            {
                // If new row, create new header cell and insert new row
                if( i % 8 == 0 && i != 0)
                {
                    row = (<HTMLTableRowElement>tbl.insertRow());
                    header += 8;
                    row.insertCell().innerHTML = "<b>0x" + TSOS.Utils.padString(header.toString(16),4) + "</b>";
                }

                // Insert new cell
                row.insertCell().innerHTML =  _Memory.getAddressHexStr(i);
            }
        }

        // Updates memory display table. If instructed, highlights instruction and parameters.
        //
        // Params: instructionIndex <number> - instruction to highlight
        //         params <number> - number of parameters to highlight
        public static updateMemoryDisplay(instructionIndex : number = -1, params : number = -1) : void
        {
            // Inits
            var tbl = (<HTMLTableElement>document.getElementById("tblMemory"));
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.rows.item(0));
            var header = 0;
            var cellIndex : number = 1;
            var paramsLeft : number = params;
            var inParams : boolean = false;

            // Cycle through memory
            for( var i = 0; i < _MemoryMax; i++)
            {
                // Get next row
                if( i % 8 == 0 && i != 0)
                {
                    header++;
                    row = (<HTMLTableRowElement>tbl.rows.item(header));
                    cellIndex = 1;
                }


                // If instruction index highlight red
                if( i == instructionIndex)
                {
                    (<HTMLTableCellElement>row.cells.item(cellIndex)).style.color = "red";
                    if( paramsLeft > 0)
                        inParams = true;
                }
                // Else if params left to highlight, highlight blue
                else if( inParams )
                {

                    (<HTMLTableCellElement>row.cells.item(cellIndex)).style.color = "blue";

                    paramsLeft--;

                    if( paramsLeft <= 0)
                        inParams = false;
                }
                // Else color is black
                else
                {
                    (<HTMLTableCellElement>row.cells.item(cellIndex)).style.color = "black";
                }

                // Update cell
                (<HTMLTableCellElement>row.cells.item(cellIndex)).innerHTML = _Memory.getAddressHexStr(i);

                // Inc cell index
                cellIndex++;
            }
        }

        // Updates cpu display table
        public static updateCPUDisplay() : void
        {
            // Inits
            var tbl = (<HTMLTableElement>document.getElementById("tblCPU"));
            var row = (<HTMLTableRowElement>tbl.rows.item(1));

            // Set register data
            (<HTMLTableCellElement>row.cells.item(0)).innerHTML = TSOS.Utils.padString(_CPU.PC.toString(16),2).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(1)).innerHTML = TSOS.Utils.padString(_CPU.Acc.toString(16),2).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(2)).innerHTML = TSOS.Utils.padString(_CPU.Xreg.toString(16),2).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(3)).innerHTML = TSOS.Utils.padString(_CPU.Yreg.toString(16),2).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(4)).innerHTML = TSOS.Utils.padString(_CPU.Zflag.toString(16),2).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(5)).innerHTML = TSOS.Utils.padString(_CPU.base.toString(16),4).toUpperCase();
            (<HTMLTableCellElement>row.cells.item(6)).innerHTML = TSOS.Utils.padString(_CPU.limit.toString(16),4).toUpperCase();

        }

        // Creates CPU display table
        public static createCPUDisplay() : void
        {
            // Inits
            var tbl = (<HTMLTableElement>document.getElementById("tblCPU"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            // Create header
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';

            // Create cpu reg data
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.PC.toString(16),2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Acc.toString(16),2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Xreg.toString(16),2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Yreg.toString(16),2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Zflag.toString(16),2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.base.toString(16),4).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.limit.toString(16),4).toUpperCase();
        }

        public static createRunningProcessDisplay() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("tblRunningProcess"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'XReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'YReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'ZFlag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Created' + '</b>';

            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
            row.insertCell().innerHTML = '-';
        }

        public static updateRunningProcessDisplay() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("tblRunningProcess"));
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.rows.item(1));
            var pid = "-";
            var acc = "-";
            var pc = "-";
            var xreg = "-";
            var yreg = "-";
            var zflag = "-";
            var base = "-";
            var limit = "-";
            var created = "-";

            var pcb = _ProcessScheduler.runningProcess;

            if( pcb != null )
            {
                pid = pcb.pid.toString();
                pc = pcb.PC.toString(16);
                acc = pcb.Acc.toString(16);
                xreg = pcb.xReg.toString(16);
                yreg = pcb.yReg.toString(16);
                zflag = pcb.zFlag.toString(16);
                base = pcb.base.toString(16);
                limit = pcb.limit.toString(16);
                created = TSOS.Utils.timeString(pcb.created);
            }


            (<HTMLTableCellElement>row.cells.item(0)).innerHTML = pid;
            (<HTMLTableCellElement>row.cells.item(1)).innerHTML = pc;
            (<HTMLTableCellElement>row.cells.item(2)).innerHTML = acc;
            (<HTMLTableCellElement>row.cells.item(3)).innerHTML = xreg;
            (<HTMLTableCellElement>row.cells.item(4)).innerHTML = yreg;
            (<HTMLTableCellElement>row.cells.item(5)).innerHTML = zflag;
            (<HTMLTableCellElement>row.cells.item(6)).innerHTML = base;
            (<HTMLTableCellElement>row.cells.item(7)).innerHTML = limit;
            (<HTMLTableCellElement>row.cells.item(8)).innerHTML = created;
        }

        public static createReadyQueueDisplay() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("tblReadyQueue"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'XReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'YReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'ZFlag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Created' + '</b>';

            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";

            row = (<HTMLTableRowElement>tbl.insertRow());

            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";

            row = (<HTMLTableRowElement>tbl.insertRow());

            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";
            row.insertCell().innerHTML = "-";

        }

        public static updateReadyQueueDisplay() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("tblReadyQueue"));
            var row : HTMLTableRowElement = null;
            var rowNum : number = 1;
            var pcb : TSOS.ProcessControlBlock = null;
            var len = _ProcessScheduler.readyQueueSize();

            this.clearReadyQueueDisplay();

            for( var i : number = 0; ((i < len) && (i < 3)); i++)
            {

                pcb = _ProcessScheduler.getReadyQueueItem(i);

                if( pcb != null)
                {
                    _Kernel.krnTrace(pcb.toString());
                    row = (<HTMLTableRowElement>tbl.rows.item(rowNum));

                    (<HTMLTableCellElement>row.cells.item(0)).innerHTML = pcb.pid.toString();
                    (<HTMLTableCellElement>row.cells.item(1)).innerHTML = pcb.PC.toString(16);
                    (<HTMLTableCellElement>row.cells.item(2)).innerHTML = pcb.Acc.toString(16);
                    (<HTMLTableCellElement>row.cells.item(3)).innerHTML = pcb.xReg.toString(16);
                    (<HTMLTableCellElement>row.cells.item(4)).innerHTML = pcb.yReg.toString(16);
                    (<HTMLTableCellElement>row.cells.item(5)).innerHTML = pcb.zFlag.toString(16);
                    (<HTMLTableCellElement>row.cells.item(6)).innerHTML = pcb.base.toString(16);
                    (<HTMLTableCellElement>row.cells.item(7)).innerHTML = pcb.limit.toString(16);
                    (<HTMLTableCellElement>row.cells.item(8)).innerHTML = TSOS.Utils.timeString(pcb.created);

                    rowNum++;
                    _Kernel.krnTrace("rq57");
                }
            }

        }

        public static clearReadyQueueDisplay() : void
        {
            var tbl : HTMLTableElement = (<HTMLTableElement>document.getElementById("tblReadyQueue"));
            var row : HTMLTableRowElement;

            for( var i = 0; i < 3; i++)
            {
                row = (<HTMLTableRowElement>tbl.rows.item(i + 1));

                (<HTMLTableCellElement>row.cells.item(0)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(1)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(2)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(3)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(4)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(5)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(6)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(7)).innerHTML = "-";
                (<HTMLTableCellElement>row.cells.item(8)).innerHTML = "-";
            }
        }
    }
}
