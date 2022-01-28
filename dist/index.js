"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const getEnvFileChanges = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = core.getInput('repo-token');
        const sourceBranch = core.getInput('source-branch');
        const targetBranch = core.getInput('target-branch');
        console.log(sourceBranch, targetBranch);
        console.log(token);
        const diffResult = yield (0, util_1.promisify)(child_process_1.exec)(`git diff -w origin/${targetBranch} -- '**.env-example' '**.env-test-example'`);
        if (diffResult.stderr) {
            throw new Error(diffResult.stderr);
        }
        if (diffResult.stdout === "") {
            core.setOutput("ENV_CHANGES", "No env file changes detected.");
            return;
        }
        const parsedDiffArray = diffResult.stdout
            .split("diff --git ")
            .slice(1)
            .map((line) => line.split("\n"));
        const filteredDiff = parsedDiffArray.map((item) => ({
            filePath: item[0].slice(1).split(" ")[0],
            diff: item
                .filter((line) => line[0] === "+" || line[0] === "-")
                .slice(2)
                .join("\n"),
        }));
        const result = filteredDiff
            .map(({ filePath, diff }) => `\`${filePath}\`\n\`\`\` diff\n${diff}\n\`\`\``)
            .join("\n");
        core.setOutput("ENV_CHANGES", `## Detected changes in env files:\n\n${result}`);
    }
    catch (error) {
        core.setFailed(error);
    }
});
module.exports = {
    getEnvFileChanges,
};
