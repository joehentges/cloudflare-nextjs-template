const ErrorList: { [key: string]: string } = {
  RateLimitError: "Rate limit exceeded",
  LoginError: "Invalid email or password"
} as const

export class CustomError extends Error {
  constructor(message: string) {
    super(message)
  }

  static instanceOf(error: Error) {
    return ErrorList[this.name] === error.message
  }
}

export class RateLimitError extends CustomError {
  constructor() {
    const name = "RateLimitError"
    super(ErrorList[name])
    this.name = name
  }
}

export class LoginError extends CustomError {
  constructor() {
    const name = "LoginError"
    super(ErrorList[name])
    this.name = name
  }
}
