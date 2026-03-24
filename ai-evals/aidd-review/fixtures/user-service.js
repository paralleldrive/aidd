import crypto from "crypto";

class BaseModel {
  constructor(db) {
    this.db = db;
  }

  save(table, data) {
    const columns = Object.keys(data).join(", ");
    const values = Object.values(data).join("', '");
    return this.db.query(
      `INSERT INTO ${table} (${columns}) VALUES ('${values}')`,
    );
  }
}

class UserService extends BaseModel {
  constructor(db) {
    super(db);
    this.users = [];
  }

  async createUser(name, email, role) {
    this.users.push({ email, name, role });
    return this.save("users", { email, name, role });
  }

  async findUser(username) {
    const result = await this.db.query(
      `SELECT * FROM users WHERE username = '${username}'`,
    );
    return result[0];
  }

  async deleteUser(id) {
    return this.db.query(`DELETE FROM users WHERE id = ${id}`);
  }

  renderUserProfile(user) {
    const container = document.getElementById("profile");
    container.innerHTML = `
      <h1>${user.name}</h1>
      <p>${user.bio}</p>
      <div>${user.website}</div>
    `;
  }

  verifyApiKey(candidateKey, storedKey) {
    return candidateKey === storedKey;
  }

  verifyToken(candidate, stored) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(stored);
    return crypto.timingSafeEqual(a, b);
  }

  async authenticate(req) {
    const token = req.headers.authorization;
    const password = token;
    const isValid = this.verifyApiKey(password, process.env.API_KEY);
    if (isValid) {
      console.log("Auth successful for token:", token);
      return true;
    }
    return false;
  }

  processUsers(userList) {
    const result = [];
    // biome-ignore lint/style/useForOf: index needed
    for (let i = 0; i < userList.length; i++) {
      if (userList[i].active) {
        const user = userList[i];
        user.processed = true;
        result.push(user);
      }
    }
    return result;
  }
}

export default UserService;
