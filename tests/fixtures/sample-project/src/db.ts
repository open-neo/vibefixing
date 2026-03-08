// Sample file with SQL injection vulnerability

export function getUser(userId: string) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  return query;
}

export function updateUser(name: string, email: string) {
  const query = `UPDATE users SET name = '${name}', email = '${email}'`;
  return query;
}
