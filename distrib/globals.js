/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */
//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//
var APP_NAME = "TSOS"; // 'cause Bob and I were at a loss for a better name.
var APP_VERSION = "0.1.09"; // What did you expect?
var AUTHOR = "Nathan D. Fahrner"; // Me, student author
var FRAME_AUTHOR = "Alan Labouseur"; // Got to give instructor credit for starting frame work
var CPU_CLOCK_INTERVAL = 100; // This is in ms (milliseconds) so 1000 = 1 second.
// Interupts
var TIMER_IRQ = 0; // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
// NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;
var CREATE_PROCESS_IRQ = 2;
var EXECUTE_PROCESS_IRQ = 3;
var TERMINATE_PROCESS_IRQ = 4;
var WAIT_FOR_PROCESS_EXIT_IRQ = 5;
var UNKNOWN_OP_CODE_IRQ = 6;
var MEMORY_ACCESS_VIOLATION_IRQ = 7;
var ARITHMATIC_OVERFLOW_IRQ = 8;
var UNKNOWN_SYSCALL_IRQ = 9;
var PRINT_INTEGER_IRQ = 10;
var PRINT_STRING_IRQ = 11;
var READ_PAST_EOP_IRQ = 12;
//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var _CPU; // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
var _OSclock = 0; // Page 23.
var _Mode = 0; // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.
var _Canvas; // Initialized in Control.hostInit().
var _DrawingContext; // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
var _DefaultFontFamily = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize = 13;
var _FontHeightMargin = 4; // Additional space added to font size when advancing a line.
var _Trace = true; // Default the OS trace to be on.
// The OS Kernel and its queues.
var _Kernel;
var _KernelInterruptQueue; // Initializing this to null (which I would normally do) would then require us to specify the 'any' type, as below.
var _KernelInputQueue = null; // Is this better? I don't like uninitialized variables. But I also don't like using the type specifier 'any'
var _KernelBuffers = null; // when clearly 'any' is not what we want. There is likely a better way, but what is it?
var _KernelCrash = false; // A flag basicly to stop shell from drawing prompt in BDOD after a crash
var _KernelTabInput = false; // A flag to take tab input, as cant put tab on input buffer
var _KernelReadyQueue;
var _KernelRunningProcesses = null;
var _ProcessScheduler;
// Flags
var _ShellWaitForMessage = false; // Tells shell to wait for message from kernel after sending system call
// Standard input and output
var _StdIn; // Same "to null or not to null" issue as above.
var _StdOut;
// UI
var _Console;
var _OsShell;
var _Utils;
// Memory
var _MemoryMax = 256;
var _Memory;
// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;
// Global Device Driver Objects - page 12
var _krnKeyboardDriver; //  = null;
var _hardwareClockID = null;
// For testing (and enrichment)...
var Glados = null; // This is the function Glados() in glados.js on Labouseur.com.
var _GLaDOS = null; // If the above is linked in, this is the instantiated instance of Glados.
var onDocumentLoad = function () {
    TSOS.Control.hostInit();
};
