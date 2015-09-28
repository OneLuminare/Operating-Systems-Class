///<reference path="../globals.ts" />

/* ------------
 CPU.ts

 Requires global.ts.
 Requires memory.ts

 Routines for the host CPU simulation, NOT for the OS itself.
 In this manner, it's A LITTLE BIT like a hypervisor,
 in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
 that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
 TypeScript/JavaScript in both the host and client environments.

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */

module TSOS {

    export class ProcessControlBlock {



        constructor(public pid : number,
                    public base : number,
                    public limit : number,
                    public PC : number = 0,
                    public running : boolean = true) {
            this.init();

        }

        public init(): void {

        }
    }
}