# Detect changes in env files

Github action for detecting changes in env files. Useful for adding comments to PRs with changes to environment variables and more (see [outputs](#outputs)).

```
- uses: jovanblazek/env-changes-detector@v1.0
  with:
    target-branch: ${{ github.event.pull_request.base.ref }}
    files: '["**env-example", "**env-test-example"]'
```

## Inputs

| Name          | Description                                                                              | Default                                       | Required |
| ------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- | -------- |
| target-branch | Target branch of PR. Set to PR target branch by default.                                 | `github.event.pull_request.base.ref` | false    |
| files         | Array of paths to check for changes. Can use glob patterns. See below for more examples. | `'["**.env-example", "**.env-test-example"]'` | false    |

### Custom files

Customize paths to use when checking for changes using `files` input. You need to pass an array of strings as a string in order for it to work properly. Use parentheses `"` for array values and apostrophe `'` to wrap the entire array.


```
files: '["env-example", "api/env-example"]'
```

You can also utilize glob patterns to search for files.

## Outputs

| Name                 | Description                                                    | If no changes detected        |
| -------------------- | -------------------------------------------------------------- | ----------------------------- |
| env-changes-detected | Boolean value indicating if specified files have been changed. | `false`                       |
| env-changes-raw      | Raw data containing detected changes.                          | `[]`                          |
| env-changes-md       | Generated report in Markdown.                                  | `'No env file changes detected.'` |

Do not forget to add `id` to your step to access the outputs.

### Examples

#### Raw output:
```
[
	{ "file": "/.env.example" },
	{ "diff": "-GENERAL_SECRET=" },
	{ "diff": "+HELLO_THERE=" },
	{ "file": "/api/.env.example" },
	{ "diff": "+GENERAL_KENOBI=" }
]
```

#### Markdown output:
````
## Detected changes in env files:

`/.env.example`

``` diff
-GENERAL_SECRET=
+HELLO_THERE=
``` 

`/api/.env.example`

``` diff
+GENERAL_KENOBI=
```
````

## Post comment when changes are detected

To post comment to PR when changes are detected, you need to utilize some other action. We recommend using this one: [sticky-pull-request-comment](https://github.com/marocchino/sticky-pull-request-comment)

### Example

```
- name: Detect changes in environment variables
  uses: jovanblazek/env-changes-detector@v1.0
  id: detect-changes-in-env-files

- name: Add or update sticky comment
  uses: marocchino/sticky-pull-request-comment@v2.2.0
  with:
    message: |
      ${{ steps.detect-changes-in-env-files.outputs.env-changes-md }}
```
