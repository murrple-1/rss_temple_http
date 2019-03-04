export function sessionToken() {
  return localStorage.getItem('sessionToken');
}

export function setSessionToken(token: string) {
  localStorage.setItem('sessionToken', token);
}

export function deleteSessionToken() {
  localStorage.removeItem('sessionToken');
}
