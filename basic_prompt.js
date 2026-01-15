/*
Information about the current repository. You can use this information when you need to calculate diffs or compare changes with the default branch:
Repository name: Anythink-Market-cmms8eh8
Owner: Wilcolab
Current branch: main
Default branch: main
*/

module.exports = {
  repositoryName: "Anythink-Market-cmms8eh8",
  owner: "Wilcolab",
  currentBranch: "main",
  defaultBranch: "main"
};
/**
 * Converts a string to camelCase format.
 * 
 * Takes a string with words separated by spaces, hyphens, or underscores
 * and converts it to camelCase where the first word is lowercase and
 * subsequent words have their first letter capitalized.
 * 
 * @param {string} str - The input string to convert
 * @returns {string} The camelCase version of the input string
 * 
 * @example
 * toCamelCase("hello world") // returns "helloWorld"
 * toCamelCase("hello-world") // returns "helloWorld"
 * toCamelCase("hello_world") // returns "helloWorld"
 * toCamelCase("HELLO WORLD") // returns "helloWorld"
 */
function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[_\s-]+(.)/g, (_, char) => char.toUpperCase());
}

module.exports = { ...module.exports, toCamelCase };