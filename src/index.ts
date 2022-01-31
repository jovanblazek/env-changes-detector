import * as core from "@actions/core";
import { promisify } from "util";
import { exec } from "child_process";

const HAS_DETECTED_CHANGES = 'env-changes-detected'
const RAW_OUTPUT = 'env-changes-raw'
const MD_OUTPUT = 'env-changes-md'

async function run() {
	try {
		const targetBranch = core.getInput("target-branch");
		core.setOutput(HAS_DETECTED_CHANGES, false);
		core.setOutput(RAW_OUTPUT, []);
		core.setOutput(MD_OUTPUT, "No env file changes detected.");

		const diffResult = await promisify(exec)(
			`git diff -w origin/${targetBranch} -- '**.env.example' '**.env-test-example'`
		);
		if (diffResult.stderr) {
			throw new Error(diffResult.stderr);
		}

		if (diffResult.stdout === "") {
			console.log('Did not find any changes');
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

		console.log(result);
		
		core.setOutput(HAS_DETECTED_CHANGES, true);
		core.setOutput(RAW_OUTPUT, matches);
		core.setOutput(
			MD_OUTPUT,
			`## Detected changes in env files:\n\n${result}`
		);
	} catch (error: any) {
		console.log(error);
		core.setFailed(error);
	}
}

run();
