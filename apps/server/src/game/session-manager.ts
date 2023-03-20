import type { ISession, ISessionFactory, ISessionManager } from "./interfaces"

class SessionManager implements ISessionManager {
  private sessions: Map<string, ISession>
  private sessionFactory: ISessionFactory

  public constructor(sessionFactory: ISessionFactory) {
    this.sessions = new Map()
    this.sessionFactory = sessionFactory
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
}

export default SessionManager
