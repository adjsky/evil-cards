class FakeDOMStringList extends Array {
  contains() {
    return false
  }
  item() {
    return null
  }
}

class FakeLocation extends URL {
  public ancestorOrigins = new FakeDOMStringList()

  constructor(url: string) {
    super(url)
  }

  assign() {
    //
  }

  reload() {
    //
  }

  replace() {
    //
  }
}

function mockSpy(spy: jest.SpyInstance<Location, []>, url: string) {
  spy.mockReturnValue(new FakeLocation(url))
}

function mockLocation(url: string) {
  const spy = jest.spyOn(window, "location", "get")
  mockSpy(spy, url)

  return {
    changeURL(newURL: string) {
      mockSpy(spy, newURL)
    },
    resetLocationMock() {
      mockSpy(spy, url)
    }
  }
}

export default mockLocation
