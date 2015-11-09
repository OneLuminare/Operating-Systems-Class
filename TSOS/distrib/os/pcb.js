///<reference path="../globals.ts" />
/* ------------
 ProcessControlBlock.ts

 This keeps track of all info for a running process, including registers for switching processes running.
 ------------ */
var TSOS;
(function (TSOS) {
    var ProcessControlBlock = (function () {
        function ProcessControlBlock(pid, base, limit, PC, xReg, yReg, Acc, zFlag, created, turnAroundCycles, startCycle, waitCycles, lastContextSwitchCycle, setTurnAroundTime) {
            if (base === void 0) { base = 0; }
            if (limit === void 0) { limit = 0; }
            if (PC === void 0) { PC = 0; }
            if (xReg === void 0) { xReg = 0; }
            if (yReg === void 0) { yReg = 0; }
            if (Acc === void 0) { Acc = 0; }
            if (zFlag === void 0) { zFlag = 0; }
            if (created === void 0) { created = new Date(); }
            if (turnAroundCycles === void 0) { turnAroundCycles = 0; }
            if (startCycle === void 0) { startCycle = 0; }
            if (waitCycles === void 0) { waitCycles = 0; }
            if (lastContextSwitchCycle === void 0) { lastContextSwitchCycle = 0; }
            if (setTurnAroundTime === void 0) { setTurnAroundTime = false; }
            this.pid = pid;
            this.base = base;
            this.limit = limit;
            this.PC = PC;
            this.xReg = xReg;
            this.yReg = yReg;
            this.Acc = Acc;
            this.zFlag = zFlag;
            this.created = created;
            this.turnAroundCycles = turnAroundCycles;
            this.startCycle = startCycle;
            this.waitCycles = waitCycles;
            this.lastContextSwitchCycle = lastContextSwitchCycle;
            this.setTurnAroundTime = setTurnAroundTime;
        }
        // Overrides toString for trace purposes
        ProcessControlBlock.prototype.toString = function () {
            return "pid: " + this.pid.toString() + " base: " + this.base.toString(16) + " limit: " + this.limit.toString(16)
                + " PC: " + this.PC.toString(16) + " xReg: " + this.xReg.toString(16) + " yReg: " + this.yReg.toString(16)
                + " Acc: " + this.Acc.toString(16) + " zFlag: " + this.zFlag.toString(16) + " created: " + TSOS.Utils.timeString(this.created)
                + " Turnaround Time: " + this.turnAroundCycles + " cycles Wait Time: " + this.waitCycles + " cycles";
        };
        return ProcessControlBlock;
    })();
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
