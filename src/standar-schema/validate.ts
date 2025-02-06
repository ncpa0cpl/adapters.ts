import { Validator } from "../adapter-endpoint";
import { StandardSchemaV1 } from "./interface";

function isStandardSchema<T>(validator: any): validator is StandardSchemaV1<unknown, T> {
  return "~standard" in validator;
}

export function validate<T>(
  validator: Validator<T>,
  data: unknown,
  getIssues?: (issues: readonly StandardSchemaV1.Issue[]) => void,
): data is T {
  if (isStandardSchema(validator)) {
    const result = validator["~standard"].validate(data);
    if (result instanceof Promise) {
      throw new Error("Asynchronous validation is not supported.");
    }
    if (result.issues) {
      if (getIssues) {
        getIssues(result.issues);
      }
      return false;
    }
    return true;
  }
  return validator(data);
}
