// Temporary type declarations for calculation-service
// These will be resolved once npm properly installs @types packages

declare module 'express' {
  interface Request {
    body: any;
    query: any;
    params: any;
    headers: any;
  }
  interface Response {
    json(data: any): Response;
    status(code: number): Response;
  }
  interface Application {
    use(middleware: any): Application;
    get(path: string, handler: (req: Request, res: Response) => void): Application;
    post(path: string, handler: (req: Request, res: Response) => void): Application;
    listen(port: number, callback?: () => void): void;
  }
  function express(): Application;
  namespace express {
    function json(options?: any): any;
  }
  export = express;
  export { Request, Response, Application };
}

declare module 'cors' {
  function cors(options?: any): (req: any, res: any, next: any) => void;
  export = cors;
}

