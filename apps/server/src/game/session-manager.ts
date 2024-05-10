import type {
  ISession,
  ISessionFactory,
  ISessionManager
} from "./interfaces.ts"

class SessionManager implements ISessionManager {
  private sessions: Map<string, ISession>
  private sessionFactory: ISessionFactory

  public constructor(sessionFactory: ISessionFactory) {
    this.sessions = new Map()
    this.sessionFactory = sessionFactory
  }

  public async init() {
    await this.sessionFactory.init()
  }

  public create() {
    const session = this.sessionFactory.create()

    this.sessions.set(session.id, session)

    return session
  }

  public delete(id: string) {
    return this.sessions.delete(id)
  }

  public get(id: string) {
    return this.sessions.get(id)
  }

  public getAll() {
    return Array.from(this.sessions.values())
  }
}

export default SessionManager
