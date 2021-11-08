export const validator = {
  password: (password: string): boolean => {
    return /^((?=\S*?[a-z,A-Z])(?=\S*?[0-9]).{6,})\S/.test(password);
  },
  email: (email: string): boolean => {
    return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);
  },
};
