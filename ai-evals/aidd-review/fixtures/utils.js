import { createHash } from "crypto";

/**
 * Hashes a value with SHA3-256.
 */
const hashSecret = (secret = "") =>
  createHash("sha3-256").update(secret).digest("hex");

/**
 * Compares two secrets by hashing both before comparison.
 */
const compareSecrets = (candidate = "", stored = "") =>
  hashSecret(candidate) === hashSecret(stored);

const isActive = (user = {}) => Boolean(user.active);

const getDisplayName = ({ firstName = "", lastName = "" } = {}) =>
  `${firstName} ${lastName}`.trim();

const filterActiveUsers = (users = []) => users.filter(isActive);

const getActiveUserNames = (users = []) =>
  filterActiveUsers(users).map(getDisplayName);

const createUser = ({
  id = "",
  firstName = "",
  lastName = "",
  email = "",
  active = false,
} = {}) => ({
  active,
  email,
  firstName,
  id,
  lastName,
});

export {
  hashSecret,
  compareSecrets,
  isActive,
  getDisplayName,
  filterActiveUsers,
  getActiveUserNames,
  createUser,
};
