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
const APP_NAME: string    = "TSOS";   // 'cause Bob and I were at a loss for a better name.
const APP_VERSION: string = "0.1.09";   // What did you expect?
const AUTHOR: string = "Nathan D. Fahrner"; // Me, student author
const FRAME_AUTHOR: string = "Alan Labouseur"; // Got to give instructor credit for starting frame work

const CPU_CLOCK_INTERVAL: number = 100;   // This is in ms (milliseconds) so 1000 = 1 second.

// Interupts
const TIMER_IRQ: number = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                              // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ: number = 1;

const CREATE_PROCESS_IRQ: number = 2;
const EXECUTE_PROCESS_IRQ: number = 3;
const TERMINATE_PROCESS_IRQ: number = 4;
const WAIT_FOR_PROCESS_EXIT_IRQ: number = 5;
const UNKNOWN_OP_CODE_IRQ: number = 6;
const MEMORY_ACCESS_VIOLATION_IRQ: number = 7;
const ARITHMATIC_OVERFLOW_IRQ: number = 8;
const UNKNOWN_SYSCALL_IRQ: number = 9;
const PRINT_INTEGER_IRQ: number = 10;
const PRINT_STRING_IRQ: number = 11;
const READ_PAST_EOP_IRQ: number = 12;
const MEMORY_FULL_IRQ: number = 13;
const CONTEXT_SWITCH_IRQ: number = 14;
const CLEAR_MEMORY_IRQ : number = 15;
const EXECUTE_ALL_IRQ : number = 16;
const LIST_PROCESS_IRQ : number = 17;
const CHANGE_QUANTUM_IRQ : number = 18;
const CREATE_ALL_PROCESS_IRQ : number = 19;
const FORMAT_HD_IRQ : number = 20;
const CREATE_FILE_IRQ : number = 21;
const WRITE_FILE_IRQ : number = 22;
const READ_FILE_IRQ : number = 23;
const DELETE_FILE_IRQ : number = 24;
const LIST_FILES_IRQ: number = 25;
const SWAP_ERROR_IRQ: number = 26;
const CHANGE_SCHEDULING_METHOD_IRQ : number = 27;
const GET_SCHEDULE_METHOD_IRQ : number = 28;

// Scheduling Method
var _ScheduleMethod : number = 500;
const SM_ROUND_ROBIN = 500;
const SM_FJF = 501;
const SM_PRIORITY = 502;

// Scrolling Const
const scrollPoints  = 23.9;

//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var _CPU: TSOS.Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.

var _OSclock: number = 0;  // Page 23.

var _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.

var _Canvas: HTMLCanvasElement;         // Initialized in Control.hostInit().
var _DrawingContext: any; // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
var _DefaultFontFamily: string = "sans";        // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize: number = 13;
var _FontHeightMargin: number = 4;              // Additional space added to font size when advancing a line.

var _Trace: boolean = true;  // Default the OS trace to be on.

// The OS Kernel and its queues.
var _Kernel: TSOS.Kernel;
var _KernelInterruptQueue;          // Initializing this to null (which I would normally do) would then require us to specify the 'any' type, as below.
var _KernelInputQueue: any = null;  // Is this better? I don't like uninitialized variables. But I also don't like using the type specifier 'any'
var _KernelBuffers: any[] = null;   // when clearly 'any' is not what we want. There is likely a better way, but what is it?
var _KernelCrash: boolean = false;  // A flag basicly to stop shell from drawing prompt in BDOD after a crash
var _KernelTabInput : boolean = false; // A flag to take tab input, as cant put tab on input buffer
var _KernelReadyQueue;
var _KernelRunningProcesses: any[] = null;
var _ProcessScheduler : TSOS.ProcessScheduler;
var _FirstStart = false;

// Flags
var _TraceMode : boolean = false;
var _NextInstruction : boolean = false;

// Standard input and output
var _StdIn;    // Same "to null or not to null" issue as above.
var _StdOut;

// UI
var _Console: TSOS.Console;
var _OsShell: TSOS.Shell;
var _Utils: TSOS.Utils;
var _OutputPrompt : string = '#';

// Memory
const _MemoryMax : number = 768;
const _MemoryPartitions = 3;
const _MemoryPartitionSize : number = 256;
var _Memory : TSOS.MemoryAccessor;
var _MemoryManager : TSOS.MemoryManager;

// Devices
var _HDDriver : TSOS.HardDriveDriver = null;

// Process Scheduling
var _TimerOn : boolean = false;
var _TimerCounter : number = 0;
var _Quantum : number = 6;

// File codes
const EOF = -1;
const NEWLINE = 10; // Note: in this file system, I am not using a line feed/carrage return pair for new line

// Error codes
const CR_SUCCESS = 1;
const CR_FILE_LENGTH_TO_LONG = -100;
const CR_DRIVE_FULL = -101;
const CR_FILE_DIRECTORY_FULL = -103;
const CR_FILE_NOT_FOUND = -104;
const CR_DID_NOT_WRITE_ALL_DATA = -105;
const CR_DUPLICATE_FILE_NAME = -106
const CR_DRIVE_NOT_FORMATED = -107;
const CR_EMPTY_FILE_NAME = -108;
const CR_CORRUPTED_FILE_BLOCK = -109;
const CR_SWAP_FILE_NOT_LOADED = -110;
const CR_PARTITION_NOT_LOADED = -111;
const CR_INVALID_PARTITION = -112;
const CR_MEMORY_SWAP_FILE_NOT_NEEDED = -113;



// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode: boolean = false;

// Global Device Driver Objects - page 12
var _krnKeyboardDriver; //  = null;

var _hardwareClockID: number = null;

// For testing (and enrichment)...
var Glados: any = null;  // This is the function Glados() in glados.js on Labouseur.com.
var _GLaDOS: any = null; // If the above is linked in, this is the instantiated instance of Glados.

var onDocumentLoad = function() {
	TSOS.Control.hostInit();
};
