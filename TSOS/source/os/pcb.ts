///<reference path="../globals.ts" />

/* ------------
 ProcessControlBlock.ts

 This keeps track of all info for a running process, including registers for switching processes running.
 ------------ */

module TSOS {

    export class ProcessControlBlock {

        constructor(public pid : number,
                    public base : number = 0,
                    public limit : number = 0,
                    public PC : number = 0,
                    public xReg : number = 0,
                    public yReg : number = 0,
                    public Acc : number = 0,
                    public zFlag : number = 0,
                    public created : Date = new Date(),
                    public priority : number = 10,
                    public onHD : boolean = false,
                    public hdFileName : string = "",
                    public turnAroundCycles : number = 0,
                    public startCycle : number = 0,
                    public waitCycles : number = 0,
                    public lastContextSwitchCycle : number = 0,
                    public setTurnAroundTime : boolean = false) {

        }

        // Overrides toString for trace purposes
        public toString() : string
        {
            return "pid: " + this.pid.toString() + " base: " + this.base.toString(16) + " limit: " + this.limit.toString(16)
                + " PC: " + this.PC.toString(16) + " xReg: " + this.xReg.toString(16) + " yReg: " + this.yReg.toString(16)
                + " Acc: " + this.Acc.toString(16) + " zFlag: " + this.zFlag.toString(16) + " created: " + TSOS.Utils.timeString(this.created)
                + "Priority: " + this.priority.toString() + " Turnaround Time: " + this.turnAroundCycles + " cycles Wait Time: "  + this.waitCycles + " cycles" ;

        }
    }
}