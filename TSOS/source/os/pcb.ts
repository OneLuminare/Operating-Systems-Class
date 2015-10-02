///<reference path="../globals.ts" />

/* ------------
 ProcessControlBlock.ts

 This keeps track of all info for a running process, including registers for switching processes running.
 ------------ */

module TSOS {

    export class ProcessControlBlock {

        constructor(public pid : number,
                    public base : number,
                    public limit : number,
                    public PC : number = 0,
                    public xReg : number = 0,
                    public yReg : number = 0,
                    public Acc : number = 0,
                    public zFlag : number = 0,
                    public created : Date = new Date(),
                    public running : boolean = true) {
        }

        // Overrides toString for trace purposes
        public toString() : string
        {
            return "pid: " + this.pid.toString() + " base: " + this.base.toString(16) + " limit: " + this.limit.toString(16)
                + " PC: " + this.PC.toString(16) + " xReg: " + this.xReg.toString(16) + " yReg: " + this.yReg.toString(16)
                + " Acc: " + this.Acc.toString(16) + " zFlag: " + this.zFlag.toString(16) + " created: " + TSOS.Utils.timeString(this.created);

        }
    }
}