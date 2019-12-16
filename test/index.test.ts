import { handler } from '../index'

const lib1 = '../test/__mocks__/lib1'
const lib2 = '../test/__mocks__/lib2'
const lib99 = '../test/__mocks__/lib99'

const lib1Config = { [lib1]: {} } as any
const event = {} as any
const context = {} as any

describe('processor.configuration', () => {
  (global as any).libMock = {
    lib1: () => null,
    lib2: () => Promise.resolve(2)
  }

  it('should throw error if processor does not exist', () => {
    expect(() => handler({
      [lib1]: {},
      [lib99]: {}
    } as any)).toThrowError(/lib99.*cannot be instantiated/)
  })
  it('should call callback with first non-null result', async () => {
    const result = await handler({
      [lib1]: {},
      [lib2]: {}
    } as any)(event, context)
    expect(result).toBe(2)
  })
  it('should call callback with error if no processor feels responsible', async () => {
    (global as any).libMock = {
      lib1: () => null,
      lib2: () => null
    }
    const result = handler({
      [lib1]: {},
      [lib2]: {}
    } as any)(event, context)

    await expect(result).rejects.toMatch(/^No event processor found/)
  })

})

describe('processor.results', () => {
  it('SYNC should call callback synchronous with result', async () => {
    (global as any).libMock = {
      lib1: () => 'syncresult'
    }

    const result = await handler(lib1Config)(event, context)
    expect(result).toBe('syncresult')
  })
  it('ASYNC should reject async with errormessage', async () => {
    (global as any).libMock = {
      lib1: () => Promise.reject(new Error('asyncError'))
    }

    const result = handler(lib1Config)(event, context)
    await expect(result).rejects.toBe('Error: asyncError')
  })
  it('should call reject synchronous with errormessage', async () => {
    (global as any).libMock = {
      lib1: () => { throw new Error('myerror') }
    }

    const result = handler(lib1Config)(event, context)
    expect(result).rejects.toBe('Error: myerror')
  })
  it('should resolve async with result', async () => {
    (global as any).libMock = {
      lib1: () => Promise.resolve('asyncresult')
    }

    const result = await handler(lib1Config)(event, context)
    expect(result).toBe('asyncresult')
  })
})
