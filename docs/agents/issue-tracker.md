# Issue tracker: Linear

Issues and specs for this repository live in Linear under the project/team prefix `VOI`.

## Conventions

- Refer to issues by their Linear identifier, such as `VOI-123`, or by their Linear URL.
- Create new issues in the `VOI` project.
- Use Linear’s native parent, sub-issue, and blocking relationships where applicable.
- Do not create duplicate local Markdown issues under `.scratch/`.
- No triage label vocabulary is configured for this repository. Do not apply triage labels such as `ready-for-agent`.

## When a skill says “publish to the issue tracker”

Create the issue in the `VOI` Linear project and return its identifier and URL.

If Linear access is unavailable, prepare the issue content and ask the user to connect or provide access to Linear. Do not silently publish it elsewhere.

## When a skill says “fetch the relevant ticket”

Resolve the supplied Linear identifier or URL and read the corresponding issue, including its description, status, comments, parent, sub-issues, and blocking relationships when relevant.

## Ticket dependencies

Create dependent tickets in dependency order, blockers first. Represent dependencies using Linear’s native blocking relationships.

## Wayfinding operations

- Represent an effort map as a parent Linear issue.
- Represent each question or task as a child issue.
- Record the ticket type in the child issue description.
- Use Linear’s native blocking relationships for dependencies.
- Claim work by assigning the child issue to the acting user or agent and moving it to the team’s active status.
- Resolve work by adding the answer or outcome to the child issue, completing it, and adding a concise decision pointer to the parent issue.
