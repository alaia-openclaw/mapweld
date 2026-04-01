import { CredentialsSignin } from "@auth/core/errors";

/** Thrown from Credentials authorize when password is correct but email is not verified yet. */
export class EmailNotVerified extends CredentialsSignin {
  constructor() {
    super();
    this.code = "email_not_verified";
  }
}
