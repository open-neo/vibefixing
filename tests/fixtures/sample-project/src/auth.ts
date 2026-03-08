// Sample file with intentional issues for testing

const API_KEY = "sk-1234567890abcdef";

export function authenticate(user: any) {
  // @ts-ignore
  if (user.name == null) {
    return false;
  }
  return user.password === "admin123";
}

export function getToken(): string {
  return API_KEY;
}
