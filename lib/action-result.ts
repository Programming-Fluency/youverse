export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function okVoid(): ActionResult<void> {
  return { success: true, data: undefined };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { success: false, error };
}

export function dbFail<T = never>(): ActionResult<T> {
  return { success: false, error: "Something went wrong. Please try again." };
}
