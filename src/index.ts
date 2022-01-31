import * as core from "@actions/core";
import { promisify } from "util";
import { exec } from "child_process";

async function run() {
	try {
		const token = core.getInput("repo-token");
		const sourceBranch = core.getInput("source-branch");
		const targetBranch = core.getInput("target-branch");

		console.log(sourceBranch, targetBranch);
		console.log(token);

		const diffResult = await promisify(exec)(
			`git diff -w origin/${targetBranch} -- '**.env-example' '**.env-test-example'`
		);
		if (diffResult.stderr) {
			throw new Error(diffResult.stderr);
		}

		if (diffResult.stdout === "") {
			core.setOutput("env-changes-detected", false);
			core.setOutput("env-changes-raw", []);
			core.setOutput("env-changes-md", "No env file changes detected.");
			return;
		}

		const regex =
			/^(?<diff>[\+-]{1}\w.*)|(?:diff --git\sa(?<file>.*?)\s.*)$/gm;
		const matches = Array.from(
			diffResult.stdout.matchAll(regex),
			(match) => match.groups && (match.groups.file || match.groups.diff)
		).filter((match) => match !== undefined) as string[];

		// format found changes to markdown syntax
		const result = matches
			.map((match, index) => {
				// file name
				if (match[0] === "/") {
					if (index === 0) {
						return `\`${match}\`\n`;
					}
					return `\`\`\`\n\`${match}\`\n`;
				}

				// diff
				const previousMatch = matches[index - 1];
				if (previousMatch[0] === "+" || previousMatch[0] === "-") {
					return `${match}\n`;
				}
				return `\`\`\` diff\n${match}\n`;
			})
			.join("\n");

		core.setOutput("env-changes-detected", true);
		core.setOutput("env-changes-raw", matches);
		core.setOutput(
			"env-changes-md",
			`## Detected changes in env files:\n\n${result}`
		);
	} catch (error: any) {
		console.log(error);
		core.setFailed(error);
	}
}

run();
