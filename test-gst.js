
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const input = "21AAQFC6357e1ZI";
const upper = input.toUpperCase();

console.log(`Input: ${input}`);
console.log(`Upper: ${upper}`);
console.log(`Regex Source: ${GSTIN_REGEX.source}`);
console.log(`Matches: ${GSTIN_REGEX.test(upper)}`);

if (!GSTIN_REGEX.test(upper)) {
    console.log("Validation FAILED");
} else {
    console.log("Validation PASSED");
}
