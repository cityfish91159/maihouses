import { handleScriptError, handleScriptSuccess } from '../error-handler';

describe('error-handler', () => {
  let consoleSpy: { error: ReturnType<typeof vi.spyOn>; log: ReturnType<typeof vi.spyOn> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exitSpy: any;

  beforeEach(() => {
    consoleSpy = {
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {})
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exitSpy = vi.spyOn(process, 'exit' as any).mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleScriptError', () => {
    it('prints script name and calls process.exit(1)', () => {
      handleScriptError('test-script', new Error('Test error'));
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[test-script]'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('handles non-Error objects', () => {
      handleScriptError('test-script', 'string error');
      
      expect(consoleSpy.error).toHaveBeenCalledWith('錯誤: string error');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('parses Zod-like errors with issues array', () => {
      const zodError = Object.assign(new Error('Validation failed'), {
        issues: [
          { path: ['data', 'name'], message: 'Required' },
          { path: ['data', 'age'], message: 'Must be number' }
        ]
      });
      
      handleScriptError('test-script', zodError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('data.name'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Required'));
    });

    it('shows stack trace when DEBUG=true', () => {
      process.env.DEBUG = 'true';
      const error = new Error('Debug test');
      
      handleScriptError('test-script', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
      delete process.env.DEBUG;
    });
  });

  describe('handleScriptSuccess', () => {
    it('prints success message with script name', () => {
      handleScriptSuccess('test-script', 'All done');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[test-script]'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('All done'));
    });

    it('uses default message when none provided', () => {
      handleScriptSuccess('test-script');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('執行成功'));
    });
  });
});
