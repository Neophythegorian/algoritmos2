class IReadRepository {
  async findById(id) { throw new Error('Method must be implemented'); }
  async findByField(field, value) { throw new Error('Method must be implemented'); }
}

class IWriteRepository {
  async create(data) { throw new Error('Method must be implemented'); }
  async update(id, data) { throw new Error('Method must be implemented'); }
  async delete(id) { throw new Error('Method must be implemented'); }
}

class IUserReadRepository extends IReadRepository {
  async findByUsername(username) { throw new Error('Method must be implemented'); }
  async findByEmail(email) { throw new Error('Method must be implemented'); }
}

class IUserWriteRepository extends IWriteRepository {
  async createSession(userId, token, expiresAt) { throw new Error('Method must be implemented'); }
  async invalidateSession(token) { throw new Error('Method must be implemented'); }
}

class IGameReadRepository extends IReadRepository {
  async getGamePlayers(gameId) { throw new Error('Method must be implemented'); }
  async getPlayerScores(gameId) { throw new Error('Method must be implemented'); }
}

class IGameWriteRepository extends IWriteRepository {
  async addPlayerToGame(gameId, userId) { throw new Error('Method must be implemented'); }
  async removePlayerFromGame(gameId, userId) { throw new Error('Method must be implemented'); }
}

module.exports = {
  IReadRepository,
  IWriteRepository,
  IUserReadRepository,
  IUserWriteRepository,
  IGameReadRepository,
  IGameWriteRepository
};