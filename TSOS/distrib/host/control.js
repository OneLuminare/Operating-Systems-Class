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
var TSOS;
(function (TSOS) {
    var Control = (function () {
        function Control() {
        }
        Control.hostInit = function () {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.
            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = document.getElementById('display');
            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");
            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            TSOS.CanvasTextFunctions.enable(_DrawingContext); // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("taHostLog").value = "";
            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("btnStartOS").focus();
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
        };
        Control.hostLog = function (msg, source) {
            if (source === void 0) { source = "?"; }
            // Note the OS CLOCK.
            var clock = _OSclock;
            // Note the REAL clock in milliseconds since January 1, 1970.
            var now = new Date().getTime();
            // Build the log string.
            var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now + " })" + "\n";
            // Update the log console.
            var taLog = document.getElementById("taHostLog");
            taLog.value = str + taLog.value;
            // TODO in the future: Optionally update a log database or some streaming service.
        };
        //
        // Host Events
        //
        Control.hostBtnStartOS_click = function (btn) {
            // Disable the (passed-in) start button...
            btn.disabled = true;
            // .. enable the Halt and Reset buttons ...
            document.getElementById("btnHaltOS").disabled = false;
            document.getElementById("btnReset").disabled = false;
            document.getElementById("btnTrace").disabled = false;
            // .. set focus on the OS console display ...
            document.getElementById("display").focus();
            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new TSOS.Cpu(); // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init(); //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
            // Create new memory object
            _Memory = new TSOS.MemoryAccessor();
            // Create table
            this.createMemoryDisplay();
            this.createCPUDisplay();
            this.createRunningProcessDisplay();
            this.createReadyQueueDisplay();
            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(TSOS.Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new TSOS.Kernel();
            // Set status
            this.updateHostStatus("OS running.");
            _Kernel.krnBootstrap(); // _GLaDOS.afterStartup() will get called in there, if configured.
        };
        Control.hostBtnHaltOS_click = function (btn) {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            this.updateHostStatus("OS halted.");
            document.getElementById("btnStartOS").disabled = false;
            document.getElementById("btnTrace").disabled = true;
            document.getElementById("btnStep").disabled = true;
            btn.disabled = true;
            // TODO: Is there anything else we need to do here?
        };
        Control.hostBtnReset_click = function (btn) {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        };
        Control.hostBtnTraceMode_click = function (btn) {
            // Toggle trace mode
            var tm = _TraceMode = !_TraceMode;
            // Enable or disable next button if trace mode is on
            if (_TraceMode) {
                document.getElementById("btnStep").disabled = false;
                document.getElementById("btnTrace").value = "Trace Off";
                _NextInstruction = false;
            }
            else {
                document.getElementById("btnStep").disabled = true;
                document.getElementById("btnTrace").value = "Trace On";
            }
        };
        Control.hostBtnStep_click = function (btn) {
            // Set execute next instruction flag
            _NextInstruction = true;
        };
        // Updates status bar with msg
        Control.updateHostStatus = function (msg) {
            // Update internal msg
            this.msg = msg;
            // Update status bar
            document.getElementById("lblHostStatusBar").innerHTML = TSOS.Utils.dateString() + " - " + msg;
        };
        // Update status bar time
        Control.updateHostStatusTime = function () {
            // Update status bar
            document.getElementById("lblHostStatusBar").innerHTML = TSOS.Utils.dateString() + " - " + this.msg;
        };
        // Creates memory display table
        Control.createMemoryDisplay = function () {
            // Inits
            var header = 0;
            var tbl = document.getElementById("tblMemory");
            var row = tbl.insertRow();
            // Create first header cell
            row.insertCell(0).innerHTML = "<b>0x" + TSOS.Utils.padString(header.toString(16), 4) + "</b>";
            // Cycle through memory
            for (var i = 0; i < _MemoryMax; i++) {
                // If new row, create new header cell and insert new row
                if (i % 8 == 0 && i != 0) {
                    row = tbl.insertRow();
                    header += 8;
                    row.insertCell().innerHTML = "<b>0x" + TSOS.Utils.padString(header.toString(16), 4) + "</b>";
                }
                // Insert new cell
                row.insertCell().innerHTML = _Memory.getAddressHexStr(i);
            }
        };
        // Updates memory display table. If instructed, highlights instruction and parameters.
        //
        // Params: instructionIndex <number> - instruction to highlight
        //         params <number> - number of parameters to highlight
        Control.updateMemoryDisplay = function (instructionIndex, params) {
            if (instructionIndex === void 0) { instructionIndex = -1; }
            if (params === void 0) { params = -1; }
            // Inits
            var tbl = document.getElementById("tblMemory");
            var row = tbl.rows.item(0);
            var header = 0;
            var cellIndex = 1;
            var paramsLeft = params;
            var inParams = false;
            // Cycle through memory
            for (var i = 0; i < _MemoryMax; i++) {
                // Get next row
                if (i % 8 == 0 && i != 0) {
                    header++;
                    row = tbl.rows.item(header);
                    cellIndex = 1;
                }
                // If instruction index highlight red
                if (i == instructionIndex) {
                    row.cells.item(cellIndex).style.color = "red";
                    if (paramsLeft > 0)
                        inParams = true;
                }
                else if (inParams) {
                    row.cells.item(cellIndex).style.color = "blue";
                    paramsLeft--;
                    if (paramsLeft <= 0)
                        inParams = false;
                }
                else {
                    row.cells.item(cellIndex).style.color = "black";
                }
                // Update cell
                row.cells.item(cellIndex).innerHTML = _Memory.getAddressHexStr(i);
                // Inc cell index
                cellIndex++;
            }
        };
        // Updates cpu display table
        Control.updateCPUDisplay = function () {
            // Inits
            var tbl = document.getElementById("tblCPU");
            var row = tbl.rows.item(1);
            // Set register data
            row.cells.item(0).innerHTML = TSOS.Utils.padString(_CPU.PC.toString(16), 2).toUpperCase();
            row.cells.item(1).innerHTML = TSOS.Utils.padString(_CPU.Acc.toString(16), 2).toUpperCase();
            row.cells.item(2).innerHTML = TSOS.Utils.padString(_CPU.Xreg.toString(16), 2).toUpperCase();
            row.cells.item(3).innerHTML = TSOS.Utils.padString(_CPU.Yreg.toString(16), 2).toUpperCase();
            row.cells.item(4).innerHTML = TSOS.Utils.padString(_CPU.Zflag.toString(16), 2).toUpperCase();
            row.cells.item(5).innerHTML = TSOS.Utils.padString(_CPU.base.toString(16), 4).toUpperCase();
            row.cells.item(6).innerHTML = TSOS.Utils.padString(_CPU.limit.toString(16), 4).toUpperCase();
        };
        // Creates CPU display table
        Control.createCPUDisplay = function () {
            // Inits
            var tbl = document.getElementById("tblCPU");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            // Create header
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            // Create cpu reg data
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.PC.toString(16), 2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Acc.toString(16), 2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Xreg.toString(16), 2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Yreg.toString(16), 2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.Zflag.toString(16), 2).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.base.toString(16), 4).toUpperCase();
            row.insertCell().innerHTML = TSOS.Utils.padString(_CPU.limit.toString(16), 4).toUpperCase();
        };
        Control.createRunningProcessDisplay = function () {
            var tbl = document.getElementById("tblRunningProcess");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'XReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'YReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'ZFlag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Created' + '</b>';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
            row.insertCell().innerHTML = ' ';
        };
        Control.updateRunningProcessDisplay = function () {
            var tbl = document.getElementById("tblRunningProcess");
            var row = tbl.rows.item(1);
            var pid = 0;
            var acc = 0;
            var pc = 0;
            var xreg = 0;
            var yreg = 0;
            var zflag = 0;
            var base = 0;
            var limit = 0;
            var created = "";
            var pcb = _ProcessScheduler.runningProcess;
            if (pcb != null) {
                pid = pcb.pid;
                acc = pcb.Acc;
                xreg = pcb.xReg;
                yreg = pcb.yReg;
                zflag = pcb.zFlag;
                base = pcb.base;
                limit = pcb.limit;
                created = TSOS.Utils.timeString(pcb.created);
            }
            row.cells.item(0).innerHTML = pid.toString();
            row.cells.item(1).innerHTML = pc.toString(16);
            row.cells.item(2).innerHTML = acc.toString(16);
            row.cells.item(3).innerHTML = xreg.toString(16);
            row.cells.item(4).innerHTML = yreg.toString(16);
            row.cells.item(5).innerHTML = zflag.toString(16);
            row.cells.item(6).innerHTML = base.toString(16);
            row.cells.item(7).innerHTML = limit.toString(16);
            row.cells.item(8).innerHTML = created;
        };
        Control.createReadyQueueDisplay = function () {
            var tbl = document.getElementById("tblReadyQueue");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'XReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'YReg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'ZFlag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Created' + '</b>';
            row.insertCell().innerHTML = '0';
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row = tbl.insertRow();
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = ' 0';
            row = tbl.insertRow();
            row.insertCell().innerHTML = ' 0';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
            row.insertCell().innerHTML = '0 ';
        };
        Control.updateReadyQueueDisplay = function () {
            var tbl = document.getElementById("tblReadyQueue");
            var row = null;
            var rowNum = 1;
            var pcb = null;
            var arr = new Array();
            var temp = new TSOS.Queue();
            while (_ProcessScheduler.readyQueue.getSize() > 0) {
                pcb = _ProcessScheduler.readyQueue.dequeue();
                arr.push(pcb);
                temp.enqueue(pcb);
            }
            for (var i = 0; (i < arr.length) && (i < 3); i++)
                ;
            {
                _Kernel.krnTrace("rq2");
                pcb = arr[i];
                _Kernel.krnTrace("rq3");
                if (pcb != null) {
                    _Kernel.krnTrace(pcb.toString());
                    row = tbl.rows.item(rowNum);
                    row.cells.item(0).innerHTML = pcb.pid.toString();
                    row.cells.item(1).innerHTML = pcb.PC.toString(16);
                    row.cells.item(2).innerHTML = pcb.Acc.toString(16);
                    row.cells.item(3).innerHTML = pcb.xReg.toString(16);
                    row.cells.item(4).innerHTML = pcb.yReg.toString(16);
                    row.cells.item(5).innerHTML = pcb.zFlag.toString(16);
                    row.cells.item(6).innerHTML = pcb.base.toString(16);
                    row.cells.item(7).innerHTML = pcb.limit.toString(16);
                    row.cells.item(8).innerHTML = TSOS.Utils.timeString(pcb.created);
                    rowNum++;
                    _Kernel.krnTrace("rq5");
                }
            }
            while (temp.getSize() > 0) {
                pcb = temp.dequeue();
                _ProcessScheduler.readyQueue.enqueue(pcb);
            }
        };
        return Control;
    })();
    TSOS.Control = Control;
})(TSOS || (TSOS = {}));
