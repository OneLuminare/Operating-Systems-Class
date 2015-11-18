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
var MEMORY_FULL_IRQ = 13;
var CONTEXT_SWITCH_IRQ = 14;
var CLEAR_MEMORY_IRQ = 15;
var EXECUTE_ALL_IRQ = 16;
var LIST_PROCESS_IRQ = 17;
var CHANGE_QUANTUM_IRQ = 18;
var CREATE_ALL_PROCESS_IRQ = 19;
var FORMAT_HD_IRQ = 20;
var CREATE_FILE_IRQ = 21;
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
var _FirstStart = false;
// Flags
var _TraceMode = false;
var _NextInstruction = false;
// Standard input and output
var _StdIn; // Same "to null or not to null" issue as above.
var _StdOut;
// UI
var _Console;
var _OsShell;
var _Utils;
var _OutputPrompt = '#';
// Memory
var _MemoryMax = 768;
var _MemoryPartitions = 3;
var _MemoryPartitionSize = 256;
var _Memory;
var _MemoryManager;
// Devices
var _HDDriver = null;
// Process Scheduling
var _TimerOn = false;
var _TimerCounter = 0;
var _Quantum = 6;
// File codes
var EOF = 255;
var NEWLINE = 10; // Note: in this file system, I am not using a line feed/carrage return pair for new line
// Error codes
var CR_SUCCESS = 1;
var CR_FILE_LENGTH_TO_LONG = -100;
var CR_DRIVE_FULL = -101;
var CR_FILE_DIRECTORY_FULL = -103;
var CR_FILE_NOT_FOUND = -104;
var CR_DID_NOT_WRITE_ALL_DATA = -105;
var CR_DUPLICATE_FILE_NAME = -106;
var CR_DRIVE_NOT_FORMATED = -107;
var CR_EMPTY_FILE_NAME = -108;
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
