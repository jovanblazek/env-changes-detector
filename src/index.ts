import * as core from "@actions/core";
import { promisify } from "util";
import { exec } from "child_process";

const getEnvFileChanges = async () => {
	try {
		const token = core.getInput('repo-token')
		const sourceBranch = core.getInput('source-branch')
		const targetBranch = core.getInput('target-branch')

		console.log(sourceBranch, targetBranch);
		console.log(token);	

		const diffResult = await promisify(exec)(
			`git diff -w origin/${targetBranch} -- '**.env-example' '**.env-test-example'`
		);
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
			.map(
				({ filePath, diff }) =>
					`\`${filePath}\`\n\`\`\` diff\n${diff}\n\`\`\``
			)
			.join("\n");

		core.setOutput(
			"ENV_CHANGES",
			`## Detected changes in env files:\n\n${result}`
		);
	} catch (error: any) {
		core.setFailed(error);
	}
};

module.exports = {
	getEnvFileChanges,
};
